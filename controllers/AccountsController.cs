using Bit.Api.Auth.Models.Request.Accounts;
using Bit.Api.Models.Request;
using Bit.Api.Models.Request.Accounts;
using Bit.Api.Models.Response;
using Bit.Api.Utilities;
using Bit.Core;
using Bit.Core.Auth.Models.Api.Request.Accounts;
using Bit.Core.Auth.Models.Api.Response.Accounts;
using Bit.Core.Auth.Services;
using Bit.Core.Auth.Utilities;
using Bit.Core.Enums;
using Bit.Core.Enums.Provider;
using Bit.Core.Exceptions;
using Bit.Core.Models.Api.Response;
using Bit.Core.Models.Business;
using Bit.Core.Models.Data;
using Bit.Core.Repositories;
using Bit.Core.Services;
using Bit.Core.Settings;
using Bit.Core.Tools.Entities;
using Bit.Core.Tools.Repositories;
using Bit.Core.Tools.Services;
using Bit.Core.Utilities;
using Bit.Core.Vault.Entities;
using Bit.Core.Vault.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bit.Api.Controllers;

[Route("accounts")]
[Authorize("Application")]
public class AccountsController : Controller
{
    private readonly GlobalSettings _globalSettings;
    private readonly ICipherRepository _cipherRepository;
    private readonly IFolderRepository _folderRepository;
    private readonly IOrganizationService _organizationService;
    private readonly IOrganizationUserRepository _organizationUserRepository;
    private readonly IProviderUserRepository _providerUserRepository;
    private readonly IPaymentService _paymentService;
    private readonly IUserRepository _userRepository;
    private readonly IUserService _userService;
    private readonly ISendRepository _sendRepository;
    private readonly ISendService _sendService;
    private readonly ICaptchaValidationService _captchaValidationService;
    private readonly IPolicyService _policyService;

    public AccountsController(
        GlobalSettings globalSettings,
        ICipherRepository cipherRepository,
        IFolderRepository folderRepository,
        IOrganizationService organizationService,
        IOrganizationUserRepository organizationUserRepository,
        IProviderUserRepository providerUserRepository,
        IPaymentService paymentService,
        IUserRepository userRepository,
        IUserService userService,
        ISendRepository sendRepository,
        ISendService sendService,
        ICaptchaValidationService captchaValidationService,
        IPolicyService policyService)
    {
        _cipherRepository = cipherRepository;
        _folderRepository = folderRepository;
        _globalSettings = globalSettings;
        _organizationService = organizationService;
        _organizationUserRepository = organizationUserRepository;
        _providerUserRepository = providerUserRepository;
        _paymentService = paymentService;
        _userRepository = userRepository;
        _userService = userService;
        _sendRepository = sendRepository;
        _sendService = sendService;
        _captchaValidationService = captchaValidationService;
        _policyService = policyService;
    }

    #region DEPRECATED (Moved to Identity Service)

    [Obsolete("TDL-136 Moved to Identity (2022-01-12 cloud, 2022-09-19 self-hosted), left for backwards compatability with older clients.")]
    [HttpPost("prelogin")]
    [AllowAnonymous]
    public async Task<PreloginResponseModel> PostPrelogin([FromBody] PreloginRequestModel model)
    {
        var kdfInformation = await _userRepository.GetKdfInformationByEmailAsync(model.Email);
        if (kdfInformation == null)
        {
            kdfInformation = new UserKdfInformation
            {
                Kdf = KdfType.PBKDF2_SHA256,
                KdfIterations = 100000,
            };
        }
        return new PreloginResponseModel(kdfInformation);
    }

    [Obsolete("TDL-136 Moved to Identity (2022-01-12 cloud, 2022-09-19 self-hosted), left for backwards compatability with older clients.")]
    [HttpPost("register")]
    [AllowAnonymous]
    [CaptchaProtected]
    public async Task<RegisterResponseModel> PostRegister([FromBody] RegisterRequestModel model)
    {
        var user = model.ToUser();
        var result = await _userService.RegisterUserAsync(user, model.MasterPasswordHash,
            model.Token, model.OrganizationUserId);
        if (result.Succeeded)
        {
            var captchaBypassToken = _captchaValidationService.GenerateCaptchaBypassToken(user);
            return new RegisterResponseModel(captchaBypassToken);
        }

        foreach (var error in result.Errors.Where(e => e.Code != "DuplicateUserName"))
        {
            ModelState.AddModelError(string.Empty, error.Description);
        }

        await Task.Delay(2000);
        throw new BadRequestException(ModelState);
    }

    #endregion

    [HttpPost("password-hint")]
    [AllowAnonymous]
    public async Task PostPasswordHint([FromBody] PasswordHintRequestModel model)
    {
        await _userService.SendMasterPasswordHintAsync(model.Email);
    }

    [HttpPost("email-token")]
    public async Task PostEmailToken([FromBody] EmailTokenRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        if (user.UsesKeyConnector)
        {
            throw new BadRequestException("You cannot change your email when using Key Connector.");
        }

        if (!await _userService.CheckPasswordAsync(user, model.MasterPasswordHash))
        {
            await Task.Delay(2000);
            throw new BadRequestException("MasterPasswordHash", "Invalid password.");
        }

        await _userService.InitiateEmailChangeAsync(user, model.NewEmail);
    }

    [HttpPost("email")]
    public async Task PostEmail([FromBody] EmailRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        if (user.UsesKeyConnector)
        {
            throw new BadRequestException("You cannot change your email when using Key Connector.");
        }

        var result = await _userService.ChangeEmailAsync(user, model.MasterPasswordHash, model.NewEmail,
            model.NewMasterPasswordHash, model.Token, model.Key);
        if (result.Succeeded)
        {
            return;
        }

        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(string.Empty, error.Description);
        }

        await Task.Delay(2000);
        throw new BadRequestException(ModelState);
    }

    [HttpPost("verify-email")]
    public async Task PostVerifyEmail()
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        await _userService.SendEmailVerificationAsync(user);
    }

    [HttpPost("verify-email-token")]
    [AllowAnonymous]
    public async Task PostVerifyEmailToken([FromBody] VerifyEmailRequestModel model)
    {
        var user = await _userService.GetUserByIdAsync(new Guid(model.UserId));
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }
        var result = await _userService.ConfirmEmailAsync(user, model.Token);
        if (result.Succeeded)
        {
            return;
        }

        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(string.Empty, error.Description);
        }

        await Task.Delay(2000);
        throw new BadRequestException(ModelState);
    }

    [HttpPost("password")]
    public async Task PostPassword([FromBody] PasswordRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        var result = await _userService.ChangePasswordAsync(user, model.MasterPasswordHash,
            model.NewMasterPasswordHash, model.MasterPasswordHint, model.Key);
        if (result.Succeeded)
        {
            return;
        }

        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(string.Empty, error.Description);
        }

        await Task.Delay(2000);
        throw new BadRequestException(ModelState);
    }

    [HttpPost("set-password")]
    public async Task PostSetPasswordAsync([FromBody] SetPasswordRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        var result = await _userService.SetPasswordAsync(model.ToUser(user), model.MasterPasswordHash, model.Key,
            model.OrgIdentifier);
        if (result.Succeeded)
        {
            return;
        }

        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(string.Empty, error.Description);
        }

        throw new BadRequestException(ModelState);
    }

    [HttpPost("verify-password")]
    public async Task<MasterPasswordPolicyResponseModel> PostVerifyPassword([FromBody] SecretVerificationRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        if (await _userService.CheckPasswordAsync(user, model.MasterPasswordHash))
        {
            var policyData = await _policyService.GetMasterPasswordPolicyForUserAsync(user);

            return new MasterPasswordPolicyResponseModel(policyData);
        }

        ModelState.AddModelError(nameof(model.MasterPasswordHash), "Invalid password.");
        await Task.Delay(2000);
        throw new BadRequestException(ModelState);
    }

    [HttpPost("set-key-connector-key")]
    public async Task PostSetKeyConnectorKeyAsync([FromBody] SetKeyConnectorKeyRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        var result = await _userService.SetKeyConnectorKeyAsync(model.ToUser(user), model.Key, model.OrgIdentifier);
        if (result.Succeeded)
        {
            return;
        }

        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(string.Empty, error.Description);
        }

        throw new BadRequestException(ModelState);
    }

    [HttpPost("convert-to-key-connector")]
    public async Task PostConvertToKeyConnector()
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        var result = await _userService.ConvertToKeyConnectorAsync(user);
        if (result.Succeeded)
        {
            return;
        }

        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(string.Empty, error.Description);
        }

        throw new BadRequestException(ModelState);
    }

    [HttpPost("kdf")]
    public async Task PostKdf([FromBody] KdfRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        var result = await _userService.ChangeKdfAsync(user, model.MasterPasswordHash,
            model.NewMasterPasswordHash, model.Key, model.Kdf.Value, model.KdfIterations.Value, model.KdfMemory, model.KdfParallelism);
        if (result.Succeeded)
        {
            return;
        }

        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(string.Empty, error.Description);
        }

        await Task.Delay(2000);
        throw new BadRequestException(ModelState);
    }

    [HttpPost("key")]
    public async Task PostKey([FromBody] UpdateKeyRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        var ciphers = new List<Cipher>();
        if (model.Ciphers.Any())
        {
            var existingCiphers = await _cipherRepository.GetManyByUserIdAsync(user.Id);
            ciphers.AddRange(existingCiphers
                .Join(model.Ciphers, c => c.Id, c => c.Id, (existing, c) => c.ToCipher(existing)));
        }

        var folders = new List<Folder>();
        if (model.Folders.Any())
        {
            var existingFolders = await _folderRepository.GetManyByUserIdAsync(user.Id);
            folders.AddRange(existingFolders
                .Join(model.Folders, f => f.Id, f => f.Id, (existing, f) => f.ToFolder(existing)));
        }

        var sends = new List<Send>();
        if (model.Sends?.Any() == true)
        {
            var existingSends = await _sendRepository.GetManyByUserIdAsync(user.Id);
            sends.AddRange(existingSends
                .Join(model.Sends, s => s.Id, s => s.Id, (existing, s) => s.ToSend(existing, _sendService)));
        }

        var result = await _userService.UpdateKeyAsync(
            user,
            model.MasterPasswordHash,
            model.Key,
            model.PrivateKey,
            ciphers,
            folders,
            sends);

        if (result.Succeeded)
        {
            return;
        }

        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(string.Empty, error.Description);
        }

        await Task.Delay(2000);
        throw new BadRequestException(ModelState);
    }

    [HttpPost("security-stamp")]
    public async Task PostSecurityStamp([FromBody] SecretVerificationRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        var result = await _userService.RefreshSecurityStampAsync(user, model.Secret);
        if (result.Succeeded)
        {
            return;
        }

        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(string.Empty, error.Description);
        }

        await Task.Delay(2000);
        throw new BadRequestException(ModelState);
    }

    [HttpGet("profile")]
    public async Task<ProfileResponseModel> GetProfile()
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        var organizationUserDetails = await _organizationUserRepository.GetManyDetailsByUserAsync(user.Id,
            OrganizationUserStatusType.Confirmed);
        var providerUserDetails = await _providerUserRepository.GetManyDetailsByUserAsync(user.Id,
            ProviderUserStatusType.Confirmed);
        var providerUserOrganizationDetails =
            await _providerUserRepository.GetManyOrganizationDetailsByUserAsync(user.Id,
                ProviderUserStatusType.Confirmed);
        var response = new ProfileResponseModel(user, organizationUserDetails, providerUserDetails,
            providerUserOrganizationDetails, await _userService.TwoFactorIsEnabledAsync(user), await _userService.HasPremiumFromOrganization(user));
        return response;
    }

    [HttpGet("organizations")]
    public async Task<ListResponseModel<ProfileOrganizationResponseModel>> GetOrganizations()
    {
        var userId = _userService.GetProperUserId(User);
        var organizationUserDetails = await _organizationUserRepository.GetManyDetailsByUserAsync(userId.Value,
            OrganizationUserStatusType.Confirmed);
        var responseData = organizationUserDetails.Select(o => new ProfileOrganizationResponseModel(o));
        return new ListResponseModel<ProfileOrganizationResponseModel>(responseData);
    }

    [HttpPut("profile")]
    [HttpPost("profile")]
    public async Task<ProfileResponseModel> PutProfile([FromBody] UpdateProfileRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        await _userService.SaveUserAsync(model.ToUser(user));
        var response = new ProfileResponseModel(user, null, null, null, await _userService.TwoFactorIsEnabledAsync(user), await _userService.HasPremiumFromOrganization(user));
        return response;
    }

    [HttpPut("avatar")]
    [HttpPost("avatar")]
    public async Task<ProfileResponseModel> PutAvatar([FromBody] UpdateAvatarRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }
        await _userService.SaveUserAsync(model.ToUser(user), true);
        var response = new ProfileResponseModel(user, null, null, null, await _userService.TwoFactorIsEnabledAsync(user), await _userService.HasPremiumFromOrganization(user));
        return response;
    }

    [HttpGet("revision-date")]
    public async Task<long?> GetAccountRevisionDate()
    {
        var userId = _userService.GetProperUserId(User);
        long? revisionDate = null;
        if (userId.HasValue)
        {
            var date = await _userService.GetAccountRevisionDateByIdAsync(userId.Value);
            revisionDate = CoreHelpers.ToEpocMilliseconds(date);
        }

        return revisionDate;
    }

    [HttpPost("keys")]
    public async Task<KeysResponseModel> PostKeys([FromBody] KeysRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        await _userService.SaveUserAsync(model.ToUser(user));
        return new KeysResponseModel(user);
    }

    [HttpGet("keys")]
    public async Task<KeysResponseModel> GetKeys()
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        return new KeysResponseModel(user);
    }

    [HttpDelete]
    [HttpPost("delete")]
    public async Task Delete([FromBody] SecretVerificationRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        if (!await _userService.VerifySecretAsync(user, model.Secret))
        {
            ModelState.AddModelError(string.Empty, "User verification failed.");
            await Task.Delay(2000);
        }
        else
        {
            var result = await _userService.DeleteAsync(user);
            if (result.Succeeded)
            {
                return;
            }

            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }
        }

        throw new BadRequestException(ModelState);
    }

    [AllowAnonymous]
    [HttpPost("delete-recover")]
    public async Task PostDeleteRecover([FromBody] DeleteRecoverRequestModel model)
    {
        await _userService.SendDeleteConfirmationAsync(model.Email);
    }

    [HttpPost("delete-recover-token")]
    [AllowAnonymous]
    public async Task PostDeleteRecoverToken([FromBody] VerifyDeleteRecoverRequestModel model)
    {
        var user = await _userService.GetUserByIdAsync(new Guid(model.UserId));
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        var result = await _userService.DeleteAsync(user, model.Token);
        if (result.Succeeded)
        {
            return;
        }

        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(string.Empty, error.Description);
        }

        await Task.Delay(2000);
        throw new BadRequestException(ModelState);
    }

    [HttpPost("iap-check")]
    public async Task PostIapCheck([FromBody] IapCheckRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }
        await _userService.IapCheckAsync(user, model.PaymentMethodType.Value);
    }

    [HttpPost("premium")]
    public async Task<PaymentResponseModel> PostPremium(PremiumRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        var valid = model.Validate(_globalSettings);
        UserLicense license = null;
        if (valid && _globalSettings.SelfHosted)
        {
            license = await ApiHelpers.ReadJsonFileFromBody<UserLicense>(HttpContext, model.License);
        }

        if (!valid && !_globalSettings.SelfHosted && string.IsNullOrWhiteSpace(model.Country))
        {
            throw new BadRequestException("Country is required.");
        }

        if (!valid || (_globalSettings.SelfHosted && license == null))
        {
            throw new BadRequestException("Invalid license.");
        }

        var result = await _userService.SignUpPremiumAsync(user, model.PaymentToken,
            model.PaymentMethodType.Value, model.AdditionalStorageGb.GetValueOrDefault(0), license,
            new TaxInfo
            {
                BillingAddressCountry = model.Country,
                BillingAddressPostalCode = model.PostalCode,
            });
        var profile = new ProfileResponseModel(user, null, null, null, await _userService.TwoFactorIsEnabledAsync(user), await _userService.HasPremiumFromOrganization(user));
        return new PaymentResponseModel
        {
            UserProfile = profile,
            PaymentIntentClientSecret = result.Item2,
            Success = result.Item1
        };
    }

    [HttpGet("subscription")]
    public async Task<SubscriptionResponseModel> GetSubscription()
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        if (!_globalSettings.SelfHosted && user.Gateway != null)
        {
            var subscriptionInfo = await _paymentService.GetSubscriptionAsync(user);
            var license = await _userService.GenerateLicenseAsync(user, subscriptionInfo);
            return new SubscriptionResponseModel(user, subscriptionInfo, license);
        }
        else if (!_globalSettings.SelfHosted)
        {
            var license = await _userService.GenerateLicenseAsync(user);
            return new SubscriptionResponseModel(user, license);
        }
        else
        {
            return new SubscriptionResponseModel(user);
        }
    }

    [HttpPost("payment")]
    [SelfHosted(NotSelfHostedOnly = true)]
    public async Task PostPayment([FromBody] PaymentRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        await _userService.ReplacePaymentMethodAsync(user, model.PaymentToken, model.PaymentMethodType.Value,
            new TaxInfo
            {
                BillingAddressCountry = model.Country,
                BillingAddressPostalCode = model.PostalCode,
            });
    }

    [HttpPost("storage")]
    [SelfHosted(NotSelfHostedOnly = true)]
    public async Task<PaymentResponseModel> PostStorage([FromBody] StorageRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        var result = await _userService.AdjustStorageAsync(user, model.StorageGbAdjustment.Value);
        return new PaymentResponseModel
        {
            Success = true,
            PaymentIntentClientSecret = result
        };
    }

    [HttpPost("license")]
    [SelfHosted(SelfHostedOnly = true)]
    public async Task PostLicense(LicenseRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        var license = await ApiHelpers.ReadJsonFileFromBody<UserLicense>(HttpContext, model.License);
        if (license == null)
        {
            throw new BadRequestException("Invalid license");
        }

        await _userService.UpdateLicenseAsync(user, license);
    }

    [HttpPost("cancel-premium")]
    [SelfHosted(NotSelfHostedOnly = true)]
    public async Task PostCancel()
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        await _userService.CancelPremiumAsync(user);
    }

    [HttpPost("reinstate-premium")]
    [SelfHosted(NotSelfHostedOnly = true)]
    public async Task PostReinstate()
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        await _userService.ReinstatePremiumAsync(user);
    }

    [HttpGet("tax")]
    [SelfHosted(NotSelfHostedOnly = true)]
    public async Task<TaxInfoResponseModel> GetTaxInfo()
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        var taxInfo = await _paymentService.GetTaxInfoAsync(user);
        return new TaxInfoResponseModel(taxInfo);
    }

    [HttpPut("tax")]
    [SelfHosted(NotSelfHostedOnly = true)]
    public async Task PutTaxInfo([FromBody] TaxInfoUpdateRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        var taxInfo = new TaxInfo
        {
            BillingAddressPostalCode = model.PostalCode,
            BillingAddressCountry = model.Country,
        };
        await _paymentService.SaveTaxInfoAsync(user, taxInfo);
    }

    [HttpDelete("sso/{organizationId}")]
    public async Task DeleteSsoUser(string organizationId)
    {
        var userId = _userService.GetProperUserId(User);
        if (!userId.HasValue)
        {
            throw new NotFoundException();
        }

        await _organizationService.DeleteSsoUserAsync(userId.Value, new Guid(organizationId));
    }

    [HttpGet("sso/user-identifier")]
    public async Task<string> GetSsoUserIdentifier()
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        var token = await _userService.GenerateSignInTokenAsync(user, TokenPurposes.LinkSso);
        var userIdentifier = $"{user.Id},{token}";
        return userIdentifier;
    }

    [HttpPost("api-key")]
    public async Task<ApiKeyResponseModel> ApiKey([FromBody] SecretVerificationRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        if (!await _userService.VerifySecretAsync(user, model.Secret))
        {
            await Task.Delay(2000);
            throw new BadRequestException(string.Empty, "User verification failed.");
        }

        return new ApiKeyResponseModel(user);
    }

    [HttpPost("rotate-api-key")]
    public async Task<ApiKeyResponseModel> RotateApiKey([FromBody] SecretVerificationRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        if (!await _userService.VerifySecretAsync(user, model.Secret))
        {
            await Task.Delay(2000);
            throw new BadRequestException(string.Empty, "User verification failed.");
        }

        await _userService.RotateApiKeyAsync(user);
        var response = new ApiKeyResponseModel(user);
        return response;
    }

    [HttpPut("update-temp-password")]
    public async Task PutUpdateTempPasswordAsync([FromBody] UpdateTempPasswordRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        var result = await _userService.UpdateTempPasswordAsync(user, model.NewMasterPasswordHash, model.Key, model.MasterPasswordHint);
        if (result.Succeeded)
        {
            return;
        }

        foreach (var error in result.Errors)
        {
            ModelState.AddModelError(string.Empty, error.Description);
        }

        throw new BadRequestException(ModelState);
    }

    [HttpPost("request-otp")]
    public async Task PostRequestOTP()
    {
        var user = await _userService.GetUserByPrincipalAsync(User);

        await _userService.SendOTPAsync(user);
    }

    [HttpPost("verify-otp")]
    public async Task VerifyOTP([FromBody] VerifyOTPRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);

        if (!await _userService.VerifyOTPAsync(user, model.OTP))
        {
            await Task.Delay(2000);
            throw new BadRequestException("Token", "Invalid token");
        }
    }
}

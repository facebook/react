using Bit.Api.Auth.Models.Request;
using Bit.Api.Auth.Models.Request.Accounts;
using Bit.Api.Models.Request;
using Bit.Api.Models.Response;
using Bit.Core.Auth.Models.Api.Request;
using Bit.Core.Auth.Models.Api.Response;
using Bit.Core.Context;
using Bit.Core.Entities;
using Bit.Core.Exceptions;
using Bit.Core.Repositories;
using Bit.Core.Services;
using Bit.Core.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bit.Api.Controllers;

[Route("devices")]
[Authorize("Application")]
public class DevicesController : Controller
{
    private readonly IDeviceRepository _deviceRepository;
    private readonly IDeviceService _deviceService;
    private readonly IUserService _userService;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentContext _currentContext;

    public DevicesController(
        IDeviceRepository deviceRepository,
        IDeviceService deviceService,
        IUserService userService,
        IUserRepository userRepository,
        ICurrentContext currentContext)
    {
        _deviceRepository = deviceRepository;
        _deviceService = deviceService;
        _userService = userService;
        _userRepository = userRepository;
        _currentContext = currentContext;
    }

    [HttpGet("{id}")]
    public async Task<DeviceResponseModel> Get(string id)
    {
        var device = await _deviceRepository.GetByIdAsync(new Guid(id), _userService.GetProperUserId(User).Value);
        if (device == null)
        {
            throw new NotFoundException();
        }

        var response = new DeviceResponseModel(device);
        return response;
    }

    [HttpGet("identifier/{identifier}")]
    public async Task<DeviceResponseModel> GetByIdentifier(string identifier)
    {
        var device = await _deviceRepository.GetByIdentifierAsync(identifier, _userService.GetProperUserId(User).Value);
        if (device == null)
        {
            throw new NotFoundException();
        }

        var response = new DeviceResponseModel(device);
        return response;
    }

    [HttpGet("")]
    public async Task<ListResponseModel<DeviceResponseModel>> Get()
    {
        ICollection<Device> devices = await _deviceRepository.GetManyByUserIdAsync(_userService.GetProperUserId(User).Value);
        var responses = devices.Select(d => new DeviceResponseModel(d));
        return new ListResponseModel<DeviceResponseModel>(responses);
    }

    [HttpPost("")]
    public async Task<DeviceResponseModel> Post([FromBody] DeviceRequestModel model)
    {
        var device = model.ToDevice(_userService.GetProperUserId(User));
        await _deviceService.SaveAsync(device);

        var response = new DeviceResponseModel(device);
        return response;
    }

    [HttpPut("{id}")]
    [HttpPost("{id}")]
    public async Task<DeviceResponseModel> Put(string id, [FromBody] DeviceRequestModel model)
    {
        var device = await _deviceRepository.GetByIdAsync(new Guid(id), _userService.GetProperUserId(User).Value);
        if (device == null)
        {
            throw new NotFoundException();
        }

        await _deviceService.SaveAsync(model.ToDevice(device));

        var response = new DeviceResponseModel(device);
        return response;
    }

    [HttpPut("{identifier}/keys")]
    [HttpPost("{identifier}/keys")]
    public async Task<DeviceResponseModel> PutKeys(string identifier, [FromBody] DeviceKeysRequestModel model)
    {
        var device = await _deviceRepository.GetByIdentifierAsync(identifier, _userService.GetProperUserId(User).Value);
        if (device == null)
        {
            throw new NotFoundException();
        }

        await _deviceService.SaveAsync(model.ToDevice(device));

        var response = new DeviceResponseModel(device);
        return response;
    }

    [HttpPost("{identifier}/retrieve-keys")]
    public async Task<ProtectedDeviceResponseModel> GetDeviceKeys(string identifier, [FromBody] SecretVerificationRequestModel model)
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

        var device = await _deviceRepository.GetByIdentifierAsync(identifier, user.Id);

        if (device == null)
        {
            throw new NotFoundException();
        }

        return new ProtectedDeviceResponseModel(device);
    }

    [HttpPost("update-trust")]
    public async Task PostUpdateTrust([FromBody] UpdateDevicesTrustRequestModel model)
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

        await _deviceService.UpdateDevicesTrustAsync(
            _currentContext.DeviceIdentifier,
            user.Id,
            model.CurrentDevice,
            model.OtherDevices ?? Enumerable.Empty<OtherDeviceKeysUpdateRequestModel>());
    }

    [HttpPut("identifier/{identifier}/token")]
    [HttpPost("identifier/{identifier}/token")]
    public async Task PutToken(string identifier, [FromBody] DeviceTokenRequestModel model)
    {
        var device = await _deviceRepository.GetByIdentifierAsync(identifier, _userService.GetProperUserId(User).Value);
        if (device == null)
        {
            throw new NotFoundException();
        }

        await _deviceService.SaveAsync(model.ToDevice(device));
    }

    [AllowAnonymous]
    [HttpPut("identifier/{identifier}/clear-token")]
    [HttpPost("identifier/{identifier}/clear-token")]
    public async Task PutClearToken(string identifier)
    {
        var device = await _deviceRepository.GetByIdentifierAsync(identifier);
        if (device == null)
        {
            throw new NotFoundException();
        }

        await _deviceService.ClearTokenAsync(device);
    }

    [HttpDelete("{id}")]
    [HttpPost("{id}/delete")]
    public async Task Delete(string id)
    {
        var device = await _deviceRepository.GetByIdAsync(new Guid(id), _userService.GetProperUserId(User).Value);
        if (device == null)
        {
            throw new NotFoundException();
        }

        await _deviceService.DeleteAsync(device);
    }

    [AllowAnonymous]
    [HttpGet("knowndevice")]
    public async Task<bool> GetByIdentifierQuery(
        [FromHeader(Name = "X-Request-Email")] string email,
        [FromHeader(Name = "X-Device-Identifier")] string deviceIdentifier)
        => await GetByIdentifier(CoreHelpers.Base64UrlDecodeString(email), deviceIdentifier);

    [Obsolete("Path is deprecated due to encoding issues, use /knowndevice instead.")]
    [AllowAnonymous]
    [HttpGet("knowndevice/{email}/{identifier}")]
    public async Task<bool> GetByIdentifier(string email, string identifier)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(identifier))
        {
            throw new BadRequestException("Please provide an email and device identifier");
        }

        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
        {
            return false;
        }

        var device = await _deviceRepository.GetByIdentifierAsync(identifier, user.Id);
        return device != null;
    }
}

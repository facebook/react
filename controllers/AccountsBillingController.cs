using Bit.Api.Models.Response;
using Bit.Core.Services;
using Bit.Core.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bit.Api.Controllers;

[Route("accounts/billing")]
[Authorize("Application")]
public class AccountsBillingController : Controller
{
    private readonly IPaymentService _paymentService;
    private readonly IUserService _userService;

    public AccountsBillingController(
        IPaymentService paymentService,
        IUserService userService)
    {
        _paymentService = paymentService;
        _userService = userService;
    }

    [HttpGet("history")]
    [SelfHosted(NotSelfHostedOnly = true)]
    public async Task<BillingHistoryResponseModel> GetBillingHistory()
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        var billingInfo = await _paymentService.GetBillingHistoryAsync(user);
        return new BillingHistoryResponseModel(billingInfo);
    }

    [HttpGet("payment-method")]
    [SelfHosted(NotSelfHostedOnly = true)]
    public async Task<BillingPaymentResponseModel> GetPaymentMethod()
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        var billingInfo = await _paymentService.GetBillingBalanceAndSourceAsync(user);
        return new BillingPaymentResponseModel(billingInfo);
    }
}

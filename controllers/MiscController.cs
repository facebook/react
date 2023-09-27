using Bit.Api.Models.Request;
using Bit.Core.Settings;
using Bit.Core.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stripe;

namespace Bit.Api.Controllers;

public class MiscController : Controller
{
    private readonly BitPayClient _bitPayClient;
    private readonly GlobalSettings _globalSettings;

    public MiscController(
        BitPayClient bitPayClient,
        GlobalSettings globalSettings)
    {
        _bitPayClient = bitPayClient;
        _globalSettings = globalSettings;
    }

    [Authorize("Application")]
    [HttpPost("~/bitpay-invoice")]
    [SelfHosted(NotSelfHostedOnly = true)]
    public async Task<string> PostBitPayInvoice([FromBody] BitPayInvoiceRequestModel model)
    {
        var invoice = await _bitPayClient.CreateInvoiceAsync(model.ToBitpayInvoice(_globalSettings));
        return invoice.Url;
    }

    [Authorize("Application")]
    [HttpPost("~/setup-payment")]
    [SelfHosted(NotSelfHostedOnly = true)]
    public async Task<string> PostSetupPayment()
    {
        var options = new SetupIntentCreateOptions
        {
            Usage = "off_session"
        };
        var service = new SetupIntentService();
        var setupIntent = await service.CreateAsync(options);
        return setupIntent.ClientSecret;
    }
}

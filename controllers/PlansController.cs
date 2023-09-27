using Bit.Api.Models.Response;
using Bit.Core.Repositories;
using Bit.Core.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bit.Api.Controllers;

[Route("plans")]
[Authorize("Web")]
public class PlansController : Controller
{
    private readonly ITaxRateRepository _taxRateRepository;
    public PlansController(ITaxRateRepository taxRateRepository)
    {
        _taxRateRepository = taxRateRepository;
    }

    [HttpGet("")]
    [AllowAnonymous]
    public ListResponseModel<PlanResponseModel> Get()
    {
        var data = StaticStore.PasswordManagerPlans;
        var responses = data.Select(plan => new PlanResponseModel(plan));
        return new ListResponseModel<PlanResponseModel>(responses);
    }

    [HttpGet("all")]
    [AllowAnonymous]
    public ListResponseModel<PlanResponseModel> GetAllPlans()
    {
        var data = StaticStore.Plans;
        var responses = data.Select(plan => new PlanResponseModel(plan));
        return new ListResponseModel<PlanResponseModel>(responses);
    }

    [HttpGet("sm-plans")]
    [AllowAnonymous]
    public ListResponseModel<PlanResponseModel> GetSecretsManagerPlans()
    {
        var data = StaticStore.SecretManagerPlans;
        var responses = data.Select(plan => new PlanResponseModel(plan));
        return new ListResponseModel<PlanResponseModel>(responses);
    }

    [HttpGet("sales-tax-rates")]
    public async Task<ListResponseModel<TaxRateResponseModel>> GetTaxRates()
    {
        var data = await _taxRateRepository.GetAllActiveAsync();
        var responses = data.Select(x => new TaxRateResponseModel(x));
        return new ListResponseModel<TaxRateResponseModel>(responses);
    }
}

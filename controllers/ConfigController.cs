using Bit.Api.Models.Response;
using Bit.Core.Context;
using Bit.Core.Services;
using Bit.Core.Settings;

using Microsoft.AspNetCore.Mvc;

namespace Bit.Api.Controllers;

[Route("config")]
public class ConfigController : Controller
{
    private readonly IGlobalSettings _globalSettings;
    private readonly ICurrentContext _currentContext;
    private readonly IFeatureService _featureService;

    public ConfigController(
        IGlobalSettings globalSettings,
        ICurrentContext currentContext,
        IFeatureService featureService)
    {
        _globalSettings = globalSettings;
        _currentContext = currentContext;
        _featureService = featureService;
    }

    [HttpGet("")]
    public ConfigResponseModel GetConfigs()
    {
        return new ConfigResponseModel(_globalSettings, _featureService.GetAll(_currentContext));
    }
}

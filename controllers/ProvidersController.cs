using Bit.Api.Models.Request.Providers;
using Bit.Api.Models.Response.Providers;
using Bit.Core.Context;
using Bit.Core.Exceptions;
using Bit.Core.Repositories;
using Bit.Core.Services;
using Bit.Core.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bit.Api.Controllers;

[Route("providers")]
[Authorize("Application")]
public class ProvidersController : Controller
{
    private readonly IUserService _userService;
    private readonly IProviderRepository _providerRepository;
    private readonly IProviderService _providerService;
    private readonly ICurrentContext _currentContext;
    private readonly GlobalSettings _globalSettings;

    public ProvidersController(IUserService userService, IProviderRepository providerRepository,
        IProviderService providerService, ICurrentContext currentContext, GlobalSettings globalSettings)
    {
        _userService = userService;
        _providerRepository = providerRepository;
        _providerService = providerService;
        _currentContext = currentContext;
        _globalSettings = globalSettings;
    }

    [HttpGet("{id:guid}")]
    public async Task<ProviderResponseModel> Get(Guid id)
    {
        if (!_currentContext.ProviderUser(id))
        {
            throw new NotFoundException();
        }

        var provider = await _providerRepository.GetByIdAsync(id);
        if (provider == null)
        {
            throw new NotFoundException();
        }

        return new ProviderResponseModel(provider);
    }

    [HttpPut("{id:guid}")]
    [HttpPost("{id:guid}")]
    public async Task<ProviderResponseModel> Put(Guid id, [FromBody] ProviderUpdateRequestModel model)
    {
        if (!_currentContext.ProviderProviderAdmin(id))
        {
            throw new NotFoundException();
        }

        var provider = await _providerRepository.GetByIdAsync(id);
        if (provider == null)
        {
            throw new NotFoundException();
        }

        await _providerService.UpdateAsync(model.ToProvider(provider, _globalSettings));
        return new ProviderResponseModel(provider);
    }

    [HttpPost("{id:guid}/setup")]
    public async Task<ProviderResponseModel> Setup(Guid id, [FromBody] ProviderSetupRequestModel model)
    {
        if (!_currentContext.ProviderProviderAdmin(id))
        {
            throw new NotFoundException();
        }

        var provider = await _providerRepository.GetByIdAsync(id);
        if (provider == null)
        {
            throw new NotFoundException();
        }

        var userId = _userService.GetProperUserId(User).Value;

        var response =
            await _providerService.CompleteSetupAsync(model.ToProvider(provider), userId, model.Token, model.Key);

        return new ProviderResponseModel(response);
    }
}

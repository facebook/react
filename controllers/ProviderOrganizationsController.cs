using Bit.Api.Models.Request.Providers;
using Bit.Api.Models.Response;
using Bit.Api.Models.Response.Providers;
using Bit.Core.Context;
using Bit.Core.Exceptions;
using Bit.Core.Repositories;
using Bit.Core.Services;
using Bit.Core.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bit.Api.Controllers;

[Route("providers/{providerId:guid}/organizations")]
[Authorize("Application")]
public class ProviderOrganizationsController : Controller
{

    private readonly IProviderOrganizationRepository _providerOrganizationRepository;
    private readonly IProviderService _providerService;
    private readonly IUserService _userService;
    private readonly ICurrentContext _currentContext;

    public ProviderOrganizationsController(
        IProviderOrganizationRepository providerOrganizationRepository,
        IProviderService providerService,
        IUserService userService,
        ICurrentContext currentContext)
    {
        _providerOrganizationRepository = providerOrganizationRepository;
        _providerService = providerService;
        _userService = userService;
        _currentContext = currentContext;
    }

    [HttpGet("")]
    public async Task<ListResponseModel<ProviderOrganizationOrganizationDetailsResponseModel>> Get(Guid providerId)
    {
        if (!_currentContext.AccessProviderOrganizations(providerId))
        {
            throw new NotFoundException();
        }

        var providerOrganizations = await _providerOrganizationRepository.GetManyDetailsByProviderAsync(providerId);
        var responses = providerOrganizations.Select(o => new ProviderOrganizationOrganizationDetailsResponseModel(o));
        return new ListResponseModel<ProviderOrganizationOrganizationDetailsResponseModel>(responses);
    }

    [HttpPost("add")]
    public async Task Add(Guid providerId, [FromBody] ProviderOrganizationAddRequestModel model)
    {
        if (!_currentContext.ManageProviderOrganizations(providerId))
        {
            throw new NotFoundException();
        }

        await _providerService.AddOrganization(providerId, model.OrganizationId, model.Key);
    }

    [HttpPost("")]
    [SelfHosted(NotSelfHostedOnly = true)]
    public async Task<ProviderOrganizationResponseModel> Post(Guid providerId, [FromBody] ProviderOrganizationCreateRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        if (!_currentContext.ManageProviderOrganizations(providerId))
        {
            throw new NotFoundException();
        }

        var organizationSignup = model.OrganizationCreateRequest.ToOrganizationSignup(user);
        var result = await _providerService.CreateOrganizationAsync(providerId, organizationSignup, model.ClientOwnerEmail, user);
        return new ProviderOrganizationResponseModel(result);
    }

    [HttpDelete("{id:guid}")]
    [HttpPost("{id:guid}/delete")]
    public async Task Delete(Guid providerId, Guid id)
    {
        if (!_currentContext.ManageProviderOrganizations(providerId))
        {
            throw new NotFoundException();
        }

        var userId = _userService.GetProperUserId(User);
        await _providerService.RemoveOrganizationAsync(providerId, id, userId.Value);
    }
}

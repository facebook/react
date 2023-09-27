using Bit.Api.Models.Request;
using Bit.Api.Models.Request.Organizations;
using Bit.Api.Models.Response;
using Bit.Api.Models.Response.Organizations;
using Bit.Core.Context;
using Bit.Core.Entities;
using Bit.Core.Exceptions;
using Bit.Core.OrganizationFeatures.OrganizationDomains.Interfaces;
using Bit.Core.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bit.Api.Controllers;

[Route("organizations")]
[Authorize("Application")]
public class OrganizationDomainController : Controller
{
    private readonly ICreateOrganizationDomainCommand _createOrganizationDomainCommand;
    private readonly IVerifyOrganizationDomainCommand _verifyOrganizationDomainCommand;
    private readonly IDeleteOrganizationDomainCommand _deleteOrganizationDomainCommand;
    private readonly IGetOrganizationDomainByIdQuery _getOrganizationDomainByIdQuery;
    private readonly IGetOrganizationDomainByOrganizationIdQuery _getOrganizationDomainByOrganizationIdQuery;
    private readonly ICurrentContext _currentContext;
    private readonly IOrganizationRepository _organizationRepository;
    private readonly IOrganizationDomainRepository _organizationDomainRepository;

    public OrganizationDomainController(
        ICreateOrganizationDomainCommand createOrganizationDomainCommand,
        IVerifyOrganizationDomainCommand verifyOrganizationDomainCommand,
        IDeleteOrganizationDomainCommand deleteOrganizationDomainCommand,
        IGetOrganizationDomainByIdQuery getOrganizationDomainByIdQuery,
        IGetOrganizationDomainByOrganizationIdQuery getOrganizationDomainByOrganizationIdQuery,
        ICurrentContext currentContext,
        IOrganizationRepository organizationRepository,
        IOrganizationDomainRepository organizationDomainRepository)
    {
        _createOrganizationDomainCommand = createOrganizationDomainCommand;
        _verifyOrganizationDomainCommand = verifyOrganizationDomainCommand;
        _deleteOrganizationDomainCommand = deleteOrganizationDomainCommand;
        _getOrganizationDomainByIdQuery = getOrganizationDomainByIdQuery;
        _getOrganizationDomainByOrganizationIdQuery = getOrganizationDomainByOrganizationIdQuery;
        _currentContext = currentContext;
        _organizationRepository = organizationRepository;
        _organizationDomainRepository = organizationDomainRepository;
    }

    [HttpGet("{orgId}/domain")]
    public async Task<ListResponseModel<OrganizationDomainResponseModel>> Get(string orgId)
    {
        var orgIdGuid = new Guid(orgId);
        await ValidateOrganizationAccessAsync(orgIdGuid);

        var domains = await _getOrganizationDomainByOrganizationIdQuery
            .GetDomainsByOrganizationId(orgIdGuid);
        var response = domains.Select(x => new OrganizationDomainResponseModel(x)).ToList();
        return new ListResponseModel<OrganizationDomainResponseModel>(response);
    }

    [HttpGet("{orgId}/domain/{id}")]
    public async Task<OrganizationDomainResponseModel> Get(string orgId, string id)
    {
        var orgIdGuid = new Guid(orgId);
        var IdGuid = new Guid(id);
        await ValidateOrganizationAccessAsync(orgIdGuid);

        var domain = await _getOrganizationDomainByIdQuery.GetOrganizationDomainById(IdGuid);
        if (domain is null)
        {
            throw new NotFoundException();
        }

        return new OrganizationDomainResponseModel(domain);
    }

    [HttpPost("{orgId}/domain")]
    public async Task<OrganizationDomainResponseModel> Post(string orgId,
        [FromBody] OrganizationDomainRequestModel model)
    {
        var orgIdGuid = new Guid(orgId);
        await ValidateOrganizationAccessAsync(orgIdGuid);

        var organizationDomain = new OrganizationDomain
        {
            OrganizationId = orgIdGuid,
            Txt = model.Txt,
            DomainName = model.DomainName.ToLower()
        };

        var domain = await _createOrganizationDomainCommand.CreateAsync(organizationDomain);
        return new OrganizationDomainResponseModel(domain);
    }

    [HttpPost("{orgId}/domain/{id}/verify")]
    public async Task<OrganizationDomainResponseModel> Verify(string orgId, string id)
    {
        var orgIdGuid = new Guid(orgId);
        var idGuid = new Guid(id);
        await ValidateOrganizationAccessAsync(orgIdGuid);

        var domain = await _verifyOrganizationDomainCommand.VerifyOrganizationDomain(idGuid);
        return new OrganizationDomainResponseModel(domain);
    }

    [HttpDelete("{orgId}/domain/{id}")]
    [HttpPost("{orgId}/domain/{id}/remove")]
    public async Task RemoveDomain(string orgId, string id)
    {
        var orgIdGuid = new Guid(orgId);
        var idGuid = new Guid(id);
        await ValidateOrganizationAccessAsync(orgIdGuid);

        await _deleteOrganizationDomainCommand.DeleteAsync(idGuid);
    }

    [AllowAnonymous]
    [HttpPost("domain/sso/details")] // must be post to accept email cleanly
    public async Task<OrganizationDomainSsoDetailsResponseModel> GetOrgDomainSsoDetails(
        [FromBody] OrganizationDomainSsoDetailsRequestModel model)
    {
        var ssoResult = await _organizationDomainRepository.GetOrganizationDomainSsoDetailsAsync(model.Email);
        if (ssoResult is null)
        {
            throw new NotFoundException("Claimed org domain not found");
        }

        return new OrganizationDomainSsoDetailsResponseModel(ssoResult);
    }

    private async Task ValidateOrganizationAccessAsync(Guid orgIdGuid)
    {
        if (!await _currentContext.ManageSso(orgIdGuid))
        {
            throw new UnauthorizedAccessException();
        }

        var organization = await _organizationRepository.GetByIdAsync(orgIdGuid);
        if (organization == null)
        {
            throw new NotFoundException();
        }
    }
}

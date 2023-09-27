using Bit.Api.Models.Request.Organizations;
using Bit.Api.Models.Response.Organizations;
using Bit.Core.AdminConsole.Models.OrganizationConnectionConfigs;
using Bit.Core.Context;
using Bit.Core.Entities;
using Bit.Core.Enums;
using Bit.Core.Exceptions;
using Bit.Core.Models.OrganizationConnectionConfigs;
using Bit.Core.OrganizationFeatures.OrganizationConnections.Interfaces;
using Bit.Core.Repositories;
using Bit.Core.Services;
using Bit.Core.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bit.Api.Controllers;

[Authorize("Application")]
[Route("organizations/connections")]
public class OrganizationConnectionsController : Controller
{
    private readonly ICreateOrganizationConnectionCommand _createOrganizationConnectionCommand;
    private readonly IUpdateOrganizationConnectionCommand _updateOrganizationConnectionCommand;
    private readonly IDeleteOrganizationConnectionCommand _deleteOrganizationConnectionCommand;
    private readonly IOrganizationConnectionRepository _organizationConnectionRepository;
    private readonly ICurrentContext _currentContext;
    private readonly IGlobalSettings _globalSettings;
    private readonly ILicensingService _licensingService;

    public OrganizationConnectionsController(
        ICreateOrganizationConnectionCommand createOrganizationConnectionCommand,
        IUpdateOrganizationConnectionCommand updateOrganizationConnectionCommand,
        IDeleteOrganizationConnectionCommand deleteOrganizationConnectionCommand,
        IOrganizationConnectionRepository organizationConnectionRepository,
        ICurrentContext currentContext,
        IGlobalSettings globalSettings,
        ILicensingService licensingService)
    {
        _createOrganizationConnectionCommand = createOrganizationConnectionCommand;
        _updateOrganizationConnectionCommand = updateOrganizationConnectionCommand;
        _deleteOrganizationConnectionCommand = deleteOrganizationConnectionCommand;
        _organizationConnectionRepository = organizationConnectionRepository;
        _currentContext = currentContext;
        _globalSettings = globalSettings;
        _licensingService = licensingService;
    }

    [HttpGet("enabled")]
    public bool ConnectionsEnabled()
    {
        return _globalSettings.SelfHosted && _globalSettings.EnableCloudCommunication;
    }

    [HttpPost]
    public async Task<OrganizationConnectionResponseModel> CreateConnection([FromBody] OrganizationConnectionRequestModel model)
    {
        if (!await HasPermissionAsync(model?.OrganizationId))
        {
            throw new BadRequestException($"You do not have permission to create a connection of type {model.Type}.");
        }

        if (await HasConnectionTypeAsync(model, null, model.Type))
        {
            throw new BadRequestException($"The requested organization already has a connection of type {model.Type}. Only one of each connection type may exist per organization.");
        }

        switch (model.Type)
        {
            case OrganizationConnectionType.CloudBillingSync:
                return await CreateOrUpdateOrganizationConnectionAsync<BillingSyncConfig>(null, model, ValidateBillingSyncConfig);
            case OrganizationConnectionType.Scim:
                return await CreateOrUpdateOrganizationConnectionAsync<ScimConfig>(null, model);
            default:
                throw new BadRequestException($"Unknown Organization connection Type: {model.Type}");
        }
    }

    [HttpPut("{organizationConnectionId}")]
    public async Task<OrganizationConnectionResponseModel> UpdateConnection(Guid organizationConnectionId, [FromBody] OrganizationConnectionRequestModel model)
    {
        var existingOrganizationConnection = await _organizationConnectionRepository.GetByIdAsync(organizationConnectionId);
        if (existingOrganizationConnection == null)
        {
            throw new NotFoundException();
        }

        if (!await HasPermissionAsync(model?.OrganizationId, model?.Type))
        {
            throw new BadRequestException("You do not have permission to update this connection.");
        }

        if (await HasConnectionTypeAsync(model, organizationConnectionId, model.Type))
        {
            throw new BadRequestException($"The requested organization already has a connection of type {model.Type}. Only one of each connection type may exist per organization.");
        }

        switch (model.Type)
        {
            case OrganizationConnectionType.CloudBillingSync:
                return await CreateOrUpdateOrganizationConnectionAsync<BillingSyncConfig>(organizationConnectionId, model, ValidateBillingSyncConfig);
            case OrganizationConnectionType.Scim:
                return await CreateOrUpdateOrganizationConnectionAsync<ScimConfig>(organizationConnectionId, model);
            default:
                throw new BadRequestException($"Unknown Organization connection Type: {model.Type}");
        }
    }

    [HttpGet("{organizationId}/{type}")]
    public async Task<OrganizationConnectionResponseModel> GetConnection(Guid organizationId, OrganizationConnectionType type)
    {
        if (!await HasPermissionAsync(organizationId, type))
        {
            throw new BadRequestException($"You do not have permission to retrieve a connection of type {type}.");
        }

        var connections = await GetConnectionsAsync(organizationId, type);
        var connection = connections.FirstOrDefault(c => c.Type == type);

        switch (type)
        {
            case OrganizationConnectionType.CloudBillingSync:
                if (!_globalSettings.SelfHosted)
                {
                    throw new BadRequestException($"Cannot get a {type} connection outside of a self-hosted instance.");
                }
                return new OrganizationConnectionResponseModel(connection, typeof(BillingSyncConfig));
            case OrganizationConnectionType.Scim:
                return new OrganizationConnectionResponseModel(connection, typeof(ScimConfig));
            default:
                throw new BadRequestException($"Unknown Organization connection Type: {type}");
        }
    }

    [HttpDelete("{organizationConnectionId}")]
    [HttpPost("{organizationConnectionId}/delete")]
    public async Task DeleteConnection(Guid organizationConnectionId)
    {
        var connection = await _organizationConnectionRepository.GetByIdAsync(organizationConnectionId);

        if (connection == null)
        {
            throw new NotFoundException();
        }

        if (!await HasPermissionAsync(connection.OrganizationId, connection.Type))
        {
            throw new BadRequestException($"You do not have permission to remove this connection of type {connection.Type}.");
        }

        await _deleteOrganizationConnectionCommand.DeleteAsync(connection);
    }

    private async Task<ICollection<OrganizationConnection>> GetConnectionsAsync(Guid organizationId, OrganizationConnectionType type) =>
        await _organizationConnectionRepository.GetByOrganizationIdTypeAsync(organizationId, type);

    private async Task<bool> HasConnectionTypeAsync(OrganizationConnectionRequestModel model, Guid? connectionId,
        OrganizationConnectionType type)
    {
        var existingConnections = await GetConnectionsAsync(model.OrganizationId, type);

        return existingConnections.Any(c => c.Type == model.Type && (!connectionId.HasValue || c.Id != connectionId.Value));
    }

    private async Task<bool> HasPermissionAsync(Guid? organizationId, OrganizationConnectionType? type = null)
    {
        if (!organizationId.HasValue)
        {
            return false;
        }
        return type switch
        {
            OrganizationConnectionType.Scim => await _currentContext.ManageScim(organizationId.Value),
            _ => await _currentContext.OrganizationOwner(organizationId.Value),
        };
    }

    private async Task ValidateBillingSyncConfig(OrganizationConnectionRequestModel<BillingSyncConfig> typedModel)
    {
        if (!_globalSettings.SelfHosted)
        {
            throw new BadRequestException($"Cannot create a {typedModel.Type} connection outside of a self-hosted instance.");
        }
        var license = await _licensingService.ReadOrganizationLicenseAsync(typedModel.OrganizationId);
        if (!_licensingService.VerifyLicense(license))
        {
            throw new BadRequestException("Cannot verify license file.");
        }
        typedModel.ParsedConfig.CloudOrganizationId = license.Id;
    }

    private async Task<OrganizationConnectionResponseModel> CreateOrUpdateOrganizationConnectionAsync<T>(
        Guid? organizationConnectionId,
        OrganizationConnectionRequestModel model,
        Func<OrganizationConnectionRequestModel<T>, Task> validateAction = null)
        where T : IConnectionConfig
    {
        var typedModel = new OrganizationConnectionRequestModel<T>(model);
        if (validateAction != null)
        {
            await validateAction(typedModel);
        }

        var data = typedModel.ToData(organizationConnectionId);
        var connection = organizationConnectionId.HasValue
            ? await _updateOrganizationConnectionCommand.UpdateAsync(data)
            : await _createOrganizationConnectionCommand.CreateAsync(data);

        return new OrganizationConnectionResponseModel(connection, typeof(T));
    }
}

using Bit.Api.Models.Request;
using Bit.Api.Models.Response;
using Bit.Core.Context;
using Bit.Core.Exceptions;
using Bit.Core.OrganizationFeatures.Groups.Interfaces;
using Bit.Core.Repositories;
using Bit.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bit.Api.Controllers;

[Route("organizations/{orgId}/groups")]
[Authorize("Application")]
public class GroupsController : Controller
{
    private readonly IGroupRepository _groupRepository;
    private readonly IGroupService _groupService;
    private readonly IDeleteGroupCommand _deleteGroupCommand;
    private readonly IOrganizationRepository _organizationRepository;
    private readonly ICurrentContext _currentContext;
    private readonly ICreateGroupCommand _createGroupCommand;
    private readonly IUpdateGroupCommand _updateGroupCommand;

    public GroupsController(
        IGroupRepository groupRepository,
        IGroupService groupService,
        IOrganizationRepository organizationRepository,
        ICurrentContext currentContext,
        ICreateGroupCommand createGroupCommand,
        IUpdateGroupCommand updateGroupCommand,
        IDeleteGroupCommand deleteGroupCommand)
    {
        _groupRepository = groupRepository;
        _groupService = groupService;
        _organizationRepository = organizationRepository;
        _currentContext = currentContext;
        _createGroupCommand = createGroupCommand;
        _updateGroupCommand = updateGroupCommand;
        _deleteGroupCommand = deleteGroupCommand;
    }

    [HttpGet("{id}")]
    public async Task<GroupResponseModel> Get(string orgId, string id)
    {
        var group = await _groupRepository.GetByIdAsync(new Guid(id));
        if (group == null || !await _currentContext.ManageGroups(group.OrganizationId))
        {
            throw new NotFoundException();
        }

        return new GroupResponseModel(group);
    }

    [HttpGet("{id}/details")]
    public async Task<GroupDetailsResponseModel> GetDetails(string orgId, string id)
    {
        var groupDetails = await _groupRepository.GetByIdWithCollectionsAsync(new Guid(id));
        if (groupDetails?.Item1 == null || !await _currentContext.ManageGroups(groupDetails.Item1.OrganizationId))
        {
            throw new NotFoundException();
        }

        return new GroupDetailsResponseModel(groupDetails.Item1, groupDetails.Item2);
    }

    [HttpGet("")]
    public async Task<ListResponseModel<GroupDetailsResponseModel>> Get(string orgId)
    {
        var orgIdGuid = new Guid(orgId);
        var canAccess = await _currentContext.ManageGroups(orgIdGuid) ||
            await _currentContext.ViewAssignedCollections(orgIdGuid) ||
            await _currentContext.ViewAllCollections(orgIdGuid) ||
            await _currentContext.ManageUsers(orgIdGuid);

        if (!canAccess)
        {
            throw new NotFoundException();
        }

        var groups = await _groupRepository.GetManyWithCollectionsByOrganizationIdAsync(orgIdGuid);
        var responses = groups.Select(g => new GroupDetailsResponseModel(g.Item1, g.Item2));
        return new ListResponseModel<GroupDetailsResponseModel>(responses);
    }

    [HttpGet("{id}/users")]
    public async Task<IEnumerable<Guid>> GetUsers(string orgId, string id)
    {
        var idGuid = new Guid(id);
        var group = await _groupRepository.GetByIdAsync(idGuid);
        if (group == null || !await _currentContext.ManageGroups(group.OrganizationId))
        {
            throw new NotFoundException();
        }

        var groupIds = await _groupRepository.GetManyUserIdsByIdAsync(idGuid);
        return groupIds;
    }

    [HttpPost("")]
    public async Task<GroupResponseModel> Post(string orgId, [FromBody] GroupRequestModel model)
    {
        var orgIdGuid = new Guid(orgId);
        if (!await _currentContext.ManageGroups(orgIdGuid))
        {
            throw new NotFoundException();
        }

        var organization = await _organizationRepository.GetByIdAsync(orgIdGuid);
        var group = model.ToGroup(orgIdGuid);
        await _createGroupCommand.CreateGroupAsync(group, organization, model.Collections?.Select(c => c.ToSelectionReadOnly()), model.Users);

        return new GroupResponseModel(group);
    }

    [HttpPut("{id}")]
    [HttpPost("{id}")]
    public async Task<GroupResponseModel> Put(string orgId, string id, [FromBody] GroupRequestModel model)
    {
        var group = await _groupRepository.GetByIdAsync(new Guid(id));
        if (group == null || !await _currentContext.ManageGroups(group.OrganizationId))
        {
            throw new NotFoundException();
        }

        var orgIdGuid = new Guid(orgId);
        var organization = await _organizationRepository.GetByIdAsync(orgIdGuid);

        await _updateGroupCommand.UpdateGroupAsync(model.ToGroup(group), organization, model.Collections?.Select(c => c.ToSelectionReadOnly()), model.Users);
        return new GroupResponseModel(group);
    }

    [HttpPut("{id}/users")]
    public async Task PutUsers(string orgId, string id, [FromBody] IEnumerable<Guid> model)
    {
        var group = await _groupRepository.GetByIdAsync(new Guid(id));
        if (group == null || !await _currentContext.ManageGroups(group.OrganizationId))
        {
            throw new NotFoundException();
        }
        await _groupRepository.UpdateUsersAsync(group.Id, model);
    }

    [HttpDelete("{id}")]
    [HttpPost("{id}/delete")]
    public async Task Delete(string orgId, string id)
    {
        var group = await _groupRepository.GetByIdAsync(new Guid(id));
        if (group == null || !await _currentContext.ManageGroups(group.OrganizationId))
        {
            throw new NotFoundException();
        }

        await _deleteGroupCommand.DeleteAsync(group);
    }

    [HttpDelete("")]
    [HttpPost("delete")]
    public async Task BulkDelete([FromBody] GroupBulkRequestModel model)
    {
        var groups = await _groupRepository.GetManyByManyIds(model.Ids);

        foreach (var group in groups)
        {
            if (!await _currentContext.ManageGroups(group.OrganizationId))
            {
                throw new NotFoundException();
            }
        }

        await _deleteGroupCommand.DeleteManyAsync(groups);
    }

    [HttpDelete("{id}/user/{orgUserId}")]
    [HttpPost("{id}/delete-user/{orgUserId}")]
    public async Task Delete(string orgId, string id, string orgUserId)
    {
        var group = await _groupRepository.GetByIdAsync(new Guid(id));
        if (group == null || !await _currentContext.ManageGroups(group.OrganizationId))
        {
            throw new NotFoundException();
        }

        await _groupService.DeleteUserAsync(group, new Guid(orgUserId));
    }
}

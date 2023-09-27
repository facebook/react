using Bit.Api.Models.Request;
using Bit.Api.Models.Response;
using Bit.Core.Context;
using Bit.Core.Entities;
using Bit.Core.Exceptions;
using Bit.Core.OrganizationFeatures.OrganizationCollections.Interfaces;
using Bit.Core.Repositories;
using Bit.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bit.Api.Controllers;

[Route("organizations/{orgId}/collections")]
[Authorize("Application")]
public class CollectionsController : Controller
{
    private readonly ICollectionRepository _collectionRepository;
    private readonly ICollectionService _collectionService;
    private readonly IDeleteCollectionCommand _deleteCollectionCommand;
    private readonly IUserService _userService;
    private readonly ICurrentContext _currentContext;

    public CollectionsController(
        ICollectionRepository collectionRepository,
        ICollectionService collectionService,
        IDeleteCollectionCommand deleteCollectionCommand,
        IUserService userService,
        ICurrentContext currentContext)
    {
        _collectionRepository = collectionRepository;
        _collectionService = collectionService;
        _deleteCollectionCommand = deleteCollectionCommand;
        _userService = userService;
        _currentContext = currentContext;
    }

    [HttpGet("{id}")]
    public async Task<CollectionResponseModel> Get(Guid orgId, Guid id)
    {
        if (!await CanViewCollectionAsync(orgId, id))
        {
            throw new NotFoundException();
        }

        var collection = await GetCollectionAsync(id, orgId);
        return new CollectionResponseModel(collection);
    }

    [HttpGet("{id}/details")]
    public async Task<CollectionAccessDetailsResponseModel> GetDetails(Guid orgId, Guid id)
    {
        if (!await ViewAtLeastOneCollectionAsync(orgId) && !await _currentContext.ManageUsers(orgId))
        {
            throw new NotFoundException();
        }

        if (await _currentContext.ViewAllCollections(orgId))
        {
            (var collection, var access) = await _collectionRepository.GetByIdWithAccessAsync(id);
            if (collection == null || collection.OrganizationId != orgId)
            {
                throw new NotFoundException();
            }
            return new CollectionAccessDetailsResponseModel(collection, access.Groups, access.Users);
        }
        else
        {
            (var collection, var access) = await _collectionRepository.GetByIdWithAccessAsync(id,
                _currentContext.UserId.Value);
            if (collection == null || collection.OrganizationId != orgId)
            {
                throw new NotFoundException();
            }
            return new CollectionAccessDetailsResponseModel(collection, access.Groups, access.Users);
        }
    }

    [HttpGet("details")]
    public async Task<ListResponseModel<CollectionAccessDetailsResponseModel>> GetManyWithDetails(Guid orgId)
    {
        if (!await ViewAtLeastOneCollectionAsync(orgId) && !await _currentContext.ManageUsers(orgId) && !await _currentContext.ManageGroups(orgId))
        {
            throw new NotFoundException();
        }

        // We always need to know which collections the current user is assigned to
        var assignedOrgCollections = await _collectionRepository.GetManyByUserIdWithAccessAsync(_currentContext.UserId.Value, orgId);

        if (await _currentContext.ViewAllCollections(orgId) || await _currentContext.ManageUsers(orgId))
        {
            // The user can view all collections, but they may not always be assigned to all of them
            var allOrgCollections = await _collectionRepository.GetManyByOrganizationIdWithAccessAsync(orgId);

            return new ListResponseModel<CollectionAccessDetailsResponseModel>(allOrgCollections.Select(c =>
                new CollectionAccessDetailsResponseModel(c.Item1, c.Item2.Groups, c.Item2.Users)
                {
                    // Manually determine which collections they're assigned to
                    Assigned = assignedOrgCollections.Any(ac => ac.Item1.Id == c.Item1.Id)
                })
            );
        }

        return new ListResponseModel<CollectionAccessDetailsResponseModel>(assignedOrgCollections.Select(c =>
            new CollectionAccessDetailsResponseModel(c.Item1, c.Item2.Groups, c.Item2.Users)
            {
                Assigned = true // Mapping from assignedOrgCollections implies they're all assigned
            })
        );
    }

    [HttpGet("")]
    public async Task<ListResponseModel<CollectionResponseModel>> Get(Guid orgId)
    {
        IEnumerable<Collection> orgCollections = await _collectionService.GetOrganizationCollectionsAsync(orgId);

        var responses = orgCollections.Select(c => new CollectionResponseModel(c));
        return new ListResponseModel<CollectionResponseModel>(responses);
    }

    [HttpGet("~/collections")]
    public async Task<ListResponseModel<CollectionDetailsResponseModel>> GetUser()
    {
        var collections = await _collectionRepository.GetManyByUserIdAsync(
            _userService.GetProperUserId(User).Value);
        var responses = collections.Select(c => new CollectionDetailsResponseModel(c));
        return new ListResponseModel<CollectionDetailsResponseModel>(responses);
    }

    [HttpGet("{id}/users")]
    public async Task<IEnumerable<SelectionReadOnlyResponseModel>> GetUsers(Guid orgId, Guid id)
    {
        var collection = await GetCollectionAsync(id, orgId);
        var collectionUsers = await _collectionRepository.GetManyUsersByIdAsync(collection.Id);
        var responses = collectionUsers.Select(cu => new SelectionReadOnlyResponseModel(cu));
        return responses;
    }

    [HttpPost("")]
    public async Task<CollectionResponseModel> Post(Guid orgId, [FromBody] CollectionRequestModel model)
    {
        var collection = model.ToCollection(orgId);

        if (!await CanCreateCollection(orgId, collection.Id) &&
            !await CanEditCollectionAsync(orgId, collection.Id))
        {
            throw new NotFoundException();
        }

        var groups = model.Groups?.Select(g => g.ToSelectionReadOnly());
        var users = model.Users?.Select(g => g.ToSelectionReadOnly());

        var assignUserToCollection = !(await _currentContext.EditAnyCollection(orgId)) &&
            await _currentContext.EditAssignedCollections(orgId);

        await _collectionService.SaveAsync(collection, groups, users, assignUserToCollection ? _currentContext.UserId : null);
        return new CollectionResponseModel(collection);
    }

    [HttpPut("{id}")]
    [HttpPost("{id}")]
    public async Task<CollectionResponseModel> Put(Guid orgId, Guid id, [FromBody] CollectionRequestModel model)
    {
        if (!await CanEditCollectionAsync(orgId, id))
        {
            throw new NotFoundException();
        }

        var collection = await GetCollectionAsync(id, orgId);
        var groups = model.Groups?.Select(g => g.ToSelectionReadOnly());
        var users = model.Users?.Select(g => g.ToSelectionReadOnly());
        await _collectionService.SaveAsync(model.ToCollection(collection), groups, users);
        return new CollectionResponseModel(collection);
    }

    [HttpPut("{id}/users")]
    public async Task PutUsers(Guid orgId, Guid id, [FromBody] IEnumerable<SelectionReadOnlyRequestModel> model)
    {
        if (!await CanEditCollectionAsync(orgId, id))
        {
            throw new NotFoundException();
        }

        var collection = await GetCollectionAsync(id, orgId);
        await _collectionRepository.UpdateUsersAsync(collection.Id, model?.Select(g => g.ToSelectionReadOnly()));
    }

    [HttpDelete("{id}")]
    [HttpPost("{id}/delete")]
    public async Task Delete(Guid orgId, Guid id)
    {
        if (!await CanDeleteCollectionAsync(orgId, id))
        {
            throw new NotFoundException();
        }

        var collection = await GetCollectionAsync(id, orgId);
        await _deleteCollectionCommand.DeleteAsync(collection);
    }

    [HttpDelete("")]
    [HttpPost("delete")]
    public async Task DeleteMany([FromBody] CollectionBulkDeleteRequestModel model)
    {
        var orgId = new Guid(model.OrganizationId);
        var collectionIds = model.Ids.Select(i => new Guid(i));
        if (!await _currentContext.DeleteAssignedCollections(orgId) && !await _currentContext.DeleteAnyCollection(orgId))
        {
            throw new NotFoundException();
        }

        var userCollections = await _collectionService.GetOrganizationCollectionsAsync(orgId);
        var filteredCollections = userCollections.Where(c => collectionIds.Contains(c.Id) && c.OrganizationId == orgId);

        if (!filteredCollections.Any())
        {
            throw new BadRequestException("No collections found.");
        }

        await _deleteCollectionCommand.DeleteManyAsync(filteredCollections);
    }

    [HttpDelete("{id}/user/{orgUserId}")]
    [HttpPost("{id}/delete-user/{orgUserId}")]
    public async Task Delete(string orgId, string id, string orgUserId)
    {
        var collection = await GetCollectionAsync(new Guid(id), new Guid(orgId));
        await _collectionService.DeleteUserAsync(collection, new Guid(orgUserId));
    }

    private async Task<Collection> GetCollectionAsync(Guid id, Guid orgId)
    {
        Collection collection = default;
        if (await _currentContext.ViewAllCollections(orgId))
        {
            collection = await _collectionRepository.GetByIdAsync(id);
        }
        else if (await _currentContext.ViewAssignedCollections(orgId))
        {
            collection = await _collectionRepository.GetByIdAsync(id, _currentContext.UserId.Value);
        }

        if (collection == null || collection.OrganizationId != orgId)
        {
            throw new NotFoundException();
        }

        return collection;
    }


    private async Task<bool> CanCreateCollection(Guid orgId, Guid collectionId)
    {
        if (collectionId != default)
        {
            return false;
        }

        return await _currentContext.CreateNewCollections(orgId);
    }

    private async Task<bool> CanEditCollectionAsync(Guid orgId, Guid collectionId)
    {
        if (collectionId == default)
        {
            return false;
        }

        if (await _currentContext.EditAnyCollection(orgId))
        {
            return true;
        }

        if (await _currentContext.EditAssignedCollections(orgId))
        {
            var collectionDetails = await _collectionRepository.GetByIdAsync(collectionId, _currentContext.UserId.Value);
            return collectionDetails != null;
        }

        return false;
    }

    private async Task<bool> CanDeleteCollectionAsync(Guid orgId, Guid collectionId)
    {
        if (collectionId == default)
        {
            return false;
        }

        if (await _currentContext.DeleteAnyCollection(orgId))
        {
            return true;
        }

        if (await _currentContext.DeleteAssignedCollections(orgId))
        {
            var collectionDetails = await _collectionRepository.GetByIdAsync(collectionId, _currentContext.UserId.Value);
            return collectionDetails != null;
        }

        return false;
    }

    private async Task<bool> CanViewCollectionAsync(Guid orgId, Guid collectionId)
    {
        if (collectionId == default)
        {
            return false;
        }

        if (await _currentContext.ViewAllCollections(orgId))
        {
            return true;
        }

        if (await _currentContext.ViewAssignedCollections(orgId))
        {
            var collectionDetails = await _collectionRepository.GetByIdAsync(collectionId, _currentContext.UserId.Value);
            return collectionDetails != null;
        }

        return false;
    }

    private async Task<bool> ViewAtLeastOneCollectionAsync(Guid orgId)
    {
        return await _currentContext.ViewAllCollections(orgId) || await _currentContext.ViewAssignedCollections(orgId);
    }
}

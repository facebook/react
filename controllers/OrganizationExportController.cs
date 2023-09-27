using Bit.Api.Models.Response;
using Bit.Api.Vault.Models.Response;
using Bit.Core.Context;
using Bit.Core.Entities;
using Bit.Core.Services;
using Bit.Core.Settings;
using Bit.Core.Vault.Models.Data;
using Bit.Core.Vault.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bit.Api.Controllers;

[Route("organizations/{organizationId}")]
[Authorize("Application")]
public class OrganizationExportController : Controller
{
    private readonly ICurrentContext _currentContext;
    private readonly IUserService _userService;
    private readonly ICollectionService _collectionService;
    private readonly ICipherService _cipherService;
    private readonly GlobalSettings _globalSettings;

    public OrganizationExportController(
        ICurrentContext currentContext,
        ICipherService cipherService,
        ICollectionService collectionService,
        IUserService userService,
        GlobalSettings globalSettings)
    {
        _currentContext = currentContext;
        _cipherService = cipherService;
        _collectionService = collectionService;
        _userService = userService;
        _globalSettings = globalSettings;
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export(Guid organizationId)
    {
        var userId = _userService.GetProperUserId(User).Value;

        IEnumerable<Collection> orgCollections = await _collectionService.GetOrganizationCollectionsAsync(organizationId);
        (IEnumerable<CipherOrganizationDetails> orgCiphers, Dictionary<Guid, IGrouping<Guid, CollectionCipher>> collectionCiphersGroupDict) = await _cipherService.GetOrganizationCiphers(userId, organizationId);

        if (_currentContext.ClientVersion == null || _currentContext.ClientVersion >= new Version("2023.1.0"))
        {
            var organizationExportResponseModel = new OrganizationExportResponseModel
            {
                Collections = orgCollections.Select(c => new CollectionResponseModel(c)),
                Ciphers = orgCiphers.Select(c => new CipherMiniDetailsResponseModel(c, _globalSettings, collectionCiphersGroupDict, c.OrganizationUseTotp))
            };

            return Ok(organizationExportResponseModel);
        }

        // Backward compatibility with versions before 2023.1.0 that use ListResponseModel
        var organizationExportListResponseModel = new OrganizationExportListResponseModel
        {
            Collections = GetOrganizationCollectionsResponse(orgCollections),
            Ciphers = GetOrganizationCiphersResponse(orgCiphers, collectionCiphersGroupDict)
        };

        return Ok(organizationExportListResponseModel);
    }

    private ListResponseModel<CollectionResponseModel> GetOrganizationCollectionsResponse(IEnumerable<Collection> orgCollections)
    {
        var collections = orgCollections.Select(c => new CollectionResponseModel(c));
        return new ListResponseModel<CollectionResponseModel>(collections);
    }

    private ListResponseModel<CipherMiniDetailsResponseModel> GetOrganizationCiphersResponse(IEnumerable<CipherOrganizationDetails> orgCiphers,
        Dictionary<Guid, IGrouping<Guid, CollectionCipher>> collectionCiphersGroupDict)
    {
        var responses = orgCiphers.Select(c => new CipherMiniDetailsResponseModel(c, _globalSettings,
            collectionCiphersGroupDict, c.OrganizationUseTotp));

        return new ListResponseModel<CipherMiniDetailsResponseModel>(responses);
    }
}

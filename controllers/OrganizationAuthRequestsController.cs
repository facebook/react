using Bit.Api.Auth.Models.Request;
using Bit.Api.Auth.Models.Response;
using Bit.Api.Models.Response;
using Bit.Core;
using Bit.Core.AdminConsole.OrganizationAuth.Interfaces;
using Bit.Core.Auth.Models.Api.Request.AuthRequest;
using Bit.Core.Auth.Services;
using Bit.Core.Context;
using Bit.Core.Exceptions;
using Bit.Core.Repositories;
using Bit.Core.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bit.Api.Controllers;

[Route("organizations/{orgId}/auth-requests")]
[Authorize("Application")]
[RequireFeature(FeatureFlagKeys.TrustedDeviceEncryption)]
public class OrganizationAuthRequestsController : Controller
{
    private readonly IAuthRequestRepository _authRequestRepository;
    private readonly ICurrentContext _currentContext;
    private readonly IAuthRequestService _authRequestService;
    private readonly IUpdateOrganizationAuthRequestCommand _updateOrganizationAuthRequestCommand;

    public OrganizationAuthRequestsController(IAuthRequestRepository authRequestRepository,
        ICurrentContext currentContext, IAuthRequestService authRequestService,
        IUpdateOrganizationAuthRequestCommand updateOrganizationAuthRequestCommand)
    {
        _authRequestRepository = authRequestRepository;
        _currentContext = currentContext;
        _authRequestService = authRequestService;
        _updateOrganizationAuthRequestCommand = updateOrganizationAuthRequestCommand;
    }

    [HttpGet("")]
    public async Task<ListResponseModel<PendingOrganizationAuthRequestResponseModel>> GetPendingRequests(Guid orgId)
    {
        await ValidateAdminRequest(orgId);

        var authRequests = await _authRequestRepository.GetManyPendingByOrganizationIdAsync(orgId);
        var responses = authRequests
            .Select(a => new PendingOrganizationAuthRequestResponseModel(a))
            .ToList();
        return new ListResponseModel<PendingOrganizationAuthRequestResponseModel>(responses);
    }

    [HttpPost("{requestId}")]
    public async Task UpdateAuthRequest(Guid orgId, Guid requestId, [FromBody] AdminAuthRequestUpdateRequestModel model)
    {
        await ValidateAdminRequest(orgId);

        var authRequest =
            (await _authRequestRepository.GetManyAdminApprovalRequestsByManyIdsAsync(orgId, new[] { requestId })).FirstOrDefault();

        if (authRequest == null || authRequest.OrganizationId != orgId)
        {
            throw new NotFoundException();
        }

        await _updateOrganizationAuthRequestCommand.UpdateAsync(authRequest.Id, authRequest.UserId, model.RequestApproved, model.EncryptedUserKey);
    }

    [HttpPost("deny")]
    public async Task BulkDenyRequests(Guid orgId, [FromBody] BulkDenyAdminAuthRequestRequestModel model)
    {
        await ValidateAdminRequest(orgId);

        var authRequests = await _authRequestRepository.GetManyAdminApprovalRequestsByManyIdsAsync(orgId, model.Ids);

        foreach (var authRequest in authRequests)
        {
            await _authRequestService.UpdateAuthRequestAsync(authRequest.Id, authRequest.UserId,
                new AuthRequestUpdateRequestModel { RequestApproved = false, });
        }
    }

    private async Task ValidateAdminRequest(Guid orgId)
    {
        if (!await _currentContext.ManageResetPassword(orgId))
        {
            throw new UnauthorizedAccessException();
        }
    }
}


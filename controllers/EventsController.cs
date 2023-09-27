using Bit.Api.Models.Response;
using Bit.Core.Context;
using Bit.Core.Exceptions;
using Bit.Core.Models.Data;
using Bit.Core.Repositories;
using Bit.Core.Services;
using Bit.Core.Vault.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bit.Api.Controllers;

[Route("events")]
[Authorize("Application")]
public class EventsController : Controller
{
    private readonly IUserService _userService;
    private readonly ICipherRepository _cipherRepository;
    private readonly IOrganizationUserRepository _organizationUserRepository;
    private readonly IProviderUserRepository _providerUserRepository;
    private readonly IEventRepository _eventRepository;
    private readonly ICurrentContext _currentContext;

    public EventsController(
        IUserService userService,
        ICipherRepository cipherRepository,
        IOrganizationUserRepository organizationUserRepository,
        IProviderUserRepository providerUserRepository,
        IEventRepository eventRepository,
        ICurrentContext currentContext)
    {
        _userService = userService;
        _cipherRepository = cipherRepository;
        _organizationUserRepository = organizationUserRepository;
        _providerUserRepository = providerUserRepository;
        _eventRepository = eventRepository;
        _currentContext = currentContext;
    }

    [HttpGet("")]
    public async Task<ListResponseModel<EventResponseModel>> GetUser(
        [FromQuery] DateTime? start = null, [FromQuery] DateTime? end = null, [FromQuery] string continuationToken = null)
    {
        var dateRange = GetDateRange(start, end);
        var userId = _userService.GetProperUserId(User).Value;
        var result = await _eventRepository.GetManyByUserAsync(userId, dateRange.Item1, dateRange.Item2,
            new PageOptions { ContinuationToken = continuationToken });
        var responses = result.Data.Select(e => new EventResponseModel(e));
        return new ListResponseModel<EventResponseModel>(responses, result.ContinuationToken);
    }

    [HttpGet("~/ciphers/{id}/events")]
    public async Task<ListResponseModel<EventResponseModel>> GetCipher(string id,
        [FromQuery] DateTime? start = null, [FromQuery] DateTime? end = null, [FromQuery] string continuationToken = null)
    {
        var cipher = await _cipherRepository.GetByIdAsync(new Guid(id));
        if (cipher == null)
        {
            throw new NotFoundException();
        }

        var canView = false;
        if (cipher.OrganizationId.HasValue)
        {
            canView = await _currentContext.AccessEventLogs(cipher.OrganizationId.Value);
        }
        else if (cipher.UserId.HasValue)
        {
            var userId = _userService.GetProperUserId(User).Value;
            canView = userId == cipher.UserId.Value;
        }

        if (!canView)
        {
            throw new NotFoundException();
        }

        var dateRange = GetDateRange(start, end);
        var result = await _eventRepository.GetManyByCipherAsync(cipher, dateRange.Item1, dateRange.Item2,
            new PageOptions { ContinuationToken = continuationToken });
        var responses = result.Data.Select(e => new EventResponseModel(e));
        return new ListResponseModel<EventResponseModel>(responses, result.ContinuationToken);
    }

    [HttpGet("~/organizations/{id}/events")]
    public async Task<ListResponseModel<EventResponseModel>> GetOrganization(string id,
        [FromQuery] DateTime? start = null, [FromQuery] DateTime? end = null, [FromQuery] string continuationToken = null)
    {
        var orgId = new Guid(id);
        if (!await _currentContext.AccessEventLogs(orgId))
        {
            throw new NotFoundException();
        }

        var dateRange = GetDateRange(start, end);
        var result = await _eventRepository.GetManyByOrganizationAsync(orgId, dateRange.Item1, dateRange.Item2,
            new PageOptions { ContinuationToken = continuationToken });
        var responses = result.Data.Select(e => new EventResponseModel(e));
        return new ListResponseModel<EventResponseModel>(responses, result.ContinuationToken);
    }

    [HttpGet("~/organizations/{orgId}/users/{id}/events")]
    public async Task<ListResponseModel<EventResponseModel>> GetOrganizationUser(string orgId, string id,
        [FromQuery] DateTime? start = null, [FromQuery] DateTime? end = null, [FromQuery] string continuationToken = null)
    {
        var organizationUser = await _organizationUserRepository.GetByIdAsync(new Guid(id));
        if (organizationUser == null || !organizationUser.UserId.HasValue ||
            !await _currentContext.AccessEventLogs(organizationUser.OrganizationId))
        {
            throw new NotFoundException();
        }

        var dateRange = GetDateRange(start, end);
        var result = await _eventRepository.GetManyByOrganizationActingUserAsync(organizationUser.OrganizationId,
            organizationUser.UserId.Value, dateRange.Item1, dateRange.Item2,
            new PageOptions { ContinuationToken = continuationToken });
        var responses = result.Data.Select(e => new EventResponseModel(e));
        return new ListResponseModel<EventResponseModel>(responses, result.ContinuationToken);
    }

    [HttpGet("~/providers/{providerId:guid}/events")]
    public async Task<ListResponseModel<EventResponseModel>> GetProvider(Guid providerId,
        [FromQuery] DateTime? start = null, [FromQuery] DateTime? end = null, [FromQuery] string continuationToken = null)
    {
        if (!_currentContext.ProviderAccessEventLogs(providerId))
        {
            throw new NotFoundException();
        }

        var dateRange = GetDateRange(start, end);
        var result = await _eventRepository.GetManyByProviderAsync(providerId, dateRange.Item1, dateRange.Item2,
            new PageOptions { ContinuationToken = continuationToken });
        var responses = result.Data.Select(e => new EventResponseModel(e));
        return new ListResponseModel<EventResponseModel>(responses, result.ContinuationToken);
    }

    [HttpGet("~/providers/{providerId:guid}/users/{id:guid}/events")]
    public async Task<ListResponseModel<EventResponseModel>> GetProviderUser(Guid providerId, Guid id,
        [FromQuery] DateTime? start = null, [FromQuery] DateTime? end = null, [FromQuery] string continuationToken = null)
    {
        var providerUser = await _providerUserRepository.GetByIdAsync(id);
        if (providerUser == null || !providerUser.UserId.HasValue ||
            !_currentContext.ProviderAccessEventLogs(providerUser.ProviderId))
        {
            throw new NotFoundException();
        }

        var dateRange = GetDateRange(start, end);
        var result = await _eventRepository.GetManyByProviderActingUserAsync(providerUser.ProviderId,
            providerUser.UserId.Value, dateRange.Item1, dateRange.Item2,
            new PageOptions { ContinuationToken = continuationToken });
        var responses = result.Data.Select(e => new EventResponseModel(e));
        return new ListResponseModel<EventResponseModel>(responses, result.ContinuationToken);
    }

    private Tuple<DateTime, DateTime> GetDateRange(DateTime? start, DateTime? end)
    {
        if (!end.HasValue || !start.HasValue)
        {
            end = DateTime.UtcNow.Date.AddDays(1).AddMilliseconds(-1);
            start = DateTime.UtcNow.Date.AddDays(-30);
        }
        else if (start.Value > end.Value)
        {
            var newEnd = start;
            start = end;
            end = newEnd;
        }

        if ((end.Value - start.Value) > TimeSpan.FromDays(367))
        {
            throw new BadRequestException("Range too large.");
        }

        return new Tuple<DateTime, DateTime>(start.Value, end.Value);
    }
}

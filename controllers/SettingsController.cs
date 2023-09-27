using Bit.Api.Models.Request;
using Bit.Api.Models.Response;
using Bit.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bit.Api.Controllers;

[Route("settings")]
[Authorize("Application")]
public class SettingsController : Controller
{
    private readonly IUserService _userService;

    public SettingsController(
        IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("domains")]
    public async Task<DomainsResponseModel> GetDomains(bool excluded = true)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        var response = new DomainsResponseModel(user, excluded);
        return response;
    }

    [HttpPut("domains")]
    [HttpPost("domains")]
    public async Task<DomainsResponseModel> PutDomains([FromBody] UpdateDomainsRequestModel model)
    {
        var user = await _userService.GetUserByPrincipalAsync(User);
        if (user == null)
        {
            throw new UnauthorizedAccessException();
        }

        await _userService.SaveUserAsync(model.ToUser(user), true);

        var response = new DomainsResponseModel(user);
        return response;
    }
}

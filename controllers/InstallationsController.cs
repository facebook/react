using Bit.Api.Models.Request;
using Bit.Api.Models.Response;
using Bit.Core.Exceptions;
using Bit.Core.Repositories;
using Bit.Core.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bit.Api.Controllers;

[Route("installations")]
[SelfHosted(NotSelfHostedOnly = true)]
public class InstallationsController : Controller
{
    private readonly IInstallationRepository _installationRepository;

    public InstallationsController(
        IInstallationRepository installationRepository)
    {
        _installationRepository = installationRepository;
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<InstallationResponseModel> Get(Guid id)
    {
        var installation = await _installationRepository.GetByIdAsync(id);
        if (installation == null)
        {
            throw new NotFoundException();
        }

        return new InstallationResponseModel(installation, false);
    }

    [HttpPost("")]
    [AllowAnonymous]
    public async Task<InstallationResponseModel> Post([FromBody] InstallationRequestModel model)
    {
        var installation = model.ToInstallation();
        await _installationRepository.CreateAsync(installation);
        return new InstallationResponseModel(installation, true);
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebhookViewer.Api.Models;
using WebhookViewer.Api.Services;

namespace WebhookViewer.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly ISettingsStore _settings;

    public SettingsController(ISettingsStore settings)
    {
        _settings = settings;
    }

    [HttpGet]
    public async Task<ActionResult<TTLSettings>> Get()
    {
        var settings = await _settings.GetAsync();
        return Ok(settings);
    }

    [HttpPut]
    [Authorize(Policy = "ManageSettings")]
    public async Task<ActionResult<TTLSettings>> Put([FromBody] TTLSettings settings)
    {
        var saved = await _settings.SaveAsync(settings);
        return Ok(saved);
    }
}

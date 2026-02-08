using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using WebhookViewer.Api.Hubs;
using WebhookViewer.Api.Models;
using WebhookViewer.Api.Services;

namespace WebhookViewer.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MessagesController : ControllerBase
{
    private readonly IMessageStore _store;
    private readonly IHubContext<WebhookHub> _hub;

    public MessagesController(IMessageStore store, IHubContext<WebhookHub> hub)
    {
        _store = store;
        _hub = hub;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<WebhookMessage>>> List([FromQuery] MessageFilter filter)
    {
        var result = await _store.ListAsync(filter);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WebhookMessage>> Get(string id)
    {
        var message = await _store.GetAsync(id);
        if (message == null) return NotFound();
        return Ok(message);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "DeleteSingle")]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await _store.DeleteAsync(id);
        if (!deleted) return NotFound();

        await _hub.Clients.All.SendAsync("MessageDeleted", id);
        return NoContent();
    }

    [HttpDelete]
    [Authorize(Policy = "DeleteBulk")]
    public async Task<IActionResult> BatchDelete([FromBody] BatchDeleteRequest request)
    {
        if (request.All)
        {
            var count = await _store.DeleteAllAsync();
            await _hub.Clients.All.SendAsync("AllMessagesDeleted");
            return Ok(new { deleted = count });
        }

        if (request.Filter != null)
        {
            var ids = await _store.DeleteByFilterAsync(request.Filter);
            await _hub.Clients.All.SendAsync("MessagesDeleted", ids);
            return Ok(new { deleted = ids.Count, ids });
        }

        if (request.Ids is { Count: > 0 })
        {
            var ids = await _store.DeleteBatchAsync(request.Ids);
            await _hub.Clients.All.SendAsync("MessagesDeleted", ids);
            return Ok(new { deleted = ids.Count, ids });
        }

        return BadRequest(new { error = "Provide ids, filter, or set all=true" });
    }
}

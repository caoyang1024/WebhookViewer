using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using WebhookViewer.Api.Hubs;
using WebhookViewer.Api.Models;
using WebhookViewer.Api.Services;

namespace WebhookViewer.Api.Controllers;

[ApiController]
public class WebhookReceiverController : ControllerBase
{
    private const int PreviewMaxLength = 200;

    private static readonly string[] PreviewFields =
        ["message", "RenderedMessage", "@m", "msg", "MessageTemplate", "@mt"];

    private static readonly string[] LevelFields =
        ["Level", "level", "@l", "severity", "Severity"];

    private readonly IMessageStore _store;
    private readonly IHubContext<WebhookHub> _hub;

    public WebhookReceiverController(IMessageStore store, IHubContext<WebhookHub> hub)
    {
        _store = store;
        _hub = hub;
    }

    [HttpPost("api/webhook/{**path}")]
    public async Task<IActionResult> CatchAll(string? path)
    {
        Request.EnableBuffering();

        string? body = null;
        if (Request.ContentLength > 0 || Request.Body.CanRead)
        {
            using var reader = new StreamReader(Request.Body, leaveOpen: true);
            body = await reader.ReadToEndAsync();
            if (string.IsNullOrEmpty(body)) body = null;
        }

        var headers = new Dictionary<string, string[]>();
        foreach (var header in Request.Headers)
        {
            headers[header.Key] = header.Value.Select(v => v ?? string.Empty).ToArray();
        }

        var webhookPath = "/" + (path ?? string.Empty);
        var sourceIp = HttpContext.Connection.RemoteIpAddress?.ToString();
        var storedIds = new List<string>();

        if (body != null)
        {
            var messages = SplitBody(body, webhookPath, sourceIp, headers);
            foreach (var message in messages)
            {
                await _store.StoreAsync(message);
                await _hub.Clients.All.SendAsync("NewMessage", message);
                storedIds.Add(message.Id);
            }
        }
        else
        {
            var message = new WebhookMessage
            {
                Path = webhookPath,
                SourceIp = sourceIp,
                Headers = headers,
                RawBody = null,
                ContentLength = 0,
                Preview = null,
            };
            await _store.StoreAsync(message);
            await _hub.Clients.All.SendAsync("NewMessage", message);
            storedIds.Add(message.Id);
        }

        return Ok(new { received = true, count = storedIds.Count, ids = storedIds });
    }

    private static List<WebhookMessage> SplitBody(
        string body, string path, string? sourceIp, Dictionary<string, string[]> headers)
    {
        var messages = new List<WebhookMessage>();

        try
        {
            using var doc = JsonDocument.Parse(body);

            if (doc.RootElement.ValueKind == JsonValueKind.Array)
            {
                foreach (var element in doc.RootElement.EnumerateArray())
                {
                    var elementJson = element.GetRawText();
                    messages.Add(new WebhookMessage
                    {
                        Path = path,
                        SourceIp = sourceIp,
                        Headers = headers,
                        RawBody = elementJson,
                        ContentLength = elementJson.Length,
                        Preview = ExtractPreview(element),
                        Level = ExtractLevel(element),
                    });
                }
            }
            else
            {
                messages.Add(new WebhookMessage
                {
                    Path = path,
                    SourceIp = sourceIp,
                    Headers = headers,
                    RawBody = body,
                    ContentLength = body.Length,
                    Preview = ExtractPreview(doc.RootElement),
                    Level = ExtractLevel(doc.RootElement),
                });
            }
        }
        catch (JsonException)
        {
            // Not valid JSON — store raw body as-is
            messages.Add(new WebhookMessage
            {
                Path = path,
                SourceIp = sourceIp,
                Headers = headers,
                RawBody = body,
                ContentLength = body.Length,
                Preview = Truncate(body),
            });
        }

        return messages;
    }

    private static string ExtractPreview(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (var field in PreviewFields)
            {
                if (element.TryGetProperty(field, out var prop) &&
                    prop.ValueKind == JsonValueKind.String)
                {
                    var val = prop.GetString();
                    if (!string.IsNullOrWhiteSpace(val))
                        return Truncate(val);
                }
            }
        }

        return Truncate(element.GetRawText());
    }

    private static readonly Dictionary<string, string> LevelNormalization = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Verbose"] = "Verbose",
        ["Trace"] = "Verbose",
        ["VRB"] = "Verbose",
        ["Debug"] = "Debug",
        ["DBG"] = "Debug",
        ["Information"] = "Information",
        ["Info"] = "Information",
        ["INF"] = "Information",
        ["Warning"] = "Warning",
        ["Warn"] = "Warning",
        ["WRN"] = "Warning",
        ["Error"] = "Error",
        ["Err"] = "Error",
        ["ERR"] = "Error",
        ["Fatal"] = "Fatal",
        ["Critical"] = "Fatal",
        ["FTL"] = "Fatal",
    };

    private static string? ExtractLevel(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object) return null;

        foreach (var field in LevelFields)
        {
            if (element.TryGetProperty(field, out var prop) &&
                prop.ValueKind == JsonValueKind.String)
            {
                var raw = prop.GetString();
                if (raw != null && LevelNormalization.TryGetValue(raw, out var normalized))
                    return normalized;
                return raw;
            }
        }

        return null;
    }

    private static string Truncate(string text)
    {
        if (text.Length <= PreviewMaxLength) return text;
        return text[..PreviewMaxLength] + "...";
    }
}

namespace WebhookViewer.Api.Models;

public class WebhookMessage
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
    public string? Path { get; set; }
    public string? SourceIp { get; set; }
    public Dictionary<string, string[]> Headers { get; set; } = new();
    public string? RawBody { get; set; }
    public long ContentLength { get; set; }
    public string? Preview { get; set; }
    public string? Level { get; set; }
}

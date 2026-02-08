namespace WebhookViewer.Api.Models;

public class MessageFilter
{
    public string? PathContains { get; set; }
    public string? SearchPattern { get; set; }
    public string? Levels { get; set; }  // comma-separated: "Warning,Error,Fatal"
    public DateTimeOffset? From { get; set; }
    public DateTimeOffset? To { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

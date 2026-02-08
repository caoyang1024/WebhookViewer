namespace WebhookViewer.Api.Models;

public class BatchDeleteRequest
{
    public List<string>? Ids { get; set; }
    public MessageFilter? Filter { get; set; }
    public bool All { get; set; }
}

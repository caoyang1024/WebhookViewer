namespace WebhookViewer.Api.Models;

public class UpdateUserRequest
{
    public string? Password { get; set; }
    public UserPermissions? Permissions { get; set; }
}

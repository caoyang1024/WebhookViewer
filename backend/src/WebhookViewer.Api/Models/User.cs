namespace WebhookViewer.Api.Models;

public class User
{
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserPermissions Permissions { get; set; } = new();
}

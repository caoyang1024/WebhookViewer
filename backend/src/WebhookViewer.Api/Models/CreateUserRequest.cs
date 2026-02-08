namespace WebhookViewer.Api.Models;

public class CreateUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public UserPermissions Permissions { get; set; } = new();
}

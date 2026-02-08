namespace WebhookViewer.Api.Models;

public class UserInfo
{
    public string Username { get; set; } = string.Empty;
    public UserPermissions Permissions { get; set; } = new();

    public static UserInfo FromUser(User user) => new()
    {
        Username = user.Username,
        Permissions = user.Permissions,
    };
}

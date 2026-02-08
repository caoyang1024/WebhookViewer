namespace WebhookViewer.Api.Models;

public class UserPermissions
{
    public bool DeleteSingle { get; set; }
    public bool DeleteBulk { get; set; }
    public bool ManageSettings { get; set; }
    public bool ManageUsers { get; set; }

    public static UserPermissions Admin => new()
    {
        DeleteSingle = true,
        DeleteBulk = true,
        ManageSettings = true,
        ManageUsers = true,
    };

    public static UserPermissions None => new();
}

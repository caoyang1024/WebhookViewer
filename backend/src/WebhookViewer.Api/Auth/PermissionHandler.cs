using Microsoft.AspNetCore.Authorization;
using WebhookViewer.Api.Services;

namespace WebhookViewer.Api.Auth;

public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly IUserStore _userStore;

    public PermissionHandler(IUserStore userStore)
    {
        _userStore = userStore;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var username = context.User.Identity?.Name;
        if (username == null) return;

        var user = await _userStore.GetAsync(username);
        if (user == null) return;

        var allowed = requirement.Permission switch
        {
            "DeleteSingle" => user.Permissions.DeleteSingle,
            "DeleteBulk" => user.Permissions.DeleteBulk,
            "ManageSettings" => user.Permissions.ManageSettings,
            "ManageUsers" => user.Permissions.ManageUsers,
            _ => false,
        };

        if (allowed)
        {
            context.Succeed(requirement);
        }
    }
}

using WebhookViewer.Api.Models;

namespace WebhookViewer.Api.Services;

public interface IUserStore
{
    Task<User?> GetAsync(string username);
    Task<List<User>> ListAsync();
    Task<User> CreateAsync(string username, string passwordHash, UserPermissions permissions);
    Task<User?> UpdateAsync(string username, string? passwordHash, UserPermissions? permissions);
    Task<bool> DeleteAsync(string username);
    Task EnsureAdminAsync();
}

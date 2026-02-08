using System.Text.Json;
using StackExchange.Redis;
using WebhookViewer.Api.Models;

namespace WebhookViewer.Api.Services;

public class RedisUserStore : IUserStore
{
    private const string UsersSetKey = "webhook:users";

    private readonly IConnectionMultiplexer _redis;

    public RedisUserStore(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    private IDatabase Db => _redis.GetDatabase();

    private static string UserKey(string username) => $"webhook:user:{username.ToLowerInvariant()}";

    public async Task<User?> GetAsync(string username)
    {
        var json = await Db.StringGetAsync(UserKey(username));
        if (json.IsNullOrEmpty) return null;
        return JsonSerializer.Deserialize<User>(json.ToString());
    }

    public async Task<List<User>> ListAsync()
    {
        var members = await Db.SetMembersAsync(UsersSetKey);
        var users = new List<User>();
        foreach (var member in members)
        {
            var json = await Db.StringGetAsync(UserKey(member.ToString()));
            if (!json.IsNullOrEmpty)
            {
                var user = JsonSerializer.Deserialize<User>(json.ToString());
                if (user != null) users.Add(user);
            }
        }
        return users;
    }

    public async Task<User> CreateAsync(string username, string passwordHash, UserPermissions permissions)
    {
        var user = new User
        {
            Username = username.ToLowerInvariant(),
            PasswordHash = passwordHash,
            Permissions = permissions,
        };
        var json = JsonSerializer.Serialize(user);
        await Db.StringSetAsync(UserKey(username), json);
        await Db.SetAddAsync(UsersSetKey, username.ToLowerInvariant());
        return user;
    }

    public async Task<User?> UpdateAsync(string username, string? passwordHash, UserPermissions? permissions)
    {
        var user = await GetAsync(username);
        if (user == null) return null;

        if (passwordHash != null) user.PasswordHash = passwordHash;
        if (permissions != null) user.Permissions = permissions;

        var json = JsonSerializer.Serialize(user);
        await Db.StringSetAsync(UserKey(username), json);
        return user;
    }

    public async Task<bool> DeleteAsync(string username)
    {
        var deleted = await Db.KeyDeleteAsync(UserKey(username));
        await Db.SetRemoveAsync(UsersSetKey, username.ToLowerInvariant());
        return deleted;
    }

    public async Task EnsureAdminAsync()
    {
        var existing = await GetAsync("admin");
        if (existing != null) return;

        var hash = BCrypt.Net.BCrypt.HashPassword("admin");
        await CreateAsync("admin", hash, UserPermissions.Admin);
    }
}

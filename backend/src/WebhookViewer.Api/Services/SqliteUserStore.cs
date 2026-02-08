using Dapper;
using WebhookViewer.Api.Models;

namespace WebhookViewer.Api.Services;

public class SqliteUserStore : IUserStore
{
    private readonly SqliteDb _db;

    public SqliteUserStore(SqliteDb db)
    {
        _db = db;
    }

    public async Task<User?> GetAsync(string username)
    {
        using var conn = _db.CreateConnection();
        var row = await conn.QuerySingleOrDefaultAsync<UserRow>(
            "SELECT * FROM Users WHERE Username = @Username",
            new { Username = username.ToLowerInvariant() });
        return row?.ToUser();
    }

    public async Task<List<User>> ListAsync()
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.QueryAsync<UserRow>("SELECT * FROM Users ORDER BY Username");
        return rows.Select(r => r.ToUser()).ToList();
    }

    public async Task<User> CreateAsync(string username, string passwordHash, UserPermissions permissions)
    {
        using var conn = _db.CreateConnection();
        var normalized = username.ToLowerInvariant();
        await conn.ExecuteAsync("""
            INSERT INTO Users (Username, PasswordHash, DeleteSingle, DeleteBulk, ManageSettings, ManageUsers)
            VALUES (@Username, @PasswordHash, @DeleteSingle, @DeleteBulk, @ManageSettings, @ManageUsers)
            """,
            new
            {
                Username = normalized,
                PasswordHash = passwordHash,
                DeleteSingle = permissions.DeleteSingle ? 1 : 0,
                DeleteBulk = permissions.DeleteBulk ? 1 : 0,
                ManageSettings = permissions.ManageSettings ? 1 : 0,
                ManageUsers = permissions.ManageUsers ? 1 : 0,
            });

        return new User
        {
            Username = normalized,
            PasswordHash = passwordHash,
            Permissions = permissions,
        };
    }

    public async Task<User?> UpdateAsync(string username, string? passwordHash, UserPermissions? permissions)
    {
        var user = await GetAsync(username);
        if (user == null) return null;

        if (passwordHash != null) user.PasswordHash = passwordHash;
        if (permissions != null) user.Permissions = permissions;

        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync("""
            UPDATE Users SET PasswordHash = @PasswordHash,
                DeleteSingle = @DeleteSingle, DeleteBulk = @DeleteBulk,
                ManageSettings = @ManageSettings, ManageUsers = @ManageUsers
            WHERE Username = @Username
            """,
            new
            {
                Username = username.ToLowerInvariant(),
                user.PasswordHash,
                DeleteSingle = user.Permissions.DeleteSingle ? 1 : 0,
                DeleteBulk = user.Permissions.DeleteBulk ? 1 : 0,
                ManageSettings = user.Permissions.ManageSettings ? 1 : 0,
                ManageUsers = user.Permissions.ManageUsers ? 1 : 0,
            });

        return user;
    }

    public async Task<bool> DeleteAsync(string username)
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.ExecuteAsync(
            "DELETE FROM Users WHERE Username = @Username",
            new { Username = username.ToLowerInvariant() });
        return rows > 0;
    }

    public async Task EnsureAdminAsync()
    {
        var existing = await GetAsync("admin");
        if (existing != null) return;

        var hash = BCrypt.Net.BCrypt.HashPassword("admin");
        await CreateAsync("admin", hash, UserPermissions.Admin);
    }

    private class UserRow
    {
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public int DeleteSingle { get; set; }
        public int DeleteBulk { get; set; }
        public int ManageSettings { get; set; }
        public int ManageUsers { get; set; }

        public User ToUser() => new()
        {
            Username = Username,
            PasswordHash = PasswordHash,
            Permissions = new UserPermissions
            {
                DeleteSingle = DeleteSingle != 0,
                DeleteBulk = DeleteBulk != 0,
                ManageSettings = ManageSettings != 0,
                ManageUsers = ManageUsers != 0,
            },
        };
    }
}

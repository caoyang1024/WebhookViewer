using Dapper;
using Microsoft.Data.Sqlite;

namespace WebhookViewer.Api.Services;

public class SqliteDb
{
    private readonly string _connectionString;

    public SqliteDb(string dbPath)
    {
        _connectionString = $"Data Source={dbPath}";
    }

    public SqliteConnection CreateConnection() => new(_connectionString);

    public async Task InitializeAsync()
    {
        using var conn = CreateConnection();
        await conn.OpenAsync();

        await conn.ExecuteAsync("""
            CREATE TABLE IF NOT EXISTS Users (
                Username TEXT PRIMARY KEY,
                PasswordHash TEXT NOT NULL,
                DeleteSingle INTEGER NOT NULL DEFAULT 0,
                DeleteBulk INTEGER NOT NULL DEFAULT 0,
                ManageSettings INTEGER NOT NULL DEFAULT 0,
                ManageUsers INTEGER NOT NULL DEFAULT 0
            )
            """);

        await conn.ExecuteAsync("""
            CREATE TABLE IF NOT EXISTS Settings (
                Key TEXT PRIMARY KEY,
                VerboseMinutes INTEGER NOT NULL DEFAULT 60,
                DebugMinutes INTEGER NOT NULL DEFAULT 360,
                InformationMinutes INTEGER NOT NULL DEFAULT 1440,
                WarningMinutes INTEGER NOT NULL DEFAULT 10080,
                ErrorMinutes INTEGER NOT NULL DEFAULT 43200,
                FatalMinutes INTEGER NOT NULL DEFAULT 0
            )
            """);
    }
}

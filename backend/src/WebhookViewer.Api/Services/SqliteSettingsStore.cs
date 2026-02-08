using Dapper;
using WebhookViewer.Api.Models;

namespace WebhookViewer.Api.Services;

public class SqliteSettingsStore : ISettingsStore
{
    private const string SettingsKey = "default";

    private readonly SqliteDb _db;
    private TTLSettings _cached;
    private readonly Lock _lock = new();

    public SqliteSettingsStore(SqliteDb db)
    {
        _db = db;
        _cached = new TTLSettings();
        _ = LoadAsync();
    }

    private async Task LoadAsync()
    {
        using var conn = _db.CreateConnection();
        var row = await conn.QuerySingleOrDefaultAsync<TTLSettings>(
            "SELECT VerboseMinutes, DebugMinutes, InformationMinutes, WarningMinutes, ErrorMinutes, FatalMinutes FROM Settings WHERE Key = @Key",
            new { Key = SettingsKey });

        if (row != null)
        {
            lock (_lock)
            {
                _cached = row;
            }
        }
    }

    public async Task<TTLSettings> GetAsync()
    {
        await LoadAsync();
        lock (_lock)
        {
            return _cached;
        }
    }

    public async Task<TTLSettings> SaveAsync(TTLSettings settings)
    {
        using var conn = _db.CreateConnection();
        var affected = await conn.ExecuteAsync("""
            UPDATE Settings SET VerboseMinutes = @VerboseMinutes, DebugMinutes = @DebugMinutes,
                InformationMinutes = @InformationMinutes, WarningMinutes = @WarningMinutes,
                ErrorMinutes = @ErrorMinutes, FatalMinutes = @FatalMinutes
            WHERE Key = @Key
            """,
            new
            {
                Key = SettingsKey,
                settings.VerboseMinutes,
                settings.DebugMinutes,
                settings.InformationMinutes,
                settings.WarningMinutes,
                settings.ErrorMinutes,
                settings.FatalMinutes,
            });

        if (affected == 0)
        {
            await conn.ExecuteAsync("""
                INSERT INTO Settings (Key, VerboseMinutes, DebugMinutes, InformationMinutes, WarningMinutes, ErrorMinutes, FatalMinutes)
                VALUES (@Key, @VerboseMinutes, @DebugMinutes, @InformationMinutes, @WarningMinutes, @ErrorMinutes, @FatalMinutes)
                """,
                new
                {
                    Key = SettingsKey,
                    settings.VerboseMinutes,
                    settings.DebugMinutes,
                    settings.InformationMinutes,
                    settings.WarningMinutes,
                    settings.ErrorMinutes,
                    settings.FatalMinutes,
                });
        }

        lock (_lock)
        {
            _cached = settings;
        }
        return settings;
    }

    public TimeSpan? GetTTLForLevel(string? level)
    {
        TTLSettings settings;
        lock (_lock)
        {
            settings = _cached;
        }

        var minutes = level?.ToLowerInvariant() switch
        {
            "verbose" => settings.VerboseMinutes,
            "debug" => settings.DebugMinutes,
            "information" => settings.InformationMinutes,
            "warning" => settings.WarningMinutes,
            "error" => settings.ErrorMinutes,
            "fatal" => settings.FatalMinutes,
            _ => 0,
        };

        return minutes > 0 ? TimeSpan.FromMinutes(minutes) : null;
    }
}

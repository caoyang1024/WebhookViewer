using System.Text.Json;
using StackExchange.Redis;
using WebhookViewer.Api.Models;

namespace WebhookViewer.Api.Services;

public class RedisSettingsStore : ISettingsStore
{
    private const string SettingsKey = "webhook:settings";

    private readonly IConnectionMultiplexer _redis;
    private TTLSettings _cached;
    private readonly Lock _lock = new();

    public RedisSettingsStore(IConnectionMultiplexer redis)
    {
        _redis = redis;
        _cached = new TTLSettings();
        _ = LoadAsync();
    }

    private IDatabase Db => _redis.GetDatabase();

    private async Task LoadAsync()
    {
        var json = await Db.StringGetAsync(SettingsKey);
        if (!json.IsNullOrEmpty)
        {
            var settings = JsonSerializer.Deserialize<TTLSettings>(json.ToString());
            if (settings != null)
            {
                lock (_lock)
                {
                    _cached = settings;
                }
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
        var json = JsonSerializer.Serialize(settings);
        await Db.StringSetAsync(SettingsKey, json);
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

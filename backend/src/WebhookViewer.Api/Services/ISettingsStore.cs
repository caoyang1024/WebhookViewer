using WebhookViewer.Api.Models;

namespace WebhookViewer.Api.Services;

public interface ISettingsStore
{
    Task<TTLSettings> GetAsync();
    Task<TTLSettings> SaveAsync(TTLSettings settings);
    TimeSpan? GetTTLForLevel(string? level);
}

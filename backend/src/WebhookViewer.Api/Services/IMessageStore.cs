using WebhookViewer.Api.Models;

namespace WebhookViewer.Api.Services;

public interface IMessageStore
{
    Task StoreAsync(WebhookMessage message);
    Task<WebhookMessage?> GetAsync(string id);
    Task<PagedResult<WebhookMessage>> ListAsync(MessageFilter filter);
    Task<bool> DeleteAsync(string id);
    Task<List<string>> DeleteBatchAsync(List<string> ids);
    Task<List<string>> DeleteByFilterAsync(MessageFilter filter);
    Task<int> DeleteAllAsync();
}

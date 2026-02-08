using System.Text.Json;
using System.Text.RegularExpressions;
using StackExchange.Redis;
using WebhookViewer.Api.Models;

namespace WebhookViewer.Api.Services;

public class RedisMessageStore : IMessageStore
{
    private const string SortedSetKey = "webhook:messages";
    private const string MessageKeyPrefix = "webhook:msg:";
    private static readonly TimeSpan RegexTimeout = TimeSpan.FromSeconds(2);

    private readonly IConnectionMultiplexer _redis;
    private readonly ISettingsStore _settings;

    public RedisMessageStore(IConnectionMultiplexer redis, ISettingsStore settings)
    {
        _redis = redis;
        _settings = settings;
    }

    private IDatabase Db => _redis.GetDatabase();

    public async Task StoreAsync(WebhookMessage message)
    {
        var db = Db;
        var json = JsonSerializer.Serialize(message);
        var score = message.Timestamp.ToUnixTimeMilliseconds();

        var ttl = _settings.GetTTLForLevel(message.Level);
        await db.StringSetAsync(MessageKeyPrefix + message.Id, json,
            ttl.HasValue ? new Expiration(ttl.Value) : Expiration.Default);
        await db.SortedSetAddAsync(SortedSetKey, message.Id, score);
    }

    public async Task<WebhookMessage?> GetAsync(string id)
    {
        var json = await Db.StringGetAsync(MessageKeyPrefix + id);
        if (json.IsNullOrEmpty) return null;
        return JsonSerializer.Deserialize<WebhookMessage>(json.ToString());
    }

    public async Task<PagedResult<WebhookMessage>> ListAsync(MessageFilter filter)
    {
        var db = Db;

        double fromScore = filter.From.HasValue
            ? filter.From.Value.ToUnixTimeMilliseconds()
            : double.NegativeInfinity;
        double toScore = filter.To.HasValue
            ? filter.To.Value.ToUnixTimeMilliseconds()
            : double.PositiveInfinity;

        // Get all IDs in the time range, newest first
        var ids = await db.SortedSetRangeByScoreAsync(
            SortedSetKey, fromScore, toScore, order: Order.Descending);

        if (ids.Length == 0)
            return new PagedResult<WebhookMessage>
            {
                Page = filter.Page,
                PageSize = filter.PageSize
            };

        // Fetch all messages in bulk
        var keys = ids.Select(id => (RedisKey)(MessageKeyPrefix + (string)id!)).ToArray();
        var values = await db.StringGetAsync(keys);

        var messages = new List<WebhookMessage>();
        for (int i = 0; i < values.Length; i++)
        {
            if (values[i].IsNullOrEmpty) continue;
            var msg = JsonSerializer.Deserialize<WebhookMessage>(values[i].ToString());
            if (msg != null) messages.Add(msg);
        }

        // Apply in-memory filters
        messages = ApplyFilters(messages, filter);

        var totalCount = messages.Count;
        var paged = messages
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToList();

        return new PagedResult<WebhookMessage>
        {
            Items = paged,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var db = Db;
        var batch = db.CreateBatch();
        var remTask = batch.SortedSetRemoveAsync(SortedSetKey, id);
        var delTask = batch.KeyDeleteAsync(MessageKeyPrefix + id);
        batch.Execute();

        return await remTask || await delTask;
    }

    public async Task<List<string>> DeleteBatchAsync(List<string> ids)
    {
        var db = Db;
        var deleted = new List<string>();

        foreach (var id in ids)
        {
            if (await DeleteAsync(id))
                deleted.Add(id);
        }

        return deleted;
    }

    public async Task<List<string>> DeleteByFilterAsync(MessageFilter filter)
    {
        // Get all matching messages, then delete them
        var allFilter = new MessageFilter
        {
            PathContains = filter.PathContains,
            SearchPattern = filter.SearchPattern,
            Levels = filter.Levels,
            From = filter.From,
            To = filter.To,
            Page = 1,
            PageSize = int.MaxValue
        };

        var result = await ListAsync(allFilter);
        var ids = result.Items.Select(m => m.Id).ToList();
        return await DeleteBatchAsync(ids);
    }

    public async Task<int> DeleteAllAsync()
    {
        var db = Db;
        var server = _redis.GetServers().First();

        var count = 0;
        await foreach (var key in server.KeysAsync(pattern: MessageKeyPrefix + "*"))
        {
            await db.KeyDeleteAsync(key);
            count++;
        }

        await db.KeyDeleteAsync(SortedSetKey);
        return count;
    }

    private static List<WebhookMessage> ApplyFilters(List<WebhookMessage> messages, MessageFilter filter)
    {
        var result = messages.AsEnumerable();

        if (!string.IsNullOrEmpty(filter.Levels))
        {
            var levels = filter.Levels.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            result = result.Where(m => m.Level != null && levels.Contains(m.Level, StringComparer.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrEmpty(filter.PathContains))
        {
            result = result.Where(m =>
                (m.Path ?? string.Empty).Contains(filter.PathContains, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrEmpty(filter.SearchPattern))
        {
            try
            {
                var regex = new Regex(filter.SearchPattern, RegexOptions.IgnoreCase, RegexTimeout);
                result = result.Where(m =>
                    regex.IsMatch(m.RawBody ?? string.Empty) ||
                    regex.IsMatch(m.Preview ?? string.Empty));
            }
            catch (RegexParseException)
            {
                var pattern = filter.SearchPattern;
                result = result.Where(m =>
                    (m.RawBody ?? string.Empty).Contains(pattern, StringComparison.OrdinalIgnoreCase) ||
                    (m.Preview ?? string.Empty).Contains(pattern, StringComparison.OrdinalIgnoreCase));
            }
        }

        return result.ToList();
    }
}

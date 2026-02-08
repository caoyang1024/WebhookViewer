using StackExchange.Redis;
using WebhookViewer.Api.Hubs;
using WebhookViewer.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddSignalR();

// Redis
var redisConnection = builder.Configuration.GetValue<string>("Redis:Connection") ?? "localhost:6379";
builder.Services.AddSingleton<IConnectionMultiplexer>(
    ConnectionMultiplexer.Connect(redisConnection));
builder.Services.AddSingleton<ISettingsStore, RedisSettingsStore>();
builder.Services.AddSingleton<IMessageStore, RedisMessageStore>();

// CORS for dev
builder.Services.AddCors(options =>
{
    options.AddPolicy("Dev", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("Dev");
app.UseStaticFiles();
app.MapControllers();
app.MapHub<WebhookHub>("/hubs/webhook");
app.MapFallbackToFile("index.html");

app.Run();

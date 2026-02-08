using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using StackExchange.Redis;
using WebhookViewer.Api.Auth;
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
builder.Services.AddSingleton<IMessageStore, RedisMessageStore>();

// SQLite for persistent data (users, settings)
var dbPath = Path.Combine(builder.Environment.ContentRootPath, "webhookviewer.db");
var sqliteDb = new SqliteDb(dbPath);
await sqliteDb.InitializeAsync();
builder.Services.AddSingleton(sqliteDb);
builder.Services.AddSingleton<ISettingsStore, SqliteSettingsStore>();
builder.Services.AddSingleton<IUserStore, SqliteUserStore>();

// Authentication
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "WebhookViewer.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Events.OnRedirectToLogin = ctx =>
        {
            ctx.Response.StatusCode = 401;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = ctx =>
        {
            ctx.Response.StatusCode = 403;
            return Task.CompletedTask;
        };
    });

// Authorization
builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("DeleteSingle", policy =>
        policy.Requirements.Add(new PermissionRequirement("DeleteSingle")))
    .AddPolicy("DeleteBulk", policy =>
        policy.Requirements.Add(new PermissionRequirement("DeleteBulk")))
    .AddPolicy("ManageSettings", policy =>
        policy.Requirements.Add(new PermissionRequirement("ManageSettings")))
    .AddPolicy("ManageUsers", policy =>
        policy.Requirements.Add(new PermissionRequirement("ManageUsers")));

// CORS for dev
builder.Services.AddCors(options =>
{
    options.AddPolicy("Dev", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5177")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Seed default admin account
var userStore = app.Services.GetRequiredService<IUserStore>();
await userStore.EnsureAdminAsync();

app.UseCors("Dev");
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<WebhookHub>("/hubs/webhook");
app.MapFallbackToFile("index.html");

app.Run();

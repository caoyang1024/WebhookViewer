const BASE = process.argv[2] || "http://localhost:5000";
const RATE = Number(process.argv[3]) || 1500; // ms between sends

// ── Helpers ──────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function uuid() {
  return crypto.randomUUID();
}
function ts() {
  return new Date().toISOString();
}

// ── Structured log event templates ──────────────────────────────────

type Template = {
  name: string;
  weight: number;
  build: () => { path: string; body: unknown };
};

const services = ["api-gateway", "auth-service", "billing-api", "data-pipeline", "web-frontend", "scheduler"];
const endpoints = ["/api/users", "/api/orders", "/api/products", "/api/auth/login", "/api/health", "/api/payments", "/api/search"];
const dbNames = ["UsersDb", "OrdersDb", "ProductsDb", "AnalyticsDb"];
const userNames = ["alice", "bob", "charlie", "diana", "eve", "frank"];
const loggers = ["Microsoft.AspNetCore.Hosting", "Serilog.AspNetCore", "App.Services.OrderService", "App.Data.Repository", "App.Auth.TokenValidator", "App.Middleware.RateLimiter"];

function serilogEvent(level: string, messageTemplate: string, properties: Record<string, unknown> = {}, exception?: string) {
  const rendered = messageTemplate.replace(/\{(\w+)\}/g, (_, key) => {
    const val = properties[key];
    return val !== undefined ? String(val) : `{${key}}`;
  });
  return {
    Timestamp: ts(),
    Level: level,
    MessageTemplate: messageTemplate,
    RenderedMessage: rendered,
    Properties: {
      ...properties,
      SourceContext: pick(loggers),
      MachineName: `srv-${rand(1, 5)}`,
    },
    ...(exception ? { Exception: exception } : {}),
  };
}

function clefEvent(level: string, messageTemplate: string, properties: Record<string, unknown> = {}) {
  const rendered = messageTemplate.replace(/\{(\w+)\}/g, (_, key) => {
    const val = properties[key];
    return val !== undefined ? String(val) : `{${key}}`;
  });
  return {
    "@t": ts(),
    "@l": level,
    "@mt": messageTemplate,
    "@m": rendered,
    ...properties,
  };
}

function nlogEvent(level: string, message: string, logger: string, extra: Record<string, unknown> = {}) {
  return {
    time: ts(),
    level,
    message,
    logger,
    ...extra,
  };
}

const stackTraces = [
  `System.NullReferenceException: Object reference not set to an instance of an object.
   at App.Services.OrderService.GetOrderAsync(String orderId) in /src/Services/OrderService.cs:line 47
   at App.Controllers.OrdersController.Get(String id) in /src/Controllers/OrdersController.cs:line 23
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute()`,
  `System.Data.SqlClient.SqlException: Timeout expired. The timeout period elapsed prior to completion of the operation.
   at System.Data.SqlClient.SqlConnection.OnError(SqlException exception)
   at App.Data.Repository.ExecuteQueryAsync(String sql) in /src/Data/Repository.cs:line 112
   at App.Services.UserService.FindByEmailAsync(String email) in /src/Services/UserService.cs:line 78`,
  `System.InvalidOperationException: Sequence contains no elements
   at System.Linq.ThrowHelper.ThrowNoElementsException()
   at System.Linq.Enumerable.First[TSource](IEnumerable\`1 source)
   at App.Services.BillingService.GetActiveSubscription(Guid userId) in /src/Services/BillingService.cs:line 34`,
  `System.Net.Http.HttpRequestException: Connection refused (localhost:6379)
   at System.Net.Http.ConnectHelper.ConnectAsync(String host, Int32 port)
   at StackExchange.Redis.ConnectionMultiplexer.ConnectAsync()
   at App.Cache.RedisCacheProvider.GetAsync(String key) in /src/Cache/RedisCacheProvider.cs:line 22`,
];

const templates: Template[] = [
  // ── HTTP Request Completed (Serilog style) ──
  {
    name: "http-request",
    weight: 25,
    build: () => {
      const endpoint = pick(endpoints);
      const statusCode = pick([200, 200, 200, 200, 201, 204, 301, 400, 401, 404, 500]);
      const elapsed = rand(2, 850);
      const level = statusCode >= 500 ? "Error" : statusCode >= 400 ? "Warning" : "Information";
      return {
        path: `/logs/${pick(services)}`,
        body: serilogEvent(level, "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000}ms", {
          RequestMethod: "POST",
          RequestPath: endpoint,
          StatusCode: statusCode,
          Elapsed: elapsed,
          RequestId: uuid().slice(0, 8),
          ConnectionId: uuid().slice(0, 12),
        }),
      };
    },
  },

  // ── Database Query (Serilog) ──
  {
    name: "db-query",
    weight: 15,
    build: () => {
      const db = pick(dbNames);
      const elapsed = rand(1, 2000);
      const level = elapsed > 1000 ? "Warning" : "Debug";
      const table = pick(["Users", "Orders", "Products", "Sessions", "AuditLog"]);
      return {
        path: `/logs/${pick(services)}`,
        body: serilogEvent(level, "Executed DbCommand ({Elapsed}ms) [Parameters=[{Params}], CommandType='Text', CommandTimeout='30'] SELECT * FROM {Table}", {
          Elapsed: elapsed,
          Params: `@p0='${uuid().slice(0, 8)}'`,
          Table: table,
          Database: db,
        }),
      };
    },
  },

  // ── Auth events (CLEF format) ──
  {
    name: "auth-event",
    weight: 12,
    build: () => {
      const user = pick(userNames);
      const success = Math.random() > 0.2;
      const level = success ? "Information" : "Warning";
      const message = success
        ? `User {User} authenticated successfully`
        : `Failed login attempt for user {User} from {IpAddress}`;
      return {
        path: "/logs/auth-service",
        body: clefEvent(level, message, {
          User: user,
          IpAddress: `${rand(10, 200)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`,
          AuthMethod: pick(["password", "oauth2", "api_key", "jwt_refresh"]),
        }),
      };
    },
  },

  // ── Application errors with stack traces ──
  {
    name: "error-with-trace",
    weight: 8,
    build: () => {
      const trace = pick(stackTraces);
      return {
        path: `/logs/${pick(services)}`,
        body: serilogEvent("Error", "An unhandled exception occurred while processing the request", {
          RequestPath: pick(endpoints),
          RequestId: uuid().slice(0, 8),
        }, trace),
      };
    },
  },

  // ── Health check (NLog style) ──
  {
    name: "health-check",
    weight: 10,
    build: () => {
      const service = pick(services);
      const healthy = Math.random() > 0.1;
      return {
        path: `/logs/${service}`,
        body: nlogEvent(
          healthy ? "Info" : "Warn",
          healthy
            ? `Health check passed: ${service} (${rand(1, 50)}ms)`
            : `Health check degraded: ${service} — ${pick(["high memory usage", "slow response time", "connection pool exhausted", "disk space low"])}`,
          "HealthChecks.Publisher",
          {
            service,
            durationMs: rand(1, 200),
            status: healthy ? "Healthy" : "Degraded",
          }
        ),
      };
    },
  },

  // ── Batch: multiple events in one POST ──
  {
    name: "batch-request-logs",
    weight: 15,
    build: () => {
      const service = pick(services);
      const count = rand(2, 5);
      const events = Array.from({ length: count }, () => {
        const statusCode = pick([200, 200, 200, 201, 204, 400, 404, 500]);
        const level = statusCode >= 500 ? "Error" : statusCode >= 400 ? "Warning" : "Information";
        return serilogEvent(level, "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000}ms", {
          RequestMethod: pick(["GET", "POST", "PUT", "DELETE"]),
          RequestPath: pick(endpoints),
          StatusCode: statusCode,
          Elapsed: rand(2, 500),
          RequestId: uuid().slice(0, 8),
        });
      });
      return {
        path: `/logs/${service}`,
        body: events, // JSON array — will be split by receiver
      };
    },
  },

  // ── Startup / Shutdown ──
  {
    name: "app-lifecycle",
    weight: 5,
    build: () => {
      const service = pick(services);
      const isStartup = Math.random() > 0.3;
      return {
        path: `/logs/${service}`,
        body: serilogEvent("Information",
          isStartup
            ? "Application started. Hosting environment: {Environment}. Content root path: {ContentRoot}"
            : "Application is shutting down...",
          isStartup ? {
            Environment: pick(["Production", "Staging", "Development"]),
            ContentRoot: "/app",
            Version: `${rand(1, 5)}.${rand(0, 20)}.${rand(0, 100)}`,
          } : {}
        ),
      };
    },
  },

  // ── Rate limiting (CLEF) ──
  {
    name: "rate-limit",
    weight: 5,
    build: () => ({
      path: "/logs/api-gateway",
      body: clefEvent("Warning", "Rate limit exceeded for client {ClientId} on endpoint {Endpoint}", {
        ClientId: `client-${rand(1, 20)}`,
        Endpoint: pick(endpoints),
        Limit: pick([100, 500, 1000]),
        Window: "1m",
        CurrentCount: rand(101, 2000),
      }),
    }),
  },

  // ── Fatal: out of memory / critical ──
  {
    name: "fatal-event",
    weight: 2,
    build: () => ({
      path: `/logs/${pick(services)}`,
      body: serilogEvent("Fatal", "Critical failure in {Component}: {Reason}", {
        Component: pick(["ConnectionPool", "MessageBroker", "CacheProvider", "BackgroundWorker"]),
        Reason: pick([
          "Out of memory",
          "Maximum retry count exceeded",
          "Unrecoverable state detected",
          "Circuit breaker tripped after 10 consecutive failures",
        ]),
      }, `System.OutOfMemoryException: Insufficient memory to continue execution.
   at System.Runtime.GCFrameRegistration..ctor(Void* allocation)
   at App.Infrastructure.BufferPool.Rent(Int32 minimumLength)`),
    }),
  },

  // ── Verbose / Debug trace ──
  {
    name: "verbose-trace",
    weight: 3,
    build: () => ({
      path: `/logs/${pick(services)}`,
      body: serilogEvent("Verbose", "Entering {MethodName} with parameters {@Params}", {
        MethodName: pick(["ProcessOrderAsync", "ValidateTokenAsync", "BuildQueryAsync", "TransformPayloadAsync"]),
        Params: { id: uuid().slice(0, 8), retryCount: rand(0, 3) },
      }),
    }),
  },
];

// ── Weighted random selection ────────────────────────────────────────

const totalWeight = templates.reduce((s, t) => s + t.weight, 0);

function pickTemplate(): Template {
  let r = Math.random() * totalWeight;
  for (const t of templates) {
    r -= t.weight;
    if (r <= 0) return t;
  }
  return templates[templates.length - 1];
}

// ── Send loop ────────────────────────────────────────────────────────

let sent = 0;

async function send() {
  const tpl = pickTemplate();
  const { path, body } = tpl.build();

  const url = `${BASE}/api/webhook${path}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    sent++;
    const elapsed = `[${new Date().toLocaleTimeString()}]`;
    const status = res.ok ? `\x1b[32m${res.status}\x1b[0m` : `\x1b[31m${res.status}\x1b[0m`;
    const isBatch = Array.isArray(body) ? ` (batch: ${body.length})` : "";
    console.log(`${elapsed} #${sent} ${status} POST ${path}  \x1b[90m(${tpl.name}${isBatch})\x1b[0m`);
  } catch (err: any) {
    console.error(`\x1b[31m[ERROR]\x1b[0m POST ${path}: ${err.message}`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────

console.log(`\n\x1b[1mLog Event Simulator\x1b[0m`);
console.log(`Target: ${BASE}/api/webhook/*`);
console.log(`Rate:   ~1 every ${RATE}ms (${(60000 / RATE).toFixed(1)}/min)`);
console.log(`Press Ctrl+C to stop\n`);

// Send an initial burst of 5 so the UI isn't empty
(async () => {
  for (let i = 0; i < 5; i++) {
    await send();
    await new Promise(r => setTimeout(r, 200));
  }
  // Then steady-state with some jitter
  setInterval(() => send(), RATE + rand(-300, 300));
})();

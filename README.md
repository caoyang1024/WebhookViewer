# WebhookViewer

A real-time webhook log viewer. Send any HTTP payload to a catch-all endpoint and instantly see it in a searchable, filterable web UI with live updates.

![.NET 10](https://img.shields.io/badge/.NET-10-512BD4)
![React 19](https://img.shields.io/badge/React-19-61DAFB)
![Redis](https://img.shields.io/badge/Redis-7-DC382D)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57)

## Features

- **Catch-all webhook receiver** — `POST /api/webhook/{any-path}` accepts any JSON payload
- **Real-time updates** — messages appear instantly via SignalR (WebSocket)
- **Auto-detected log levels** — recognizes Serilog, CLEF, NLog, and common level fields
- **JSON array splitting** — batch payloads are automatically split into individual messages
- **Filtering** — by log level, path, full-text search, and date range
- **Per-level TTL** — configure how long each log level is retained (e.g. Verbose: 1 hour, Error: 30 days)
- **Account system** — granular permissions for delete, settings, and user management
- **Persistent config** — users and settings stored in SQLite; messages in Redis

## Quick Start

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- [Redis 7+](https://redis.io/) (or use Docker)

### 1. Start Redis

```bash
docker compose up -d
```

### 2. Start the backend

```bash
cd backend/src/WebhookViewer.Api
dotnet run
```

The API starts on `http://localhost:5000`.

### 3. Start the frontend (development)

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173` with hot reload.

### 4. Send a test webhook

```bash
curl -X POST http://localhost:5000/api/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello world", "level": "Information"}'
```

## Production Build

Build the frontend into the backend's `wwwroot` for single-port serving:

```bash
cd frontend && npm run build
cd ../backend/src/WebhookViewer.Api && dotnet run
```

Everything is served from `http://localhost:5000`.

## Authentication

A default admin account (`admin` / `admin`) is created on first startup. Change the password immediately.

| Permission | Controls |
|------------|----------|
| `deleteSingle` | Delete individual messages |
| `deleteBulk` | Batch delete / delete all |
| `manageSettings` | Change TTL settings |
| `manageUsers` | Create, edit, delete users |

Public (no login needed): viewing messages, viewing settings, webhook ingestion, SignalR.

## Project Structure

```
WebhookViewer/
  backend/
    src/WebhookViewer.Api/       # ASP.NET Core API
      Auth/                      # Permission-based authorization
      Controllers/               # Webhook, Messages, Settings, Auth
      Hubs/                      # SignalR hub
      Models/                    # Domain models
      Services/                  # Redis message store, SQLite stores
  frontend/
    src/
      components/                # React UI components
      context/                   # Auth context provider
      hooks/                     # Custom React hooks
      services/                  # API client, SignalR connection
      types/                     # TypeScript type definitions
  simulator/                     # Realistic log event simulator
  tests/                         # Stress tests
  docs/                          # API reference
  docker-compose.yml             # Redis
```

## API

Full API reference with curl examples: [docs/API.md](docs/API.md)

Key endpoints:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/webhook/{path}` | None | Receive webhooks |
| `GET` | `/api/messages` | None | List/filter messages |
| `DELETE` | `/api/messages/{id}` | `deleteSingle` | Delete one message |
| `DELETE` | `/api/messages` | `deleteBulk` | Batch delete |
| `GET` | `/api/settings` | None | Get TTL settings |
| `PUT` | `/api/settings` | `manageSettings` | Update TTL settings |
| `POST` | `/api/auth/login` | None | Login |
| `GET` | `/api/auth/me` | Any user | Current user info |

## Simulator

Generate realistic structured log events (Serilog, CLEF, NLog formats):

```bash
cd simulator
npm install
npx tsx simulate.ts              # default: 1 event every 1.5s
npx tsx simulate.ts http://localhost:5000 500   # faster: every 500ms
```

## Stress Testing

```bash
node tests/stress-test.mjs                    # default: localhost:5000
node tests/stress-test.mjs http://myhost:5000 # custom target
```

Runs 50,000 messages across sequential, concurrent, batch, and burst tests.

## Tech Stack

**Backend:** ASP.NET Core (.NET 10), SignalR, StackExchange.Redis, SQLite + Dapper, BCrypt

**Frontend:** React 19, TypeScript, Vite, @microsoft/signalr, react-syntax-highlighter

**Storage:** Redis (messages with TTL), SQLite (users, settings)

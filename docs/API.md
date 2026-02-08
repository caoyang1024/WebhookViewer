# WebhookViewer API Reference

Base URL: `http://localhost:5000`

---

## Webhook Ingestion

### POST /api/webhook/{path}

Receive webhook payloads. No authentication required.

- `{path}` is a catch-all — use any path you like (e.g. `/api/webhook/my-app/errors`)
- JSON arrays are automatically split into individual messages
- Log level and preview are auto-extracted from common fields (`message`, `Level`, `@l`, etc.)

**Request:**

```bash
curl -X POST http://localhost:5000/api/webhook/my-app \
  -H "Content-Type: application/json" \
  -d '{"message": "User logged in", "level": "Information"}'
```

**Response:** `200 OK`

```json
{
  "received": true,
  "count": 1,
  "ids": ["550e8400-e29b-41d4-a716-446655440000"]
}
```

Batch (JSON array):

```bash
curl -X POST http://localhost:5000/api/webhook/my-app \
  -H "Content-Type: application/json" \
  -d '[{"message": "first", "level": "Information"}, {"message": "second", "level": "Error"}]'
```

**Recognized level values:** `Verbose`/`Trace`/`VRB`, `Debug`/`DBG`, `Information`/`Info`/`INF`, `Warning`/`Warn`/`WRN`, `Error`/`Err`/`ERR`, `Fatal`/`Critical`/`FTL`

**Recognized level fields:** `Level`, `level`, `@l`, `severity`, `Severity`

**Recognized preview fields:** `message`, `RenderedMessage`, `@m`, `msg`, `MessageTemplate`, `@mt`

---

## Messages

### GET /api/messages

List messages with optional filtering and pagination. Public (no auth).

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Page number (default: 1) |
| `pageSize` | int | Items per page (default: 50) |
| `pathContains` | string | Filter by path substring |
| `searchPattern` | string | Search in message body |
| `levels` | string | Comma-separated levels, e.g. `Warning,Error,Fatal` |
| `from` | ISO 8601 | Start of date range |
| `to` | ISO 8601 | End of date range |

**Example:**

```bash
curl "http://localhost:5000/api/messages?levels=Error,Fatal&page=1&pageSize=20"
```

**Response:** `200 OK`

```json
{
  "items": [
    {
      "id": "550e8400-...",
      "timestamp": "2026-02-08T10:30:00Z",
      "path": "/my-app",
      "sourceIp": "127.0.0.1",
      "headers": { "Content-Type": ["application/json"] },
      "rawBody": "{\"message\": \"something failed\", \"level\": \"Error\"}",
      "contentLength": 48,
      "preview": "something failed",
      "level": "Error"
    }
  ],
  "totalCount": 1,
  "page": 1,
  "pageSize": 20
}
```

### GET /api/messages/{id}

Get a single message by ID. Public (no auth).

```bash
curl http://localhost:5000/api/messages/550e8400-e29b-41d4-a716-446655440000
```

**Response:** `200 OK` with message object, or `404 Not Found`.

### DELETE /api/messages/{id}

Delete a single message. **Requires auth** with `deleteSingle` permission.

```bash
curl -X DELETE http://localhost:5000/api/messages/550e8400-... \
  -b "WebhookViewer.Auth=<cookie>"
```

**Response:** `204 No Content`, `401 Unauthorized`, or `404 Not Found`.

### DELETE /api/messages

Batch delete messages. **Requires auth** with `deleteBulk` permission.

**Request body options** (provide one):

```json
// Delete specific IDs
{ "ids": ["id1", "id2", "id3"] }

// Delete by filter
{ "filter": { "levels": "Verbose,Debug", "from": "2026-02-01T00:00:00Z" } }

// Delete all
{ "all": true }
```

**Example:**

```bash
curl -X DELETE http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -b "WebhookViewer.Auth=<cookie>" \
  -d '{"all": true}'
```

**Response:** `200 OK`

```json
{ "deleted": 42 }
```

---

## Settings

### GET /api/settings

Get TTL settings per log level. Public (no auth).

```bash
curl http://localhost:5000/api/settings
```

**Response:** `200 OK`

```json
{
  "verboseMinutes": 60,
  "debugMinutes": 360,
  "informationMinutes": 1440,
  "warningMinutes": 10080,
  "errorMinutes": 43200,
  "fatalMinutes": 0
}
```

Values are in minutes. `0` means messages are kept forever.

### PUT /api/settings

Update TTL settings. **Requires auth** with `manageSettings` permission.

```bash
curl -X PUT http://localhost:5000/api/settings \
  -H "Content-Type: application/json" \
  -b "WebhookViewer.Auth=<cookie>" \
  -d '{"verboseMinutes":30,"debugMinutes":60,"informationMinutes":720,"warningMinutes":4320,"errorMinutes":10080,"fatalMinutes":0}'
```

**Response:** `200 OK` with updated settings object, or `401`/`403`.

---

## Authentication

Cookie-based authentication. The auth cookie (`WebhookViewer.Auth`) is set automatically on login and sent via `Set-Cookie` header.

### POST /api/auth/login

```bash
curl -c cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

**Response:** `200 OK`

```json
{
  "username": "admin",
  "permissions": {
    "deleteSingle": true,
    "deleteBulk": true,
    "manageSettings": true,
    "manageUsers": true
  }
}
```

Or `401 Unauthorized` with `{"error": "Invalid username or password"}`.

### POST /api/auth/logout

```bash
curl -b cookies.txt -X POST http://localhost:5000/api/auth/logout
```

**Response:** `204 No Content`

### GET /api/auth/me

Get current authenticated user. **Requires auth.**

```bash
curl -b cookies.txt http://localhost:5000/api/auth/me
```

**Response:** `200 OK` with user info, or `401 Unauthorized`.

### PUT /api/auth/me/password

Change your own password. **Requires auth.**

```bash
curl -b cookies.txt -X PUT http://localhost:5000/api/auth/me/password \
  -H "Content-Type: application/json" \
  -d '{"currentPassword": "admin", "newPassword": "newpass123"}'
```

**Response:** `204 No Content`, or `400` if current password is wrong.

---

## User Management

All user management endpoints **require auth** with `manageUsers` permission.

### GET /api/auth/users

List all users.

```bash
curl -b cookies.txt http://localhost:5000/api/auth/users
```

**Response:** `200 OK`

```json
[
  {
    "username": "admin",
    "permissions": {
      "deleteSingle": true,
      "deleteBulk": true,
      "manageSettings": true,
      "manageUsers": true
    }
  }
]
```

### POST /api/auth/users

Create a new user.

```bash
curl -b cookies.txt -X POST http://localhost:5000/api/auth/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "viewer",
    "password": "secret",
    "permissions": {
      "deleteSingle": true,
      "deleteBulk": false,
      "manageSettings": false,
      "manageUsers": false
    }
  }'
```

**Response:** `200 OK` with user info, `400` if missing fields, `409` if user exists.

### PUT /api/auth/users/{username}

Update a user's password and/or permissions. Both fields are optional.

```bash
curl -b cookies.txt -X PUT http://localhost:5000/api/auth/users/viewer \
  -H "Content-Type: application/json" \
  -d '{"permissions": {"deleteSingle": true, "deleteBulk": true, "manageSettings": false, "manageUsers": false}}'
```

**Response:** `200 OK` with updated user info, or `404`.

### DELETE /api/auth/users/{username}

Delete a user. Cannot delete yourself.

```bash
curl -b cookies.txt -X DELETE http://localhost:5000/api/auth/users/viewer
```

**Response:** `204 No Content`, `400` if self-delete, `404` if not found.

---

## Real-time Updates (SignalR)

Connect to `/hubs/webhook` for real-time message events. No authentication required.

**Events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `NewMessage` | Message object | New webhook received |
| `MessageDeleted` | `string` id | Single message deleted |
| `MessagesDeleted` | `string[]` ids | Multiple messages deleted |
| `AllMessagesDeleted` | _(none)_ | All messages deleted |

**JavaScript example:**

```js
import { HubConnectionBuilder } from '@microsoft/signalr';

const connection = new HubConnectionBuilder()
  .withUrl('/hubs/webhook')
  .withAutomaticReconnect()
  .build();

connection.on('NewMessage', (message) => {
  console.log('New:', message);
});

await connection.start();
```

---

## Permissions Reference

| Permission | Protects |
|------------|----------|
| `deleteSingle` | `DELETE /api/messages/{id}` |
| `deleteBulk` | `DELETE /api/messages` (batch) |
| `manageSettings` | `PUT /api/settings` |
| `manageUsers` | `/api/auth/users` CRUD endpoints |

Public endpoints (no auth needed): webhook ingestion, GET messages, GET settings, SignalR hub.

Default admin account: `admin` / `admin` (created on first startup).

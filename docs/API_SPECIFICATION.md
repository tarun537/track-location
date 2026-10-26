# Locato - API & Real-Time Event Specification

> **Version:** 1.0.0  
> **Status:** Specification Baseline (Phase 1 Approved)  
> **Protocol:** HTTPS (REST) & WSS (Socket.IO v4)  
> **Base URL:** `https://locato-api.onrender.com/api/v1` (Production) / `http://localhost:5000/api/v1` (Development)  

---

## 1. REST API Standards & Conventions

### 1.1 Headers
All REST API requests and responses use standard headers:
- `Content-Type: application/json`
- `Accept: application/json`
- `Authorization: Bearer <senderToken>` (Required for sender mutation endpoints)
- `X-Session-Viewer-Key: <viewerKey>` (Optional header if viewer access key is passed outside URL fragment)

### 1.2 Unified Success & Error Envelopes

#### Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-10-26T12:00:00.000Z"
  }
}
```

#### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "SESSION_EXPIRED",
    "message": "The location-sharing session has expired or been revoked.",
    "statusCode": 410,
    "timestamp": "2026-10-26T12:00:00.000Z",
    "details": null
  }
}
```

---

## 2. REST Endpoints Specification

### 2.1 Health Check

```http
GET /health
```
Returns system health, database connectivity status, and uptime.

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptimeSeconds": 14230,
    "database": "connected",
    "timestamp": "2026-10-26T12:00:00.000Z"
  }
}
```

---

### 2.2 Create Sharing Session

```http
POST /sessions
```
Creates a new ephemeral location-sharing session. Returns the public session ID, secret management token, viewer capability token, and shareable capability URL.

#### Rate Limit
- 5 requests per minute per IP address.

#### Request Body
```json
{
  "durationMinutes": 30,
  "title": "Evening walk from Metro station",
  "passcode": "4829"
}
```

| Field | Type | Required | Rules | Description |
| :--- | :--- | :--- | :--- | :--- |
| `durationMinutes` | `number` | Yes | Min: 5, Max: 480 | Duration before session auto-expires |
| `title` | `string` | No | Max 60 chars, trimmed | Optional friendly title for viewers |
| `passcode` | `string` | No | 4 to 8 numeric digits | Optional PIN required for viewers |

#### Response: `201 Created`
```json
{
  "success": true,
  "data": {
    "sessionId": "xK9_m2Q8vLp4",
    "senderToken": "st_9f7a8b1c4e2d3f6a8b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2",
    "viewerToken": "vt_3d5f7a9b1c2e4f6a",
    "shareUrl": "https://locato.app/v/xK9_m2Q8vLp4#key=vt_3d5f7a9b1c2e4f6a",
    "durationMinutes": 30,
    "expiresAt": "2026-10-26T12:30:00.000Z",
    "requirePasscode": true
  },
  "meta": {
    "timestamp": "2026-10-26T12:00:00.000Z"
  }
}
```

> [!IMPORTANT]
> The `senderToken` is **never shown again** after this response. Senders must store it in browser `sessionStorage`. It is not retrievable from the database.

---

### 2.3 Get Public Session Metadata (Viewer Initial Fetch)

```http
GET /sessions/:sessionId
```
Retrieves non-sensitive session metadata, active status, and the current coordinate snapshot (if session is active and not passcode-locked).

#### Headers (Optional)
- `X-Session-Viewer-Key: <viewerToken>` (Required if session requires capability verification)

#### Response: `200 OK` (Active Session)
```json
{
  "success": true,
  "data": {
    "sessionId": "xK9_m2Q8vLp4",
    "status": "active",
    "title": "Evening walk from Metro station",
    "durationMinutes": 30,
    "expiresAt": "2026-10-26T12:30:00.000Z",
    "requirePasscode": false,
    "viewerCount": 2,
    "lastLocation": {
      "latitude": 40.712776,
      "longitude": -74.005974,
      "accuracy": 12.5,
      "heading": 185.0,
      "speed": 1.4,
      "altitude": 10.2,
      "timestamp": "2026-10-26T12:05:32.000Z"
    }
  }
}
```

#### Response: `200 OK` (Passcode Locked)
If `requirePasscode: true` and a valid passcode/token has not yet been verified, `lastLocation` is omitted:
```json
{
  "success": true,
  "data": {
    "sessionId": "xK9_m2Q8vLp4",
    "status": "active",
    "title": "Evening walk from Metro station",
    "expiresAt": "2026-10-26T12:30:00.000Z",
    "requirePasscode": true,
    "isUnlocked": false
  }
}
```

#### Response: `410 Gone` (Expired or Revoked Session)
```json
{
  "success": false,
  "error": {
    "code": "SESSION_EXPIRED",
    "message": "This location sharing session has ended or expired.",
    "statusCode": 410
  }
}
```

---

### 2.4 Verify Viewer Passcode

```http
POST /sessions/:sessionId/verify-passcode
```
Verifies the numeric PIN set by the sender to unlock viewing.

#### Rate Limit
- Strict: 5 attempts per 15 minutes per IP per session (mitigates brute-force PIN attacks).

#### Request Body
```json
{
  "passcode": "4829"
}
```

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "verified": true,
    "viewerToken": "vt_3d5f7a9b1c2e4f6a"
  }
}
```

---

### 2.5 Stop Session (Kill Switch / Revocation)

```http
POST /sessions/:sessionId/stop
```
Immediately revokes location sharing. Unsets coordinates from database, transitions `status = 'revoked'`, and broadcasts termination to all connected viewer sockets.

#### Headers
- `Authorization: Bearer <senderToken>` (Required)

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "sessionId": "xK9_m2Q8vLp4",
    "status": "revoked",
    "revokedAt": "2026-10-26T12:12:00.000Z"
  }
}
```

---

### 2.6 Pause Location Sharing

```http
POST /sessions/:sessionId/pause
```
Temporarily suspends broadcasting location updates without revoking the session URL.

#### Headers
- `Authorization: Bearer <senderToken>` (Required)

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "sessionId": "xK9_m2Q8vLp4",
    "status": "paused"
  }
}
```

---

### 2.7 Resume Location Sharing

```http
POST /sessions/:sessionId/resume
```
Resumes broadcasting after being paused.

#### Headers
- `Authorization: Bearer <senderToken>` (Required)

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "sessionId": "xK9_m2Q8vLp4",
    "status": "active"
  }
}
```

---

### 2.8 Extend Session Lifetime

```http
PATCH /sessions/:sessionId/extend
```
Extends the session expiration time by the specified additional minutes.

#### Headers
- `Authorization: Bearer <senderToken>` (Required)

#### Request Body
```json
{
  "additionalMinutes": 15
}
```

#### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "sessionId": "xK9_m2Q8vLp4",
    "durationMinutes": 45,
    "expiresAt": "2026-10-26T12:45:00.000Z"
  }
}
```

---

## 3. Real-Time Socket.IO Event Specification

### 3.1 Handshake Authentication & Authorization

All Socket.IO connections must provide credentials in the `auth` payload during connection establishment:

```javascript
// Sender Socket Connection
const senderSocket = io('https://locato-api.onrender.com', {
  auth: {
    role: 'sender',
    sessionId: 'xK9_m2Q8vLp4',
    token: 'st_9f7a8b1c4e2d3f6a8b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2'
  },
  transports: ['websocket', 'polling']
});

// Recipient Socket Connection
const viewerSocket = io('https://locato-api.onrender.com', {
  auth: {
    role: 'viewer',
    sessionId: 'xK9_m2Q8vLp4',
    token: 'vt_3d5f7a9b1c2e4f6a'
  },
  transports: ['websocket', 'polling']
});
```

#### Handshake Validation Logic
1. Verify `sessionId` matches an active, non-expired, non-revoked session.
2. If `role === 'sender'`:
   - Compute `SHA-256(token)` and compare with `session.senderTokenHash`.
   - Reject with `AuthenticationError: Invalid sender token` if mismatched.
   - Attach session context to `socket.data = { role: 'sender', sessionId }`.
   - Join room `session:${sessionId}`.
3. If `role === 'viewer'`:
   - If session requires token, verify `SHA-256(token) === session.viewerTokenHash`.
   - Attach session context to `socket.data = { role: 'viewer', sessionId }`.
   - Join room `session:${sessionId}`.
   - Increment `stats.viewerCount` and broadcast `session:viewer_count`.

---

### 3.2 Client-to-Server Events

| Event Name | Sender Allowed | Viewer Allowed | Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `sender:location_update` | **Yes** | **No (Forbidden)** | Coordinate Object (see schema below) | Emits latest GPS fix |
| `sender:battery_status` | **Yes** | **No** | `{ batteryLevel: number, isCharging: boolean }` | Reports sender device power level |
| `sender:pause` | **Yes** | **No** | `{}` | Requests broadcast pause |
| `sender:resume` | **Yes** | **No** | `{}` | Requests broadcast resume |
| `sender:terminate` | **Yes** | **No** | `{}` | Immediate kill switch |
| `viewer:ping` | No | Yes | `{ timestamp: number }` | Viewer latency check |

#### Payload Schema: `sender:location_update`
```typescript
interface LocationUpdatePayload {
  latitude: number;       // Range: [-90.0, 90.0]
  longitude: number;      // Range: [-180.0, 180.0]
  accuracy: number;       // Range: [0.0, 5000.0] meters
  heading: number | null; // Range: [0.0, 360.0] or null
  speed: number | null;   // Range: [0.0, 150.0] m/s or null
  altitude: number | null;// Ground altitude in meters or null
  timestamp: number;      // Device epoch timestamp in milliseconds
}
```

---

### 3.3 Server-to-Client Events

| Event Name | Target | Payload | Description |
| :--- | :--- | :--- | :--- |
| `session:location_broadcast` | Room Viewers | Coordinate Object | Live location stream delivered to viewers |
| `session:status_changed` | All Room Members | `{ status: SessionStatus, reason?: string }` | State transitions (`active`, `paused`, `revoked`) |
| `session:viewer_count` | All Room Members | `{ viewerCount: number }` | Live viewer count updates |
| `session:sender_disconnected`| Room Viewers | `{ gracePeriodSeconds: number }` | Informs viewers sender disconnected unexpectedly |
| `session:sender_reconnected` | Room Viewers | `{}` | Informs viewers sender re-established link |
| `session:expired` | All Room Members | `{ expiredAt: string }` | Emitted when session reaches expiration time |
| `session:error` | Individual Socket | `{ code: string, message: string }` | Event-level error notification |

---

## 4. Complete Zod Validation Schemas (TypeScript)

These Zod schemas are located in `apps/api/src/schemas/`:

```typescript
import { z } from 'zod';

// 1. Session Creation Schema
export const CreateSessionSchema = z.object({
  durationMinutes: z
    .number({ required_error: 'Duration is required' })
    .int('Duration must be an integer')
    .min(5, 'Minimum duration is 5 minutes')
    .max(480, 'Maximum duration is 8 hours (480 minutes)')
    .default(30),
  title: z
    .string()
    .trim()
    .max(60, 'Title cannot exceed 60 characters')
    .optional()
    .nullable(),
  passcode: z
    .string()
    .regex(/^\d{4,8}$/, 'Passcode must be between 4 and 8 digits')
    .optional()
    .nullable(),
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;

// 2. Extend Session Schema
export const ExtendSessionSchema = z.object({
  additionalMinutes: z
    .number()
    .int()
    .min(5, 'Minimum extension is 5 minutes')
    .max(120, 'Maximum single extension is 120 minutes'),
});

// 3. Verify Passcode Schema
export const VerifyPasscodeSchema = z.object({
  passcode: z
    .string()
    .regex(/^\d{4,8}$/, 'Passcode must be between 4 and 8 numeric digits'),
});

// 4. Real-Time Location Update Schema (Socket Event)
export const LocationUpdateSchema = z.object({
  latitude: z
    .number()
    .min(-90.0, 'Latitude must be between -90 and 90')
    .max(90.0, 'Latitude must be between -90 and 90'),
  longitude: z
    .number()
    .min(-180.0, 'Longitude must be between -180 and 180')
    .max(180.0, 'Longitude must be between -180 and 180'),
  accuracy: z
    .number()
    .min(0, 'Accuracy must be a non-negative number')
    .max(5000, 'Accuracy reading too coarse (>5000m) to broadcast'),
  heading: z
    .number()
    .min(0)
    .max(360)
    .nullable()
    .optional(),
  speed: z
    .number()
    .min(0)
    .max(150, 'Speed exceeds plausible human/vehicular threshold (150 m/s)')
    .nullable()
    .optional(),
  altitude: z
    .number()
    .nullable()
    .optional(),
  timestamp: z
    .number()
    .refine(
      (ts) => Math.abs(Date.now() - ts) < 300000, // Reject clocks drifted by >5 minutes
      { message: 'Timestamp deviates too far from server clock' }
    ),
});

export type LocationUpdatePayload = z.infer<typeof LocationUpdateSchema>;

// 5. Socket Handshake Auth Schema
export const SocketAuthSchema = z.object({
  role: z.enum(['sender', 'viewer']),
  sessionId: z.string().min(8).max(64),
  token: z.string().min(8).max(128).optional().nullable(),
});
```

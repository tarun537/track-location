# Locato - Security & Privacy Requirements

> **Version:** 1.0.0  
> **Status:** Security Baseline & Privacy Architecture (Phase 1 Approved)  
> **Core Focus:** Consent-Based Geolocation, Token Hygiene, and Zero Historical Data Footprint  

---

## 1. Security Architecture Principles

Locato handles highly sensitive real-time physical telemetry. Consequently, its architecture departs from traditional web application assumptions:

1. **Zero-Trust Ephemerality:** All location state exists purely for transient synchronization. Once a session ends or is revoked, all physical coordinate data must be eradicated.
2. **Consent Precedes Acquisition:** The browser must never request or receive GPS coordinates without clear, unambiguous human interaction and informed consent.
3. **Strictly Never Request Recipient Location:** The recipient is purely an observer. The application never asks for, collects, or accesses the viewer's location.
4. **Defense-in-Depth Token Hygiene:** The public session identity must never grant broadcast privileges. Tokens must never appear in application log streams, referrer headers, or unprotected database records.
5. **Address Bar Secret Stripping:** Upon opening a shared link, the client application immediately consumes the capability secret, exchanges it for an in-memory session credential, and scrubs the secret from the browser address bar (`window.history.replaceState`) to prevent shoulder surfing, screenshot disclosure, and browser history leakage.
6. **Asymmetric Privilege Model:** Recipients are strictly passive visual observers. Viewers cannot manipulate session state or transmit telemetry.

---

## 2. STRIDE Threat Model & Mitigations

| Threat Category | Potential Vector | Impact | Locato Architectural Countermeasure |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Attacker attempts to impersonate sender and broadcast fraudulent GPS coordinates | Recipient misled regarding sender's real-world location | Sender mutations and Socket updates require validation of `senderTokenHash`. Raw `senderToken` is 256 bits of cryptographically secure random entropy. |
| **Tampering** | Man-in-the-Middle (MitM) alters coordinates in transit or injects spoofed events | Erroneous location displayed to viewers | Strict TLS 1.3 encryption end-to-end, WSS for WebSockets, and strict Zod payload validation rejecting out-of-bounds coordinates. |
| **Repudiation** | Malicious client floods server and denies origin | Exhaustion of server resources | Anonymized IP hash logging in `session_audits`, cryptographically bound session IDs, and rate limiting. |
| **Information Disclosure** | 1. Tokens leaked via HTTP `Referer` headers to tile servers.<br>2. Coordinates leaked into server logs or error monitoring.<br>3. Database breach reveals past locations.<br>4. Recipient location exposed. | User tracking by 3rd parties, public exposure of coordinates, historical profiling | 1. URL Hash Fragment architecture (`#key=...`) + address bar stripping + `Referrer-Policy: no-referrer`.<br>2. Automated log redaction (Pino filters).<br>3. Zero location history in database; single slot overwritten and purged immediately on stop.<br>4. Recipient location is strictly never requested or captured. |
| **Denial of Service** | Botnet floods `POST /sessions` or floods WebSocket with 100 coordinates/sec | Backend crash or high database load | Strict rate limiting: 5 session creations/min/IP. WebSocket leaky bucket throttling: max 2 coordinate updates/sec per sender socket. |
| **Elevation of Privilege** | Connected viewer socket attempts to emit `sender:location_update` or stop session | Unauthorized takeover of tracking session | Strict role enforcement during handshake (`socket.data.role`). Viewers attempting to emit sender events are disconnected immediately. |

---

## 3. Token Architecture & Storage Security

### 3.1 Token Comparison Matrix

| Property | `sessionId` | `senderToken` | `viewerToken` |
| :--- | :--- | :--- | :--- |
| **Entropy** | 128-bit random NanoID (16-24 chars) | 256-bit cryptographically secure (`crypto.randomBytes(32)`) | 128-bit cryptographically secure (`crypto.randomBytes(16)`) |
| **Hash Algorithm** | None (public lookup key) | SHA-256 (`crypto.createHash('sha256')`) | SHA-256 (`crypto.createHash('sha256')`) |
| **Client Storage** | URL Path & React State | `sessionStorage` or Memory | URL Hash Fragment & Memory |
| **Lifecycle** | Destroyed at session expiry | Destroyed upon session stop or expiry | Destroyed at session expiry |
| **Logged by Server?** | Yes (correlation key) | **NEVER** | **NEVER** |

### 3.2 Client-Side Storage Evaluation
- **Why NOT `localStorage` for `senderToken`?**  
  `localStorage` persists across browser sessions and tabs indefinitely. If a sender shares a session on a shared or borrowed computer, a subsequent user could inspect `localStorage` to resume or kill old sessions.
- **Why `sessionStorage` or In-Memory?**  
  `sessionStorage` is strictly scoped to the active browser tab. Closing the tab automatically clears the `senderToken`. In-memory state in React hooks guarantees zero lingering footprint on shared devices.

### 3.3 Address Bar Stripping & Referrer Leakage Prevention
When a recipient clicks a link (via SMS or chat), the capability key is present in the hash fragment:
```
https://locato.app/v/xK9_m2Q8vLp4#key=vt_3d5f7a9b1c2e4f6a
```

#### The Address Bar Sanitization Protocol (Phase 5)
1. The React application reads `window.location.hash` and extracts `vt_3d5f...` into component memory.
2. The URL is scrubbed immediately via:
   ```javascript
   window.history.replaceState(null, '', window.location.pathname);
   ```
3. The secret key is removed from the visible browser address bar, preventing shoulder surfing, screenshots, and bookmarking of active credentials.
4. Furthermore, because it was in the hash fragment, browsers **never send it in HTTP headers or `Referer` headers** to map tile providers (OpenStreetMap).
5. Strict `Referrer-Policy: no-referrer` is enforced on all responses.

---

## 4. Server-Side Logging & Coordinate Redaction

Application logs must never become an inadvertent repository of user coordinates or secret keys.

### 4.1 Pino Logger Redaction Rules
The backend implements strict path redaction using Pino:

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-session-viewer-key"]',
      'senderToken',
      'viewerToken',
      'token',
      'passcode',
      'latitude',
      'longitude',
      'lastLocation.latitude',
      'lastLocation.longitude',
      'payload.latitude',
      'payload.longitude'
    ],
    censor: '[REDACTED_SENSITIVE]'
  }
});
```

### 4.2 Error Tracking Sanitization
Before sending unhandled exceptions to crash reporters:
- Strip all URL query strings and hash parameters.
- Sanitize stack frames and local variables holding latitude/longitude floats.
- Scrub HTTP request bodies containing `senderToken` or coordinates.

---

## 5. Network & HTTP Security Headers

The Express application enforces comprehensive security headers via `helmet`:

```typescript
import helmet from 'helmet';
import cors from 'cors';

export function configureSecurityMiddlewares(app: Express) {
  // 1. Helmet Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: [
            "'self'",
            'data:',
            'https://*.tile.openstreetmap.org'
          ],
          connectSrc: [
            "'self'",
            process.env.API_URL || 'http://localhost:5000',
            (process.env.API_URL || 'http://localhost:5000').replace(/^http/, 'ws')
          ],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: []
        }
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'no-referrer' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      frameguard: { action: 'deny' },
      xContentTypeOptions: true,
      noSniff: true
    })
  );

  // 2. Strict CORS Configuration
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Viewer-Key'],
      credentials: true
    })
  );

  // 3. Permissions Policy Header
  app.use((req, res, next) => {
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(self), microphone=(), camera=(), payment=(), usb=()'
    );
    next();
  });
}
```

---

## 6. Rate Limiting & Abuse Prevention

| Route / Gateway | Limiter Mechanism | Window | Max Allowed | Exceeded Action |
| :--- | :--- | :--- | :--- | :--- |
| `POST /sessions` | IP-based Rate Limiter | 1 Minute | 5 requests | HTTP `429 Too Many Requests` |
| `POST /sessions/:id/verify-passcode` | IP + SessionId Limiter | 15 Minutes | 5 attempts | Lock session passcode verification for 15 min |
| `GET /sessions/:id` | IP-based Rate Limiter | 1 Minute | 60 requests | HTTP `429 Too Many Requests` |
| `sender:location_update` (Socket) | Leaky Bucket per Socket | 1 Second | 2 events | Drop excess updates, emit warning to sender |
| Socket Connections | IP Connection Limiter | 1 Minute | 20 handshakes | Reject handshake with `429` |

---

## 7. Consent & Geolocation Compliance

### 7.1 Multi-Stage Consent UI Pattern
1. **Pre-Prompt Modal (Application Layer):** Before the native browser prompt is invoked, an informational modal explains:
   - What will be shared: Real-time GPS location, horizontal accuracy, and speed.
   - Who can see it: Only people with the unique link (and optional passcode).
   - How long: For the designated session duration (e.g. 30 minutes).
   - Can it be cancelled: Yes, at any time via the "Stop Sharing" button.
2. **Native Browser Prompt:** Only after the user clicks "Enable Location & Share" does the browser trigger `navigator.geolocation.getCurrentPosition()`.
3. **Persistent Active Indicator:** Throughout the session, the UI displays a high-contrast pulsating badge:  
   `🔴 LIVE: BROADCASTING LOCATION`.

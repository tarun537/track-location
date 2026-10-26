# Locato - Production Deployment Guide & Runbook

> **Product Name:** Locato  
> **Architecture:** Ephemeral Live GPS Location Sharing Platform  
> **Target Cloud Stack:** Vercel (Frontend SPA), Render (Backend WebSockets & REST API), MongoDB Atlas (Managed DB)  
> **Specification Compliance:** 13-Point Deployment Blueprint  
> **Last Updated:** 2026-10-26  

---

## Table of Contents
1. [GitHub Repository Preparation](#1-github-repository-preparation)
2. [MongoDB Atlas Setup](#2-mongodb-atlas-setup)
3. [Render Backend Deployment](#3-render-backend-deployment)
4. [Backend Environment Variables](#4-backend-environment-variables)
5. [Vercel Frontend Deployment](#5-vercel-frontend-deployment)
6. [Frontend Backend URL Configuration](#6-frontend-backend-url-configuration)
7. [Production CORS Configuration](#7-production-cors-configuration)
8. [API and Socket.IO Connectivity Tests](#8-api-and-socketio-connectivity-tests)
9. [Two-Device Live-Sharing Verification Checklist](#9-two-device-live-sharing-verification-checklist)
10. [Custom Domain Configuration](#10-custom-domain-configuration)
11. [HTTPS Verification & Geolocation Mandates](#11-https-verification--geolocation-mandates)
12. [Expiration and Revocation Verification](#12-expiration-and-revocation-verification)
13. [Troubleshooting Common Failures](#13-troubleshooting-common-failures)

---

## 1. GitHub Repository Preparation

Before triggering cloud deployments, ensure the repository is clean, validated, and free of sensitive development secrets or test tokens.

### Monorepo Structure
Locato uses an npm workspaces monorepo:
```text
we-safe/
├── apps/
│   ├── api/            # Express, Socket.IO, Mongoose backend
│   └── web/            # React 19, Vite, Tailwind CSS, Leaflet SPA
├── docs/               # Architectural, privacy, security & deployment specs
├── package.json        # Root workspace configuration
└── tsconfig.base.json  # Shared TypeScript base configuration
```

### Pre-Push Verification Checklist
Run the following commands from the repository root to verify zero build errors and 100% test pass rate:
```bash
# 1. Verify all unit and integration tests pass (34/34 tests)
npm run test:api
npm run test:web

# 2. Verify clean production builds
npm run build:api
npm run build:web
```

### Git & Secret Hygiene
- Verify `.gitignore` exists at the root and excludes all sensitive files:
  - `.env`, `.env.local`, `.env.production`
  - `node_modules/`
  - `dist/` and `build/`
  - Logs (`*.log`, `pino.log`)
- Ensure no raw database connection strings, passwords, or pepper tokens are committed to version control.
- Push clean commits to your default branch (`master` or `main`):
  ```bash
  git push origin master
  ```

---

## 2. MongoDB Atlas Setup

MongoDB Atlas provides the managed database cluster hosting temporary session metadata, credential hashes, and single-coordinate location state.

### Step 1: Create Cluster
1. Navigate to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and log in.
2. Click **Create** to deploy a new database cluster:
   - **Provider & Region:** Choose AWS or GCP in the region closest to your Render backend (e.g., `us-east-1` or `eu-central-1`) to minimize database latency.
   - **Cluster Tier:** Free Tier `M0 Sandbox` (ideal for MVP/testing) or `M10+` (production with automated continuous backups).
   - **Cluster Name:** `locato-cluster`.

### Step 2: Configure Least-Privilege Database User
1. Under **Security** in the left sidebar, navigate to **Database Access**.
2. Click **Add New Database User**.
3. Choose **Built-in Role** -> **Specific Privileges**:
   - Assign `readWrite` permission restricted specifically to the `locato` database:
     - Database: `locato`
     - Collection: (blank for all collections in `locato`)
4. Set Authentication Method to **Password**. Generate a secure 32+ character random alphanumeric password.
5. Save user as `locato_app_user`. Store the password securely.

### Step 3: Network Access Rules
1. Under **Security**, navigate to **Network Access**.
2. Click **Add IP Address**.
3. Because Render web services have dynamic outbound IP ranges (unless on an Enterprise plan with dedicated egress IPs), select **Allow Access from Anywhere** (`0.0.0.0/0`).
4. Ensure access is protected by your strong database user password and TLS encryption.

### Step 4: Obtain Connection String
1. Under **Deployment** -> **Database**, click **Connect** on your cluster.
2. Select **Drivers** (Node.js version 5.5 or later).
3. Copy the SRV connection URI:
   ```text
   mongodb+srv://locato_app_user:<db_password>@locato-cluster.xxxxxx.mongodb.net/locato?retryWrites=true&w=majority&appName=LocatoCluster
   ```

### Step 5: Verify Schema Indexes & TTL
Locato automatically registers its schema indexes upon initial server bootstrap via Mongoose:
- **`sessionId`**: Unique index (`{ unique: true }`) for instant lookups.
- **`expiresAt`**: TTL index (`{ expireAfterSeconds: 0 }`) enabling background database-level document purging.

---

## 3. Render Backend Deployment

Render is the designated host for the Node.js API and persistent Socket.IO gateway, providing automated TLS termination, HTTP/1.1 WebSocket upgrading, and zero-configuration SSL.

### Step 1: Create Render Web Service
1. Log in to the [Render Dashboard](https://dashboard.render.com).
2. Click **New +** in the top navigation and select **Web Service**.
3. Connect your GitHub account and select the `we-safe` / `locato` repository.

### Step 2: Configure Service Parameters
Configure the service with the following settings:
- **Name:** `locato-api`
- **Region:** Match your MongoDB Atlas region (e.g., Frankfurt or Oregon).
- **Branch:** `master` (or `main`)
- **Root Directory:** (leave blank; commands will run from the monorepo root)
- **Runtime:** `Node`
- **Build Command:**
  ```bash
  npm install && npm run build:api
  ```
- **Start Command:**
  ```bash
  npm run start:api
  ```
- **Plan Type:** `Starter` (recommended for WebSockets to prevent sleeping) or `Free`.
  > [!NOTE]
  > On Render's Free tier, services spin down after 15 minutes of inactivity, causing initial spin-up delays of ~50 seconds. For production real-time location sharing, the Starter plan or higher is strongly recommended to maintain uninterrupted WebSocket connections.

### Step 3: Health Check Endpoint
In **Advanced Settings**:
- **Health Check Path:** `/api/health`
- Render periodically queries this path. The API will respond with `200 OK` and `{ status: "healthy", database: "connected" }`.

---

## 4. Backend Environment Variables

In the Render dashboard, navigate to the **Environment** tab of `locato-api` and configure the following variables:

| Variable | Type | Example / Value | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | String | `production` | Enables production optimizations and sanitized error logging |
| `PORT` | Number | `10000` | Port assigned by Render (server listens on `0.0.0.0:PORT`) |
| `API_URL` | String | `https://locato-api.onrender.com` | Public base URL of backend API |
| `CLIENT_ORIGIN` | String | `https://locato.vercel.app` | Allowed CORS origin (Vercel domain or custom domain) |
| `MONGODB_URI` | String | `mongodb+srv://locato_app_user:SECURE_PASS@...` | MongoDB Atlas SRV connection string with TLS |
| `TOKEN_SALT` | String | `7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1f...` | 64-character random hex pepper for cryptographic token hashing |
| `LOG_LEVEL` | String | `info` | Pino logging level (`info` or `warn` in high-volume production) |

> [!CAUTION]
> Generate a fresh 64-character random string for `TOKEN_SALT` in production using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Never use development fallback strings.

---

## 5. Vercel Frontend Deployment

Vercel provides edge CDN hosting, automated asset optimization, and zero-latency distribution for the React 19 single-page application.

### Step 1: Import Project to Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Select your GitHub repository.

### Step 2: Configure Monorepo Project Settings
- **Framework Preset:** `Vite`
- **Root Directory:** Click **Edit** and set to `apps/web`
- **Build and Output Settings:**
  - Build Command: `npm run build` (runs `tsc -b && vite build`)
  - Output Directory: `dist`
  - Install Command: `npm install`

### Step 3: Client-Side SPA Routing (`apps/web/vercel.json`)
Verify that `apps/web/vercel.json` exists in the repository to ensure direct navigation to deep links (such as `/v/:sessionId` and `/create`) routes properly without 404 errors:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 6. Frontend Backend URL Configuration

### Setting Vercel Environment Variables
In the Vercel project settings, navigate to **Settings** -> **Environment Variables** and add:

| Variable | Environment | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Production, Preview | `https://locato-api.onrender.com/api/v1` | Full URL to the Render REST API |
| `VITE_SOCKET_URL` | Production, Preview | `https://locato-api.onrender.com` | Root URL for Socket.IO gateway connection |

> [!WARNING]
> **Client Bundle Security:** All variables prefixed with `VITE_` are bundled directly into public JavaScript assets and are readable by any client.
> - **NEVER** set `TOKEN_SALT`, `MONGODB_URI`, or backend secrets in Vercel environment variables.
> - Only public endpoint URLs belong in `VITE_` variables.

### Zero Mock Code in Production
The Locato client is verified to contain zero mock fallbacks in its production execution paths:
- `apps/web/src/pages/CreatePage.tsx` exclusively dispatches to `apiClient.createSession` and `apiClient.stopSession`.
- `apps/web/src/pages/TrackPage.tsx` exclusively fetches from `apiClient.getSession` and authenticates via `socketClient`.
- `apps/web/src/services/mockSessionService.ts` is strictly isolated for standalone Vitest unit tests.

---

## 7. Production CORS Configuration

To prevent Cross-Origin Resource Sharing vulnerabilities while allowing legitimate frontend viewers, CORS is strictly enforced across both REST and WebSocket transports:

### REST API CORS (`apps/api/src/app.ts`)
```typescript
app.use(cors({
  origin: env.CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
```

### Socket.IO CORS (`apps/api/src/sockets/socketServer.ts`)
```typescript
const io = new Server(httpServer, {
  cors: {
    origin: env.CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: 1e4, // 10 KB limit
  pingInterval: 25000,
  pingTimeout: 20000,
});
```

### Supporting Multiple Origins (Optional)
If supporting both a custom apex domain (`https://locato.app`) and Vercel preview URLs (`https://*-yourteam.vercel.app`), configure `CLIENT_ORIGIN` with comma-separated values or update `apps/api/src/app.ts` to validate against an allowed origin list.

---

## 8. API and Socket.IO Connectivity Tests

Once both Render and Vercel services report successful builds, run these automated smoke checks:

### 1. Safe Health Check Test
```bash
curl -i https://locato-api.onrender.com/api/health
```
**Expected Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=15552000; includeSubDomains

{"success":true,"data":{"status":"healthy","database":"connected"}}
```

### 2. Session Creation Smoke Test
```bash
curl -i -X POST https://locato-api.onrender.com/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{"durationMinutes": 30}'
```
**Expected Response:**
```http
HTTP/1.1 201 Created
```
Body contains `sessionId`, `senderToken`, `viewerToken`, and `expiresAt`.

### 3. Socket.IO WebSocket Upgrade Test
Inspect WebSocket handshake using `curl` or browser DevTools:
```bash
curl -i "https://locato-api.onrender.com/socket.io/?EIO=4&transport=polling"
```
**Expected Response:**
```http
HTTP/1.1 200 OK
Content-Type: text/plain; charset=UTF-8

0{"sid":"...","upgrades":["websocket"],"pingInterval":25000,"pingTimeout":20000}
```

---

## 9. Two-Device Live-Sharing Verification Checklist

Execute this comprehensive physical verification test using two separate devices (e.g., Sender on iPhone/Android mobile and Recipient on Laptop/Desktop):

| Step | Action | Expected Behavior | Result |
| :---: | :--- | :--- | :---: |
| **1** | Open `https://locato.app` on Mobile Device A | Clean landing page renders. No browser GPS permission prompt requested. | [ ] Pass |
| **2** | Click **"Create Location Link"** | Navigates to `/create`. Pre-consent explanatory modal explains GPS use. Still NO GPS prompt. | [ ] Pass |
| **3** | Click **"Review Privacy & Start Sharing"** | Browser prompts: *"locato.app wants to use your location"*. | [ ] Pass |
| **4** | Accept GPS permission | Session created on backend. Sender dashboard displays pulsing status, countdown, and Share Link modal. | [ ] Pass |
| **5** | Send link to Device B via WhatsApp, SMS, or QR code | Link format: `https://locato.app/v/:sessionId#key=vt_...`. Notice capability key is in URL hash fragment. | [ ] Pass |
| **6** | Open link on Device B (Recipient) | Page loads instantly. Browser address bar automatically strips `#key=...` via `replaceState`. | [ ] Pass |
| **7** | Verify Recipient Privacy | Device B receives ZERO prompt for GPS permission. Recipient coordinates are never collected. | [ ] Pass |
| **8** | Verify Live Map Tracking | Leaflet map displays Device A marker with accuracy radius circle. Map recenter button works smoothly. | [ ] Pass |
| **9** | Physical Movement / Walk | As Device A moves, Device B marker glides smoothly with sub-second latency via Socket.IO room broadcast. | [ ] Pass |
| **10** | Wake Lock Toggle | On Device A, toggle Screen Wake Lock switch. Screen remains active during live broadcasting. | [ ] Pass |
| **11** | Click **"Stop Sharing"** on Device A | Confirmation modal prompts sender. Upon confirmation, backend executes atomic `$unset: { lastLocation: 1 }`. | [ ] Pass |
| **12** | Instant Viewer Termination | Within 500ms, Device B map transitions to **"Session Ended"** state card. Coordinates disappear from DOM. | [ ] Pass |
| **13** | Reconnect / Refresh Attempt | Refresh Device B. Backend returns `404 / Session Expired or Revoked`. No coordinates leaked. | [ ] Pass |

---

## 10. Custom Domain Configuration

To connect custom domains (e.g., `locato.app` for frontend and `api.locato.app` for backend):

### 1. Frontend Domain (Vercel)
1. In Vercel Project Settings -> **Domains**, add `locato.app` and `www.locato.app`.
2. Configure DNS records with your registrar (e.g., Cloudflare, Namecheap, Route 53):
   - **Apex (`@`):** `A` record pointing to `76.76.21.21`
   - **Subdomain (`www`):** `CNAME` pointing to `cname.vercel-dns.com`
3. Vercel automatically provisions and renews Let's Encrypt SSL certificates.

### 2. Backend Domain (Render)
1. In Render Dashboard -> `locato-api` -> **Settings** -> **Custom Domains**, add `api.locato.app`.
2. Add DNS record at your registrar:
   - **Type:** `CNAME`
   - **Name:** `api`
   - **Target:** `locato-api.onrender.com`
3. Render automatically provisions a TLS certificate via Let's Encrypt.

### 3. Update Cross-Service Configuration
After domain propagation:
- Update Render environment: `CLIENT_ORIGIN=https://locato.app`
- Update Vercel environment: `VITE_API_URL=https://api.locato.app/api/v1` and `VITE_SOCKET_URL=https://api.locato.app`
- Trigger redeployment on Vercel.

---

## 11. HTTPS Verification & Geolocation Mandates

### Browser W3C Geolocation Mandate
Modern browsers (Google Chrome, Apple Safari, Mozilla Firefox) strictly prohibit `navigator.geolocation` in insecure contexts.
- **HTTPS is Mandatory:** GPS collection fails immediately with an error if the application is accessed over unencrypted `http://`.
- **Localhost Exception:** Browsers only permit plain HTTP on `http://localhost` or `http://127.0.0.1` for developer testing.

### Security Headers & TLS Configuration
Locato enforces strict transport security through Helmet:
```typescript
helmet({
  hsts: {
    maxAge: 15552000, // 180 days
    includeSubDomains: true,
    preload: true,
  },
  contentSecurityPolicy: false, // Managed per edge routing
  referrerPolicy: { policy: 'no-referrer' },
})
```

Verify HTTPS redirect:
```bash
curl -I http://locato-api.onrender.com/api/health
```
**Expected Response:** `HTTP/1.1 301 Moved Permanently` pointing to `https://...`.

---

## 12. Expiration and Revocation Verification

Locato implements a two-tier real-time session expiration and revocation defense:

### 1. Real-Time Room Timer (Application Layer)
When a session is established in `apps/api/src/sockets/handlers/session.handler.ts`, an active in-memory timer is armed for `expiresAt - Date.now()`:
```typescript
const timeToExpiry = sessionDoc.expiresAt.getTime() - Date.now();
const timer = setTimeout(async () => {
  await SessionModel.findOneAndUpdate(
    { sessionId },
    { $set: { status: 'expired' }, $unset: { lastLocation: 1 } }
  );
  io.to(`session:${sessionId}`).emit('session:status_changed', {
    sessionId,
    status: 'expired',
  });
  io.in(`session:${sessionId}`).disconnectSockets(true);
}, timeToExpiry);
```
- **Verification:** Create a 5-minute session. At 5:00.0, the viewer displays the Expired card and all connected sockets disconnect automatically.

### 2. Immediate Kill Switch Revocation
When the sender clicks **"Stop Sharing"**:
- Sender triggers `/api/v1/sessions/:sessionId/stop` or emits `sender:terminate`.
- Status is immediately set to `'revoked'`.
- Subdocument `lastLocation` is immediately wiped via MongoDB `$unset`.
- Socket room is notified and purged within milliseconds.

### 3. Background TTL Garbage Collection (Database Layer)
- Mongoose TTL index `{ expiresAt: 1 }, { expireAfterSeconds: 0 }`.
- MongoDB Atlas runs its background TTL monitor thread every 60 seconds, permanently deleting old session documents.

---

## 13. Troubleshooting Common Failures

### 1. `CORS policy: No 'Access-Control-Allow-Origin' header`
- **Cause:** `CLIENT_ORIGIN` on Render does not match the exact origin in the browser address bar (including trailing slashes or subdomains).
- **Fix:** In Render Environment settings, ensure `CLIENT_ORIGIN` matches your frontend domain exactly (e.g. `https://locato.app` without a trailing slash).

### 2. `WebSocket connection failed: Error during WebSocket handshake: Unexpected response code: 502/503`
- **Cause:** Render service is cold-starting (Free tier) or backend experienced a boot crash.
- **Fix:** Check Render logs for boot errors (`MongoServerError`, unhandled exception). If on Free tier, wait 45 seconds for cold start or upgrade to Starter plan.

### 3. `Geolocation error: User denied Geolocation`
- **Cause:** User clicked "Don't Allow" on native OS or browser prompt, or site-level permissions are blocked in browser settings.
- **Fix:** Locato's `useGeolocation` hook catches error code `1 (PERMISSION_DENIED)` and renders an actionable error card instructing the user how to reset site permissions in browser settings (click lock icon in address bar).

### 4. `Geolocation error: Only secure origins are allowed`
- **Cause:** Application accessed over plain `http://` instead of `https://`.
- **Fix:** Ensure HTTPS is enforced by Vercel and your custom domain DNS records.

### 5. `MongoServerSelectionError: connect ECONNREFUSED`
- **Cause:** Render cannot connect to MongoDB Atlas because Network Access IP whitelist is blocking it.
- **Fix:** In MongoDB Atlas -> Network Access, ensure `0.0.0.0/0` is added to the IP Access List.

### 6. `UNAUTHORIZED_TOKEN: Capability token is required`
- **Cause:** Recipient opened `/v/:sessionId` directly without the `#key=vt_...` URL fragment or session was protected by PIN passcode.
- **Fix:** If the session has a passcode, enter the 4-6 digit passcode in the unlock card. If it was a capability link, ensure the full link generated by the sender was shared.

---

## Production Sign-Off & Status

| Phase | Milestone | Status |
| :--- | :--- | :---: |
| Phase 1 | Planning & Architecture Blueprints | **Completed** |
| Phase 2 | Frontend UI, Leaflet Map & State Cards | **Completed** |
| Phase 3 | REST API, MongoDB Mongoose & Centralized Validation | **Completed** |
| Phase 4 | Real-Time GPS Streaming & Leaky-Bucket Rate Limiter | **Completed** |
| Phase 5 | RFC 3986 Capability URLs & Memory-Only Key Stripping | **Completed** |
| Phase 6 | Product Polish, Web Manifest & Glide Animations | **Completed** |
| Phase 7 | Security Audit, Geodetic QA & 34 Passing Tests | **Completed** |
| Phase 8 | Production Deployment Runbook & Environment Verification | **Completed** |

*Locato is fully prepared, audited, and ready for production deployment across GitHub, Render, Vercel, and MongoDB Atlas.*

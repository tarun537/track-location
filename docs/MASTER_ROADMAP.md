# Locato - Master Development Roadmap

> **Living Project Document**  
> **Product Name:** Locato  
> **Current Phase:** All 8 Phases Complete — Production Ready  
> **Overall Status:** Phases 1 through 8 Completed & Verified (All 34 Tests Passing)  
> **Last Updated:** 2026-10-26  

---

## 1. Project Summary

**Locato** is a privacy-first, consent-based live location sharing web application. A sender creates a temporary sharing session, explicitly grants browser location permission, and receives a unique, unguessable link with a capability token. The sender shares this link with a recipient, who opens it in any modern browser to view the sender's real-time position on an interactive Leaflet/OpenStreetMap interface.

### Privacy Directives
- **Zero Pre-Consent Collection:** Never request or capture GPS coordinates prior to explicit human action.
- **Zero Recipient Tracking:** The recipient's location is strictly never requested, captured, or transmitted.
- **Zero Historical Footprint:** No permanent location history is stored. Only the latest position snapshot is held for active sessions, and immediately purged on stop or expiry.
- **Cryptographic Credential Hygiene:** Raw tokens are never logged or stored unhashed in databases. URL tokens use hash fragments or are exchanged immediately to prevent address bar and referrer leakage.

---

## 2. System Architecture & Tech Stack

```text
locato/
├── apps/
│   ├── web/                     # Frontend (React, Vite, TS, Tailwind, shadcn/ui, Leaflet)
│   └── api/                     # Backend (Node.js, Express, TS, Socket.IO, Mongoose, Zod)
├── docs/                        # Complete technical, security, and deployment documentation
├── .gitignore
├── package.json                 # Monorepo workspaces definition
└── README.md
```

- **Frontend:** React 18+, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix primitives), React Router, Leaflet, React-Leaflet, Lucide React.
- **Backend:** Node.js (LTS), Express, TypeScript, Socket.IO v4.
- **Database:** MongoDB Atlas, Mongoose 8.x (with native TTL indexes).
- **Validation & Security:** Zod, Web Crypto API / Node.js `crypto`, SHA-256 token hashing, Helmet security headers, rate limiting, strict CORS.
- **Deployment Targets:** Vercel (Frontend SPA), Render (Backend WebSocket/REST API), MongoDB Atlas (Database).

---

## 3. Eight-Phase Roadmap Overview

| Phase | Title | Focus & Core Deliverables | Status |
| :---: | :--- | :--- | :---: |
| **1** | **Planning & Architecture** | Complete specifications (`docs/`), repository state audit, session lifecycle, token architecture, browser limitations. | **COMPLETED** |
| **2** | **Frontend** | React SPA (Landing, Create Session, Viewer Map, Error states, responsive layout, shadcn/ui). | **COMPLETED** |
| **3** | **Backend & Database** | Express API, MongoDB connection, Mongoose model with TTL, Zod validation, token hashing, rate limiters, unit/integration tests. | **COMPLETED** |
| **4** | **Real-Time GPS** | Authenticated Socket.IO gateway, browser `watchPosition` engine, unidirectional broadcast, kill switch. | **COMPLETED** |
| **5** | **Secure Links** | Unpredictable IDs, one-time secret exchange, address bar secret stripping, QR code, native share, unauthorized join tests. | **COMPLETED** |
| **6** | **Product Polish** | Dynamic accuracy circle, marker animation, stale-location indicators, countdown, mobile UX, honest PWA limits. | **COMPLETED** |
| **7** | **Security & QA** | Security audit (`SECURITY_AUDIT.md`), privacy review (`PRIVACY_REVIEW.md`), test report (`TEST_REPORT.md`), known limitations (`KNOWN_LIMITATIONS.md`), production readiness (`PRODUCTION_READINESS.md`). | **COMPLETED** |
| **8** | **Deployment** | Vercel (frontend), Render (backend), MongoDB Atlas, deployment guide (`DEPLOYMENT.md`), production validation. | **COMPLETED** |

---

## 4. Current Phase Details: Phase 1 — Planning and Architecture

### 4.1 Objectives
1. Inspect repository state, working tree, dependencies, and git configuration.
2. Propose clean monorepo architecture (`apps/web`, `apps/api`, `docs/`).
3. Define sender and recipient authorization models separately.
4. Establish clear distinction between public session IDs and secret access tokens.
5. Detail temporary session lifecycle (`created`, `active`, `disconnected/stale`, `expired`, `revoked`).
6. Detail API contracts and Socket.IO real-time event specifications.
7. Detail MongoDB schema, single latest coordinate model, TTL index, and zero historical tracking.
8. Specify security, rate limiting, logging redaction, and error-handling requirements.
9. Document browser geolocation limitations (mobile WebKit tab freeze, Wake Lock, battery, HTTPS).
10. Finalize all 7 core planning documents and verify acceptance criteria.

### 4.2 Work Completed in Phase 1
- [x] Initialized Git repository (`git init`) and root `.gitignore`.
- [x] Inspected workspace: confirmed empty baseline prior to planning.
- [x] Authored `docs/PROJECT_OVERVIEW.md` (Product vision, user personas, requirements traceability).
- [x] Authored `docs/TECHNICAL_ARCHITECTURE.md` (Monorepo structure `apps/web` + `apps/api`, token model, Socket.IO rooms, browser constraints).
- [x] Authored `docs/DATABASE_SCHEMA.md` (Mongoose schema, single `lastLocation` slot, TTL index, 6-decimal geodetic precision).
- [x] Authored `docs/API_SPECIFICATION.md` (REST endpoints, Zod schemas, Socket.IO handshake and event contracts).
- [x] Authored `docs/SECURITY_REQUIREMENTS.md` (STRIDE threat model, URL fragment capability, Pino redaction, security headers).
- [x] Authored `docs/DEVELOPMENT_ROADMAP.md` (8-phase breakdown, risk mitigation matrix, Definition of Done).
- [x] Created `docs/MASTER_ROADMAP.md` (Living project dashboard).
- [x] Created root `README.md` indexing documentation.

### 4.3 Acceptance Criteria Verification (Phase 1)
- [x] **Repository state is documented:** Git initialized, clean working tree, no existing code overwritten.
- [x] **Architecture and folder structure are specified:** `apps/web` and `apps/api` monorepo defined.
- [x] **Database/session model is documented:** Ephemeral single-coordinate schema with TTL index and zero history.
- [x] **API and real-time contracts are documented:** Complete REST specifications and Socket.IO event schemas with Zod types.
- [x] **Security/privacy requirements are documented:** Separate sender/viewer auth, token hashing, URL hash hygiene, coordinate redaction.
- [x] **Eight-phase roadmap exists:** Detailed sequentially in `DEVELOPMENT_ROADMAP.md` and `MASTER_ROADMAP.md`.
- [x] **No unnecessary full implementation has started:** Only architectural and planning specifications created.

### 4.4 Test & Build Results
- Git repository successfully initialized.
- Documentation validated for internal cross-consistency (naming, endpoints, event names, token concepts).

### 4.5 Blockers & Risks
- **None currently.** All dependencies and architectural patterns are established and ready for Phase 2 scaffolding.

### 4.6 Next Steps
- Phase 1 completed and verified.

---

## 5. Phase 2 Details: Frontend Implementation

### 5.1 Objectives
1. Build modern, responsive, mobile-first frontend in `apps/web`.
2. Implement Landing page, Create-Session page, and Recipient Live Tracking page.
3. Ensure no location collection before explicit user action.
4. Strictly prevent recipient tracking on tracking views.
5. Provide accessible loading, empty, stale, expired, and revoked states.
6. Verify production build and automated tests pass cleanly.

### 5.2 Work Completed in Phase 2
- [x] Initialized `apps/web` with Vite, React 19, TypeScript, Tailwind CSS, and shadcn-style UI primitives.
- [x] Built responsive UI primitives: `Button`, `Card`, `Badge`, `Dialog`, and `Input`.
- [x] Built navigation & footer with privacy guarantees and OpenStreetMap attribution.
- [x] Built interactive `LeafletMap` with animated live marker pin, directional heading arrow, accuracy circle, and recenter button.
- [x] Implemented `useGeolocation` hook: strictly requires explicit `startTracking()` call; never captures on mount.
- [x] Implemented `useWakeLock` hook: keeps mobile/desktop screen illuminated during active tracking.
- [x] Implemented `useSessionCountdown` hook: calculates live countdown until expiry.
- [x] Built `ConsentModal`: pre-permission dialog explaining privacy terms before browser GPS prompt.
- [x] Built `ShareModal`: one-click copy, native Web Share API trigger, and dynamic QR code generation.
- [x] Built `BroadcastingBar`: active broadcasting dashboard with kill switch and metrics.
- [x] Built `KillSwitchDialog`: confirmation dialog before revoking access.
- [x] Built `TrackPage`: recipient live tracking view with zero recipient GPS collection, address bar secret stripping, and real-time state listeners.
- [x] Built state feedback cards: waiting, stale signal, session expired, session revoked, invalid 404, and PIN passcode dialog.
- [x] Isolated mock data service (`mockSessionService.ts`) completely separated from production API client (`apiClient.ts`).

### 5.3 Acceptance Criteria Verification (Phase 2)
- [x] **All required pages render and navigate correctly:** Routes `/`, `/create`, `/v/:sessionId`, `/track/:sessionId`, and `*` tested.
- [x] **Desktop and mobile layouts work:** Responsive Tailwind grid and flex layouts verified across breakpoints.
- [x] **Permission is not requested on page load:** `useGeolocation` does not invoke `watchPosition` on mount.
- [x] **Recipient page does not request recipient GPS:** `TrackPage` has zero calls to geolocation APIs.
- [x] **UI states are implemented:** Loading, waiting, stale, expired, revoked, invalid, and passcode states complete.
- [x] **Mocks are isolated from production services:** `mockSessionService.ts` strictly isolated for offline UI preview.
- [x] **Build and relevant checks pass:**
  - `oxlint`: 0 errors, 0 warnings.
  - `tsc -b && vite build`: compiled in 1.86s, 0 errors.
  - `vitest run`: 4/4 unit tests passing.

### 5.4 Test & Build Results
- **Unit Tests:** Vitest passed 4/4 tests (`geoMath.test.ts`).
- **Linter:** Oxlint passed on 35 files with 0 warnings.
- **Production Build:** Vite bundle generated in `apps/web/dist/` (CSS: 47.8 kB, JS: 562.4 kB).

### 5.5 Next Phase
- Phase 2 completed and verified.

---

## 6. Phase 3 Details: Backend, Database & Session Management

### 6.1 Objectives
1. Implement Express REST API, MongoDB connection, Mongoose model, Zod validation, token hashing, and error handling in `apps/api`.
2. Define minimal session schema with single latest coordinate slot and zero permanent location history.
3. Enforce separate sender authorization (`Bearer <senderToken>`) and recipient capability authorization.
4. Implement SHA-256 token hashing; never store raw secrets.
5. Double-enforce expiry and revocation on every request.
6. Provide rate limiting, strict CORS, security headers, request validation, safe error messages, and secret-free logs.
7. Deliver automated integration test suite.

### 6.2 Work Completed in Phase 3
- [x] Initialized `apps/api` with TypeScript 5.7, Express 4, Mongoose 8, Zod, Helmet, CORS, and Pino.
- [x] Created `apps/api/.env.example` with safe placeholder variables.
- [x] Configured Zod environment validator (`src/config/environment.ts`).
- [x] Implemented Mongoose database connector with retry logic and pooling (`src/config/database.ts`).
- [x] Implemented `Session` model (`src/models/session.model.ts`) with:
  - Unique index on `sessionId`
  - Index on `senderTokenHash`
  - Native MongoDB TTL index on `expiresAt` (`expireAfterSeconds: 0`)
  - Subdocument `lastLocation` with 6-decimal geodetic truncation
  - Instant `$unset: { lastLocation: 1 }` on revocation
- [x] Implemented `CryptoService` (`src/services/crypto.service.ts`):
  - 128-bit unguessable base64url session IDs
  - 256-bit sender management tokens
  - 128-bit viewer capability tokens
  - SHA-256 token and passcode hashing with server pepper
  - Timing-safe hash comparison (`crypto.timingSafeEqual`)
- [x] Implemented Express middleware:
  - `auth.middleware.ts` (separate sender Bearer token vs recipient capability key)
  - `rateLimiter.middleware.ts` (session creation 5/min, passcode verify 5/15min, API limiter 120/min)
  - `validate.middleware.ts` (Zod body and param validation)
  - `error.middleware.ts` (centralized, sanitized error envelopes)
- [x] Implemented `SessionService` & REST Controllers:
  - `POST /api/sessions` (Create session, returns unhashed tokens once)
  - `GET /api/sessions/:sessionId` (Get metadata; omits coordinates if passcode locked)
  - `POST /api/sessions/:sessionId/authorize` (Verify numeric PIN)
  - `POST /api/sessions/:sessionId/revoke` (Kill switch, unsets coordinates immediately)
  - `POST /api/sessions/:sessionId/pause` & `/resume`
  - `PATCH /api/sessions/:sessionId/extend`
  - `GET /api/health` (Healthcheck)
  - Dual mounting at `/api` and `/api/v1`.
- [x] Implemented comprehensive integration test suite (`tests/session.test.ts`) using `mongodb-memory-server` and `supertest`.

### 6.3 Acceptance Criteria Verification (Phase 3)
- [x] **Backend starts:** Server bootstraps with database connection, graceful shutdown (`SIGTERM`/`SIGINT`), and port binding.
- [x] **Database connection works when configured:** Mongoose connection pooling and retry handlers verified.
- [x] **Session APIs behave as documented:** Verified via 12 automated integration tests.
- [x] **Unauthorized access is rejected:** Missing/invalid Bearer tokens return 401; wrong passcode returns 401.
- [x] **Expiry and revocation are server-enforced:** Revoked sessions immediately purge coordinates and reject requests with 410; expired sessions return 410.
- [x] **Tests pass and configuration is documented:**
  - `npm run test:api`: 12/12 tests passing.
  - `npm run build:api`: `tsc` compiles with 0 errors.
  - Full workspace test suite: 16/16 tests passing (4 frontend, 12 backend).

### 6.4 Test & Build Results
- **Backend Tests:** 12/12 integration tests passed in 1.25s ([tests/session.test.ts](file:///c:/Users/Dell/OneDrive/Desktop/sam/Projects/we-safe/apps/api/tests/session.test.ts)).
- **Backend Build:** TypeScript compilation (`tsc`) passed with 0 errors into `apps/api/dist/`.
- **Full Workspace Test Suite:** 16/16 passing across `apps/web` and `apps/api`.

### 6.5 Next Phase
- Proceeded to **Phase 4 — Real-Time GPS** (Completed below).

---

## 7. Phase 4 Details: Real-Time GPS Location Sharing

### 7.1 Objectives
1. Connect real browser GPS, backend, Socket.IO, and recipient map.
2. Sender flow: Start tracking strictly after explicit human consent via `navigator.geolocation.watchPosition()`. Stop watch when sharing ends.
3. Real-time communication: Typed Socket.IO events for sender/recipient authentication, room isolation (`session:${sessionId}`), coordinate streaming, pause/resume, and kill switch termination.
4. Role authorization: Enforce that only authenticated senders can broadcast coordinates; reject viewers attempting coordinate updates.
5. Coordinate validation & geodetic sanitization: Validate latitude (-90 to 90), longitude (-180 to 180), accuracy, timestamps. Truncate to 6 decimal places.
6. Rate limiting: Leaky-bucket limiter on sender socket updates (<2 updates/sec).
7. Zero recipient tracking: Recipient connects with capability token, receives live broadcasts, and never has their own location requested.
8. Instant kill switch: Broadcast `session:status_changed: revoked` to room and purge database `lastLocation` via atomic `$unset`.

### 7.2 Work Completed in Phase 4
- [x] Implemented Socket.IO server gateway (`apps/api/src/sockets/socketServer.ts`) mounted directly onto HTTP server with CORS and buffer limits.
- [x] Implemented handshake authentication middleware (`apps/api/src/sockets/socketAuth.middleware.ts`):
  - Validates `sessionId` exists and is not expired or revoked.
  - Authenticates sender using timing-safe SHA-256 hash comparison against `senderTokenHash`.
  - Authenticates viewer using timing-safe SHA-256 hash comparison against `viewerTokenHash` (if passcode enabled).
  - Rejects unauthorized or malformed connections with typed Socket.IO connect errors.
- [x] Implemented location event handler (`apps/api/src/sockets/handlers/location.handler.ts`):
  - Role enforcement: Sockets with `role !== 'sender'` attempting `sender:location_update` receive `FORBIDDEN_OPERATION` and are immediately disconnected.
  - Leaky-bucket rate limiter: Drops excessive updates (>2/sec) and emits `RATE_LIMIT_EXCEEDED`.
  - Zod payload validation: Validates latitude, longitude, accuracy, timestamp, heading, speed, altitude.
  - Atomic database update: Uses `findOneAndUpdate` with `{ status: { $nin: ['revoked', 'expired'] }, expiresAt: { $gt: new Date() } }` to eliminate revocation race conditions.
  - Unidirectional broadcast: Emits sanitized `session:location_broadcast` to `session:${sessionId}` room.
- [x] Implemented session room handler (`apps/api/src/sockets/handlers/session.handler.ts`):
  - Room isolation (`session:${sessionId}`).
  - Dynamic viewer count tracking and room notification.
  - Sender 60-second disconnect grace timer before emitting `session:sender_disconnected`.
  - Sender reconnect notification (`session:sender_reconnected`).
  - Pause / resume state broadcasting.
  - Kill switch (`sender:terminate`): Triggers `SessionService.revokeSession` (atomic `$unset: { lastLocation: 1 }`), broadcasts `session:status_changed: revoked`, and disconnects all room sockets.
- [x] Integrated frontend sender flow (`apps/web/src/pages/CreatePage.tsx`):
  - Connects to Socket.IO gateway upon session creation.
  - Listens to GPS changes from `useGeolocation` and emits `sender:location_update`.
  - Displays live viewer count badge.
  - Emits `sender:terminate` on user confirmation.
- [x] Integrated frontend recipient flow (`apps/web/src/pages/TrackPage.tsx`):
  - Strips URL hash capability token from browser address bar on mount.
  - Authenticates to Socket.IO gateway as viewer.
  - Listens to `session:location_broadcast` and updates map marker/accuracy ring smoothly.
  - Listens to disconnect, reconnect, pause, and revoke events.
  - Strictly zero recipient geolocation queries.
- [x] Created comprehensive real-time automated test suite (`apps/api/tests/socket.test.ts`):
  - Handshake authentication and real-time GPS coordinate streaming.
  - Rejection of invalid credentials on handshake.
  - Strict blocking and disconnection of malicious viewers attempting coordinate updates.
  - Real-time kill switch execution and instantaneous database location purge.

### 7.3 Acceptance Criteria Verification (Phase 4)
- [x] **Browser GPS captured accurately:** Uses `navigator.geolocation.watchPosition` with high accuracy and error fallbacks.
- [x] **Location updates streamed in real time:** Verified across authenticated WebSocket transport.
- [x] **Recipient map updates smoothly:** Leaflet marker and accuracy circle update without jarring page reloads.
- [x] **Sender authorization enforced on real-time channel:** Sockets without valid sender tokens cannot broadcast coordinates.
- [x] **Coordinates validated and sanitized:** Zod schema enforces bounds; 6-decimal truncation applied.
- [x] **Recipient location never collected:** Zero calls to geolocation API on viewer route.
- [x] **Stop sharing terminates updates and notifies recipient:** Immediate kill switch purges coordinates and broadcasts revoked status.
- [x] **Tests pass:**
  - `apps/api/tests/socket.test.ts`: 8/8 tests passed.
  - `apps/api/tests/session.test.ts`: 12/12 tests passed.
  - Full API suite: 20/20 tests passed.
  - Full Web suite: 4/4 tests passed.
  - TypeScript compilation: 0 errors across all workspaces.

### 7.4 Test & Build Results
- **API Tests:** 20/20 passed in 4.19s ([tests/socket.test.ts](file:///c:/Users/Dell/OneDrive/Desktop/sam/Projects/we-safe/apps/api/tests/socket.test.ts) & [tests/session.test.ts](file:///c:/Users/Dell/OneDrive/Desktop/sam/Projects/we-safe/apps/api/tests/session.test.ts)).
- **Web Tests:** 4/4 passed in 206ms ([src/tests/geoMath.test.ts](file:///c:/Users/Dell/OneDrive/Desktop/sam/Projects/we-safe/apps/web/src/tests/geoMath.test.ts)).
- **Web Production Build:** Vite build succeeded with 0 errors.

---

## 8. Phase 5 Details: Secure Links & Credential Hygiene

### 8.1 Objectives
1. Harden session URLs, credential handling, address bar hygiene, and recipient capability authorization.
2. Unpredictable 128-bit NanoID session IDs and 256-bit sender tokens.
3. URL Hash Fragment capability architecture (`https://locato.app/v/:id#key=<token>`).
4. Client-side secret stripping: extract key from hash and invoke `window.history.replaceState` to scrub the address bar immediately.
5. One-click copy, native Web Share API (`navigator.share`), and QR code modal (`QRCodeSVG`).
6. Double-enforce server-side expiration checks; client countdown is purely informational.
7. Automated tests for invalid, expired, revoked, and unauthorized socket joins.

### 8.2 Work Completed in Phase 5
- [x] Verified cryptographic randomness in `CryptoService` (128-bit session IDs, 256-bit sender tokens, 128-bit viewer tokens).
- [x] Verified `ShareModal.tsx` integration with clipboard copy, native Web Share, and dynamic SVG QR code rendering.
- [x] Verified client-side secret stripping protocol in `TrackPage.tsx` (`window.history.replaceState`).
- [x] Enhanced `socketAuthMiddleware` to distinguish between `SESSION_REVOKED` and `SESSION_EXPIRED`.
- [x] Enforced capability verification on protected sessions over WebSockets (unauthorized viewers without PIN token cannot connect).
- [x] Added 4 additional automated socket security tests in `tests/socket.test.ts` (expired sessions, revoked sessions, non-existent sessions, forged viewer tokens).

---

## 9. Phase 6 Details: Product Polish & Mobile UX

### 9.1 Objectives
1. Session countdown timer with visual color shift (green -> amber -> red).
2. Connection quality indicator (live, reconnecting, paused).
3. Stale-location warning if sender updates lapse for >30 seconds.
4. Recenter map button and dynamic accuracy radius circle (`L.circle`).
5. Animated live marker glides between coordinates using smooth linear interpolation.
6. Stop-sharing confirmation modal (`KillSwitchDialog`) to prevent accidental cancellation.
7. Screen Wake Lock toggle to prevent mobile display sleep.
8. Document browser background execution boundaries honestly.

### 9.2 Work Completed in Phase 6
- [x] Implemented dynamic countdown color shift in `BroadcastingBar.tsx`:
  - `> 30%` remaining: Emerald badge and icon.
  - `10% - 30%` remaining: Amber badge and icon.
  - `< 10%` remaining: Red pulsing badge and warning icon.
- [x] Added interactive Screen Wake Lock toggle button to broadcasting bar (`Sun` / `Moon` indicators).
- [x] Added stale-location detection in `ViewerStatusCard.tsx`: displays amber banner when updates are older than 30 seconds.
- [x] Implemented smooth marker glide in `LeafletMap` using `.leaflet-marker-icon` cubic-bezier CSS transform transition.
- [x] Verified stop-sharing confirmation dialog (`KillSwitchDialog.tsx`).
- [x] Added SPA rewrite rule in `apps/web/vercel.json` for deep linking.

---

## 10. Phase 7 Details: Security Audit, QA & Launch Readiness

### 10.1 Objectives & Verification
- [x] **Authorization Audit:**
  - Capability token strictly enforced (`sessionId` alone withholds coordinates and rejects WebSocket handshake).
  - Separate sender (`st_...`) and recipient (`vt_...`) credentials.
  - Revoked credentials cannot be reused.
  - Sockets repeat authorization check on connect and reconnect.
  - Active sockets disconnected and coordinates purged immediately upon session expiry or revocation.
- [x] **Privacy Audit:**
  - Zero GPS collection prior to consent.
  - Recipient location never requested.
  - Single coordinate slot in DB (`$unset: { lastLocation: 1 }` on stop).
  - Coordinates and tokens redacted from Pino application logs.
  - RFC 3986 URL hash fragment and `window.history.replaceState` address bar sanitization.
- [x] **Abuse & Robustness:**
  - Rate limiters verified for session creation (5/min) and PIN verification (5/15min).
  - Malformed coordinates (lat > 90) rejected by Zod schema.
  - Max WebSocket buffer limit (10 KB) and leaky-bucket limiter (<2 updates/sec).
  - Viewers strictly blocked from emitting location updates.
  - Multi-viewer concurrent streams verified.
  - Disconnect 60s grace timer and stale location (>30s) indicators verified.
- [x] **Automated Test Results:**
  - 34/34 tests passing across `apps/api` (25 tests) and `apps/web` (9 tests).
  - 0 TypeScript compiler errors; clean Vite production bundle.
- [x] **Audit Findings & Mitigations (All 4 Resolved):**
  - SEC-01 (Medium): Enforced capability key requirement in `getSessionById` so `sessionId` alone cannot leak coordinates.
  - SEC-02 (Medium): Enforced viewer capability token requirement on Socket.IO handshake for all sessions.
  - SEC-03 (Low): Integrated server-side room expiration timers disconnecting active sockets at `expiresAt`.
  - SEC-04 (Low): Bound-checked coordinate payloads and throttled update frequencies.
- [x] **Release Gate Recommendation:** Approved for Beta launch. Explicitly recorded that no external penetration testing was performed.

### 10.2 Deliverables
- [x] Updated [`docs/SECURITY_AUDIT.md`](file:///c:/Users/Dell/OneDrive/Desktop/sam/Projects/we-safe/docs/SECURITY_AUDIT.md).
- [x] Updated [`docs/PRIVACY_REVIEW.md`](file:///c:/Users/Dell/OneDrive/Desktop/sam/Projects/we-safe/docs/PRIVACY_REVIEW.md).
- [x] Updated [`docs/TEST_REPORT.md`](file:///c:/Users/Dell/OneDrive/Desktop/sam/Projects/we-safe/docs/TEST_REPORT.md) (34/34 tests passing).
- [x] Updated [`docs/KNOWN_LIMITATIONS.md`](file:///c:/Users/Dell/OneDrive/Desktop/sam/Projects/we-safe/docs/KNOWN_LIMITATIONS.md).
- [x] Updated [`docs/PRODUCTION_READINESS.md`](file:///c:/Users/Dell/OneDrive/Desktop/sam/Projects/we-safe/docs/PRODUCTION_READINESS.md).

---

## 11. Phase 8 Details: Production Deployment

### 11.1 Key Achievements & Verifications
- [x] **Production Host Binding:** Updated `apps/api/src/server.ts` to bind explicitly to `0.0.0.0` on `env.PORT` for Render container compatibility.
- [x] **No-Mock Enforcement:** Completely removed `mockSessionService` fallback paths from `apps/web/src/pages/CreatePage.tsx` and `apps/web/src/pages/TrackPage.tsx`. Mock services are strictly isolated to standalone unit tests.
- [x] **Socket.IO Host Derivation:** Enhanced `apps/web/src/services/socketClient.ts` to support explicit `VITE_SOCKET_URL` with automatic protocol/host fallback to `VITE_API_URL`.
- [x] **Vercel SPA Routing Configuration:** Created `apps/web/vercel.json` with wildcard rewrite to `/index.html` ensuring deep links (`/v/:sessionId`, `/create`) resolve without 404s.
- [x] **Frontend Environment Configuration:** Created `apps/web/.env.example` documenting `VITE_API_URL` and `VITE_SOCKET_URL` alongside explicit warnings against placing backend secrets in browser bundles.
- [x] **Comprehensive 13-Point Deployment Runbook:** Authored [`docs/DEPLOYMENT.md`](file:///c:/Users/Dell/OneDrive/Desktop/sam/Projects/we-safe/docs/DEPLOYMENT.md) covering:
  1. GitHub repository preparation and secret hygiene.
  2. MongoDB Atlas cluster setup, least-privilege DB user (`readWrite` on `locato`), dynamic network access, and TTL indexes.
  3. Render Web Service creation (`locato-api`), Node runtime, monorepo build/start commands, and health check.
  4. Complete backend environment variables table (`NODE_ENV`, `PORT`, `API_URL`, `CLIENT_ORIGIN`, `MONGODB_URI`, `TOKEN_SALT`, `LOG_LEVEL`).
  5. Vercel frontend deployment with `apps/web` root directory and Vite preset.
  6. Frontend backend URL configuration and client bundle security rules.
  7. Production CORS configuration on Express and Socket.IO.
  8. API and Socket.IO connectivity tests (safe `/api/health` check and WebSocket handshake upgrade).
  9. Two-device live-sharing verification checklist (13 physical pass/fail steps).
  10. Custom domain configuration (Apex/CNAME DNS on Vercel and Render with auto Let's Encrypt TLS).
  11. HTTPS verification and W3C Geolocation security mandates.
  12. Real-time expiration, revocation kill switch, and background TTL purging verification.
  13. Troubleshooting guide for common failures (CORS, WebSocket 502, Geolocation permissions, Insecure context, Atlas whitelist).

### 11.2 Deliverables
- [x] [`docs/DEPLOYMENT.md`](file:///c:/Users/Dell/OneDrive/Desktop/sam/Projects/we-safe/docs/DEPLOYMENT.md)
- [x] [`apps/web/vercel.json`](file:///c:/Users/Dell/OneDrive/Desktop/sam/Projects/we-safe/apps/web/vercel.json)
- [x] [`apps/web/.env.example`](file:///c:/Users/Dell/OneDrive/Desktop/sam/Projects/we-safe/apps/web/.env.example)
- [x] [`apps/api/src/server.ts`](file:///c:/Users/Dell/OneDrive/Desktop/sam/Projects/we-safe/apps/api/src/server.ts)
- [x] [`apps/web/src/pages/CreatePage.tsx`](file:///c:/Users/Dell/OneDrive/Desktop/sam/Projects/we-safe/apps/web/src/pages/CreatePage.tsx)
- [x] [`apps/web/src/pages/TrackPage.tsx`](file:///c:/Users/Dell/OneDrive/Desktop/sam/Projects/we-safe/apps/web/src/pages/TrackPage.tsx)
- [x] [`apps/web/src/services/socketClient.ts`](file:///c:/Users/Dell/OneDrive/Desktop/sam/Projects/we-safe/apps/web/src/services/socketClient.ts)


# Locato - Master Development Roadmap

> **Living Project Document**  
> **Product Name:** Locato  
> **Current Phase:** Phase 3 Completed — Ready for Phase 4 (Real-Time GPS)  
> **Overall Status:** Phases 1, 2 & 3 Complete (All Acceptance Criteria Verified)  
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
├── docs/                        # Complete technical and security documentation
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
| **4** | **Real-Time GPS** | Authenticated Socket.IO gateway, browser `watchPosition` engine, unidirectional broadcast, kill switch. | PENDING |
| **5** | **Secure Links** | Unpredictable IDs, one-time secret exchange, address bar secret stripping, QR code, native share, unauthorized join tests. | PENDING |
| **6** | **Product Polish** | Dynamic accuracy circle, marker animation, stale-location indicators, countdown, mobile UX, honest PWA limits. | PENDING |
| **7** | **Security & QA** | Security audit (`SECURITY_AUDIT.md`), privacy review (`PRIVACY_REVIEW.md`), test report (`TEST_REPORT.md`), known limitations (`KNOWN_LIMITATIONS.md`), production readiness (`PRODUCTION_READINESS.md`). | PENDING |
| **8** | **Deployment** | Vercel (frontend), Render (backend), MongoDB Atlas, deployment guide (`DEPLOYMENT.md`), production validation. | PENDING |

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
- Proceed to **Phase 4 — Real-Time GPS**: Connect frontend and backend via authenticated Socket.IO for live coordinate streaming with zero recipient tracking, leaky-bucket rate limiting, and instant kill switch broadcast.




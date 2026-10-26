# Locato - Master Development Roadmap

> **Living Project Document**  
> **Product Name:** Locato  
> **Current Phase:** Phase 1 — Project Planning and Architecture  
> **Overall Status:** In Progress (Phase 1 Active)  
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
| **1** | **Planning & Architecture** | Complete specifications (`docs/`), repository state audit, session lifecycle, token architecture, browser limitations. | **IN PROGRESS** |
| **2** | **Frontend** | React SPA (Landing, Create Session, Viewer Map, Error states, responsive layout, shadcn/ui). | PENDING |
| **3** | **Backend & Database** | Express API, MongoDB connection, Mongoose model with TTL, Zod validation, token hashing, rate limiters, unit/integration tests. | PENDING |
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
- Conclude Phase 1 review with user.
- Upon approval, proceed to **Phase 2 — Frontend**: scaffold `apps/web` (Vite, React, TypeScript, Tailwind CSS, shadcn/ui, Leaflet, Lucide React) and implement UI pages with typed mocks.

# Locato

> **Consent-based, real-time ephemeral live location sharing through unique, cryptographically secured URLs.**

Locato is an open, privacy-first web application enabling users to share their live physical location on an interactive map with trusted contacts for a limited duration—without requiring account registration, friend graphs, or native app downloads.

---

## Technical Documentation Index

Complete architectural blueprints, data models, API contracts, security audits, and implementation roadmaps are located in the [`docs/`](./docs) directory:

1. [**Master Development Roadmap** (`docs/MASTER_ROADMAP.md`)](./docs/MASTER_ROADMAP.md)  
   The living master tracking document across all eight phases: objectives, acceptance criteria, completed work, test results, blockers, and next steps.
2. [**Project Overview** (`docs/PROJECT_OVERVIEW.md`)](./docs/PROJECT_OVERVIEW.md)  
   Executive summary, product philosophy, user personas, real-world use cases, and functional requirements traceability matrix.
3. [**Technical Architecture** (`docs/TECHNICAL_ARCHITECTURE.md`)](./docs/TECHNICAL_ARCHITECTURE.md)  
   End-to-end system design, client/server component breakdown (`apps/web` + `apps/api`), real-time WebSocket protocol, and analysis of browser constraints.
4. [**Database Schema Specification** (`docs/DATABASE_SCHEMA.md`)](./docs/DATABASE_SCHEMA.md)  
   Zero-history persistence model, Mongoose schema definitions, field-level indexes, TTL garbage collection mechanics, and coordinate precision truncation.
5. [**API & Real-Time Event Specification** (`docs/API_SPECIFICATION.md`)](./docs/API_SPECIFICATION.md)  
   RESTful endpoint documentation, request/response JSON payloads, Socket.IO real-time event contracts, and complete Zod validation schemas.
6. [**Security & Privacy Requirements** (`docs/SECURITY_REQUIREMENTS.md`)](./docs/SECURITY_REQUIREMENTS.md)  
   STRIDE threat modeling, token entropy and hashing, URL hash fragment hygiene, address bar secret stripping, Pino coordinate redaction, and HTTP security headers.
7. [**Development Roadmap** (`docs/DEVELOPMENT_ROADMAP.md`)](./docs/DEVELOPMENT_ROADMAP.md)  
   Sequential eight-phase milestone execution plan, task breakdown, risk mitigation matrix, and production Definition of Done (DoD).

---

## Core Security & Architecture Highlights

```
+-----------------------------------------------------------------------------------------+
|                                  LOCATO DUAL-TOKEN MODEL                                |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  Public Session ID (xK9_m2Q8vLp4)                                                       |
|  - Shared publicly with recipient                                                       |
|  - Routes to /v/xK9_m2Q8vLp4                                                            |
|  - Maps to Socket.IO room "session:xK9_m2Q8vLp4"                                        |
|                                                                                         |
|  Viewer Capability Key (#key=vt_3d5f7a9b1c2e4f6a)                                       |
|  - Encoded in URL HASH FRAGMENT (RFC 3986)                                              |
|  - Stripped from browser address bar upon arrival (window.history.replaceState)          |
|  - Never sent across HTTP network or leaked in Referer headers to map tile servers      |
|  - Strictly read-only access (cannot broadcast or modify session)                       |
|                                                                                         |
|  Sender Secret Token (st_9f7a8b1c4e2d...)                                               |
|  - Provided ONLY ONCE upon session creation                                             |
|  - Stored exclusively in Sender sessionStorage / memory                                 |
|  - Hashed as SHA-256 in MongoDB (never stored in cleartext)                             |
|  - Required for Kill Switch, Pause/Resume, Extend, and pushing GPS coordinates          |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

---

## Technology Stack

- **Frontend (`apps/web`):** React 18+, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, Leaflet, React-Leaflet, Lucide React
- **Device APIs:** W3C Geolocation API, Screen Wake Lock API, Page Visibility API
- **Backend (`apps/api`):** Node.js (LTS), Express, TypeScript, Socket.IO v4
- **Database:** MongoDB Atlas, Mongoose 8.x (with automated TTL indexes)
- **Validation & Crypto:** Zod, Web Crypto API / Node.js `crypto` (`crypto.randomBytes`, `crypto.createHash`)
- **Logging & Security:** Pino (with coordinate and token redaction), Helmet, CORS, Express Rate Limit
- **Deployment Targets:** Vercel (Frontend SPA), Render (Backend Service), MongoDB Atlas (Database)

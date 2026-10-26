# Locato - Project Overview

> **Version:** 1.0.0  
> **Status:** Architecture & Planning Phase (Phase 1 Baseline)  
> **Product Name:** Locato  
> **Classification:** Production-Grade Ephemeral Location Sharing Platform  

---

## 1. Executive Summary

**Locato** is a modern, privacy-first web application designed for explicit, consent-based, real-time live location sharing via unique, unguessable, cryptographically secured URLs.

Unlike conventional location-tracking products that require persistent user accounts, mutual social graphs, invasive background surveillance, or persistent storage of movement history, Locato operates on an **ephemeral, zero-footprint philosophy**. A sender can initiate a temporary sharing session in seconds, grant browser location permissions, and share a capability URL with trusted recipients (family, friends, emergency contacts, or delivery drivers). The recipient views the sender's live position on an interactive Leaflet/OpenStreetMap interface without needing to install an app or create an account.

The platform guarantees strict transparency: location data is captured **only** while the sharing session is active, broadcast **only** to authorized viewers, and **never** stored permanently in application logs or databases.

```
+-----------------------------------------------------------------------------------+
|                                  LOCATO CORE FLOW                                 |
+-----------------------------------------------------------------------------------+
|  [Sender Device]                                                [Recipient Device]|
|         |                                                                |        |
|  1. Select Duration (e.g. 30m)                                           |        |
|  2. Explicit Consent Dialog                                              |        |
|  3. Backend generates Session ID + Secret Tokens                         |        |
|  4. Shareable Link generated (with URL fragment capability)              |        |
|     ====================== Share URL via SMS / Chat ==================>  |        |
|  5. Sender streams GPS via WSS                                   6. Opens URL     |
|     ====================== Socket.IO Broadcast =======================>  |        |
|  7. Visual feedback (viewer count, kill switch)                  8. Live Map View |
|  8. Sender clicks "Stop Sharing" OR Session Expires                      |        |
|     ----------------------- Coordinates Purged ------------------------> |        |
+-----------------------------------------------------------------------------------+
```

---

## 2. Problem Statement & Privacy Philosophy

### 2.1 The Problem with Existing Solutions
1. **Permanent History Retention:** Mainstream apps (e.g., Google Maps location sharing, Apple Find My, Life360) store exhaustive historical breadcrumb trails, creating permanent surveillance dossiers vulnerable to data breaches and subpoenas.
2. **Account & Ecosystem Lock-in:** Both sender and recipient must download native apps, register accounts, and often join mutual social networks.
3. **Covert & Creep Vectors:** Background location tracking can linger long after a need has passed, often without obvious visual indicators to the user that their coordinates are continuously broadcasting.
4. **Heavy Battery & Resource Drain:** Constant background GPS drains mobile battery and exposes devices to tracking even when stationary.

### 2.2 The Locato Privacy Rules
- **Explicit, Informed Consent:** No tracking begins without an active user gesture and explicit browser permission acceptance. Clear UI pre-prompts describe exactly what information will be shared.
- **Strictly Never Request Recipient Location:** The recipient is purely an observer. The application never asks for, collects, or accesses the viewer's location.
- **Zero Permanent Location History:** The database only maintains the *latest active coordinate* required for live viewer synchronization. When a session terminates or expires, all location data is wiped immediately.
- **Capability-Based Access:** Sessions are addressed through cryptographically random, unguessable identifiers paired with client-held secret tokens.
- **Asymmetric Control (Sender Sovereignty):** The sender retains absolute authority. At any moment, the sender can pause sharing, extend duration, or trigger the instant "Kill Switch" to revoke the session and sever all active viewer connections.
- **No Recipient Control:** Recipients are strictly read-only observers. A viewer can never query, command, ping, or manipulate the sender's device.

---

## 3. User Personas & Real-World Use Cases

| Persona | Context | Requirement | Value Delivered |
| :--- | :--- | :--- | :--- |
| **Night Commuter / Solo Walker** | Walking home late from public transit or ride-share | Temporary (15–45 min) live link to a close friend or family member | Reassurance, quick emergency visibility, auto-expires upon arrival |
| **Outdoor Enthusiast / Runner** | Running, cycling, or hiking along a trail | Low-friction link to partner without requiring app installation | Live location tracking with battery-aware GPS updates |
| **Meetup / Rendezvous Coordinator** | Finding friends at a crowded festival, airport, or park | One-click browser link sent over WhatsApp / Signal | Instant interactive map without social account requirements |
| **Field Professional / Courier** | Providing arrival visibility to a client | 1-hour session strictly limited to transit duration | Professional, privacy-respecting client tracking without invasive corporate apps |

---

## 4. Key Functional Capabilities

### 4.1 Sender Capabilities
- **Session Configuration:**
  - Configurable expiration periods (presets: 5 min, 15 min, 30 min, 1 hour, 4 hours; custom up to 8 hours).
  - Optional session label/title (e.g., "Walking from Central Station").
  - Optional numeric passcode protection for sensitive sharing.
- **Consent Pre-Prompt & Browser Permission:**
  - Explanatory pre-permission modal educating the user on why Geolocation is needed before the native browser prompt triggers.
  - Granular permission state detection (`granted`, `prompt`, `denied`).
- **Live Broadcasting Dashboard:**
  - High-visibility "BROADCASTING LIVE" status banner with pulsating red/green indicators.
  - Active viewer counter showing how many recipients currently have the link open.
  - Live GPS metadata display: Horizontal accuracy radius (meters), current speed, altitude, and last update timestamp.
  - Screen Wake Lock toggle to prevent mobile display timeout during transit.
- **Session Management & Kill Switch:**
  - **Instant Kill Switch:** One-tap button immediately invalidates the session, purges backend coordinates, and closes all viewer WebSockets.
  - **Pause / Resume Sharing:** Sender can temporarily freeze location streaming without terminating the session URL.
  - **Extend Session:** Add 15 or 30 minutes to an active session before expiry.

### 4.2 Recipient / Viewer Capabilities
- **Frictionless Onboarding:** Instant map view upon clicking the shared URL on any desktop or mobile browser.
- **Interactive OpenStreetMap / Leaflet Interface:**
  - High-resolution, retina-friendly map tiles.
  - Animated, smoothed marker tracking the sender's latest reported coordinates.
  - Dynamic accuracy circle depicting GPS uncertainty.
  - Auto-center and manual pan/zoom modes.
  - Compass orientation / heading visualizer.
- **Session Lifecycle Feedback:**
  - Clear alerts when sender is actively moving, paused, temporarily disconnected/stale (cellular tunnel), or when the session has been revoked/expired.

---

## 5. Technology Stack Summary

| Layer | Technology | Selection Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18+ (TypeScript)** | Component-driven, robust lifecycle hooks, strong ecosystem, strict type safety |
| **Build Tool** | **Vite** | Sub-second HMR, optimized ES modules, minimal build overhead |
| **Styling & UI Components** | **Tailwind CSS + shadcn/ui** | Headless accessible components (Radix primitives), low runtime overhead, consistent design system |
| **Mapping Engine** | **Leaflet + React-Leaflet + OSM** | Open-source, lightweight (~42KB gzip), no proprietary API key requirements or per-tile Google billing |
| **Device APIs** | **W3C Geolocation API & Screen Wake Lock API** | Native browser APIs; no mobile app store approval or native wrappers needed |
| **Backend Runtime** | **Node.js (LTS) + Express (TypeScript)** | High-throughput asynchronous I/O, mature middleware ecosystem, seamless TypeScript support |
| **Real-Time Transport** | **Socket.IO (Engine.IO v4)** | Automatic fallback (WebSocket with HTTP long-polling backup), room multiplexing, reconnection handling |
| **Database & ODM** | **MongoDB Atlas + Mongoose** | Document model ideal for transient sessions, native TTL indexes for automated hard expiration |
| **Data Validation** | **Zod** | End-to-end schema validation for both REST payloads and Socket.IO real-time messages |
| **Hosting Targets** | **Vercel (Frontend), Render (Backend), Atlas (DB)** | Managed cloud deployments with native HTTPS, environment controls, and zero DevOps drag |
| **Version Control** | **Git & GitHub** | Standard collaborative development, Git flow, CI/CD automation |

---

## 6. High-Level Requirements Traceability Matrix

| Requirement ID | Description | Architectural Component | Verification Method |
| :--- | :--- | :--- | :--- |
| **REQ-01** | User creates location-sharing session | Express `POST /api/v1/sessions` | Unit & API integration test |
| **REQ-02** | Explicit consent granted before GPS capture | React Consent Modal + W3C Geolocation Hook | UI unit test & manual browser verification |
| **REQ-03** | Unpredictable Session ID + Secret Sender Token | Node.js `crypto.randomBytes` / nanoid | Cryptographic entropy audit & hashing checks |
| **REQ-04** | Capability Shareable URL generation | URL Fragment / Hash token generator | E2E test verifying URL structure |
| **REQ-05** | Recipient views location on interactive map | Leaflet Map Component + OpenStreetMap tiles | Cross-browser visual testing |
| **REQ-06** | Real-time coordinate updates | Socket.IO room broadcast (`location:broadcast`) | Latency benchmark (<250ms target) |
| **REQ-07** | Sender instant stop / kill switch | `POST /api/v1/sessions/:id/stop` + Socket event | Real-time disconnect and DB purge test |
| **REQ-08** | Enforceable automated session expiration | MongoDB TTL index + Server-side timestamp validation | Automated test for expired session rejection |
| **REQ-09** | Recipient cannot control sender device | Unidirectional event contract + strict role validation | Penetration testing / event fuzzing |
| **REQ-10** | Mobile & desktop responsive execution | Tailwind responsive grid + Touch Leaflet handlers | Mobile Safari & Chrome for Android validation |

---

## 7. Out of Scope for MVP Release

To ensure rapid delivery, high stability, and uncompromising security, the following features are intentionally deferred:
- Persistent user accounts, OAuth logins, and user address books.
- Geofencing and automated boundary breach notifications.
- Multi-sender group tracking in a single map room.
- Native mobile applications (iOS / Android App Store wrappers).
- Turn-by-turn routing or transit navigation integration.
- Permanent historical track recording or GPX/KML route export.

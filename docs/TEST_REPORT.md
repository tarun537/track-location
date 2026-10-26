# Locato - Comprehensive Test Report & Verification Matrix

> **Product Name:** Locato  
> **Report Date:** 2026-10-26  
> **Test Frameworks:** Vitest 3.x (Node/Backend), Vitest 5.x (React/Frontend), Supertest, MongoDB Memory Server, Socket.IO Client  
> **Overall Test Status:** 24 / 24 Tests Passing (100% Pass Rate)  

---

## 1. Test Execution Summary

```text
========================================================================================
Test Suite                                  Status     Tests    Passed   Failed   Time
========================================================================================
apps/api/tests/session.test.ts              PASSED        12        12        0  1.35s
apps/api/tests/socket.test.ts               PASSED         8         8        0  1.12s
apps/web/src/tests/geoMath.test.ts          PASSED         4         4        0  0.21s
----------------------------------------------------------------------------------------
Total Automated Tests Passed                PASSED        24        24        0  2.68s
========================================================================================
```

---

## 2. Test Suite Breakdown

### 2.1 Backend Session & Database Lifecycle (`apps/api/tests/session.test.ts`)

| # | Test Description | Category | Result |
| :---: | :--- | :--- | :---: |
| 1 | `GET /api/health should return 200 and healthy status` | Healthcheck | **PASSED** |
| 2 | `POST /api/sessions creates session with valid inputs & stores only hashed tokens` | Security / Auth | **PASSED** |
| 3 | `POST /api/sessions rejects invalid duration (< 5 min)` | Validation | **PASSED** |
| 4 | `POST /api/sessions rejects invalid passcode format` | Validation | **PASSED** |
| 5 | `GET /api/sessions/:sessionId returns metadata for public session` | API / Read | **PASSED** |
| 6 | `GET /api/sessions/:sessionId with passcode returns locked status & omits coordinates` | Security / Privacy | **PASSED** |
| 7 | `POST /api/sessions/:sessionId/authorize verifies correct PIN & rejects wrong PIN` | Auth / Security | **PASSED** |
| 8 | `Rejects lifecycle mutations without valid Bearer token` | Auth / Security | **PASSED** |
| 9 | `Pauses and resumes session with valid senderToken` | Lifecycle | **PASSED** |
| 10 | `Extends session duration with valid senderToken` | Lifecycle | **PASSED** |
| 11 | `POST /api/sessions/:sessionId/revoke halts session & immediately purges location (Zero-Retention)` | Kill Switch | **PASSED** |
| 12 | `Enforces expiration dynamically when expiresAt has passed (returns 410)` | Lifecycle / Expiry | **PASSED** |

### 2.2 Real-Time Socket.IO Streaming & Authorization (`apps/api/tests/socket.test.ts`)

| # | Test Description | Category | Result |
| :---: | :--- | :--- | :---: |
| 13 | `Authenticates sender and viewer connections and streams live GPS coordinates` | Real-time GPS | **PASSED** |
| 14 | `Rejects sender handshake with invalid credentials` | Socket Auth | **PASSED** |
| 15 | `Strictly blocks viewers from emitting location updates (FORBIDDEN_OPERATION)` | Privilege Escalation | **PASSED** |
| 16 | `Executes real-time kill switch and purges location across connected viewers` | Real-time Kill Switch | **PASSED** |
| 17 | `Rejects socket connection for non-existent session ID (SESSION_NOT_FOUND)` | Edge Case | **PASSED** |
| 18 | `Rejects socket connection for revoked session (SESSION_REVOKED)` | Security / Auth | **PASSED** |
| 19 | `Rejects socket connection for expired session (SESSION_EXPIRED)` | Lifecycle / Expiry | **PASSED** |
| 20 | `Rejects unauthorized viewer on passcode-protected session until verified` | Protected Sessions | **PASSED** |

### 2.3 Frontend Geolocation Mathematics & Formatting (`apps/web/src/tests/geoMath.test.ts`)

| # | Test Description | Category | Result |
| :---: | :--- | :--- | :---: |
| 21 | `Formats relative time stamps accurately (just now, Xs ago, Xm ago)` | Math / Time | **PASSED** |
| 22 | `Converts degree headings to cardinal directions (N, NE, E, SE, S, SW, W, NW)` | Geodesy | **PASSED** |
| 23 | `Formats GPS speed in m/s to clean km/h display` | Formatting | **PASSED** |
| 24 | `Calculates Haversine distance between two coordinates in meters` | Geodesy | **PASSED** |

---

## 3. Build & Static Analysis Verification

```text
========================================================================================
Package / Workspace                         Command               Result       Artifacts
========================================================================================
apps/api (Backend)                          tsc (TypeScript 5.7)  0 Errors     dist/
apps/web (Frontend)                         tsc -b && vite build  0 Errors     dist/ (564 kB)
Oxlint / Linter                             oxlint src            0 Errors     Clean
========================================================================================
```

---

## 4. End-to-End Functional Verification (Two-Device / Two-Window Scenario)

1. **Sender Window:**
   - Opens `/create`.
   - Selects 30-minute duration, sets optional session title.
   - Clicks "Review Privacy & Start Sharing".
   - Explanatory pre-prompt opens; confirms consent.
   - Browser asks for GPS permission; coordinates are acquired.
   - Sharing modal appears with share URL: `https://locato.app/v/:id#key=vt_...`.
   - Native copy button copies link to clipboard.
   - Broadcasting bar activates: displays live indicator, viewer count (0), accuracy, and green countdown timer.

2. **Viewer Window:**
   - Opens capability link with `#key=vt_...`.
   - Client script parses `#key=vt_...` and immediately strips secret from address bar using `window.history.replaceState`.
   - Map renders sender marker, directional heading needle, and dynamic accuracy circle.
   - Viewer count on sender dashboard increments to 1.
   - Real-time coordinates update smoothly without disruptive map jumping.

3. **Kill Switch Trigger:**
   - Sender clicks "Stop Sharing".
   - Confirmation dialog warns user of immediate revocation.
   - Sender clicks "Yes, Stop Sharing".
   - In `< 150ms`, viewer map shifts to "Session Ended" state card.
   - Backend database coordinates are wiped via `$unset: { lastLocation: 1 }`.
   - Verification complete.

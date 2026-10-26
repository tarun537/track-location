# Locato - Known Limitations & Mobile Geolocation Constraints

> **Product Name:** Locato  
> **Document Purpose:** Honest documentation of browser geolocation boundaries, mobile OS power-saving restrictions, and network edge cases.  
> **Last Updated:** 2026-10-26  

---

## 1. Mobile Browser Background GPS Throttling

A fundamental constraint of web-based geolocation applications is that mobile operating systems aggressively suspend background JavaScript execution to preserve battery life.

### 1.1 Apple iOS (WebKit / Safari)
- **Background Tab Suspension:** When an iOS user switches away from the Safari tab running Locato, or locks the device screen, iOS immediately suspends the WebKit process after approximately 10 to 30 seconds.
- **Impact on Locato:** Live GPS broadcasts pause while Safari is backgrounded or the screen is locked. Once the user unlocks the phone or reopens Safari, the connection automatically resumes, emits the current position fix, and clears the disconnect state.
- **PWA Status:** Installing Locato as a Progressive Web App (PWA) on iOS does **not** bypass this restriction. iOS treats standalone web apps under the same WebKit background suspension rules. Only native iOS applications with the `UIBackgroundModes: location` entitlement can continuously capture background GPS.

### 1.2 Android (Chrome / Chromium)
- **Background Timer Throttling:** Android Chrome permits background execution for short intervals, but aggressively throttles `setInterval` and `watchPosition` frequencies to once every few minutes when the tab is backgrounded.
- **Battery Optimization (Doze Mode):** If the phone enters Doze mode, network and GPS sockets are paused until the next maintenance window.

---

## 2. Mitigations Implemented in Locato

Locato addresses these mobile constraints transparently and safely:

### 2.1 Screen Wake Lock API (`useWakeLock`)
- Locato integrates the HTML5 Screen Wake Lock API (`navigator.wakeLock.request('screen')`).
- While the sender is broadcasting, the screen is kept active to prevent the phone from entering sleep mode or locking automatically.
- A toggle button on the broadcasting bar allows the sender to enable or disable the Wake Lock at will.

### 2.2 Sender Disconnect Grace Period (60 Seconds)
- If the sender drives into an underground garage, subway tunnel, or has their cellular connection blip, the backend does **not** instantly terminate the session.
- A **60-second grace timer** is started.
- The recipient status card indicates `"Reconnecting..."` without showing a jarring error.
- If the sender reconnects within 60 seconds, the grace timer is cancelled, and live tracking resumes seamlessly.

### 2.3 Stale Signal Warning (>30 Seconds)
- If the recipient has not received a coordinate packet in >30 seconds (due to sender backgrounding or tunnel loss), an amber alert is shown:  
  `"Location not updated in >30s (weak GPS or device asleep)"`.
- This ensures the recipient is never deceived by an outdated position marker.

---

## 3. GPS Accuracy & Geodetic Tolerances

- **Indoor & Underground Environments:** Pure GPS/GNSS requires line-of-sight to satellites. Indoors, mobile browsers fall back to Wi-Fi triangulation and cell tower positioning, where accuracy can range from ±20m to ±150m.
- **Visualization:** Locato visualizes accuracy using a dynamic blue radius circle (`L.circle`). When accuracy is poor, the circle expands to convey uncertainty honestly.
- **Geodetic Rounding:** Coordinates are rounded to 6 decimal places (~0.11m). This avoids false precision and eliminates floating-point jitter across different browser engines.

---

## 4. Tile Layer Policies (OpenStreetMap)

- Locato uses OpenStreetMap standard tiles (`tile.openstreetmap.org`).
- **OSM Tile Usage Policy:** Requires standard attribution and disallows bulk downloading or excessive tile scraping.
- Locato strictly abides by this policy:
  - Clear attribution is embedded in Leaflet.
  - Tile requests do not pass user tokens or identifiers.
  - For high-volume enterprise deployments, we recommend switching to a dedicated vector tile provider (such as Mapbox, Stadia Maps, or self-hosted OpenMapTiles) as documented in `docs/DEPLOYMENT.md`.

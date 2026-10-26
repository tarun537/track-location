# Locato - Production Deployment Guide

> **Product Name:** Locato  
> **Target Cloud Platforms:** Vercel (Frontend SPA), Render (Backend WebSockets & REST API), MongoDB Atlas (Managed Database)  
> **Last Updated:** 2026-10-26  

---

## 1. Architecture Overview

```text
               +-------------------------------------------+
               |             Browser Clients               |
               |  (Sender Mobile GPS / Recipient Viewer)   |
               +---------------------+---------------------+
                                     |
                HTTPS GET (Static)   |   WSS & REST API
                                     |
               v                     v
   +-----------------------+   +-------------------------------+
   |      Vercel Edge      |   |        Render Web Service     |
   |      Frontend SPA     |   |    (Node.js + Express + WS)   |
   |  (https://locato.app) |   |    (https://api.locato.app)   |
   +-----------------------+   +---------------+---------------+
                                               |
                                               | TLS Mongoose
                                               v
                               +-------------------------------+
                               |      MongoDB Atlas Cluster    |
                               |    (Replica Set + TTL Index)  |
                               +-------------------------------+
```

---

## 2. Prerequisites
1. **GitHub Repository:** Monorepo pushed to GitHub (`main` or `master` branch).
2. **MongoDB Atlas Account:** Free tier (M0) or dedicated cluster.
3. **Render Account:** Standard Web Service (supports persistent WebSockets).
4. **Vercel Account:** Hobby or Pro account.
5. **Custom Domain (Optional):** E.g. `locato.app` and `api.locato.app`.

---

## 3. Database Setup (MongoDB Atlas)

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new cluster (Shared M0 Sandbox is sufficient for MVP).
3. **Database Access:** Create a database user (e.g. `locato_app_user`) with read/write permissions to the `locato` database. Generate a strong 32-character password.
4. **Network Access:**
   - Under IP Access List, add the outbound IP addresses of your Render service, or add `0.0.0.0/0` (Allow Access from Anywhere) secured by strong username/password authentication.
5. **Connection String:** Obtain the SRV connection URI:
   ```
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/locato?retryWrites=true&w=majority&appName=LocatoCluster
   ```

---

## 4. Backend Deployment (Render)

Render is recommended for the Node.js backend because it supports persistent WebSockets with automated TLS termination and HTTP/2.

### Step 1: Create Web Service
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Fill in the build settings:
   - **Name:** `locato-api`
   - **Region:** Frankfurt (EU) or Oregon (US)
   - **Branch:** `master`
   - **Root Directory:** (leave empty or set to root)
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build:api`
   - **Start Command:** `npm run start:api`
   - **Plan:** Free or Starter

### Step 2: Configure Environment Variables
In the Render Service **Environment** tab, set:

| Variable | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations and error handling |
| `PORT` | `10000` | Port automatically assigned by Render |
| `MONGODB_URI` | `mongodb+srv://locato_app_user:...@cluster0.abcde.mongodb.net/locato?retryWrites=true&w=majority` | MongoDB connection string |
| `CLIENT_ORIGIN` | `https://locato.app` (or your Vercel URL) | Strict CORS allowed origin |
| `LOG_LEVEL` | `info` | Pino logging level |
| `TOKEN_PEPPER` | `c8f1e29a8341b520d481f92e...` (32+ chars random hex) | Secret pepper for token hashing |

### Step 3: Health Check Verification
Render will deploy the service and run health checks. Once active, verify:
```bash
curl https://locato-api.onrender.com/api/health
```
Response:
```json
{"success":true,"data":{"status":"healthy","database":"connected"}}
```

---

## 5. Frontend Deployment (Vercel)

### Step 1: Import Project in Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. In the Project Configuration:
   - **Framework Preset:** Vite
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Step 2: SPA Rewrite Rule (`apps/web/vercel.json`)
To ensure deep links (`/v/:sessionId` or `/create`) route correctly to the Single Page Application without 404 errors, create `apps/web/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Step 3: Environment Variables
Add the environment variable in Vercel:

| Variable | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://locato-api.onrender.com/api/v1` |

Deploy the project. Vercel will build the frontend and provide your live URL (e.g. `https://locato.vercel.app`).

---

## 6. Post-Deployment Verification Checklist

1. [ ] **HTTPS Enforced:** Confirm both frontend and backend redirect HTTP to HTTPS.
2. [ ] **Health Check:** `curl -i https://<backend-domain>/api/health` returns `200 OK`.
3. [ ] **CORS Verification:** Verify that browser requests from unauthorized origins are rejected.
4. [ ] **Consent Pre-Prompt:** Open live frontend, click "Review Privacy & Start Sharing", confirm pre-prompt appears before GPS prompt.
5. [ ] **Two-Device Real-Time Test:**
   - Create session on Mobile Phone A.
   - Share URL via WhatsApp/SMS to Phone B or Laptop.
   - Confirm Phone B sees Phone A marker updating smoothly on OpenStreetMap.
   - Confirm Phone B's address bar has stripped `#key=...`.
6. [ ] **Kill Switch Test:**
   - Click "Stop Sharing" on Phone A.
   - Confirm Phone B immediately displays "Session Ended" state card within 500ms.
   - Verify coordinates are purged from database.

# CrimsonMC Store

Premium Minecraft server web store (ranks, keys, bundles) with INR/USD pricing, live server status, QR scan-and-pay checkout, and Google login.

**Stack:** React (frontend) · FastAPI (backend) · MongoDB

---

## Local development

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill MONGO_URL, DB_NAME, CORS_ORIGINS
uvicorn server:app --reload --port 8001
```

### Frontend
```bash
cd frontend
yarn install
cp .env.example .env   # set REACT_APP_BACKEND_URL
yarn start
```

All backend routes are prefixed with `/api`. The frontend calls `${REACT_APP_BACKEND_URL}/api/...`.

---

## Deploy externally (self-host, avoids Emergent monthly credits)

You deploy the **frontend** and **backend** separately, plus a managed **MongoDB**.

### 1. Database — MongoDB Atlas (free tier)
1. Create a free cluster at https://www.mongodb.com/atlas
2. Create a DB user and allow network access (0.0.0.0/0 for simplicity)
3. Copy the connection string → this becomes `MONGO_URL`

### 2. Backend — Railway or Render
- Root/working directory: `backend`
- Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT` (a `Procfile` is included)
- Environment variables:
  - `MONGO_URL` = your Atlas string
  - `DB_NAME` = `crimsonmc`
  - `CORS_ORIGINS` = `https://crimsonmc.in,https://www.crimsonmc.in`
- After deploy you get a backend URL, e.g. `https://crimsonmc-api.up.railway.app`

### 3. Frontend — Netlify or Vercel

**IMPORTANT:** `netlify.toml` must be at the **repository root** (it is). It sets base=`frontend`, build=`yarn build`, publish=`build`. If you configure manually instead:
- **Base directory:** `frontend`
- **Build command:** `yarn build`
- **Publish directory:** `frontend/build`

Config files included: root `netlify.toml`, `frontend/vercel.json`, and `frontend/public/_redirects` (SPA routing).

**Required environment variable (set in Netlify/Vercel UI, then trigger a fresh deploy):**
- `REACT_APP_BACKEND_URL` = your backend URL from step 2, e.g. `https://crimsonmc-api.up.railway.app` (no trailing slash)

> CRA bakes `REACT_APP_*` at BUILD time. If it's missing or you change it, you MUST redeploy for it to take effect. Without a reachable backend the page still loads, but products/status/login won't work.

**Vercel:** set the project **Root Directory** to `frontend` in the UI; `vercel.json` handles SPA rewrites.

### 4. Custom domain — crimsonmc.in
Point the domain to your **frontend** host:
- **Netlify:** Site settings → Domain management → Add `crimsonmc.in`, follow DNS records.
- **Vercel:** Project → Settings → Domains → Add `crimsonmc.in`, follow DNS records.
Then set `CORS_ORIGINS` on the backend to include `https://crimsonmc.in` and redeploy.

> Note on login: Google login uses cross-site cookies (`SameSite=None; Secure`). For it to work, the backend must be served over HTTPS and `CORS_ORIGINS` must list your exact frontend origin (not `*`).

---

## Environment variables reference

| Where | Key | Purpose |
|-------|-----|---------|
| backend | `MONGO_URL` | MongoDB connection string |
| backend | `DB_NAME` | Database name |
| backend | `CORS_ORIGINS` | Allowed frontend origins (comma-separated) |
| frontend | `REACT_APP_BACKEND_URL` | Base URL of the backend |

Secrets are never committed — `.env` files are git-ignored; use the `.env.example` templates.

---
description: How to deploy frontend and backend from a single monorepo to Railway
---

# Deploying Reword Monorepo to Railway

Since **Reword** is now a monorepo containing both `/frontend` and `/backend` directories, you can deploy both services from the same GitHub repository by configuring the "Root Directory" in Railway.

## Prerequisites
- A Railway account (railway.app)
- The Reword repository pushed to GitHub
- Your local `.env` file handy for copying variables

## Step 1: Deploy the Backend (FastAPI)

1. **New Project/Service**:
   - Go to your Railway dashboard.
   - Click **"New Project"** -> **"Deploy from GitHub repo"**.
   - Select your repository (`microsaasteam0/Reword`).

2. **Configure Root Directory**:
   - Before the first build starts (or go to **Settings** immediately if it starts):
   - Go to the **Settings** tab of the service.
   - Scroll down to **Run Command** / **Root Directory** settings.
   - Set **Root Directory** to `/backend`.
   - Railway will now look for `requirements.txt` and `Procfile` (or `main.py`) inside the `/backend` folder.

3. **Set Build & Start Commands (if needed)**:
   - Railway usually auto-detects Python apps.
   - If not, verify the **Start Command** is: `python main.py` or `uvicorn main:app --host 0.0.0.0 --port $PORT`.
   - **Important**: Your `main.py` starts uvicorn on `0.0.0.0:$PORT` automatically, so `python main.py` should work.

4. **Environment Variables**:
   - Go to the **Variables** tab.
   - Copy all variables from the **BACKEND CONFIGURATION** section of your local `.env`.
   - **Variables to include**:
     - `DATABASE_URL`
     - `GOOGLE_CLIENT_ID`
     - `GOOGLE_CLIENT_SECRET`
     - `SECRET_KEY`
     - `BACKEND_URL` (Wait! This will be the URL Railway generates for this service. You can update it after deployment)
     - `FRONTEND_URL` (Set this to your intended frontend URL, or update after deploying frontend)
     - ...and all other payment/email keys.

5. **Deploy**:
   - The service should rebuild with the new Root Directory settings.
   - Once deployed, copy the **Public Domain** (e.g., `snippetstream-api...railway.app`) from the Settings -> Networking section.
   - Update your `BACKEND_URL` variable with this domain.

## Step 2: Deploy the Frontend (Next.js)

1. **Add Another Service**:
   - In the same Railway project (or a new one), click **"New"** button -> **"GitHub Repo"**.
   - Select the **same** repository (`microsaasteam0/Reword`).

2. **Configure Root Directory**:
   - Go to **Settings**.
   - Set **Root Directory** to `/frontend`.
   - Railway auto-detects `package.json` and Next.js.
   - It will automatically run `npm install` and `npm run build`.

3. **Environment Variables**:
   - Go to the **Variables** tab.
   - Copy variables from the **FRONTEND CONFIGURATION** section of your `.env`.
   - **Crucial Variables**:
     - `NEXT_PUBLIC_API_URL`: Set this to the **Public Domain** of your Backend service (from Step 1).
     - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Same as backend.

4. **Deploy**:
   - Railway will build the Next.js app.
   - Once live, you will get a Frontend URL (e.g., `reword-production.up.railway.app`).

## Step 3: Final Linkage

1. **Update Backend Config**:
   - Go back to your **Backend Service** -> **Variables**.
   - Update `FRONTEND_URL` to match your new **Frontend Service URL**.
   - Redeploy the backend.

2. **Verify**:
   - Open your Frontend URL.
   - Try logging in (Google Auth should redirect to Backend -> Google -> Backend -> Frontend).
   - If redirects fail, ensure Google Cloud Console "Authorized API URIs" includes your new Backend URL and "Authorized Redirect URIs" includes `<backend_url>/api/v1/auth/callback`.

## Summary
- **One Repo**: `microsaasteam0/Reword`
- **Two Services**:
    1. **Backend**: Root Directory = `/backend`
    2. **Frontend**: Root Directory = `/frontend`

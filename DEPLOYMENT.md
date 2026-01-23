# flayre.ai Deployment Guide

## 🚀 Backend (Render - Free Tier)

Since you've already deployed before, you can either:

### Option A: Update Existing Deployment
1. Go to your Render dashboard
2. Find your existing service
3. Go to **Settings** → **Build & Deploy**
4. Change **Root Directory** to `backend` (if not set)
5. Verify **Build Command**: `pip install -r requirements.txt`
6. Verify **Start Command**: `gunicorn app.main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
7. Click **Manual Deploy** → **Deploy latest commit**

### Option B: Check Environment Variables
Go to **Environment** tab and ensure these are set:

| Variable | Value |
|----------|-------|
| `ENVIRONMENT` | production |
| `DEBUG` | false |
| `FRONTEND_URL` | https://flayreai.vercel.app |
| `OPENROUTER_API_KEY` | sk-or-v1-5bb76... |
| `VISION_MODEL` | bytedance-seed/seed-1.6-flash |
| `PRIMARY_MODEL` | moonshotai/kimi-k2:free |
| `SUPABASE_URL` | https://yjaggdxrdmdyzkmyvemg.supabase.co |
| `SUPABASE_KEY` | eyJhbGci... (anon key) |
| `SUPABASE_SERVICE_KEY` | eyJhbGci... (service key) |
| `POLAR_ACCESS_TOKEN` | polar_oat_WAngG... |
| `POLAR_ORGANIZATION_ID` | flayre.ai |
| `POLAR_PRODUCT_ID` | 0dc7b073-4ecb-48c6-957d-56a0fa338092 |
| `POLAR_WEBHOOK_SECRET` | polar_whs_Ie59vKhg... |

---

## 🌐 Frontend (Vercel - Free Tier)

### Option A: Update Existing Deployment
1. Go to your Vercel dashboard
2. Find your project (flayreai)
3. Go to **Settings** → **General**
4. Set **Root Directory** to `frontend`
5. Go to **Settings** → **Environment Variables**
6. Add/update these variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | https://social-coach-api.onrender.com |
| `NEXT_PUBLIC_SUPABASE_URL` | https://yjaggdxrdmdyzkmyvemg.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJhbGci... |

7. **Redeploy**: Go to Deployments → Click "..." on latest → Redeploy

---

## 🗄️ Database (Supabase)

Run this SQL in Supabase SQL Editor:
1. Go to https://supabase.com/dashboard
2. Open your project
3. Go to **SQL Editor**
4. Copy contents from `backend/supabase_schema.sql`
5. Run the SQL

---

## 📦 Git Push (Triggers Auto-Deploy)

If both services are connected to your GitHub:

```bash
cd c:\Users\yasee\OneDrive\Documents\final-coach
git add .
git commit -m "flayre.ai v2.0 - Complete rebuild"
git push origin main
```

This will automatically trigger deploys on both Render and Vercel.

---

## ✅ Verification

After deployment:
1. Backend: Visit `https://social-coach-api.onrender.com/health`
2. Frontend: Visit `https://flayreai.vercel.app`
3. Test login/signup flow

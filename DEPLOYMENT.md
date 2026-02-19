# flayre.ai Deployment Guide

## 🚀 Backend → Render (Free Tier)

### Update Existing Deployment

1. Go to your [Render dashboard](https://dashboard.render.com)
2. Find your existing service
3. Go to **Settings** → **Build & Deploy**
4. Set **Root Directory** to `backend`
5. Verify **Build Command:** `pip install -r requirements.txt`
6. Verify **Start Command:** `gunicorn app.main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
7. Click **Manual Deploy** → **Deploy latest commit**

### Environment Variables

Go to the **Environment** tab and ensure these are set:

| Variable | Value |
|----------|-------|
| `ENVIRONMENT` | `production` |
| `DEBUG` | `false` |
| `FRONTEND_URL` | `https://flayreai.vercel.app` |
| `OPENROUTER_API_KEY` | `sk-or-v1-xxx` |
| `PRIMARY_MODEL` | `bytedance-seed/seed-1.6-flash` |
| `FAST_MODEL` | `bytedance-seed/seed-1.6-flash` |
| `VISION_MODEL` | `bytedance-seed/seed-1.6-flash` |
| `SUPABASE_URL` | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | anon key |
| `SUPABASE_SERVICE_KEY` | service role key |
| `SUPABASE_JWT_SECRET` | JWT secret (Settings > API) |

---

## 🌐 Frontend → Vercel (Free Tier)

### Update Existing Deployment

1. Go to your [Vercel dashboard](https://vercel.com/dashboard)
2. Find your project (**flayreai**)
3. Go to **Settings** → **General**
4. Set **Root Directory** to `frontend`
5. Go to **Settings** → **Environment Variables**
6. Add/update these variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://flayre-ai.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |

7. **Redeploy**: Go to Deployments → Click "..." on latest → Redeploy

---

## 🗄️ Database → Supabase

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Open your project
3. Go to **SQL Editor**
4. Copy contents from `backend/supabase_schema.sql`
5. Run the SQL

---

## 📦 Git Push (Triggers Auto-Deploy)

If both services are connected to your GitHub:

```bash
git add .
git commit -m "deploy: update flayre.ai"
git push origin main
```

This triggers automatic deploys on both Render and Vercel.

---

## ✅ Post-Deploy Verification

1. **Backend:** Visit `https://flayre-ai.onrender.com/health` — should return `{"status": "healthy"}`
2. **Frontend:** Visit `https://flayreai.vercel.app`
3. Test the signup → login → analyze flow

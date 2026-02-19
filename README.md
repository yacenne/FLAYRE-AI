# flayre.ai

> AI-powered conversation assistant that analyzes chat screenshots and suggests smart responses.

![Version](https://img.shields.io/badge/version-2.0.0-purple)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🚀 Overview

flayre.ai uses Vision AI to analyze screenshots of chat conversations (WhatsApp, Instagram, Discord, etc.) and generates contextually appropriate response suggestions in three tones:

- **Warm** — Empathetic and supportive
- **Direct** — Clear and straightforward
- **Playful** — Light-hearted and fun

The AI also detects participants, emotional state, relationship dynamics, visual elements (emojis, stickers, GIFs), and urgency level.

## 📁 Project Structure

```
flayre.ai/
├── backend/              # FastAPI Python API
│   ├── app/
│   │   ├── api/          # REST endpoints (auth, analyze, conversations)
│   │   │   └── v1/       # Versioned API routes
│   │   ├── core/         # Security, logging, exceptions
│   │   ├── db/           # Supabase client + repositories
│   │   ├── models/       # Pydantic schemas
│   │   └── services/     # AI pipeline (vision, OCR, context intelligence)
│   ├── requirements.txt
│   ├── render.yaml       # Render deployment config
│   └── supabase_schema.sql
│
├── frontend/             # Next.js 16 web app
│   ├── src/
│   │   ├── app/          # Pages (landing, login, dashboard, analyze, pricing, history, viewer)
│   │   ├── components/   # Shared UI components
│   │   ├── context/      # React context providers
│   │   ├── lib/          # Supabase client, utilities
│   │   └── types/        # TypeScript type definitions
│   └── package.json
│
└── DEPLOYMENT.md         # Deployment guide
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI, Python 3.11+, Pydantic v2 |
| Database | Supabase (Postgres + Auth) |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| State | Zustand |
| Icons | Lucide React |
| AI (Cloud) | OpenRouter (bytedance-seed/seed-1.6-flash) |
| AI (Local) | Ollama (optional, qwen3-vl) |
| Deployment | Render (backend) + Vercel (frontend) |

## 🏃 Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
cp .env.example .env         # Configure your credentials
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # Configure API URL + Supabase
npm run dev
```

### Using the App

1. Navigate to `http://localhost:3000`
2. Sign up or log in
3. Go to **Analyze** (`/analyze`)
4. Upload or paste a chat screenshot
5. Get AI-powered response suggestions in three tones!

## 📡 API Endpoints

All endpoints are prefixed with `/api/v1`.

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register new user |
| POST | `/login` | Authenticate & get tokens |
| POST | `/refresh` | Refresh access token |
| GET | `/me` | Get current user profile |
| PATCH | `/me` | Update user profile |
| POST | `/logout` | Sign out user |

### Analysis (`/api/v1/analyze`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Analyze a chat screenshot |
| GET | `/usage` | Get usage statistics |

### Conversations (`/api/v1/conversations`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List conversations (paginated) |
| GET | `/{id}` | Get conversation with responses |
| DELETE | `/{id}` | Delete a conversation |
| POST | `/{id}/responses/{response_id}/copy` | Mark response as copied |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root — API info |
| GET | `/health` | Health check |

## 🔐 Environment Variables

### Backend (`.env`)

```env
# App
ENVIRONMENT=development          # development | staging | production
DEBUG=false
FRONTEND_URL=http://localhost:3000

# AI — OpenRouter (cloud)
OPENROUTER_API_KEY=sk-or-v1-xxx
PRIMARY_MODEL=bytedance-seed/seed-1.6-flash
FAST_MODEL=bytedance-seed/seed-1.6-flash
VISION_MODEL=bytedance-seed/seed-1.6-flash

# AI — Ollama (optional, local)
USE_OLLAMA=false
OLLAMA_URL=http://localhost:11434
OLLAMA_API_KEY=
OLLAMA_VISION_MODEL=qwen3-vl:latest

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx                 # anon key
SUPABASE_SERVICE_KEY=xxx         # service role key
SUPABASE_JWT_SECRET=xxx          # JWT secret (Settings > API)
```

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

## 🚀 Deployment

### Backend → [Render](https://render.com)

1. Connect your GitHub repo
2. Set **Root Directory** to `backend`
3. Set environment variables in the Render dashboard
4. **Start Command:** `gunicorn app.main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`

### Frontend → [Vercel](https://vercel.com)

1. Connect your GitHub repo
2. Set **Root Directory** to `frontend`
3. Framework preset: **Next.js**
4. Set environment variables in the Vercel dashboard

### Database → [Supabase](https://supabase.com)

1. Create a project on Supabase
2. Run `backend/supabase_schema.sql` in the SQL Editor
3. Copy API keys to both backend and frontend env files

## 💳 Pricing

| Plan | Price | Analyses per Month |
|------|-------|--------------------|
| Free | $0 | 10 |
| Pro | $9.99/month | Unlimited |

## 📄 License

MIT License — see LICENSE file for details.

# flayre.ai

> AI-powered conversation assistant that analyzes chat screenshots and suggests smart responses.

![Version](https://img.shields.io/badge/version-2.0.0-purple)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🚀 Overview

flayre.ai uses Vision AI to analyze screenshots of chat conversations (WhatsApp, Instagram, Discord, etc.) and generates contextually appropriate response suggestions in three tones:

- **Warm** - Empathetic and supportive
- **Direct** - Clear and straightforward  
- **Playful** - Light-hearted and fun

## 📁 Project Structure

```
flayre/
├── backend/          # FastAPI Python API
│   ├── app/
│   │   ├── api/      # REST endpoints
│   │   ├── core/     # Security, logging, exceptions
│   │   ├── db/       # Supabase + repositories
│   │   ├── models/   # Pydantic schemas
│   │   └── services/ # Business logic (AI, billing)
│   └── requirements.txt
│
├── frontend/         # Next.js 14 web app
│   ├── src/app/     # Pages (landing, login, dashboard)
│   └── package.json
│
├── extension/        # Chrome Extension MV3
│   ├── background/   # Service worker
│   ├── popup/        # Extension UI
│   └── manifest.json
│
└── docs/            # Documentation
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI, Python 3.11+ |
| Database | Supabase (Postgres + Auth) |
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Extension | Chrome MV3, Vanilla JS |
| AI | OpenRouter (Vision AI) |
| Payments | Polar.sh |

## 🏃 Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Configure your credentials
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # Configure API URL
npm run dev
```

### Extension

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` folder

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Register new user |
| POST | `/api/v1/auth/login` | Authenticate user |
| GET | `/api/v1/auth/me` | Get current user |
| POST | `/api/v1/analyze` | Analyze screenshot |
| GET | `/api/v1/conversations` | List conversations |
| GET | `/api/v1/billing/subscription` | Get subscription |
| POST | `/api/v1/billing/checkout` | Create checkout |
| POST | `/api/v1/webhooks/polar` | Polar.sh webhooks |

## 🔐 Environment Variables

### Backend (.env)

```env
ENVIRONMENT=production
OPENROUTER_API_KEY=sk-or-v1-xxx
VISION_MODEL=bytedance-seed/seed-1.6-flash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx
SUPABASE_SERVICE_KEY=xxx
POLAR_ACCESS_TOKEN=polar_oat_xxx
POLAR_PRODUCT_ID=xxx
POLAR_WEBHOOK_SECRET=polar_whs_xxx
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=https://your-api.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

## 🚀 Deployment

### Backend (Render)

1. Connect GitHub repo
2. Set environment variables
3. Deploy from `backend/` directory
4. Run command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel)

1. Connect GitHub repo
2. Set environment variables
3. Deploy from `frontend/` directory
4. Framework: Next.js

## 💳 Pricing

| Plan | Price | Features |
|------|-------|----------|
| Free | $0/forever | 10 analyses/month |
| Pro | $9.99/month | Unlimited analyses |

## 📄 License

MIT License - see LICENSE file for details.

# flayre.ai Backend

> FastAPI-powered REST API for AI conversation analysis.

## 🏗️ Architecture

```
app/
├── main.py              # FastAPI app, CORS, exception handlers, health routes
├── config.py            # Pydantic Settings (env-based configuration)
├── api/
│   ├── deps.py          # Dependency injection (DB, repos, auth)
│   └── v1/
│       ├── router.py    # API v1 route aggregator
│       ├── auth.py      # Signup, login, refresh, profile, logout
│       ├── analyze.py   # Screenshot analysis + usage tracking
│       └── conversations.py  # CRUD for conversation history
├── core/
│   ├── security.py      # JWT token handling
│   ├── logging.py       # Structured logging setup
│   └── exceptions.py    # Custom exception classes
├── db/
│   └── repositories/    # Supabase data access (User, Subscription, Conversation)
├── models/              # Pydantic request/response schemas
└── services/
    ├── ai/              # AI analysis orchestration
    ├── ai_client.py     # OpenRouter / Ollama HTTP client
    ├── vision_service.py        # Vision AI screenshot analysis
    ├── context_intelligence.py  # Conversation context extraction
    ├── response_engine.py       # Response suggestion generation
    ├── visual_intelligence.py   # Visual element detection
    ├── frame_processor.py       # Image frame processing
    └── ocr.py                   # OCR text extraction
```

## 🏃 Quick Start

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env         # Then fill in your credentials

# Run development server
uvicorn app.main:app --reload
```

The server starts at `http://localhost:8000`.

## 📡 API Reference

All routes are prefixed with `/api/v1`.

### Authentication — `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/signup` | — | Register a new user |
| `POST` | `/login` | — | Sign in & get tokens |
| `POST` | `/refresh` | — | Refresh access token |
| `GET` | `/me` | ✅ | Get current user profile |
| `PATCH` | `/me` | ✅ | Update user profile |
| `POST` | `/logout` | ✅ | Sign out (invalidate session) |

### Analysis — `/api/v1/analyze`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/` | ✅ | Analyze a chat screenshot (base64) |
| `GET` | `/usage` | ✅ | Get current usage stats & remaining quota |

### Conversations — `/api/v1/conversations`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | ✅ | List conversations (paginated) |
| `GET` | `/{id}` | ✅ | Get conversation with AI responses |
| `DELETE` | `/{id}` | ✅ | Delete a conversation |
| `POST` | `/{id}/responses/{rid}/copy` | ✅ | Mark a response as copied |

### Health (no prefix)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API info |
| `GET` | `/health` | Health check |

## 🤖 AI Pipeline

The analysis endpoint runs a multi-step AI pipeline:

1. **Vision Analysis** — Sends the screenshot to a Vision LLM (bytedance-seed/seed-1.6-flash via OpenRouter, or qwen3-vl via Ollama)
2. **Context Intelligence** — Extracts tone, relationship type, emotional state, urgency, and key topics
3. **Visual Intelligence** — Detects emojis, stickers, GIFs, and images in the screenshot
4. **Response Engine** — Generates 3 response suggestions (Warm, Direct, Playful)

All results are saved to Supabase and the user's usage counter is incremented.

## 🔐 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENVIRONMENT` | — | `development` | `development` / `staging` / `production` |
| `DEBUG` | — | `false` | Enables `/docs` and `/redoc` endpoints |
| `FRONTEND_URL` | — | `http://localhost:3000` | Frontend URL for CORS |
| `OPENROUTER_API_KEY` | ✅ | — | OpenRouter API key |
| `PRIMARY_MODEL` | — | `bytedance-seed/seed-1.6-flash` | Primary LLM model |
| `FAST_MODEL` | — | `bytedance-seed/seed-1.6-flash` | Fast LLM model |
| `VISION_MODEL` | — | `bytedance-seed/seed-1.6-flash` | Vision LLM model |
| `USE_OLLAMA` | — | `false` | Use Ollama instead of OpenRouter |
| `OLLAMA_URL` | — | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_API_KEY` | — | — | Ollama Cloud API key |
| `OLLAMA_VISION_MODEL` | — | `qwen3-vl:latest` | Ollama vision model |
| `SUPABASE_URL` | ✅ | — | Supabase project URL |
| `SUPABASE_KEY` | ✅ | — | Supabase anon key |
| `SUPABASE_SERVICE_KEY` | ✅ | — | Supabase service role key |
| `SUPABASE_JWT_SECRET` | — | — | JWT secret for token verification |
| `FREE_TIER_MONTHLY_LIMIT` | — | `10` | Free plan monthly analyses |
| `PRO_TIER_MONTHLY_LIMIT` | — | `999999` | Pro plan monthly analyses |

## 🚀 Deployment (Render)

The `render.yaml` is pre-configured for deployment:

```bash
# Start command (production)
gunicorn app.main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
```

1. Connect your GitHub repo to [Render](https://render.com)
2. Set **Root Directory** to `backend`
3. Add all required environment variables
4. Deploy

## 🗄️ Database

Run `supabase_schema.sql` in your Supabase SQL Editor to create all required tables.

## API Documentation (Dev Only)

When `DEBUG=true`, interactive docs are available at:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

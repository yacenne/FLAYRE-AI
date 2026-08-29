# flayre.ai Backend

> Production-ready FastAPI REST API for AI-powered conversation screenshot analysis and smart reply generation.

## 🏗️ Architecture

```
backend/
├── app/
│   ├── main.py                  # FastAPI application, CORS, exception handlers, health routes
│   ├── config.py                # Centralized Pydantic settings & environment configuration
│   ├── api/
│   │   ├── deps.py              # Dependency injection (Supabase clients, repositories, auth)
│   │   └── v1/
│   │       ├── router.py        # API v1 router aggregator
│   │       ├── auth.py          # Signup, login, refresh token, user profile, logout
│   │       ├── analyze.py       # Screenshot analysis with Vision AI & usage tracking
│   │       ├── conversations.py # CRUD operations for user conversation history
│   │       └── billing.py       # Razorpay orders, payments verification, subscription status
│   ├── core/
│   │   ├── security.py          # Supabase JWT decoding, token utilities, password hashing
│   │   ├── logging.py           # Structured JSON and colored console logging
│   │   └── exceptions.py        # Custom API exception hierarchy
│   ├── db/
│   │   ├── supabase.py          # Singleton Supabase client instances (anon & admin)
│   │   └── repositories/        # Repository pattern for database access (Users, Subscriptions, Conversations)
│   ├── models/                  # Pydantic v2 validation and response schemas
│   │   ├── user.py              # User authentication & profile schemas
│   │   ├── conversation.py      # Screenshot analysis & conversation schemas
│   │   └── billing.py           # Razorpay checkout & subscription schemas
│   └── services/
│       └── ai/                  # AI service layer (Vision LLM & prompt engineering)
│           ├── prompts.py       # Structured JSON prompts for conversation analysis
│           └── vision.py        # OpenRouter / Ollama Vision AI orchestrator
├── .env.example                 # Template environment variables configuration
├── Procfile                     # Process file for Heroku / containerized platforms
├── render.yaml                  # Infrastructure-as-code for Render.com deployment
├── requirements.txt             # Clean, pinned Python dependencies
└── supabase_schema.sql          # PostgreSQL schema and RLS policies for Supabase
```

## 🏃 Quick Start

### 1. Set Up Virtual Environment

```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your Supabase, OpenRouter/Ollama, and Razorpay credentials
```

### 4. Start Development Server

```bash
uvicorn app.main:app --reload
```

The API will be running at `http://localhost:8000`.

---

## 📡 API Reference

All application endpoints are versioned and prefixed with `/api/v1`.

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/signup` | — | Register a new user |
| `POST` | `/login` | — | Sign in and obtain access & refresh tokens |
| `POST` | `/refresh` | — | Refresh access token |
| `GET` | `/me` | 🔒 | Get current user profile |
| `PATCH` | `/me` | 🔒 | Update profile details |
| `POST` | `/logout` | 🔒 | Invalidate session |

### Screenshot Analysis (`/api/v1/analyze`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/` | 🔒 | Analyze chat screenshot (Base64) with Vision AI |
| `GET` | `/usage` | 🔒 | Get current monthly analysis quota and usage |

### Conversations (`/api/v1/conversations`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 🔒 | Get paginated list of analyzed conversations |
| `GET` | `/{id}` | 🔒 | Get single conversation with full AI suggestions |
| `DELETE` | `/{id}` | 🔒 | Delete a conversation |
| `POST` | `/{id}/responses/{rid}/copy` | 🔒 | Record copied response suggestion (analytics) |

### Billing & Subscriptions (`/api/v1/billing`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/subscription` | 🔒 | Get active subscription status and usage limits |
| `POST` | `/create-order` | 🔒 | Create a Razorpay checkout order for Pro plan |
| `POST` | `/verify` | 🔒 | Verify HMAC payment signature and upgrade to Pro |
| `POST` | `/checkout` | 🔒 | Legacy checkout session endpoint |

### Health & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API name, version, and running status |
| `GET` | `/health` | Health check endpoint for uptime monitors |

---

## 🤖 AI Vision Pipeline

1. **Vision Analysis**: Processes chat screenshot through a Vision LLM (`bytedance-seed/seed-1.6-flash` on OpenRouter, or `qwen3-vl` on Ollama).
2. **Context & Emotion Detection**: Extracts conversation tone, emotional stance, urgency, key topics, and relationship dynamics.
3. **Visual Intelligence**: Identifies emojis, stickers, GIFs, images, and reactions within the chat bubbles.
4. **Tri-Tone Response Generation**: Produces 3 distinct reply options:
   - **Warm**: Empathetic, supportive, friendly
   - **Direct**: Concise, clear, to-the-point
   - **Playful**: Light-hearted, witty, fun
5. **Persistence & Quota Tracking**: Atomically saves the session to Supabase and updates monthly quotas.

---

## 🔐 Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENVIRONMENT` | No | `development` | `development` / `staging` / `production` |
| `DEBUG` | No | `false` | Enables `/docs` (Swagger UI) and `/redoc` |
| `FRONTEND_URL` | No | `http://localhost:3000` | Frontend origin for CORS |
| `OPENROUTER_API_KEY` | Yes | — | API key for OpenRouter AI models |
| `VISION_MODEL` | No | `bytedance-seed/seed-1.6-flash` | Vision model identifier |
| `USE_OLLAMA` | No | `false` | Enable local or cloud Ollama inference |
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_KEY` | Yes | — | Supabase anonymous public key |
| `SUPABASE_SERVICE_KEY` | Yes | — | Supabase service role key |
| `SUPABASE_JWT_SECRET` | No | — | Supabase project JWT secret (Base64 format) |
| `RAZORPAY_KEY_ID` | No | — | Razorpay API Key ID |
| `RAZORPAY_KEY_SECRET` | No | — | Razorpay API Key Secret |

---

## 🚀 Deployment

The backend is pre-configured for Render.com via [`render.yaml`](file:///c:/Users/yasee/OneDrive/Documents/FLAYREL/backend/render.yaml) and container platforms via [`Procfile`](file:///c:/Users/yasee/OneDrive/Documents/FLAYREL/backend/Procfile).

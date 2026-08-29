# flayre.ai Frontend

> Next.js 16 web application for AI-powered conversation analysis.

## 🏗️ Architecture

```
src/
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # Landing page
│   ├── layout.tsx        # Root layout & global providers
│   ├── globals.css       # Global styles & Tailwind v4 theme
│   ├── login/            # Authentication page (sign in & sign up)
│   ├── dashboard/        # User dashboard & analytics
│   ├── analyze/          # Screenshot upload & AI analysis
│   ├── pricing/          # Pricing plans & Razorpay checkout
│   ├── history/          # Conversation history & pagination
│   ├── auth/callback/    # OAuth redirect handler
│   ├── error.tsx         # Styled error boundary
│   └── global-error.tsx  # Global root error handler
├── context/              # React AuthContext (Supabase auth & session)
├── lib/                  # Unified typed API client & Supabase helpers
└── types/                # TypeScript type definitions
```

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16 | React framework (App Router) |
| React | 19 | UI library |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 4 | Styling (v4 `@theme` tokens) |
| Supabase JS | 2.x | Auth & database client |
| Supabase SSR | 0.8+ | Server-side auth helpers |
| Lucide React | — | Icon library |

## 🏃 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📄 Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, features, how it works, and CTA |
| `/login` | Sign up / sign in with email & password or Google |
| `/dashboard` | User dashboard with usage stats, recent analyses, and plan status |
| `/analyze` | Upload or paste a screenshot for AI conversation analysis |
| `/pricing` | Free vs Pro plan comparison with Razorpay upgrade flow |
| `/history` | Paginated list of past conversation analyses |
| `/auth/callback` | OAuth redirect and token session exchange handler |

## 🔐 Environment Variables

Create `.env.local` from `.env.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (local: `http://localhost:8000`, prod: `https://flayre-ai.onrender.com`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |

## 📦 Scripts

```bash
npm run dev      # Start dev server (hot reload)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🚀 Deployment (Vercel)

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Framework preset: **Next.js**
4. Add environment variables in the Vercel dashboard
5. Deploy — automatic deploys trigger on push to `main`

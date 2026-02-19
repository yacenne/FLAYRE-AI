# flayre.ai Frontend

> Next.js 16 web application for AI-powered conversation analysis.

## 🏗️ Architecture

```
src/
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # Landing page
│   ├── layout.tsx        # Root layout
│   ├── globals.css       # Global styles & Tailwind v4 theme
│   ├── login/            # Authentication page
│   ├── dashboard/        # User dashboard
│   ├── analyze/          # Screenshot upload & AI analysis
│   ├── pricing/          # Pricing plans
│   ├── history/          # Conversation history
│   ├── viewer/           # Conversation detail viewer
│   ├── api/              # API route handlers
│   ├── error.tsx         # Error boundary
│   └── global-error.tsx  # Global error boundary
├── components/           # Shared UI components
├── context/              # React context providers
├── lib/                  # Supabase client, utilities
└── types/                # TypeScript type definitions
```

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16 | React framework (App Router) |
| React | 19 | UI library |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 4 | Styling (v4 with `@theme` directive) |
| Supabase JS | 2.x | Auth & database client |
| Supabase SSR | 0.8+ | Server-side auth helpers |
| Zustand | 5.x | State management |
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
| `/` | Landing page with hero, features, and CTA |
| `/login` | Sign up / sign in with email & password |
| `/dashboard` | User dashboard with usage stats |
| `/analyze` | Upload or paste a screenshot for AI analysis |
| `/pricing` | Free and Pro plan comparison |
| `/history` | Paginated list of past analyses |
| `/viewer` | Detailed view of a single analysis with responses |

## 🔐 Environment Variables

Create `.env.local` from `.env.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (local: `http://localhost:8000`, prod: Render URL) |
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

# Social Coach - AI Conversation Assistant

## Core Feature
Chrome extension + web app that analyzes conversations and suggests smart responses.

## User Flow
1. User reads messages on WhatsApp/Instagram/Discord
2. Clicks extension icon
3. Extension reads messages from DOM (no screenshot)
4. Sends to backend API
5. AI analyzes conversation context, tone, relationship
6. Returns 3 response suggestions (warm, direct, playful)
7. User copies preferred response

## Tech Stack
- **Backend:** FastAPI, Python 3.11+
- **Database:** Supabase (Postgres + Auth)
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Extension:** Chrome Extension MV3, vanilla JS
- **AI:** OpenRouter (Llama 3.2 Vision) or Claude
- **Payments:** Polar.sh

## Features
### MVP (Free Tier)
- Auth (email/password)
- 10 analyses per month
- Basic AI responses
- Chrome extension

### Pro Tier ($9.99/month)
- Unlimited analyses
- Advanced AI responses
- Conversation history
- Priority support

## Platforms to Support
- WhatsApp Web
- Instagram DMs
- Discord
- (Extensible to others later)

## Design
- Modern, clean UI
- Purple/blue gradient theme
- Mobile responsive
- Fast loading (<2s)

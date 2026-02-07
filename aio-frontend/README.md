# AI Optimization Tool - Frontend

Next.js frontend for AI Brand Visibility Optimization Tool.

## Features

- 3-step setup wizard (license → user → API keys)
- Dashboard with AI model overview
- Brand management
- API keys management with encryption status
- Visibility scanning across 5 AI models
- Website optimization analysis
- Sentiment analysis with insights
- Real-time scan progress
- Scan history

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Supabase Client

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

3. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.example` for required variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_BACKEND_URL

## Build for Production

```bash
npm run build
npm start
```

## Deployment

Deploy to Vercel. See `DEPLOYMENT_GUIDE.md` in root directory.

```bash
vercel --prod
```

## Project Structure

```
app/
├── dashboard/          # Main dashboard
│   ├── brand/         # Brand management
│   ├── api-keys/      # API keys management
│   ├── visibility/    # Visibility scans
│   ├── website-scan/  # Website analysis
│   └── sentiment/     # Sentiment analysis
├── setup/             # Setup wizard
components/
├── Setup/             # Setup wizard components
└── Dashboard/         # Dashboard components
lib/
└── supabase.ts        # Database client
types/
└── index.ts           # TypeScript types
```

## License

Commercial - See LICENSE file

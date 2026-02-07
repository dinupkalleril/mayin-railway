# AI Optimization Tool - Backend

Node.js backend for AI Brand Visibility Optimization Tool.

## Features

- License validation and activation
- User authentication (bcrypt)
- Encrypted API key storage
- Integration with 5 AI models (ChatGPT, Claude, Gemini, Perplexity, Grok)
- Brand visibility scanning (100-1000 prompts)
- Website optimization analysis
- Sentiment analysis with web search
- Background job processing

## Tech Stack

- Node.js + Express
- Supabase (PostgreSQL)
- OpenAI, Anthropic, Google AI SDKs
- Axios, Bcrypt, Crypto

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Run development server:
```bash
npm run dev
```

## Environment Variables

See `.env.example` for required variables:
- SUPABASE_URL
- SUPABASE_SERVICE_KEY
- INTERNAL_API_KEY
- ENCRYPTION_KEY

## API Endpoints

- `POST /api/license/validate` - Validate license key
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/api-keys` - Save API keys
- `POST /api/brand` - Save brand info
- `POST /api/visibility/scan` - Start visibility scan
- `POST /api/website-scan/scan` - Start website scan
- `POST /api/sentiment/analyze` - Start sentiment analysis

## Deployment

Deploy to Vercel or Railway. See `DEPLOYMENT_GUIDE.md` in root directory.

## License

Commercial - See LICENSE file

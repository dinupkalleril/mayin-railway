# Claude Code Reference - AI Optimization Tool (Frontend)

> This file provides context for Claude Code AI assistant in future sessions.

## Project Overview

**AI Optimization Tool** - Frontend for brand visibility monitoring across AI models.

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Express.js at `../AIO_backEnd`

### Folder Structure
```
/Users/dinoopkallerilb/Mayin_project/AIO/
├── AIO_backEnd/    # Express backend
└── AIO_frontEnd/   # This frontend
```

## Project Structure

```
AIO_frontEnd/
├── app/
│   ├── page.tsx              # Landing/redirect
│   ├── login/page.tsx        # Login page
│   ├── setup/page.tsx        # Initial setup wizard
│   └── dashboard/
│       ├── page.tsx          # Dashboard home
│       ├── visibility/page.tsx   # Visibility scans
│       ├── website-scan/page.tsx # Website analysis
│       ├── sentiment/page.tsx    # Sentiment analysis
│       ├── action-plan/page.tsx  # Action plans
│       ├── brand/page.tsx        # Brand settings
│       └── api-keys/page.tsx     # API key management
├── components/
│   ├── ui/                   # Reusable UI components
│   ├── Dashboard/
│   │   └── VisibilityScan/
│   │       ├── ScanForm.tsx      # Scan input form
│   │       ├── ScanResults.tsx   # Live results display
│   │       └── ScanHistory.tsx   # Past scans list
│   └── Setup/                # Setup wizard steps
├── public/
│   └── ai-logos/             # AI provider logos
└── styles/
    └── globals.css           # Global styles
```

## Key Features

### Visibility Scan Flow
1. User selects AI provider (ChatGPT, Claude, Gemini, Perplexity, Grok)
2. User selects specific model version
3. User enters brand info or uses saved brand
4. User selects prompt count (100-1000)
5. Scan runs in background, frontend polls for updates
6. Results show visibility score, mentions, competitors

### Authentication
- Uses localStorage for session:
  - `userId` - User's UUID from database
  - `username` - Display name
- Set during login/setup
- Checked on dashboard pages

## Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

For production (Railway/Vercel):
```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.railway.app
```

## AI Model Versions (Updated December 2025)

Defined in `app/dashboard/visibility/page.tsx`:

```typescript
const AI_MODEL_VERSIONS = {
  chatgpt: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  claude: ['claude-sonnet-4-5-20250929', 'claude-haiku-4-5-20251001', 'claude-opus-4-5-20251101'],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'],
  perplexity: ['sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-reasoning-pro'],
  grok: ['grok-2-1212', 'grok-2-vision-1212', 'grok-3-mini']
};
```

**Note**: Models are now managed dynamically in the API Keys page. Users can add/edit/remove models without code changes.

## Recent Changes Log

### December 2025 - Dynamic AI Model Management
**Added ability to manage AI models from UI**

Changes made:
1. API Keys page (`app/dashboard/api-keys/page.tsx`):
   - Added "Manage AI Models" section
   - Provider tabs to switch between AI providers
   - Edit/Delete buttons for each model
   - "Add New Model" form
   - Auto-seeds default models on first visit

2. Visibility page (`app/dashboard/visibility/page.tsx`):
   - Now fetches models from `/api/models/user/:userId`
   - Falls back to hardcoded list if API fails
   - Auto-seeds defaults if user has no models

**User Flow:**
1. Go to Dashboard > API Keys
2. Scroll to "Manage AI Models" section
3. Click provider tab (ChatGPT, Claude, etc.)
4. Edit existing models or add new ones
5. Changes reflect immediately in Visibility Scan dropdown

### December 2025 - Progress Tracking Feature
**Added visibility progress chart to dashboard**

Changes made:
1. Added `recharts` library to package.json
2. Created `components/Dashboard/ProgressChart.tsx`
   - Line chart showing average visibility score over time
   - Custom Railway theme styling
   - Trend badge (up/down/stable)
   - Summary stats below chart
3. Added chart to `app/dashboard/page.tsx` after Quick Stats section

### December 2025 - Multi-Model Support
- Added model version selector dropdown for each AI provider
- Updated ScanForm to pass `modelVersion` to backend
- Updated ScanHistory to filter by model version
- Added model version display in scan results

## Common Issues & Solutions

### "Failed to create scan"
**Check**:
1. Is `userId` in localStorage? (DevTools > Application > Local Storage)
2. Is backend running and accessible?
3. Does backend have `model_version` column? (Run migration)

### Blank dashboard
**Cause**: Not logged in
**Solution**: Redirect to `/login`

### API calls failing
**Check**: `NEXT_PUBLIC_BACKEND_URL` environment variable is set correctly

## UI Theme

Uses custom "Railway" dark theme:
- `railway-black`: #0a0a0b (background)
- `railway-dark`: #111113 (elevated bg)
- `railway-card`: #161618 (cards)
- `railway-white`: #fafafa (text)
- `railway-gray`: #a1a1aa (secondary text)
- `primary-500`: #8b5cf6 (accent purple)

## Running the Project

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Start production
npm start
```

## Notes for Future Sessions

1. **Check CLAUDE.md** in both frontend and backend for context
2. **Model changes**: Users manage models via API Keys page UI (no code changes needed)
3. **New features**: Follow existing component patterns in `components/Dashboard/`
4. **Styling**: Use Tailwind with railway-* color classes
5. **State**: Use localStorage for auth, React state for UI
6. **Models API**: `/api/models/user/:userId` for fetching, POST/PUT/DELETE for CRUD

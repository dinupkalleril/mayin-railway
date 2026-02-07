# Claude Code Reference - AI Optimization Tool (Backend)

> This file provides context for Claude Code AI assistant in future sessions.

## Project Overview

**AI Optimization Tool** - A full-stack SaaS platform that helps brands monitor their visibility across 5 major AI models (ChatGPT, Claude, Gemini, Perplexity, Grok).

### Tech Stack
- **Backend**: Express.js with Node.js (ES Modules)
- **Database**: PostgreSQL on Railway
- **Frontend**: Next.js 14 (located at `../AIO_frontEnd`)

### Folder Structure
```
/Users/dinoopkallerilb/Mayin_project/AIO/
├── AIO_backEnd/    # This backend
└── AIO_frontEnd/   # Next.js frontend
```

## Project Structure

```
AIO_backEnd/
├── index.js              # Express server entry point (port 3001)
├── config/
│   └── db.js             # PostgreSQL connection pool
├── routes/
│   ├── auth.js           # Login/register endpoints
│   ├── license.js        # License validation
│   ├── apiKeys.js        # Encrypted API key storage
│   ├── brand.js          # Brand information CRUD
│   ├── models.js         # Dynamic AI model management
│   ├── visibility.js     # Visibility scan endpoints
│   ├── websiteScan.js    # Website AI-friendliness scan
│   ├── sentiment.js      # Sentiment analysis
│   └── actionPlan.js     # AI action plan generation
├── services/
│   ├── aiModels.js       # AI provider integrations (OpenAI, Anthropic, Google, etc.)
│   ├── visibilityScanner.js  # Background scan execution
│   ├── promptGenerator.js    # Test prompt generation
│   └── actionPlanGenerator.js
├── supabase_schema.sql   # Database schema
├── setup-db.js           # Initial database setup
└── run-migration.js      # Schema migrations
```

## Database (Railway PostgreSQL)

**Connection**: Set via `DATABASE_URL` in `.env`

### Key Tables
- `users` - User accounts (username, password_hash, license_key)
- `licenses` - License keys
- `api_keys` - Encrypted AI provider API keys per user
- `brands` - Brand information per user
- `visibility_scans` - Scan results with prompts/answers
- `website_scans` - Website AI-friendliness analysis
- `sentiment_analyses` - Brand sentiment analysis
- `action_plans` - Generated action plans
- `user_models` - Per-user AI model configurations (NEW)

## Recent Changes Log

### December 2025 - Dynamic AI Model Management
**Added ability for users to add, edit, and remove AI models**

Users can now manage their own model list instead of relying on hardcoded values. This allows:
- Adding new models when AI providers release them
- Editing model IDs when they change
- Removing obsolete or unused models

**New Files:**
- `routes/models.js` - CRUD endpoints for model management

**New Endpoints:**
- `GET /api/models/user/:userId` - Get user's models (grouped by provider)
- `POST /api/models/user/:userId/seed` - Seed default models for new user
- `POST /api/models` - Add a new model
- `PUT /api/models/:modelId` - Update a model
- `DELETE /api/models/:modelId` - Delete a model

**Database Migration:**
```bash
node run-migration.js  # Creates user_models table
```

**Frontend Changes:**
- API Keys page now includes "Manage AI Models" section
- Visibility page fetches models dynamically from user's configuration
- Models auto-seed on first visit if user has none

### December 2025 - Route Ordering Fix
**Fixed action plan page infinite loading issue**

Root cause: In `routes/actionPlan.js`, the wildcard route `/:planId` was defined before `/user/:userId` and `/summary/:userId`. Express matches routes in order, so requests to `/user/123` were matching `/:planId` with `planId='user'`, causing database query failures.

Fix: Reordered routes in `actionPlan.js`:
1. `/user/:userId` - now comes first
2. `/summary/:userId` - now comes second
3. `/:planId` - wildcard route now comes last

**Important**: Always define specific routes BEFORE wildcard routes in Express.

### December 2025 - Action Plan History Feature
**Added ability to view and select past action plans**

Changes made:
1. Frontend `app/dashboard/action-plan/page.tsx`:
   - Added plan history section showing all saved plans
   - Users can click to view any past plan
   - Fixed JSON parsing for plan_data (handles both string and object)
   - Generate button always visible to create new plans
2. Backend endpoint `GET /api/action-plan/user/:userId` already existed for fetching history

### December 2025 - Progress Tracking Feature
**Added visibility progress tracking chart to dashboard**

Changes made:
1. Added `GET /api/visibility/progress/:userId` endpoint to `routes/visibility.js`
   - Returns daily aggregated scores with trend calculation
   - Query params: `days` (default 30, range 7-365)
2. Created `ProgressChart.tsx` component in frontend
   - Uses Recharts library for line chart visualization
   - Shows average score over time with trend badge
   - Includes summary stats (avg score, total scans, days with scans)
3. Added chart to main dashboard page after Quick Stats

**New Endpoint Response:**
```json
{
  "success": true,
  "data": [{ "date": "2025-12-01", "averageScore": 72, "scanCount": 5 }],
  "summary": { "totalScans": 45, "overallAverage": 71, "trend": "up", "trendPercentage": 5.2 }
}
```

### December 2025 - Improved Competitor Extraction
**Fixed competitor detection showing generic words instead of brand names**

Changes made to `services/aiModels.js` - `extractCompetitors()` function:
1. Expanded stopwords list from ~30 to 200+ words (adjectives, nouns, verbs, etc.)
2. Added excluded phrases list (common non-brand phrases)
3. Added pattern matching for "brands like X, Y, Z" lists
4. Added filtering for words ending in common suffixes (-ing, -tion, -ment, etc.)
5. Better validation for abbreviations (IBM, AWS) vs random caps

### December 2025 - Multi-Model Support
**Added support for specific model versions across all AI providers**

Changes made:
1. Added `model_version` column to `visibility_scans` table
2. Updated `AIModelService` class to accept `modelVersion` parameter
3. Frontend now shows model version selector for each provider

**Migration required for existing databases:**
```bash
node run-migration.js
```

### Available AI Models (Updated December 2025)
```javascript
const AI_MODELS = {
  chatgpt: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  claude: ['claude-sonnet-4-5-20250929', 'claude-haiku-4-5-20251001', 'claude-opus-4-5-20251101', 'claude-sonnet-4-20250514'],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'],
  perplexity: ['sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-reasoning-pro'],
  grok: ['grok-2-1212', 'grok-2-vision-1212', 'grok-3-mini']
};
```

## Common Issues & Solutions

### "relation action_plans does not exist"
**Cause**: `action_plans` table not created in database
**Solution**: Run `node run-migration.js`

### "Failed to create scan"
**Cause**: Usually missing `model_version` column in database
**Solution**: Run `node run-migration.js`

### API Key errors
**Cause**: User hasn't configured API key for selected AI provider
**Solution**: Go to Dashboard > API Keys and add the required key

### Foreign key constraint errors
**Cause**: Invalid `user_id` being passed
**Solution**: Check if user is logged in (userId in localStorage)

## API Endpoints

### Visibility Scans
- `POST /api/visibility/scan` - Start new scan
- `GET /api/visibility/scan/:scanId` - Get scan status/results
- `GET /api/visibility/scans/:userId` - Get all user scans
- `GET /api/visibility/latest/:userId` - Get latest scan per AI model
- `GET /api/visibility/progress/:userId` - Get progress data for charts (query: `days`)
- `DELETE /api/visibility/scan/:scanId` - Delete scan

### Authentication
- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - Login (returns userId)

### API Keys
- `POST /api/api-keys` - Save encrypted API keys
- `GET /api/api-keys/:userId` - Get masked keys
- `DELETE /api/api-keys/:userId` - Delete keys

## Environment Variables

```env
DATABASE_URL=postgresql://...  # Railway PostgreSQL connection string
NODE_ENV=development          # or 'production'
ENCRYPTION_KEY=...            # For API key encryption (optional, has default)
PORT=3001                     # Server port
```

## Running the Project

```bash
# Install dependencies
npm install

# Setup database (first time only)
node setup-db.js

# Run migrations (after schema changes)
node run-migration.js

# Start server
npm start
# or for development
npm run dev
```

## Frontend Reference

Located at `../AIO_frontEnd`

**Environment**: Needs `NEXT_PUBLIC_BACKEND_URL` pointing to this backend

Key files:
- `app/dashboard/visibility/page.tsx` - Visibility scan UI
- `components/Dashboard/VisibilityScan/ScanForm.tsx` - Scan form
- `components/Dashboard/VisibilityScan/ScanResults.tsx` - Results display

## Notes for Future Sessions

1. **Always check CLAUDE.md first** for project context
2. **Database migrations**: When adding columns, create migration in `run-migration.js`
3. **AI model changes**: Update both `services/aiModels.js` and frontend `AI_MODEL_VERSIONS`
4. **User authentication**: Uses localStorage for userId/username on frontend

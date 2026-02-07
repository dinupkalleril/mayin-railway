# Docker Deployment Guide

## Overview

This application is designed for Docker deployment with **automatic model configuration updates**. This means customers don't need to rebuild containers when AI model names change.

## Architecture for Docker

```
┌─────────────────────────────────────────────────────┐
│  Docker Container                                   │
│  ┌───────────────────────────────────────────────┐ │
│  │ Application Code (Immutable)                  │ │
│  └───────────────────────────────────────────────┘ │
│                       ↓                             │
│  ┌───────────────────────────────────────────────┐ │
│  │ Config Priority (Runtime)                     │ │
│  │ 1. Remote URL ← https://your-domain.com       │ │
│  │ 2. ENV variables ← docker-compose.yml         │ │
│  │ 3. Volume mount ← ./config/models.config.json │ │
│  │ 4. Embedded defaults ← Fallback               │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Create `docker-compose.yml`

```yaml
version: '3.8'

services:
  aio-backend:
    image: your-company/aio-backend:1.0.0
    container_name: aio-backend
    restart: unless-stopped

    ports:
      - "3001:3001"

    volumes:
      # Config file (editable without rebuilding)
      - ./config/models.config.json:/app/config/models.config.json:ro
      # Database data (persistent)
      - ./data:/app/data

    environment:
      # Database
      - DATABASE_URL=postgresql://user:pass@postgres:5432/aiodb

      # Security
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - NODE_ENV=production

      # Remote Model Updates (RECOMMENDED)
      - MODEL_CONFIG_UPDATE_URL=https://updates.your-company.com/api/models.json
      - MODEL_CONFIG_AUTO_UPDATE=true

      # Optional: Override specific models via ENV
      # - MODEL_ALIAS_GEMINI_PREMIUM=gemini-2.5-pro,gemini-2.0-flash

    depends_on:
      - postgres

  aio-frontend:
    image: your-company/aio-frontend:1.0.0
    container_name: aio-frontend
    restart: unless-stopped

    ports:
      - "3000:3000"

    environment:
      - NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

    depends_on:
      - aio-backend

  postgres:
    image: postgres:15-alpine
    container_name: aio-postgres
    restart: unless-stopped

    volumes:
      - postgres_data:/var/lib/postgresql/data

    environment:
      - POSTGRES_DB=aiodb
      - POSTGRES_USER=aiouser
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

volumes:
  postgres_data:
```

### 2. Create Local Config Directory

```bash
mkdir -p config
cp AIO_backEnd/config/models.config.json ./config/
```

### 3. Create `.env` File

```bash
ENCRYPTION_KEY=your-32-char-secret-key-here
POSTGRES_PASSWORD=secure-db-password
```

### 4. Start Services

```bash
docker-compose up -d
```

## Model Update Strategies

### Strategy 1: Remote Updates (Recommended) ⭐

**How it works:**
- Application checks `MODEL_CONFIG_UPDATE_URL` on startup
- Fetches latest model configuration
- Uses remote config if version is newer
- Falls back to local if remote unavailable

**Setup:**
1. Host `models.json` on your domain
2. Set `MODEL_CONFIG_UPDATE_URL` in docker-compose.yml
3. Update the remote file when models change
4. Customers get updates automatically on container restart

**Example remote endpoint:**
```bash
curl https://updates.your-company.com/api/models.json
```

Returns:
```json
{
  "version": "1.1.0",
  "providers": {
    "google": {
      "displayName": "Gemini",
      "company": "Google",
      "aliases": {
        "premium": {
          "label": "Gemini Premium",
          "description": "Most capable",
          "models": ["gemini-2.5-pro", "gemini-2.0-flash"]
        }
      }
    }
  },
  "legacyMapping": {...}
}
```

**Benefits:**
- ✅ No customer action needed
- ✅ Instant updates across all deployments
- ✅ Works offline (falls back to local)
- ✅ Can push urgent fixes (model deprecations)

### Strategy 2: Volume-Mounted Config

**How it works:**
- Config file mounted from host machine
- Customer edits `./config/models.config.json`
- Restart container to apply changes

**Usage:**
```bash
# Edit config on host
nano ./config/models.config.json

# Restart to apply
docker-compose restart aio-backend
```

**When to use:**
- Air-gapped deployments
- Customers who want full control
- Remote updates disabled

### Strategy 3: Environment Variable Overrides

**How it works:**
- Override specific models via ENV variables
- Useful for testing or custom deployments

**Example:**
```yaml
environment:
  # Override Gemini premium models
  - MODEL_ALIAS_GEMINI_PREMIUM=gemini-2.5-pro,gemini-2.0-flash

  # Override Claude fast models
  - MODEL_ALIAS_CLAUDE_FAST=claude-haiku-4-5-20251001

  # Change model labels
  - MODEL_LABEL_GEMINI_PREMIUM=Custom Gemini Pro
```

**Pattern:**
- `MODEL_ALIAS_{PROVIDER}_{TIER}=model1,model2`
- `MODEL_LABEL_{PROVIDER}_{TIER}=Display Name`

## Handling Model Deprecations

### Example: Gemini 1.5 → 2.5 Migration

**What happened:**
- April 29, 2025: Gemini 1.5 models deprecated
- Customers using old config: Scans fail ❌

**Solution with remote updates:**
1. Update `https://updates.your-company.com/api/models.json`
2. Bump version: `1.0.0` → `1.1.0`
3. Replace `gemini-1.5-*` with `gemini-2.5-*`
4. Customer restarts container → Gets new config ✅

**Solution without remote updates:**
1. Email customers about deprecation
2. Provide updated `models.config.json`
3. Customer replaces file and restarts

## Configuration Priority

The application loads config in this order:

```
1. Remote URL (if MODEL_CONFIG_UPDATE_URL set)
   ↓ (if fails or disabled)
2. Environment Variable (MODEL_CONFIG_JSON)
   ↓ (if not set)
3. Volume Mount (./config/models.config.json)
   ↓ (if not found)
4. Embedded Defaults (inside container)
```

## Disabling Remote Updates

For air-gapped or privacy-sensitive deployments:

```yaml
environment:
  - MODEL_CONFIG_AUTO_UPDATE=false  # Disable remote checks
```

## Monitoring & Logs

Check if remote updates are working:

```bash
docker-compose logs aio-backend | grep ModelConfig
```

Expected output:
```
[ModelConfig] Checking for remote config at: https://updates.your-company.com/api/models.json
[ModelConfig] ✅ Remote config fetched successfully (version 1.1.0)
[ModelConfig] 🔄 Updating to remote config version 1.1.0
```

Or if using local config:
```
[ModelConfig] Loaded from config/models.config.json
[ModelConfig] Local config is up to date (1.0.0)
```

## Building Your Own Image

### Dockerfile Example

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start application
CMD ["npm", "start"]
```

### Build and Tag

```bash
# Build backend
docker build -t your-company/aio-backend:1.0.0 ./AIO_backEnd

# Build frontend
docker build -t your-company/aio-frontend:1.0.0 ./AIO_frontEnd

# Save as tar for distribution
docker save your-company/aio-backend:1.0.0 | gzip > aio-backend-1.0.0.tar.gz
docker save your-company/aio-frontend:1.0.0 | gzip > aio-frontend-1.0.0.tar.gz
```

## Customer Distribution

### Option 1: Docker Registry (Recommended)

```bash
# Private registry
docker push your-company/aio-backend:1.0.0

# Customer pulls
docker pull your-company/aio-backend:1.0.0
```

### Option 2: Tar Files

```bash
# You send: aio-backend-1.0.0.tar.gz (one-time purchase)

# Customer loads:
docker load < aio-backend-1.0.0.tar.gz
docker-compose up -d
```

### Option 3: Docker Hub (Public)

```bash
docker tag your-company/aio-backend:1.0.0 dockerhub-username/aio-backend:1.0.0
docker push dockerhub-username/aio-backend:1.0.0
```

## Support Documentation for Customers

### "Models Not Working" Troubleshooting

**Error:** `All models failed for alias "gemini.premium"`

**Solutions:**

1. **Check remote updates (if enabled):**
   ```bash
   docker-compose logs aio-backend | grep "Remote config"
   ```

2. **Manually update config:**
   ```bash
   # Download latest config
   curl https://updates.your-company.com/api/models.json -o ./config/models.config.json

   # Restart
   docker-compose restart aio-backend
   ```

3. **Override via ENV:**
   ```yaml
   # In docker-compose.yml
   environment:
     - MODEL_ALIAS_GEMINI_PREMIUM=gemini-2.5-pro
   ```

4. **Contact support** with logs

## Best Practices

### For You (Vendor):

1. ✅ **Host a reliable remote config endpoint**
2. ✅ **Version your configs** (use semver)
3. ✅ **Test before pushing** remote updates
4. ✅ **Notify customers** about major model changes
5. ✅ **Keep fallback chains diverse** (mix old and new models)

### For Customers:

1. ✅ **Enable remote updates** (default)
2. ✅ **Mount config as volume** for easy edits
3. ✅ **Monitor logs** for deprecation warnings
4. ✅ **Keep ENV variables** for quick overrides
5. ✅ **Backup config files** before editing

## Migration from Non-Docker

If customers were using non-Docker setup:

```bash
# Export current config
cp AIO_backEnd/config/models.config.json ./config/

# Create docker-compose.yml (use template above)

# Start with Docker
docker-compose up -d

# Migrate database (if needed)
docker-compose exec postgres pg_restore -d aiodb < backup.sql
```

## Summary

Your Docker architecture now supports:

- ✅ **Zero-downtime model updates** via remote config
- ✅ **Offline operation** with local config fallback
- ✅ **Customer flexibility** via ENV overrides
- ✅ **No rebuilds required** for model changes
- ✅ **One-time purchase model** with ongoing support

This solves the "Gemini 1.5 deprecation" problem permanently!

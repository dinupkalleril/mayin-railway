# License System - Quick Start Guide

## Setup (One-Time)

```bash
# 1. Install dependencies (already done if you installed earlier)
npm install

# 2. Run database migration
psql $DATABASE_URL -f migrations/002_enhance_licenses.sql
```

## Generate 25 License Keys

```bash
npm run license:batch -- -c 25
```

This creates `licenses-batch-YYYY-MM-DD.csv` with all your keys.

## View Your Keys

```bash
# See all available keys
npm run license:available

# See all licenses with details
npm run license:list

# View statistics
npm run license:stats
```

## When Customer Purchases

### Option 1: Assign Manually

```bash
node scripts/manage-licenses.js assign <LICENSE_KEY> customer@email.com
```

### Option 2: Bulk CSV

1. Open `licenses-batch-YYYY-MM-DD.csv`
2. Pick a key with status "available"
3. Manually track in spreadsheet
4. Email key to customer

## Email Template

```
Subject: Your AI Optimization Tool License Key

Hi [Customer Name],

Thank you for your purchase!

Your License Key: XXXX-XXXX-XXXX-XXXX

Setup Instructions:
1. Extract aio-product.zip
2. Run: docker-compose up -d
3. Visit: http://localhost:3000
4. Register with your license key

Support: support@your-company.com
```

## Common Commands

```bash
# Generate 20 keys
npm run license:generate -- -c 20

# Generate 25 keys with batch export
npm run license:batch -- -c 25

# List all licenses
npm run license:list

# Show available licenses only
npm run license:available

# View statistics
npm run license:stats

# Assign to customer
node scripts/manage-licenses.js assign <KEY> email@example.com

# View details
node scripts/manage-licenses.js details <KEY>

# Revoke if needed
node scripts/manage-licenses.js revoke <KEY> --reason "Refund"
```

## Workflow

```
1. Generate keys → npm run license:batch -- -c 25
2. Export CSV → licenses-batch-YYYY-MM-DD.csv
3. Customer purchases → Assign key
4. Email key → Use template above
5. Customer registers → Status: activated
```

## That's It!

You now have a professional license management system for your Docker product.

See full documentation: LICENSE_MANAGEMENT.md

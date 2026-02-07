# License Management Guide

Complete guide for generating, managing, and distributing license keys for the AI Optimization Tool.

## Overview

The license system provides:
- ✅ **Secure key generation** using crypto-random algorithms
- ✅ **Status tracking** (available, assigned, activated, revoked)
- ✅ **Audit logging** of all license changes
- ✅ **Customer assignment** before distribution
- ✅ **Activation limits** and expiration dates
- ✅ **CLI tools** for easy management

## Quick Start

### 1. Run Database Migration

First time setup:

```bash
# Run the enhanced license schema migration
psql $DATABASE_URL -f migrations/002_enhance_licenses.sql

# Or use your migration tool
node run-migration.js
```

### 2. Generate License Keys

Generate 25 license keys for distribution:

```bash
npm run license:batch
# or
node scripts/generate-licenses.js batch -c 25
```

This creates:
- 25 new license keys
- Status: `available`
- Exports to CSV and JSON files

### 3. View Available Licenses

```bash
npm run license:available
```

### 4. Assign to Customer

When a customer purchases:

```bash
node scripts/manage-licenses.js assign <LICENSE_KEY> customer@email.com
```

### 5. Email to Customer

Send the license key to the customer. They'll use it during registration.

## License Statuses

```
available → Customer purchases → assigned → Customer registers → activated
                                      ↓
                                  revoked (if needed)
```

- **available**: Generated, ready to assign
- **assigned**: Given to a customer, awaiting activation
- **activated**: Customer completed registration
- **revoked**: Deactivated (abuse, refund, etc.)
- **expired**: Past expiration date

## Generating Licenses

### Basic Generation

Generate 20 standard licenses:

```bash
npm run license:generate -- -c 20
```

### With Options

```bash
node scripts/generate-licenses.js generate \
  -c 25 \
  --tier premium \
  --expires 365 \
  --max-activations 3 \
  --notes "Q1 2025 Batch"
```

Options:
- `-c, --count <number>`: Number of keys (default: 20)
- `-t, --tier <tier>`: Product tier (standard, premium, enterprise)
- `-e, --expires <days>`: Expiration in days (omit for lifetime)
- `-m, --max-activations <number>`: How many times key can be activated
- `-n, --notes <text>`: Internal notes
- `--dry-run`: Test without saving to database
- `--export-csv <file>`: Export to CSV
- `--export-json <file>`: Export to JSON

### Key Formats

**Standard format** (default):
```
A3F2-8D4C-9B1E-7C5A
```

**Prefixed format**:
```
AIO-A3F2-8D4C-9B1E-7C5A
```

Generate with prefix:
```bash
node scripts/generate-licenses.js generate -c 10 --format prefixed --prefix AIO2025
```

### Batch Generation for Distribution

Recommended for generating keys to sell:

```bash
npm run license:batch -- -c 25 -t standard
```

This automatically:
- Generates 25 keys
- Saves to database
- Exports to `licenses-batch-YYYY-MM-DD.csv`
- Exports to `licenses-batch-YYYY-MM-DD.json`

## Managing Licenses

### View All Licenses

```bash
npm run license:list
```

With filters:
```bash
node scripts/manage-licenses.js list --status available
node scripts/manage-licenses.js list --tier premium
node scripts/manage-licenses.js list --all  # Show all, not just 50
```

### View Statistics

```bash
npm run license:stats
```

Shows breakdown by status and tier:
```
┌───────────┬──────────┬───────┐
│ Status    │ Tier     │ Count │
├───────────┼──────────┼───────┤
│ available │ standard │    15 │
│ assigned  │ standard │     5 │
│ activated │ standard │     3 │
│ activated │ premium  │     2 │
└───────────┴──────────┴───────┘
```

### Assign to Customer

When customer purchases:

```bash
node scripts/manage-licenses.js assign A3F2-8D4C-9B1E-7C5A customer@email.com --notes "Invoice #12345"
```

This:
- Changes status to `assigned`
- Records customer email
- Timestamps the assignment
- Adds optional notes

### View License Details

```bash
node scripts/manage-licenses.js details A3F2-8D4C-9B1E-7C5A
```

Shows:
- Full license info
- Associated user (if activated)
- Audit log (history of changes)

### Revoke License

If needed (refund, abuse, etc.):

```bash
node scripts/manage-licenses.js revoke A3F2-8D4C-9B1E-7C5A --reason "Refund processed"
```

⚠️ This doesn't automatically disable the user's account. You need to separately handle that.

## Workflow Examples

### Scenario 1: Pre-generate Keys for Website Sales

```bash
# 1. Generate 50 keys
npm run license:batch -- -c 50

# 2. Upload licenses-batch-YYYY-MM-DD.csv to your e-commerce system

# 3. When customer purchases:
#    - Your system marks key as "assigned"
#    - Emails key to customer

# 4. Customer uses key during registration
#    - Status changes to "activated"
```

### Scenario 2: Manual Sales Process

```bash
# 1. Customer contacts you to purchase
# 2. Check available licenses
npm run license:available

# 3. Pick one and assign to customer
node scripts/manage-licenses.js assign <KEY> customer@email.com

# 4. Email the key manually or via script

# 5. Customer registers and activates
```

### Scenario 3: Bulk Generation for Resellers

```bash
# Generate 100 keys for reseller
node scripts/generate-licenses.js generate \
  -c 100 \
  --tier standard \
  --expires 365 \
  --notes "Reseller: TechCorp - Contract #2025-01" \
  --export-csv reseller-techcorp-keys.csv

# Send CSV to reseller
# Reseller distributes keys to their customers
```

## Email Templates

### Template 1: License Key Email

```
Subject: Your AI Optimization Tool License Key

Hi [Customer Name],

Thank you for purchasing the AI Optimization Tool!

Your license key: A3F2-8D4C-9B1E-7C5A

To get started:

1. Download the product:
   [Link to Docker images or installation files]

2. Follow the setup guide:
   [Link to documentation]

3. During registration, enter your license key above

Your license includes:
- Lifetime updates
- Full feature access
- Email support

Questions? Reply to this email.

Best regards,
[Your Company]
```

### Template 2: Docker Setup Instructions

```
Subject: AI Optimization Tool - Setup Instructions

Hi [Customer Name],

Here's how to set up your AI Optimization Tool:

Your License Key: A3F2-8D4C-9B1E-7C5A

Quick Setup:
1. Extract aio-product.zip
2. Edit .env file (set ENCRYPTION_KEY)
3. Run: docker-compose up -d
4. Visit: http://localhost:3000
5. Register with your license key

Detailed Guide: [Link to DOCKER_DEPLOYMENT.md]

Support: support@your-company.com

Best regards,
[Your Company]
```

## Database Schema

### licenses table

```sql
CREATE TABLE licenses (
  id UUID PRIMARY KEY,
  license_key VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'available',  -- available, assigned, activated, revoked
  is_activated BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMP,
  assigned_to VARCHAR(255),                -- Customer email
  assigned_at TIMESTAMP,
  product_tier VARCHAR(50) DEFAULT 'standard',
  max_activations INTEGER DEFAULT 1,
  activation_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  notes TEXT,
  metadata JSONB
);
```

### license_audit_log table

Automatically tracks all changes:

```sql
CREATE TABLE license_audit_log (
  id UUID PRIMARY KEY,
  license_key VARCHAR(255),
  action VARCHAR(100),
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  performed_by VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

The existing API endpoints work with the enhanced schema:

### POST /api/license/validate

Validates a license key before registration:

```bash
curl -X POST http://localhost:3001/api/license/validate \
  -H "Content-Type: application/json" \
  -d '{"licenseKey": "A3F2-8D4C-9B1E-7C5A"}'
```

Response:
```json
{
  "valid": true,
  "license": {
    "license_key": "A3F2-8D4C-9B1E-7C5A",
    "status": "assigned",
    "product_tier": "standard",
    "expires_at": null
  }
}
```

### POST /api/auth/register

Registers user and activates license:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "password": "secret123",
    "licenseKey": "A3F2-8D4C-9B1E-7C5A"
  }'
```

This automatically:
- Creates user account
- Changes license status to `activated`
- Records activation timestamp

## Security Best Practices

### For You (Vendor):

1. ✅ **Never expose all keys publicly**
2. ✅ **Track who receives each key**
3. ✅ **Use HTTPS for key delivery**
4. ✅ **Monitor activation patterns** (detect sharing/resale)
5. ✅ **Set reasonable expiration dates** for trials
6. ✅ **Keep audit logs** for compliance

### For Customers:

1. ✅ **Treat license keys like passwords**
2. ✅ **Don't share publicly**
3. ✅ **Store securely** (password manager)
4. ✅ **Contact support if compromised**

## Monitoring & Analytics

### Track License Usage

```sql
-- Activation rate
SELECT
  COUNT(*) FILTER (WHERE status = 'activated') * 100.0 / COUNT(*) as activation_rate
FROM licenses
WHERE status IN ('assigned', 'activated');

-- Average time to activation
SELECT
  AVG(EXTRACT(EPOCH FROM (activated_at - assigned_at))/3600) as hours_to_activate
FROM licenses
WHERE status = 'activated' AND assigned_at IS NOT NULL;

-- Licenses expiring soon
SELECT license_key, assigned_to, expires_at
FROM licenses
WHERE expires_at < NOW() + INTERVAL '30 days'
  AND status = 'activated';
```

### Detect Issues

```sql
-- Unactivated assigned licenses (potential delivery issue)
SELECT license_key, assigned_to, assigned_at
FROM licenses
WHERE status = 'assigned'
  AND assigned_at < NOW() - INTERVAL '7 days';

-- Multiple activations (potential sharing)
SELECT license_key, activation_count, max_activations
FROM licenses
WHERE activation_count > 1;
```

## Troubleshooting

### "License key already activated"

**Cause**: Customer trying to use the same key twice.

**Solution**:
- Check if they already have an account
- If legitimate re-install, consider increasing `max_activations`
- Issue new key if original was compromised

### "License key has expired"

**Cause**: `expires_at` date has passed.

**Solution**:
```bash
# Extend expiration
psql $DATABASE_URL -c "UPDATE licenses SET expires_at = NOW() + INTERVAL '365 days' WHERE license_key = 'KEY';"
```

### "Invalid license key"

**Cause**: Typo or key doesn't exist.

**Solution**:
- Check for spaces or formatting issues
- Verify key in database
- Issue replacement if lost

## Advanced Features

### Multi-Activation Keys (Teams)

Allow one key for small teams:

```bash
node scripts/generate-licenses.js generate -c 5 --max-activations 5 --tier team
```

This allows 5 users to activate with the same key.

### Temporary Trial Keys

7-day trial keys:

```bash
node scripts/generate-licenses.js generate -c 20 --expires 7 --tier trial
```

### Custom Metadata

Store additional info:

```sql
UPDATE licenses
SET metadata = jsonb_build_object(
  'invoice_id', '12345',
  'reseller', 'TechCorp',
  'contract_end', '2026-01-01'
)
WHERE license_key = 'KEY';
```

## Integration with E-commerce

### Example: WooCommerce Integration

```php
// When order is completed
add_action('woocommerce_order_status_completed', function($order_id) {
    $order = wc_get_order($order_id);
    $email = $order->get_billing_email();

    // Get available license from your API
    $license = get_available_license();

    // Assign to customer
    assign_license($license, $email);

    // Email license key
    send_license_email($email, $license);
});
```

## Backup & Recovery

### Backup Licenses

```bash
# Export all licenses
pg_dump $DATABASE_URL -t licenses -t license_audit_log > licenses_backup.sql

# Or use CSV export
psql $DATABASE_URL -c "COPY licenses TO '/tmp/licenses.csv' CSV HEADER;"
```

### Restore

```bash
psql $DATABASE_URL < licenses_backup.sql
```

## Summary

Your license system now provides:

- 🔑 **Crypto-secure key generation**
- 📊 **Full lifecycle tracking** (available → assigned → activated)
- 📧 **Customer assignment** before distribution
- 📝 **Audit logging** for compliance
- 🛠️ **CLI tools** for easy management
- 📈 **Statistics** and reporting
- ⚙️ **Flexible options** (tiers, expiration, multi-activation)

Generate your first batch:
```bash
npm run license:batch -- -c 25
```

View what's available:
```bash
npm run license:available
```

Happy selling! 🚀

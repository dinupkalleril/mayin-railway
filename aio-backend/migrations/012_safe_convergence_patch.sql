BEGIN;

-- =========================
-- website_scans lifecycle
-- =========================
ALTER TABLE website_scans
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE website_scans
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE website_scans
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- =========================
-- sentiment_analyses lifecycle
-- =========================
ALTER TABLE sentiment_analyses
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE sentiment_analyses
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE sentiment_analyses
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- =========================
-- action_plans lifecycle (safe)
-- =========================
ALTER TABLE action_plans
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE action_plans
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE action_plans
ADD COLUMN IF NOT EXISTS error_message TEXT;

COMMIT;

-- Widen license_key columns to TEXT to support long HMAC licenses

-- Drop foreign keys if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name='users_license_key_fkey'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_license_key_fkey;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name='license_audit_log_license_key_fkey'
  ) THEN
    ALTER TABLE license_audit_log DROP CONSTRAINT license_audit_log_license_key_fkey;
  END IF;
END$$;

-- Alter column types
ALTER TABLE licenses ALTER COLUMN license_key TYPE TEXT;
ALTER TABLE licenses ALTER COLUMN assigned_to TYPE TEXT;
ALTER TABLE users ALTER COLUMN license_key TYPE TEXT;
-- license_audit_log may not exist in all deployments
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='license_audit_log' AND column_name='license_key'
  ) THEN
    ALTER TABLE license_audit_log ALTER COLUMN license_key TYPE TEXT;
  END IF;
END$$;

-- Re-create foreign keys
ALTER TABLE users ADD CONSTRAINT users_license_key_fkey FOREIGN KEY (license_key) REFERENCES licenses(license_key);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='license_audit_log' AND column_name='license_key'
  ) THEN
    ALTER TABLE license_audit_log ADD CONSTRAINT license_audit_log_license_key_fkey FOREIGN KEY (license_key) REFERENCES licenses(license_key);
  END IF;
END$$;

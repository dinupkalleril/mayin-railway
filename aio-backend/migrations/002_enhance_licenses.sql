-- Enhanced License Management Schema
-- Run this migration to add license tracking features

-- Add new columns to licenses table
ALTER TABLE licenses
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'activated', 'revoked', 'expired')),
ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255),
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS product_tier VARCHAR(50) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS max_activations INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS activation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing records to 'activated' if they are already activated
UPDATE licenses
SET status = 'activated'
WHERE is_activated = true;

-- Create index for faster license lookups
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_assigned_to ON licenses(assigned_to);

-- Create license audit log table
CREATE TABLE IF NOT EXISTS license_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_key VARCHAR(255) REFERENCES licenses(license_key),
  action VARCHAR(100) NOT NULL,
  performed_by VARCHAR(255),
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_license ON license_audit_log(license_key);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON license_audit_log(created_at DESC);

-- Function to automatically log license status changes
CREATE OR REPLACE FUNCTION log_license_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO license_audit_log (
      license_key,
      action,
      old_status,
      new_status,
      metadata
    ) VALUES (
      NEW.license_key,
      'status_change',
      OLD.status,
      NEW.status,
      jsonb_build_object(
        'assigned_to', NEW.assigned_to,
        'activation_count', NEW.activation_count
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for license changes
DROP TRIGGER IF EXISTS license_change_trigger ON licenses;
CREATE TRIGGER license_change_trigger
  AFTER UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION log_license_change();

-- Create view for license statistics
CREATE OR REPLACE VIEW license_stats AS
SELECT
  status,
  COUNT(*) as count,
  product_tier,
  COUNT(*) FILTER (WHERE expires_at IS NULL OR expires_at > NOW()) as active_count,
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_count
FROM licenses
GROUP BY status, product_tier;

COMMENT ON TABLE licenses IS 'License keys for product activation and user management';
COMMENT ON TABLE license_audit_log IS 'Audit trail for all license-related actions';
COMMENT ON VIEW license_stats IS 'Aggregated statistics for license management';

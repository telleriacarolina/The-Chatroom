-- ID Verifications table
CREATE TABLE IF NOT EXISTS id_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  s3_key TEXT NOT NULL,
  selfie_s3_key TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  verification_data JSONB,
  error_message TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_reason TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('PENDING', 'PROCESSING', 'APPROVED', 'REJECTED', 'FAILED', 'DELETED'))
);

CREATE INDEX IF NOT EXISTS idx_id_verifications_user_id ON id_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_id_verifications_status ON id_verifications(status);
CREATE INDEX IF NOT EXISTS idx_id_verifications_created_at ON id_verifications(created_at);

-- Add verification fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMP;

-- Verification retention policy (auto-delete after configured days)
CREATE TABLE IF NOT EXISTS verification_retention_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES id_verifications(id) ON DELETE CASCADE,
  deletion_scheduled_at TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retention_scheduled ON verification_retention_policy(deletion_scheduled_at) WHERE deleted_at IS NULL;

-- Trigger to update `updated_at` on id_verifications
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_id_verifications_updated_at
BEFORE UPDATE ON id_verifications
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

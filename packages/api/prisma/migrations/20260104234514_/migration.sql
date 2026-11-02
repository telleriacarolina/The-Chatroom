-- No-op migration.
-- This migration previously attempted to recreate the full schema and failed on clean databases.
-- Keeping this step as a no-op preserves migration ordering for existing histories.
SELECT 1;

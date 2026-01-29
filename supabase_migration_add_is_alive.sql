-- Add is_alive column to saves table
-- Run this in your Supabase SQL editor

ALTER TABLE saves
ADD COLUMN IF NOT EXISTS is_alive BOOLEAN DEFAULT true;

-- Update existing saves to be alive by default
UPDATE saves
SET is_alive = true
WHERE is_alive IS NULL;

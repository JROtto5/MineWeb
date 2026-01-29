-- DotSlayer Database Migration: Add user_id and authentication support
-- Run this in your Supabase SQL editor

-- ============================================
-- 1. Enable Google OAuth in Supabase Dashboard
-- ============================================
-- Go to: Authentication > Providers > Google > Enable
-- Add OAuth credentials from Google Cloud Console
-- Redirect URL: https://your-project.supabase.co/auth/v1/callback

-- ============================================
-- 2. Update saves table structure
-- ============================================

-- Add user_id column
ALTER TABLE saves
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_saves_user ON saves(user_id, save_slot);

-- Drop old unique constraint based on player_name
ALTER TABLE saves
  DROP CONSTRAINT IF EXISTS saves_player_name_save_slot_key;

-- Add new unique constraint based on user_id
ALTER TABLE saves
  ADD CONSTRAINT saves_user_id_save_slot_key UNIQUE(user_id, save_slot);

-- Keep player_name column for backward compatibility, but it's no longer the primary identifier
-- Existing saves will have NULL user_id initially

-- ============================================
-- 3. Update leaderboard table structure
-- ============================================

-- Add user_id column
ALTER TABLE leaderboard
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add display_name column (from auth metadata or user input)
ALTER TABLE leaderboard
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);

-- ============================================
-- 4. Enable Row Level Security (RLS)
-- ============================================

-- Enable RLS on saves table
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own saves
CREATE POLICY "Users can view own saves"
  ON saves
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own saves
CREATE POLICY "Users can insert own saves"
  ON saves
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update only their own saves
CREATE POLICY "Users can update own saves"
  ON saves
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete only their own saves
CREATE POLICY "Users can delete own saves"
  ON saves
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on leaderboard table
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view the leaderboard (for public competition)
CREATE POLICY "Anyone can view leaderboard"
  ON leaderboard
  FOR SELECT
  USING (true);

-- Policy: Users can only submit their own scores
CREATE POLICY "Users can submit own scores"
  ON leaderboard
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Optional: Allow users to view their own scores for history
CREATE POLICY "Users can view own score history"
  ON leaderboard
  FOR SELECT
  USING (auth.uid() = user_id OR true);

-- ============================================
-- 5. Optional: Migrate existing data
-- ============================================
-- WARNING: Only run this if you want to assign existing saves to a specific user
-- Replace 'YOUR_USER_ID_HERE' with an actual UUID from auth.users

-- Example: Update all existing saves to belong to first registered user
-- UPDATE saves
-- SET user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
-- WHERE user_id IS NULL;

-- Example: Update all existing leaderboard entries to belong to first registered user
-- UPDATE leaderboard
-- SET user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1),
--     display_name = COALESCE(player_name, 'Anonymous')
-- WHERE user_id IS NULL;

-- ============================================
-- 6. Verify migration success
-- ============================================

-- Check saves table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'saves';

-- Check leaderboard table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leaderboard';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('saves', 'leaderboard');

-- ============================================
-- Migration complete!
-- ============================================
-- Next steps:
-- 1. Update SaveManager.ts to use user_id instead of player_name
-- 2. Update LeaderboardService.ts to use user_id and display_name
-- 3. Test authentication flow and data access

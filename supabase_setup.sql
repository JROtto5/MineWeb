-- Crime City Game Database Schema
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- SAVES TABLE - For cloud save files
-- ============================================
CREATE TABLE IF NOT EXISTS saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL,
  save_slot INTEGER NOT NULL,
  player_data JSONB NOT NULL,
  stage_number INTEGER NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_name, save_slot)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_saves_player ON saves(player_name, save_slot);

-- ============================================
-- LEADERBOARD TABLE - For global rankings
-- ============================================
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  stage_reached INTEGER NOT NULL,
  kills INTEGER NOT NULL,
  time_played INTEGER NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast sorting
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_stage ON leaderboard(stage_reached DESC, score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_timestamp ON leaderboard(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_player ON leaderboard(player_name);

-- ============================================
-- ROW LEVEL SECURITY (Optional but recommended)
-- ============================================

-- Enable RLS on saves table
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read saves
CREATE POLICY "Anyone can view saves"
  ON saves FOR SELECT
  USING (true);

-- Allow anyone to insert saves (could restrict by player_name later)
CREATE POLICY "Anyone can insert saves"
  ON saves FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update their own saves
CREATE POLICY "Anyone can update saves"
  ON saves FOR UPDATE
  USING (true);

-- Allow anyone to delete their own saves
CREATE POLICY "Anyone can delete saves"
  ON saves FOR DELETE
  USING (true);

-- Enable RLS on leaderboard table
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view leaderboard
CREATE POLICY "Anyone can view leaderboard"
  ON leaderboard FOR SELECT
  USING (true);

-- Allow anyone to insert scores
CREATE POLICY "Anyone can submit scores"
  ON leaderboard FOR INSERT
  WITH CHECK (true);

-- Prevent updates and deletes (scores are permanent)
CREATE POLICY "No updates to leaderboard"
  ON leaderboard FOR UPDATE
  USING (false);

CREATE POLICY "No deletes from leaderboard"
  ON leaderboard FOR DELETE
  USING (false);

-- =====================================================
-- DOT UNIVERSE - Complete Database Schema
-- Run this SQL in your Supabase SQL Editor
-- This creates a clean, scalable setup for both games
-- =====================================================

-- ============================================
-- CLEANUP: Drop existing tables (run carefully!)
-- ============================================
DROP TABLE IF EXISTS clicker_saves CASCADE;
DROP TABLE IF EXISTS slayer_progress CASCADE;
DROP TABLE IF EXISTS slayer_saves CASCADE;
DROP TABLE IF EXISTS leaderboard CASCADE;
DROP TABLE IF EXISTS saves CASCADE;

-- ============================================
-- USER PROFILES TABLE
-- Stores display names and cross-game stats
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Player',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Cross-game synergy stats (cached for quick access)
  slayer_highest_floor INTEGER DEFAULT 0,
  slayer_games_won INTEGER DEFAULT 0,
  clicker_total_prestiges INTEGER DEFAULT 0,
  clicker_total_dots NUMERIC DEFAULT 0,
  synergy_bonus NUMERIC DEFAULT 0
);

-- Index for display name lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);

-- ============================================
-- DOT SLAYER - Saves Table
-- Stores roguelike game save data
-- ============================================
CREATE TABLE IF NOT EXISTS slayer_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  save_slot INTEGER NOT NULL CHECK (save_slot >= 1 AND save_slot <= 3),

  -- Player state
  player_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Expected structure:
  -- {
  --   level: number,
  --   money: number,
  --   xp: number,
  --   health: number,
  --   maxHealth: number,
  --   skillPoints: number,
  --   skills: {skillId: level},
  --   shopItems: {itemId: level},
  --   currentWeapon: number
  -- }

  floor_number INTEGER NOT NULL DEFAULT 1,
  is_alive BOOLEAN NOT NULL DEFAULT true,

  -- Run statistics
  run_stats JSONB DEFAULT '{}'::jsonb,
  -- Expected structure:
  -- {
  --   totalKills: number,
  --   totalMoney: number,
  --   highestCombo: number,
  --   bossesKilled: number,
  --   startTime: timestamp
  -- }

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, save_slot)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_slayer_saves_user ON slayer_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_slayer_saves_user_slot ON slayer_saves(user_id, save_slot);

-- ============================================
-- DOT SLAYER - Progress Table
-- Tracks cross-game synergy progress
-- ============================================
CREATE TABLE IF NOT EXISTS slayer_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Progress stats
  highest_floor INTEGER DEFAULT 0,
  total_floors_cleared INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  total_runs INTEGER DEFAULT 0,
  total_kills INTEGER DEFAULT 0,
  total_bosses_killed INTEGER DEFAULT 0,
  total_play_time INTEGER DEFAULT 0, -- in seconds

  -- Best run stats
  best_score INTEGER DEFAULT 0,
  fastest_win_time INTEGER DEFAULT NULL, -- in seconds

  last_played TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_slayer_progress_user ON slayer_progress(user_id);

-- ============================================
-- DOT CLICKER - Saves Table
-- Stores idle game save data
-- ============================================
CREATE TABLE IF NOT EXISTS clicker_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core game state
  dots NUMERIC NOT NULL DEFAULT 0,
  total_dots NUMERIC NOT NULL DEFAULT 0,
  total_clicks BIGINT NOT NULL DEFAULT 0,

  -- Multipliers
  dots_per_click NUMERIC DEFAULT 1,
  crit_chance NUMERIC DEFAULT 0.05,
  crit_multiplier NUMERIC DEFAULT 5,
  golden_dot_chance NUMERIC DEFAULT 0.01,
  global_multiplier NUMERIC DEFAULT 1,
  combo_multiplier NUMERIC DEFAULT 1,
  offline_multiplier NUMERIC DEFAULT 0,

  -- Prestige
  prestige_points INTEGER DEFAULT 0,
  prestige_multiplier NUMERIC DEFAULT 1,
  total_prestiges INTEGER DEFAULT 0,

  -- Buildings (JSONB for flexibility)
  buildings JSONB DEFAULT '[]'::jsonb,
  -- Array of {id: string, owned: number}

  -- Upgrades (JSONB for flexibility)
  upgrades JSONB DEFAULT '[]'::jsonb,
  -- Array of {id: string, purchased: boolean}

  -- Achievements (JSONB for flexibility)
  achievements JSONB DEFAULT '[]'::jsonb,
  -- Array of {id: string, unlocked: boolean}

  -- Statistics
  stats JSONB DEFAULT '{}'::jsonb,
  -- {
  --   totalGoldenClicks: number,
  --   totalCrits: number,
  --   highestDps: number,
  --   maxCombo: number,
  --   startTime: timestamp
  -- }

  -- Cross-game synergy (from DotSlayer)
  slayer_floors_cleared INTEGER DEFAULT 0,
  synergy_bonus NUMERIC DEFAULT 0,

  last_save TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_clicker_saves_user ON clicker_saves(user_id);

-- ============================================
-- LEADERBOARD TABLE - Global Rankings
-- For DotSlayer high scores
-- ============================================
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,

  -- Score components
  score INTEGER NOT NULL,
  floor_reached INTEGER NOT NULL,
  kills INTEGER NOT NULL DEFAULT 0,
  time_played INTEGER NOT NULL DEFAULT 0, -- in seconds

  -- Run details
  was_victory BOOLEAN DEFAULT false,
  run_data JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_floor ON leaderboard(floor_reached DESC, score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_recent ON leaderboard(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_victories ON leaderboard(was_victory, score DESC) WHERE was_victory = true;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- Secure data access per user
-- ============================================

-- USER PROFILES
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- SLAYER SAVES
ALTER TABLE slayer_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own slayer saves"
  ON slayer_saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own slayer saves"
  ON slayer_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own slayer saves"
  ON slayer_saves FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own slayer saves"
  ON slayer_saves FOR DELETE
  USING (auth.uid() = user_id);

-- SLAYER PROGRESS
ALTER TABLE slayer_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all slayer progress"
  ON slayer_progress FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own slayer progress"
  ON slayer_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own slayer progress"
  ON slayer_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- CLICKER SAVES
ALTER TABLE clicker_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clicker saves"
  ON clicker_saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clicker saves"
  ON clicker_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clicker saves"
  ON clicker_saves FOR UPDATE
  USING (auth.uid() = user_id);

-- LEADERBOARD
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard"
  ON leaderboard FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own scores"
  ON leaderboard FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No updates or deletes on leaderboard (scores are permanent)

-- ============================================
-- FUNCTIONS & TRIGGERS
-- Auto-update timestamps and sync synergy
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_slayer_saves_updated_at
  BEFORE UPDATE ON slayer_saves
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_slayer_progress_updated_at
  BEFORE UPDATE ON slayer_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clicker_saves_updated_at
  BEFORE UPDATE ON clicker_saves
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to sync synergy stats to user_profiles
CREATE OR REPLACE FUNCTION sync_synergy_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user_profiles with latest synergy data
  UPDATE user_profiles SET
    slayer_highest_floor = COALESCE((
      SELECT highest_floor FROM slayer_progress WHERE user_id = NEW.user_id
    ), 0),
    slayer_games_won = COALESCE((
      SELECT games_won FROM slayer_progress WHERE user_id = NEW.user_id
    ), 0),
    clicker_total_prestiges = COALESCE((
      SELECT total_prestiges FROM clicker_saves WHERE user_id = NEW.user_id
    ), 0),
    clicker_total_dots = COALESCE((
      SELECT total_dots FROM clicker_saves WHERE user_id = NEW.user_id
    ), 0),
    synergy_bonus = (
      COALESCE((SELECT highest_floor FROM slayer_progress WHERE user_id = NEW.user_id), 0) * 0.01 +
      COALESCE((SELECT total_prestiges FROM clicker_saves WHERE user_id = NEW.user_id), 0) * 0.05
    ),
    updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync synergy when slayer_progress updates
CREATE TRIGGER sync_slayer_synergy
  AFTER INSERT OR UPDATE ON slayer_progress
  FOR EACH ROW EXECUTE FUNCTION sync_synergy_to_profile();

-- Trigger to sync synergy when clicker_saves updates
CREATE TRIGGER sync_clicker_synergy
  AFTER INSERT OR UPDATE ON clicker_saves
  FOR EACH ROW EXECUTE FUNCTION sync_synergy_to_profile();

-- Function to create user profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email, 'Player')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SAMPLE QUERIES FOR TESTING
-- ============================================

-- Get user's synergy stats:
-- SELECT * FROM user_profiles WHERE id = auth.uid();

-- Get top 10 leaderboard:
-- SELECT display_name, score, floor_reached, kills, time_played, created_at
-- FROM leaderboard ORDER BY score DESC LIMIT 10;

-- Get user's clicker save:
-- SELECT * FROM clicker_saves WHERE user_id = auth.uid();

-- Get user's slayer saves:
-- SELECT * FROM slayer_saves WHERE user_id = auth.uid() ORDER BY save_slot;

-- =====================================================
-- DOT UNIVERSE - Migration to Clean Schema
-- Run this SQL in your Supabase SQL Editor
-- WARNING: This will DROP existing data!
-- =====================================================

-- ============================================
-- STEP 1: Drop existing tables
-- ============================================
DROP TABLE IF EXISTS leaderboard CASCADE;
DROP TABLE IF EXISTS saves CASCADE;

-- ============================================
-- STEP 2: Create new tables
-- ============================================

-- USER PROFILES - Stores display names and cached synergy stats
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Player',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  slayer_highest_floor INTEGER DEFAULT 0,
  slayer_games_won INTEGER DEFAULT 0,
  clicker_total_prestiges INTEGER DEFAULT 0,
  clicker_total_dots NUMERIC DEFAULT 0,
  synergy_bonus NUMERIC DEFAULT 0
);

-- DOT SLAYER SAVES
CREATE TABLE IF NOT EXISTS slayer_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  save_slot INTEGER NOT NULL CHECK (save_slot >= 1 AND save_slot <= 3),
  player_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  floor_number INTEGER NOT NULL DEFAULT 1,
  is_alive BOOLEAN NOT NULL DEFAULT true,
  run_stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, save_slot)
);

-- DOT SLAYER PROGRESS (for cross-game synergy)
CREATE TABLE IF NOT EXISTS slayer_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  highest_floor INTEGER DEFAULT 0,
  total_floors_cleared INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  total_runs INTEGER DEFAULT 0,
  total_kills INTEGER DEFAULT 0,
  total_bosses_killed INTEGER DEFAULT 0,
  total_play_time INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  fastest_win_time INTEGER DEFAULT NULL,
  last_played TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOT CLICKER SAVES
CREATE TABLE IF NOT EXISTS clicker_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dots NUMERIC NOT NULL DEFAULT 0,
  total_dots NUMERIC NOT NULL DEFAULT 0,
  total_clicks BIGINT NOT NULL DEFAULT 0,
  dots_per_click NUMERIC DEFAULT 1,
  crit_chance NUMERIC DEFAULT 0.05,
  crit_multiplier NUMERIC DEFAULT 5,
  golden_dot_chance NUMERIC DEFAULT 0.01,
  global_multiplier NUMERIC DEFAULT 1,
  combo_multiplier NUMERIC DEFAULT 1,
  offline_multiplier NUMERIC DEFAULT 0,
  prestige_points INTEGER DEFAULT 0,
  prestige_multiplier NUMERIC DEFAULT 1,
  total_prestiges INTEGER DEFAULT 0,
  buildings JSONB DEFAULT '[]'::jsonb,
  upgrades JSONB DEFAULT '[]'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  stats JSONB DEFAULT '{}'::jsonb,
  slayer_floors_cleared INTEGER DEFAULT 0,
  synergy_bonus NUMERIC DEFAULT 0,
  last_save TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEADERBOARD
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  floor_reached INTEGER NOT NULL,
  kills INTEGER NOT NULL DEFAULT 0,
  time_played INTEGER NOT NULL DEFAULT 0,
  was_victory BOOLEAN DEFAULT false,
  run_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 3: Create indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_slayer_saves_user ON slayer_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_slayer_saves_user_slot ON slayer_saves(user_id, save_slot);
CREATE INDEX IF NOT EXISTS idx_slayer_progress_user ON slayer_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_clicker_saves_user ON clicker_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_floor ON leaderboard(floor_reached DESC, score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_recent ON leaderboard(created_at DESC);

-- ============================================
-- STEP 4: Enable RLS and create policies
-- ============================================

-- USER PROFILES
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- SLAYER SAVES
ALTER TABLE slayer_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own slayer saves" ON slayer_saves;
DROP POLICY IF EXISTS "Users can insert own slayer saves" ON slayer_saves;
DROP POLICY IF EXISTS "Users can update own slayer saves" ON slayer_saves;
DROP POLICY IF EXISTS "Users can delete own slayer saves" ON slayer_saves;
CREATE POLICY "Users can view own slayer saves" ON slayer_saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own slayer saves" ON slayer_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own slayer saves" ON slayer_saves FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own slayer saves" ON slayer_saves FOR DELETE USING (auth.uid() = user_id);

-- SLAYER PROGRESS
ALTER TABLE slayer_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all slayer progress" ON slayer_progress;
DROP POLICY IF EXISTS "Users can insert own slayer progress" ON slayer_progress;
DROP POLICY IF EXISTS "Users can update own slayer progress" ON slayer_progress;
CREATE POLICY "Users can view all slayer progress" ON slayer_progress FOR SELECT USING (true);
CREATE POLICY "Users can insert own slayer progress" ON slayer_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own slayer progress" ON slayer_progress FOR UPDATE USING (auth.uid() = user_id);

-- CLICKER SAVES
ALTER TABLE clicker_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own clicker saves" ON clicker_saves;
DROP POLICY IF EXISTS "Anyone can view clicker saves for leaderboard" ON clicker_saves;
DROP POLICY IF EXISTS "Users can insert own clicker saves" ON clicker_saves;
DROP POLICY IF EXISTS "Users can update own clicker saves" ON clicker_saves;
-- Allow anyone to view clicker saves (needed for leaderboards)
CREATE POLICY "Anyone can view clicker saves for leaderboard" ON clicker_saves FOR SELECT USING (true);
CREATE POLICY "Users can insert own clicker saves" ON clicker_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clicker saves" ON clicker_saves FOR UPDATE USING (auth.uid() = user_id);

-- LEADERBOARD
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON leaderboard;
DROP POLICY IF EXISTS "Users can insert own scores" ON leaderboard;
CREATE POLICY "Anyone can view leaderboard" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Users can insert own scores" ON leaderboard FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STEP 5: Create functions and triggers
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_slayer_saves_updated_at ON slayer_saves;
CREATE TRIGGER update_slayer_saves_updated_at
  BEFORE UPDATE ON slayer_saves FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_slayer_progress_updated_at ON slayer_progress;
CREATE TRIGGER update_slayer_progress_updated_at
  BEFORE UPDATE ON slayer_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_clicker_saves_updated_at ON clicker_saves;
CREATE TRIGGER update_clicker_saves_updated_at
  BEFORE UPDATE ON clicker_saves FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to sync synergy stats to user_profiles
CREATE OR REPLACE FUNCTION sync_synergy_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, display_name, slayer_highest_floor, slayer_games_won, clicker_total_prestiges, clicker_total_dots, synergy_bonus)
  VALUES (
    NEW.user_id,
    'Player',
    COALESCE((SELECT highest_floor FROM slayer_progress WHERE user_id = NEW.user_id), 0),
    COALESCE((SELECT games_won FROM slayer_progress WHERE user_id = NEW.user_id), 0),
    COALESCE((SELECT total_prestiges FROM clicker_saves WHERE user_id = NEW.user_id), 0),
    COALESCE((SELECT total_dots FROM clicker_saves WHERE user_id = NEW.user_id), 0),
    COALESCE((SELECT highest_floor FROM slayer_progress WHERE user_id = NEW.user_id), 0) * 0.01 +
    COALESCE((SELECT total_prestiges FROM clicker_saves WHERE user_id = NEW.user_id), 0) * 0.05
  )
  ON CONFLICT (id) DO UPDATE SET
    slayer_highest_floor = COALESCE((SELECT highest_floor FROM slayer_progress WHERE user_id = NEW.user_id), 0),
    slayer_games_won = COALESCE((SELECT games_won FROM slayer_progress WHERE user_id = NEW.user_id), 0),
    clicker_total_prestiges = COALESCE((SELECT total_prestiges FROM clicker_saves WHERE user_id = NEW.user_id), 0),
    clicker_total_dots = COALESCE((SELECT total_dots FROM clicker_saves WHERE user_id = NEW.user_id), 0),
    synergy_bonus = COALESCE((SELECT highest_floor FROM slayer_progress WHERE user_id = NEW.user_id), 0) * 0.01 +
                    COALESCE((SELECT total_prestiges FROM clicker_saves WHERE user_id = NEW.user_id), 0) * 0.05,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to sync synergy
DROP TRIGGER IF EXISTS sync_slayer_synergy ON slayer_progress;
CREATE TRIGGER sync_slayer_synergy
  AFTER INSERT OR UPDATE ON slayer_progress FOR EACH ROW EXECUTE FUNCTION sync_synergy_to_profile();

DROP TRIGGER IF EXISTS sync_clicker_synergy ON clicker_saves;
CREATE TRIGGER sync_clicker_synergy
  AFTER INSERT OR UPDATE ON clicker_saves FOR EACH ROW EXECUTE FUNCTION sync_synergy_to_profile();

-- Function to create user profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), 'Player')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- DONE! Run the schema in Supabase SQL Editor
-- ============================================

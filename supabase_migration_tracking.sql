-- =====================================================
-- DOT UNIVERSE - Tracking System Migration
-- Adds daily challenges, achievements, and game stats tracking
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- ============================================
-- DAILY CHALLENGES TABLE
-- Tracks daily challenge progress per user
-- ============================================
CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Challenge date (YYYY-MM-DD format)
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Challenge progress (JSONB array)
  challenges JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Array of {
  --   challengeId: string,
  --   progress: number,
  --   completed: boolean,
  --   claimed: boolean
  -- }

  -- Streak tracking
  streak INTEGER DEFAULT 0,
  last_completed_date DATE DEFAULT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One record per user per day
  UNIQUE(user_id, challenge_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_challenges_user ON daily_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(challenge_date);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_user_date ON daily_challenges(user_id, challenge_date);

-- ============================================
-- ACHIEVEMENTS TABLE
-- Tracks unlocked achievements per user
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Unlocked achievements (array of achievement IDs)
  unlocked JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Total unlocked count (for quick queries)
  unlocked_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);

-- ============================================
-- GAME STATS TABLE (DotSlayer)
-- Comprehensive stat tracking for achievements and challenges
-- ============================================
CREATE TABLE IF NOT EXISTS slayer_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Lifetime stats
  total_kills INTEGER DEFAULT 0,
  total_damage_dealt BIGINT DEFAULT 0,
  total_gold_earned BIGINT DEFAULT 0,
  total_gold_spent BIGINT DEFAULT 0,
  total_floors_completed INTEGER DEFAULT 0,
  total_bosses_killed INTEGER DEFAULT 0,
  total_elite_kills INTEGER DEFAULT 0,
  total_critical_hits INTEGER DEFAULT 0,
  total_items_collected INTEGER DEFAULT 0,
  total_legendaries_collected INTEGER DEFAULT 0,
  total_weapons_switched INTEGER DEFAULT 0,
  total_shop_upgrades INTEGER DEFAULT 0,
  total_deaths INTEGER DEFAULT 0,
  total_play_time INTEGER DEFAULT 0, -- in seconds

  -- Best records
  highest_combo INTEGER DEFAULT 0,
  highest_floor INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  fastest_win_time INTEGER DEFAULT NULL,
  most_kills_in_run INTEGER DEFAULT 0,
  highest_damage_in_run BIGINT DEFAULT 0,
  most_gold_in_run INTEGER DEFAULT 0,

  -- Perfect floor tracking
  floors_without_damage INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_slayer_stats_user ON slayer_stats(user_id);

-- ============================================
-- PRESTIGE UPGRADES TABLE (Clicker)
-- Tracks purchased prestige upgrades
-- ============================================
ALTER TABLE clicker_saves
ADD COLUMN IF NOT EXISTS prestige_upgrades JSONB DEFAULT '[]'::jsonb;

-- Add ascension tracking to clicker_saves
ALTER TABLE clicker_saves
ADD COLUMN IF NOT EXISTS ascension_level INTEGER DEFAULT 0;

ALTER TABLE clicker_saves
ADD COLUMN IF NOT EXISTS total_ascensions INTEGER DEFAULT 0;

ALTER TABLE clicker_saves
ADD COLUMN IF NOT EXISTS ascension_points NUMERIC DEFAULT 0;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- DAILY CHALLENGES
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily challenges"
  ON daily_challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily challenges"
  ON daily_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily challenges"
  ON daily_challenges FOR UPDATE
  USING (auth.uid() = user_id);

-- ACHIEVEMENTS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all achievements"
  ON achievements FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own achievements"
  ON achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
  ON achievements FOR UPDATE
  USING (auth.uid() = user_id);

-- SLAYER STATS
ALTER TABLE slayer_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all slayer stats"
  ON slayer_stats FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own slayer stats"
  ON slayer_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own slayer stats"
  ON slayer_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamps
CREATE TRIGGER update_daily_challenges_updated_at
  BEFORE UPDATE ON daily_challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_achievements_updated_at
  BEFORE UPDATE ON achievements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_slayer_stats_updated_at
  BEFORE UPDATE ON slayer_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get or create today's daily challenges
CREATE OR REPLACE FUNCTION get_or_create_daily_challenges(p_user_id UUID)
RETURNS daily_challenges AS $$
DECLARE
  result daily_challenges;
BEGIN
  -- Try to get today's record
  SELECT * INTO result
  FROM daily_challenges
  WHERE user_id = p_user_id AND challenge_date = CURRENT_DATE;

  -- If not found, create one
  IF NOT FOUND THEN
    INSERT INTO daily_challenges (user_id, challenge_date)
    VALUES (p_user_id, CURRENT_DATE)
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment stats
CREATE OR REPLACE FUNCTION increment_slayer_stat(
  p_user_id UUID,
  p_stat_name TEXT,
  p_amount INTEGER DEFAULT 1
)
RETURNS void AS $$
BEGIN
  -- Ensure user has stats record
  INSERT INTO slayer_stats (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Dynamically update the stat
  EXECUTE format('UPDATE slayer_stats SET %I = %I + $1, updated_at = NOW() WHERE user_id = $2',
    p_stat_name, p_stat_name)
  USING p_amount, p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

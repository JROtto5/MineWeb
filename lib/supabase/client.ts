import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// DATABASE TYPES
// ============================================

export interface UserProfile {
  id: string
  display_name: string
  created_at?: string
  updated_at?: string

  // Cross-game synergy stats (cached)
  slayer_highest_floor: number
  slayer_games_won: number
  clicker_total_prestiges: number
  clicker_total_dots: number
  synergy_bonus: number
}

export interface SlayerSave {
  id?: string
  user_id: string
  save_slot: number
  player_data: {
    level: number
    money: number
    xp: number
    health: number
    maxHealth: number
    skillPoints: number
    skills: Record<string, number>
    shopItems: Record<string, number>
    currentWeapon: number
  }
  floor_number: number
  is_alive: boolean
  run_stats?: {
    totalKills?: number
    totalMoney?: number
    highestCombo?: number
    bossesKilled?: number
    startTime?: number
  }
  created_at?: string
  updated_at?: string
}

export interface SlayerProgress {
  id?: string
  user_id: string
  highest_floor: number
  total_floors_cleared: number
  games_won: number
  total_runs: number
  total_kills: number
  total_bosses_killed: number
  total_play_time: number
  best_score: number
  fastest_win_time: number | null
  last_played?: string
  created_at?: string
  updated_at?: string
}

export interface ClickerSave {
  id?: string
  user_id: string

  // Core game state
  dots: number
  total_dots: number
  total_clicks: number

  // Multipliers
  dots_per_click: number
  crit_chance: number
  crit_multiplier: number
  golden_dot_chance: number
  global_multiplier: number
  combo_multiplier: number
  offline_multiplier: number

  // Prestige
  prestige_points: number
  prestige_multiplier: number
  total_prestiges: number

  // Buildings, upgrades, achievements as JSONB
  buildings: Array<{ id: string; owned: number }>
  upgrades: Array<{ id: string; purchased: boolean }>
  achievements: Array<{ id: string; unlocked: boolean }>
  prestige_upgrades: Array<{ id: string; purchased: boolean }>

  // Statistics
  stats: {
    totalGoldenClicks: number
    totalCrits: number
    highestDps: number
    maxCombo: number
    startTime: number
  }

  // Cross-game synergy
  slayer_floors_cleared: number
  synergy_bonus: number

  last_save?: string
  created_at?: string
  updated_at?: string
}

export interface LeaderboardEntry {
  id?: string
  user_id: string
  display_name: string
  score: number
  floor_reached: number
  kills: number
  time_played: number
  was_victory: boolean
  run_data?: Record<string, any>
  created_at?: string
}

// ============================================
// DAILY CHALLENGES TYPES
// ============================================

export interface DailyChallengeProgress {
  challengeId: string
  progress: number
  completed: boolean
  claimed: boolean
}

export interface DailyChallengeRecord {
  id?: string
  user_id: string
  challenge_date: string
  challenges: DailyChallengeProgress[]
  streak: number
  last_completed_date: string | null
  created_at?: string
  updated_at?: string
}

// ============================================
// ACHIEVEMENTS TYPES
// ============================================

export interface AchievementRecord {
  id?: string
  user_id: string
  unlocked: string[] // Array of achievement IDs
  unlocked_count: number
  created_at?: string
  updated_at?: string
}

// ============================================
// SLAYER STATS TYPES
// ============================================

export interface SlayerStats {
  id?: string
  user_id: string

  // Lifetime stats
  total_kills: number
  total_damage_dealt: number
  total_gold_earned: number
  total_gold_spent: number
  total_floors_completed: number
  total_bosses_killed: number
  total_elite_kills: number
  total_critical_hits: number
  total_items_collected: number
  total_legendaries_collected: number
  total_weapons_switched: number
  total_shop_upgrades: number
  total_deaths: number
  total_play_time: number

  // Best records
  highest_combo: number
  highest_floor: number
  best_score: number
  fastest_win_time: number | null
  most_kills_in_run: number
  highest_damage_in_run: number
  most_gold_in_run: number

  // Perfect floor tracking
  floors_without_damage: number

  created_at?: string
  updated_at?: string
}

// Legacy types for backward compatibility
export type SaveData = SlayerSave

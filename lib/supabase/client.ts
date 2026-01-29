import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface SaveData {
  id?: string
  user_id: string  // Auth user ID (replaces player_name as primary identifier)
  player_name?: string  // Kept for backward compatibility
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
  stage_number: number
  is_alive: boolean
  timestamp?: string
}

export interface LeaderboardEntry {
  id?: string
  user_id: string  // Auth user ID
  display_name: string  // Display name (from auth metadata or user input)
  player_name?: string  // Kept for backward compatibility
  score: number
  stage_reached: number
  kills: number
  time_played: number
  timestamp?: string
}

import { supabase, LeaderboardEntry } from './client'

export class LeaderboardService {
  private static instance: LeaderboardService

  private constructor() {}

  static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService()
    }
    return LeaderboardService.instance
  }

  // Submit score to leaderboard
  async submitScore(
    userId: string,
    displayName: string,
    score: number,
    floorReached: number,
    kills: number,
    timePlayed: number,
    wasVictory: boolean = false,
    runData?: Record<string, any>
  ): Promise<{ success: boolean; message: string; rank?: number }> {
    try {
      const entry: LeaderboardEntry = {
        user_id: userId,
        display_name: displayName,
        score: score,
        floor_reached: floorReached,
        kills: kills,
        time_played: timePlayed,
        was_victory: wasVictory,
        run_data: runData || {}
      }

      const { error } = await supabase.from('leaderboard').insert(entry)

      if (error) throw error

      // Get player's rank
      const rank = await this.getPlayerRank(score)

      return {
        success: true,
        message: wasVictory
          ? `Victory! You ranked #${rank}!`
          : `Score submitted! You ranked #${rank}`,
        rank: rank,
      }
    } catch (error: any) {
      console.error('Submit score error:', error)
      return {
        success: false,
        message: `Failed to submit: ${error.message}`,
      }
    }
  }

  // Get top scores
  async getTopScores(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as LeaderboardEntry[]) || []
    } catch (error) {
      console.error('Get top scores error:', error)
      return []
    }
  }

  // Get top scores by floor
  async getTopByFloor(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('floor_reached', { ascending: false })
        .order('score', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as LeaderboardEntry[]) || []
    } catch (error) {
      console.error('Get top by floor error:', error)
      return []
    }
  }

  // Get victories only
  async getVictories(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('was_victory', true)
        .order('score', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as LeaderboardEntry[]) || []
    } catch (error) {
      console.error('Get victories error:', error)
      return []
    }
  }

  // Get player's rank
  async getPlayerRank(score: number): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('leaderboard')
        .select('*', { count: 'exact', head: true })
        .gt('score', score)

      if (error) throw error
      return (count || 0) + 1
    } catch (error) {
      console.error('Get rank error:', error)
      return 0
    }
  }

  // Get player's best score
  async getPlayerBest(userId: string): Promise<LeaderboardEntry | null> {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('user_id', userId)
        .order('score', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as LeaderboardEntry
    } catch (error) {
      console.error('Get player best error:', error)
      return null
    }
  }

  // Get player's all scores
  async getPlayerScores(userId: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as LeaderboardEntry[]) || []
    } catch (error) {
      console.error('Get player scores error:', error)
      return []
    }
  }

  // Get scores from today
  async getTodayScores(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .gte('created_at', today.toISOString())
        .order('score', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as LeaderboardEntry[]) || []
    } catch (error) {
      console.error('Get today scores error:', error)
      return []
    }
  }

  // Get scores from this week
  async getWeekScores(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .gte('created_at', weekAgo.toISOString())
        .order('score', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as LeaderboardEntry[]) || []
    } catch (error) {
      console.error('Get week scores error:', error)
      return []
    }
  }
}

export const leaderboardService = LeaderboardService.getInstance()

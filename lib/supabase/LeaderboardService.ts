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

  // Submit score to leaderboard (NOW USES user_id and display_name)
  async submitScore(
    userId: string,
    displayName: string,
    score: number,
    stageReached: number,
    kills: number,
    timePlayed: number
  ): Promise<{ success: boolean; message: string; rank?: number }> {
    try {
      const entry: LeaderboardEntry = {
        user_id: userId,
        display_name: displayName,
        score: score,
        stage_reached: stageReached,
        kills: kills,
        time_played: timePlayed,
      }

      const { error } = await supabase.from('leaderboard').insert(entry)

      if (error) throw error

      // Get player's rank
      const rank = await this.getPlayerRank(score)

      return {
        success: true,
        message: `Score submitted! You ranked #${rank}`,
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

  // Get top scores by stage
  async getTopByStage(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('stage_reached', { ascending: false })
        .order('score', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as LeaderboardEntry[]) || []
    } catch (error) {
      console.error('Get top by stage error:', error)
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

  // Get player's best score (NOW USES user_id)
  async getPlayerBest(userId: string): Promise<LeaderboardEntry | null> {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('user_id', userId)
        .order('score', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error
      return data as LeaderboardEntry
    } catch (error) {
      console.error('Get player best error:', error)
      return null
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
        .gte('timestamp', today.toISOString())
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
        .gte('timestamp', weekAgo.toISOString())
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

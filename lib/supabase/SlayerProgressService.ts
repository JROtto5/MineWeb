import { supabase, SlayerProgress } from './client'

export class SlayerProgressService {
  private static instance: SlayerProgressService

  private constructor() {}

  static getInstance(): SlayerProgressService {
    if (!SlayerProgressService.instance) {
      SlayerProgressService.instance = new SlayerProgressService()
    }
    return SlayerProgressService.instance
  }

  // Update progress when a floor is cleared
  async updateFloorProgress(
    userId: string,
    floorNumber: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get current progress
      const { data: existing } = await supabase
        .from('slayer_progress')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (existing) {
        // Update existing progress
        const { error } = await supabase
          .from('slayer_progress')
          .update({
            highest_floor: Math.max(existing.highest_floor, floorNumber),
            total_floors_cleared: existing.total_floors_cleared + 1,
            last_played: new Date().toISOString()
          })
          .eq('user_id', userId)

        if (error) throw error
      } else {
        // Create new progress record
        const { error } = await supabase
          .from('slayer_progress')
          .insert({
            user_id: userId,
            highest_floor: floorNumber,
            total_floors_cleared: 1,
            total_runs: 1,
            last_played: new Date().toISOString()
          })

        if (error) throw error
      }

      // Also update localStorage for immediate cross-game sync
      this.updateLocalStorage(userId, floorNumber, false)

      return {
        success: true,
        message: `Progress saved: Floor ${floorNumber}`
      }
    } catch (error: any) {
      console.error('Progress update error:', error)
      return {
        success: false,
        message: `Failed to update progress: ${error.message}`
      }
    }
  }

  // Update progress when game is won
  async recordVictory(
    userId: string,
    runStats: {
      score: number
      kills: number
      bossesKilled: number
      playTime: number
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { data: existing } = await supabase
        .from('slayer_progress')
        .select('*')
        .eq('user_id', userId)
        .single()

      const updateData: Partial<SlayerProgress> = {
        highest_floor: 100,
        games_won: (existing?.games_won || 0) + 1,
        total_kills: (existing?.total_kills || 0) + runStats.kills,
        total_bosses_killed: (existing?.total_bosses_killed || 0) + runStats.bossesKilled,
        total_play_time: (existing?.total_play_time || 0) + runStats.playTime,
        best_score: Math.max(existing?.best_score || 0, runStats.score),
        last_played: new Date().toISOString()
      }

      // Update fastest win time if applicable
      if (!existing?.fastest_win_time || runStats.playTime < existing.fastest_win_time) {
        updateData.fastest_win_time = runStats.playTime
      }

      if (existing) {
        const { error } = await supabase
          .from('slayer_progress')
          .update(updateData)
          .eq('user_id', userId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('slayer_progress')
          .insert({
            user_id: userId,
            ...updateData,
            total_runs: 1
          })

        if (error) throw error
      }

      // Update localStorage
      this.updateLocalStorage(userId, 100, true)

      return {
        success: true,
        message: 'Victory recorded!'
      }
    } catch (error: any) {
      console.error('Victory record error:', error)
      return {
        success: false,
        message: `Failed to record victory: ${error.message}`
      }
    }
  }

  // Record a death/run end
  async recordRunEnd(
    userId: string,
    runStats: {
      floorReached: number
      score: number
      kills: number
      bossesKilled: number
      playTime: number
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { data: existing } = await supabase
        .from('slayer_progress')
        .select('*')
        .eq('user_id', userId)
        .single()

      const updateData: Partial<SlayerProgress> = {
        highest_floor: Math.max(existing?.highest_floor || 0, runStats.floorReached),
        total_runs: (existing?.total_runs || 0) + 1,
        total_kills: (existing?.total_kills || 0) + runStats.kills,
        total_bosses_killed: (existing?.total_bosses_killed || 0) + runStats.bossesKilled,
        total_play_time: (existing?.total_play_time || 0) + runStats.playTime,
        best_score: Math.max(existing?.best_score || 0, runStats.score),
        last_played: new Date().toISOString()
      }

      if (existing) {
        const { error } = await supabase
          .from('slayer_progress')
          .update(updateData)
          .eq('user_id', userId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('slayer_progress')
          .insert({
            user_id: userId,
            ...updateData
          })

        if (error) throw error
      }

      return {
        success: true,
        message: 'Run stats recorded'
      }
    } catch (error: any) {
      console.error('Run end record error:', error)
      return {
        success: false,
        message: `Failed to record run: ${error.message}`
      }
    }
  }

  // Get progress for a user
  async getProgress(userId: string): Promise<SlayerProgress | null> {
    try {
      const { data, error } = await supabase
        .from('slayer_progress')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error || !data) return null
      return data as SlayerProgress
    } catch (error) {
      console.error('Get progress error:', error)
      return null
    }
  }

  // Get synergy bonus for Dot Clicker
  async getClickerSynergyBonus(userId: string): Promise<number> {
    const progress = await this.getProgress(userId)
    if (!progress) return 0

    // 1% bonus per floor cleared + 10% per game won
    return (progress.highest_floor * 0.01) + (progress.games_won * 0.1)
  }

  // Update localStorage for immediate cross-game sync
  private updateLocalStorage(userId: string, floorNumber: number, isVictory: boolean) {
    try {
      if (typeof localStorage === 'undefined') return

      const existing = JSON.parse(localStorage.getItem('dotslayer_progress') || '{}')
      const updated = {
        ...existing,
        floorsCleared: floorNumber,
        highestFloor: Math.max(existing.highestFloor || 0, floorNumber),
        gamesWon: isVictory ? (existing.gamesWon || 0) + 1 : (existing.gamesWon || 0),
        lastPlayed: Date.now()
      }
      localStorage.setItem('dotslayer_progress', JSON.stringify(updated))
    } catch (e) {
      console.warn('Failed to update localStorage:', e)
    }
  }
}

export const slayerProgressService = SlayerProgressService.getInstance()

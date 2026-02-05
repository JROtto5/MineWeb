import { supabase, SlayerStats } from './client'

export interface RunStats {
  kills: number
  damageDealt: number
  goldEarned: number
  goldSpent: number
  floorsCompleted: number
  bossesKilled: number
  eliteKills: number
  criticalHits: number
  itemsCollected: number
  legendariesCollected: number
  weaponsSwitched: number
  shopUpgrades: number
  highestCombo: number
  score: number
  playTime: number
  floorsWithoutDamage: number
  wasVictory: boolean
}

export class SlayerStatsService {
  private static instance: SlayerStatsService

  private constructor() {}

  static getInstance(): SlayerStatsService {
    if (!SlayerStatsService.instance) {
      SlayerStatsService.instance = new SlayerStatsService()
    }
    return SlayerStatsService.instance
  }

  // Get user's stats
  async getStats(userId: string): Promise<SlayerStats | null> {
    try {
      const { data, error } = await supabase
        .from('slayer_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        // Create default stats
        await this.ensureRecord(userId)
        return this.getDefaultStats(userId)
      }

      return data as SlayerStats
    } catch (error) {
      console.error('Get stats error:', error)
      return null
    }
  }

  private getDefaultStats(userId: string): SlayerStats {
    return {
      user_id: userId,
      total_kills: 0,
      total_damage_dealt: 0,
      total_gold_earned: 0,
      total_gold_spent: 0,
      total_floors_completed: 0,
      total_bosses_killed: 0,
      total_elite_kills: 0,
      total_critical_hits: 0,
      total_items_collected: 0,
      total_legendaries_collected: 0,
      total_weapons_switched: 0,
      total_shop_upgrades: 0,
      total_deaths: 0,
      total_play_time: 0,
      highest_combo: 0,
      highest_floor: 0,
      best_score: 0,
      fastest_win_time: null,
      most_kills_in_run: 0,
      highest_damage_in_run: 0,
      most_gold_in_run: 0,
      floors_without_damage: 0
    }
  }

  private async ensureRecord(userId: string): Promise<void> {
    try {
      await supabase
        .from('slayer_stats')
        .upsert(this.getDefaultStats(userId), {
          onConflict: 'user_id'
        })
    } catch (error) {
      console.error('Ensure stats record error:', error)
    }
  }

  // Record end of run stats
  async recordRunEnd(userId: string, runStats: RunStats): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('slayer_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      const existing = (data as SlayerStats) || this.getDefaultStats(userId)

      const updates: Partial<SlayerStats> = {
        // Increment totals
        total_kills: existing.total_kills + runStats.kills,
        total_damage_dealt: existing.total_damage_dealt + runStats.damageDealt,
        total_gold_earned: existing.total_gold_earned + runStats.goldEarned,
        total_gold_spent: existing.total_gold_spent + runStats.goldSpent,
        total_floors_completed: existing.total_floors_completed + runStats.floorsCompleted,
        total_bosses_killed: existing.total_bosses_killed + runStats.bossesKilled,
        total_elite_kills: existing.total_elite_kills + runStats.eliteKills,
        total_critical_hits: existing.total_critical_hits + runStats.criticalHits,
        total_items_collected: existing.total_items_collected + runStats.itemsCollected,
        total_legendaries_collected: existing.total_legendaries_collected + runStats.legendariesCollected,
        total_weapons_switched: existing.total_weapons_switched + runStats.weaponsSwitched,
        total_shop_upgrades: existing.total_shop_upgrades + runStats.shopUpgrades,
        total_play_time: existing.total_play_time + runStats.playTime,
        floors_without_damage: existing.floors_without_damage + runStats.floorsWithoutDamage,

        // Track death
        total_deaths: runStats.wasVictory ? existing.total_deaths : existing.total_deaths + 1,

        // Update records
        highest_combo: Math.max(existing.highest_combo, runStats.highestCombo),
        highest_floor: Math.max(existing.highest_floor, runStats.floorsCompleted),
        best_score: Math.max(existing.best_score, runStats.score),
        most_kills_in_run: Math.max(existing.most_kills_in_run, runStats.kills),
        highest_damage_in_run: Math.max(existing.highest_damage_in_run, runStats.damageDealt),
        most_gold_in_run: Math.max(existing.most_gold_in_run, runStats.goldEarned),
      }

      // Update fastest win time if victory
      if (runStats.wasVictory) {
        if (!existing.fastest_win_time || runStats.playTime < existing.fastest_win_time) {
          updates.fastest_win_time = runStats.playTime
        }
      }

      const { error } = await supabase
        .from('slayer_stats')
        .upsert({
          ...existing,
          ...updates,
          user_id: userId // Ensure user_id is set last to override any from spread
        }, {
          onConflict: 'user_id'
        })

      return !error
    } catch (error) {
      console.error('Record run end error:', error)
      return false
    }
  }

  // Increment a specific stat (for real-time tracking)
  async incrementStat(
    userId: string,
    stat: keyof SlayerStats,
    amount: number = 1
  ): Promise<boolean> {
    try {
      // Use RPC if available, otherwise do manual update
      const { data } = await supabase
        .from('slayer_stats')
        .select(stat)
        .eq('user_id', userId)
        .single()

      if (!data) {
        await this.ensureRecord(userId)
      }

      const record = data as Record<string, unknown> | null
      const currentValue = (record?.[stat] as number) || 0
      const newValue = currentValue + amount

      const { error } = await supabase
        .from('slayer_stats')
        .update({ [stat]: newValue })
        .eq('user_id', userId)

      return !error
    } catch (error) {
      console.error('Increment stat error:', error)
      return false
    }
  }

  // Update a record stat (only if new value is higher)
  async updateRecord(
    userId: string,
    stat: keyof SlayerStats,
    value: number
  ): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('slayer_stats')
        .select(stat)
        .eq('user_id', userId)
        .single()

      if (!data) {
        await this.ensureRecord(userId)
      }

      const record = data as Record<string, unknown> | null
      const currentValue = (record?.[stat] as number) || 0

      if (value > currentValue) {
        const { error } = await supabase
          .from('slayer_stats')
          .update({ [stat]: value })
          .eq('user_id', userId)

        return !error
      }

      return true // No update needed
    } catch (error) {
      console.error('Update record error:', error)
      return false
    }
  }

  // Get stats leaderboard
  async getLeaderboard(
    stat: keyof SlayerStats,
    limit: number = 10
  ): Promise<Array<{ user_id: string; value: number }>> {
    try {
      const { data, error } = await supabase
        .from('slayer_stats')
        .select(`user_id, ${stat}`)
        .order(stat, { ascending: false })
        .limit(limit)

      if (error || !data) return []

      return data.map(row => {
        const record = row as Record<string, unknown>
        return {
          user_id: record.user_id as string,
          value: (record[stat] as number) || 0
        }
      })
    } catch (error) {
      console.error('Get stats leaderboard error:', error)
      return []
    }
  }

  // Get formatted stats for display
  async getFormattedStats(userId: string): Promise<{
    lifetime: {
      kills: string
      damage: string
      gold: string
      floors: string
      bosses: string
      playtime: string
    }
    records: {
      highestCombo: number
      highestFloor: number
      bestScore: string
      fastestWin: string
    }
  } | null> {
    const stats = await this.getStats(userId)
    if (!stats) return null

    const formatNumber = (n: number): string => {
      if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
      if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
      return n.toString()
    }

    const formatTime = (seconds: number | null): string => {
      if (!seconds) return 'N/A'
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}m ${secs}s`
    }

    return {
      lifetime: {
        kills: formatNumber(stats.total_kills),
        damage: formatNumber(stats.total_damage_dealt),
        gold: formatNumber(stats.total_gold_earned),
        floors: formatNumber(stats.total_floors_completed),
        bosses: formatNumber(stats.total_bosses_killed),
        playtime: formatTime(stats.total_play_time)
      },
      records: {
        highestCombo: stats.highest_combo,
        highestFloor: stats.highest_floor,
        bestScore: formatNumber(stats.best_score),
        fastestWin: formatTime(stats.fastest_win_time)
      }
    }
  }
}

export const slayerStatsService = SlayerStatsService.getInstance()

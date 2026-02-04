import { supabase, ClickerSave, SlayerProgress } from './client'

export interface PrestigeUpgradeState {
  id: string
  purchased: boolean
}

export interface ClickerGameState {
  dots: number
  totalDots: number
  totalClicks: number
  dotsPerClick: number
  dotsPerSecond: number
  critChance: number
  critMultiplier: number
  goldenDotChance: number
  globalMultiplier: number
  prestigePoints: number
  prestigeMultiplier: number
  buildings: Array<{ id: string; owned: number }>
  upgrades: Array<{ id: string; purchased: boolean }>
  achievements: Array<{ id: string; unlocked: boolean }>
  prestigeUpgrades: Array<PrestigeUpgradeState>
  lastSave: number
  startTime: number
  combo: number
  maxCombo: number
  comboTimer: number
  comboMultiplier: number
  offlineMultiplier: number
  totalGoldenClicks: number
  totalCrits: number
  totalPrestiges: number
  highestDps: number
  slayerFloorsCleared: number
  synergyBonus: number
}

export class ClickerSyncService {
  private static instance: ClickerSyncService

  private constructor() {}

  static getInstance(): ClickerSyncService {
    if (!ClickerSyncService.instance) {
      ClickerSyncService.instance = new ClickerSyncService()
    }
    return ClickerSyncService.instance
  }

  // Save clicker game to cloud
  async saveToCloud(
    userId: string,
    gameState: ClickerGameState
  ): Promise<{ success: boolean; message: string }> {
    try {
      const saveData: Partial<ClickerSave> = {
        user_id: userId,
        dots: gameState.dots,
        total_dots: gameState.totalDots,
        total_clicks: gameState.totalClicks,
        dots_per_click: gameState.dotsPerClick,
        crit_chance: gameState.critChance,
        crit_multiplier: gameState.critMultiplier,
        golden_dot_chance: gameState.goldenDotChance,
        global_multiplier: gameState.globalMultiplier,
        combo_multiplier: gameState.comboMultiplier,
        offline_multiplier: gameState.offlineMultiplier,
        prestige_points: gameState.prestigePoints,
        prestige_multiplier: gameState.prestigeMultiplier,
        total_prestiges: gameState.totalPrestiges,
        buildings: gameState.buildings.map(b => ({ id: b.id, owned: b.owned })),
        upgrades: gameState.upgrades.map(u => ({ id: u.id, purchased: u.purchased })),
        achievements: gameState.achievements.map(a => ({ id: a.id, unlocked: a.unlocked })),
        prestige_upgrades: gameState.prestigeUpgrades?.map(u => ({ id: u.id, purchased: u.purchased })) || [],
        stats: {
          totalGoldenClicks: gameState.totalGoldenClicks,
          totalCrits: gameState.totalCrits,
          highestDps: gameState.highestDps,
          maxCombo: gameState.maxCombo,
          startTime: gameState.startTime
        },
        slayer_floors_cleared: gameState.slayerFloorsCleared,
        synergy_bonus: gameState.synergyBonus,
        last_save: new Date().toISOString()
      }

      // Upsert - insert or update based on user_id
      const { error } = await supabase
        .from('clicker_saves')
        .upsert(saveData, { onConflict: 'user_id' })

      if (error) throw error

      return {
        success: true,
        message: 'Game saved to cloud!'
      }
    } catch (error: any) {
      console.error('Cloud save error:', error)
      return {
        success: false,
        message: `Failed to save: ${error.message}`
      }
    }
  }

  // Load clicker game from cloud
  async loadFromCloud(
    userId: string
  ): Promise<{ success: boolean; data?: ClickerGameState; message: string }> {
    try {
      const { data, error } = await supabase
        .from('clicker_saves')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found - not an error, just no save
          return {
            success: false,
            message: 'No cloud save found'
          }
        }
        throw error
      }

      if (!data) {
        return {
          success: false,
          message: 'No cloud save found'
        }
      }

      // Convert database format to game state
      const gameState: ClickerGameState = {
        dots: Number(data.dots),
        totalDots: Number(data.total_dots),
        totalClicks: Number(data.total_clicks),
        dotsPerClick: Number(data.dots_per_click),
        dotsPerSecond: 0, // Calculated dynamically
        critChance: Number(data.crit_chance),
        critMultiplier: Number(data.crit_multiplier),
        goldenDotChance: Number(data.golden_dot_chance),
        globalMultiplier: Number(data.global_multiplier),
        prestigePoints: data.prestige_points,
        prestigeMultiplier: Number(data.prestige_multiplier),
        buildings: data.buildings || [],
        upgrades: data.upgrades || [],
        achievements: data.achievements || [],
        prestigeUpgrades: data.prestige_upgrades || [],
        lastSave: new Date(data.last_save || data.updated_at).getTime(),
        startTime: data.stats?.startTime || Date.now(),
        combo: 0,
        maxCombo: data.stats?.maxCombo || 0,
        comboTimer: 0,
        comboMultiplier: Number(data.combo_multiplier),
        offlineMultiplier: Number(data.offline_multiplier),
        totalGoldenClicks: data.stats?.totalGoldenClicks || 0,
        totalCrits: data.stats?.totalCrits || 0,
        totalPrestiges: data.total_prestiges,
        highestDps: data.stats?.highestDps || 0,
        slayerFloorsCleared: data.slayer_floors_cleared,
        synergyBonus: Number(data.synergy_bonus)
      }

      return {
        success: true,
        data: gameState,
        message: 'Game loaded from cloud!'
      }
    } catch (error: any) {
      console.error('Cloud load error:', error)
      return {
        success: false,
        message: `Failed to load: ${error.message}`
      }
    }
  }

  // Get synergy data from DotSlayer progress
  async getSlayerSynergy(
    userId: string
  ): Promise<{ floorsCleared: number; gamesWon: number; synergyBonus: number }> {
    try {
      const { data, error } = await supabase
        .from('slayer_progress')
        .select('highest_floor, games_won')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        return { floorsCleared: 0, gamesWon: 0, synergyBonus: 0 }
      }

      return {
        floorsCleared: data.highest_floor || 0,
        gamesWon: data.games_won || 0,
        synergyBonus: (data.highest_floor || 0) * 0.01 // 1% per floor
      }
    } catch (error) {
      console.error('Failed to get slayer synergy:', error)
      return { floorsCleared: 0, gamesWon: 0, synergyBonus: 0 }
    }
  }

  // Calculate offline earnings
  calculateOfflineEarnings(
    lastSave: number,
    dps: number,
    offlineMultiplier: number
  ): number {
    const now = Date.now()
    const offlineSeconds = Math.floor((now - lastSave) / 1000)

    // Max 24 hours of offline earnings
    const maxOfflineSeconds = 24 * 60 * 60
    const effectiveSeconds = Math.min(offlineSeconds, maxOfflineSeconds)

    if (effectiveSeconds < 10) return 0

    // Base offline rate is 50%, plus upgrades
    const offlineRate = 0.5 + offlineMultiplier
    return dps * effectiveSeconds * offlineRate
  }

  // Check if cloud save is newer than local
  async shouldLoadFromCloud(userId: string, localLastSave: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('clicker_saves')
        .select('last_save')
        .eq('user_id', userId)
        .single()

      if (error || !data) return false

      const cloudLastSave = new Date(data.last_save).getTime()
      return cloudLastSave > localLastSave
    } catch {
      return false
    }
  }
}

export const clickerSyncService = ClickerSyncService.getInstance()

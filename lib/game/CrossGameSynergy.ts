/**
 * CrossGameSynergy - Unified system for cross-game bonuses and integration
 * Connects Dot Clicker and DotSlayer with bidirectional bonuses
 */

export interface SynergyBonuses {
  // Clicker -> Slayer bonuses
  slayerDamageBonus: number      // % damage boost
  slayerHealthBonus: number      // Flat HP bonus
  slayerStartingMoney: number    // Starting cash
  slayerXPBonus: number          // % XP boost

  // Slayer -> Clicker bonuses
  clickerDPSBonus: number        // % DPS boost
  clickerClickBonus: number      // Flat click damage
  clickerGoldenChance: number    // % golden dot chance
  clickerOfflineBonus: number    // % offline earnings

  // Shared unlocks
  unlockedAchievements: string[]
  totalPlaytime: number
  crossGameLevel: number
}

export interface SlayerStats {
  highestFloor: number
  totalKills: number
  bossesKilled: number
  gamesWon: number
  totalPlaytime: number
}

export interface ClickerStats {
  totalPrestiges: number
  totalDots: number
  highestDPS: number
  totalClicks: number
  totalPlaytime: number
}

const SYNERGY_KEYS = {
  SLAYER_STATS: 'dotslayer_synergy_stats',
  CLICKER_STATS: 'dotclicker_synergy_stats',
  CROSS_GAME_LEVEL: 'dot_universe_level'
}

export class CrossGameSynergyService {
  private static instance: CrossGameSynergyService

  private constructor() {}

  static getInstance(): CrossGameSynergyService {
    if (!CrossGameSynergyService.instance) {
      CrossGameSynergyService.instance = new CrossGameSynergyService()
    }
    return CrossGameSynergyService.instance
  }

  // Save Slayer stats for synergy calculation
  saveSlayerStats(stats: SlayerStats): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SYNERGY_KEYS.SLAYER_STATS, JSON.stringify(stats))
      this.updateCrossGameLevel()
    }
  }

  // Save Clicker stats for synergy calculation
  saveClickerStats(stats: ClickerStats): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SYNERGY_KEYS.CLICKER_STATS, JSON.stringify(stats))
      this.updateCrossGameLevel()
    }
  }

  // Get Slayer stats
  getSlayerStats(): SlayerStats {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(SYNERGY_KEYS.SLAYER_STATS)
      if (stored) {
        return JSON.parse(stored)
      }
    }
    return {
      highestFloor: 0,
      totalKills: 0,
      bossesKilled: 0,
      gamesWon: 0,
      totalPlaytime: 0
    }
  }

  // Get Clicker stats
  getClickerStats(): ClickerStats {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(SYNERGY_KEYS.CLICKER_STATS)
      if (stored) {
        return JSON.parse(stored)
      }
    }
    return {
      totalPrestiges: 0,
      totalDots: 0,
      highestDPS: 0,
      totalClicks: 0,
      totalPlaytime: 0
    }
  }

  // Calculate all synergy bonuses
  calculateBonuses(): SynergyBonuses {
    const slayerStats = this.getSlayerStats()
    const clickerStats = this.getClickerStats()

    // Clicker -> Slayer bonuses
    // 5% damage per prestige, capped at 100%
    const slayerDamageBonus = Math.min(clickerStats.totalPrestiges * 0.05, 1.0)
    // 10 HP per billion dots earned
    const slayerHealthBonus = Math.floor(clickerStats.totalDots / 1000000000) * 10
    // 100 starting cash per prestige
    const slayerStartingMoney = clickerStats.totalPrestiges * 100
    // 2% XP boost per prestige, capped at 50%
    const slayerXPBonus = Math.min(clickerStats.totalPrestiges * 0.02, 0.5)

    // Slayer -> Clicker bonuses
    // 1% DPS per floor cleared, capped at 100%
    const clickerDPSBonus = Math.min(slayerStats.highestFloor * 0.01, 1.0)
    // 1 click damage per 100 kills
    const clickerClickBonus = Math.floor(slayerStats.totalKills / 100)
    // 0.5% golden chance per boss killed, capped at 10%
    const clickerGoldenChance = Math.min(slayerStats.bossesKilled * 0.005, 0.1)
    // 5% offline bonus per game won, capped at 50%
    const clickerOfflineBonus = Math.min(slayerStats.gamesWon * 0.05, 0.5)

    // Calculate cross-game level
    const crossGameLevel = this.calculateCrossGameLevel(slayerStats, clickerStats)

    return {
      slayerDamageBonus,
      slayerHealthBonus,
      slayerStartingMoney,
      slayerXPBonus,
      clickerDPSBonus,
      clickerClickBonus,
      clickerGoldenChance,
      clickerOfflineBonus,
      unlockedAchievements: this.getSharedAchievements(slayerStats, clickerStats),
      totalPlaytime: slayerStats.totalPlaytime + clickerStats.totalPlaytime,
      crossGameLevel
    }
  }

  // Calculate cross-game level (combined progress)
  private calculateCrossGameLevel(slayer: SlayerStats, clicker: ClickerStats): number {
    let points = 0

    // Slayer contributions
    points += slayer.highestFloor * 10
    points += slayer.totalKills
    points += slayer.bossesKilled * 50
    points += slayer.gamesWon * 100

    // Clicker contributions
    points += clicker.totalPrestiges * 100
    points += Math.log10(Math.max(1, clicker.totalDots)) * 10
    points += Math.floor(clicker.totalClicks / 1000)

    // Convert points to level (sqrt scaling)
    return Math.floor(Math.sqrt(points / 100)) + 1
  }

  // Update cross-game level in storage
  private updateCrossGameLevel(): void {
    const bonuses = this.calculateBonuses()
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SYNERGY_KEYS.CROSS_GAME_LEVEL, bonuses.crossGameLevel.toString())
    }
  }

  // Get shared achievements based on combined progress
  private getSharedAchievements(slayer: SlayerStats, clicker: ClickerStats): string[] {
    const achievements: string[] = []

    // Slayer achievements
    if (slayer.highestFloor >= 10) achievements.push('FLOOR_MASTER_10')
    if (slayer.highestFloor >= 25) achievements.push('FLOOR_MASTER_25')
    if (slayer.highestFloor >= 50) achievements.push('FLOOR_MASTER_50')
    if (slayer.totalKills >= 1000) achievements.push('SLAYER_1K')
    if (slayer.totalKills >= 10000) achievements.push('SLAYER_10K')
    if (slayer.bossesKilled >= 10) achievements.push('BOSS_HUNTER')
    if (slayer.gamesWon >= 1) achievements.push('FIRST_VICTORY')

    // Clicker achievements
    if (clicker.totalPrestiges >= 1) achievements.push('FIRST_PRESTIGE')
    if (clicker.totalPrestiges >= 10) achievements.push('PRESTIGE_MASTER')
    if (clicker.totalDots >= 1000000000) achievements.push('BILLIONAIRE')
    if (clicker.totalClicks >= 10000) achievements.push('CLICK_MASTER')

    // Combined achievements
    if (slayer.highestFloor >= 10 && clicker.totalPrestiges >= 1) {
      achievements.push('UNIVERSE_EXPLORER')
    }
    if (slayer.bossesKilled >= 5 && clicker.totalPrestiges >= 5) {
      achievements.push('DUAL_MASTER')
    }

    return achievements
  }

  // Get formatted bonus text for UI display
  getBonusDisplayText(): string[] {
    const bonuses = this.calculateBonuses()
    const lines: string[] = []

    lines.push(`🌌 DOT UNIVERSE LEVEL ${bonuses.crossGameLevel}`)
    lines.push('')

    if (bonuses.slayerDamageBonus > 0 || bonuses.slayerHealthBonus > 0) {
      lines.push('🎮 Clicker → Slayer:')
      if (bonuses.slayerDamageBonus > 0) {
        lines.push(`  +${Math.round(bonuses.slayerDamageBonus * 100)}% Damage`)
      }
      if (bonuses.slayerHealthBonus > 0) {
        lines.push(`  +${bonuses.slayerHealthBonus} Max HP`)
      }
      if (bonuses.slayerStartingMoney > 0) {
        lines.push(`  +$${bonuses.slayerStartingMoney} Starting Cash`)
      }
      if (bonuses.slayerXPBonus > 0) {
        lines.push(`  +${Math.round(bonuses.slayerXPBonus * 100)}% XP`)
      }
      lines.push('')
    }

    if (bonuses.clickerDPSBonus > 0 || bonuses.clickerClickBonus > 0) {
      lines.push('⚡ Slayer → Clicker:')
      if (bonuses.clickerDPSBonus > 0) {
        lines.push(`  +${Math.round(bonuses.clickerDPSBonus * 100)}% DPS`)
      }
      if (bonuses.clickerClickBonus > 0) {
        lines.push(`  +${bonuses.clickerClickBonus} Click Power`)
      }
      if (bonuses.clickerGoldenChance > 0) {
        lines.push(`  +${(bonuses.clickerGoldenChance * 100).toFixed(1)}% Golden Chance`)
      }
      if (bonuses.clickerOfflineBonus > 0) {
        lines.push(`  +${Math.round(bonuses.clickerOfflineBonus * 100)}% Offline Earnings`)
      }
    }

    return lines
  }
}

export const crossGameSynergy = CrossGameSynergyService.getInstance()

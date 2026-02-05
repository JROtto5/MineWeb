export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition: (stats: GameStats) => boolean
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  color: number
}

export interface GameStats {
  floorsCompleted: number
  totalKills: number
  totalMoney: number
  highestCombo: number
  itemsCollected: number
  legendariesCollected: number
  bossesKilled: number
  deathCount: number
  totalPlayTime: number
  // New stats
  damageDealt: number
  criticalHits: number
  weaponsSwitched: number
  floorsWithoutDamage: number
  enemiesKilledThisRun: number
  goldSpent: number
  shopUpgradesBought: number
  eliteEnemiesKilled: number
}

export const ACHIEVEMENTS: Achievement[] = [
  // Floor progression achievements
  {
    id: 'floor_10',
    name: 'Descent Begins',
    description: 'Reach Floor 10',
    icon: '🔟',
    condition: (stats) => stats.floorsCompleted >= 10,
    tier: 'bronze',
    color: 0xcd7f32
  },
  {
    id: 'floor_25',
    name: 'Deep Dive',
    description: 'Reach Floor 25',
    icon: '🎯',
    condition: (stats) => stats.floorsCompleted >= 25,
    tier: 'silver',
    color: 0xc0c0c0
  },
  {
    id: 'floor_50',
    name: 'Halfway There',
    description: 'Reach Floor 50',
    icon: '⚡',
    condition: (stats) => stats.floorsCompleted >= 50,
    tier: 'gold',
    color: 0xffd700
  },
  {
    id: 'floor_75',
    name: 'The Abyss Calls',
    description: 'Reach Floor 75',
    icon: '💀',
    condition: (stats) => stats.floorsCompleted >= 75,
    tier: 'platinum',
    color: 0x00d9ff
  },
  {
    id: 'floor_100',
    name: 'DotSlayer Legend',
    description: 'Beat all 100 floors!',
    icon: '👑',
    condition: (stats) => stats.floorsCompleted >= 100,
    tier: 'platinum',
    color: 0xff0266
  },

  // Combat achievements
  {
    id: 'kills_100',
    name: 'Dot Destroyer',
    description: 'Kill 100 enemies',
    icon: '💥',
    condition: (stats) => stats.totalKills >= 100,
    tier: 'bronze',
    color: 0xcd7f32
  },
  {
    id: 'kills_500',
    name: 'Massacre',
    description: 'Kill 500 enemies',
    icon: '🔥',
    condition: (stats) => stats.totalKills >= 500,
    tier: 'silver',
    color: 0xc0c0c0
  },
  {
    id: 'kills_1000',
    name: 'Extinction Event',
    description: 'Kill 1000 enemies',
    icon: '☄️',
    condition: (stats) => stats.totalKills >= 1000,
    tier: 'gold',
    color: 0xffd700
  },
  {
    id: 'combo_50',
    name: 'Combo Master',
    description: 'Achieve a 50x combo',
    icon: '🎸',
    condition: (stats) => stats.highestCombo >= 50,
    tier: 'gold',
    color: 0xffd700
  },
  {
    id: 'combo_100',
    name: 'Unstoppable',
    description: 'Achieve a 100x combo!',
    icon: '⚡',
    condition: (stats) => stats.highestCombo >= 100,
    tier: 'platinum',
    color: 0x00d9ff
  },

  // Item collection achievements
  {
    id: 'items_50',
    name: 'Treasure Hunter',
    description: 'Collect 50 items',
    icon: '💎',
    condition: (stats) => stats.itemsCollected >= 50,
    tier: 'bronze',
    color: 0xcd7f32
  },
  {
    id: 'legendaries_5',
    name: 'Lucky Strike',
    description: 'Collect 5 legendary items',
    icon: '✨',
    condition: (stats) => stats.legendariesCollected >= 5,
    tier: 'silver',
    color: 0xc0c0c0
  },
  {
    id: 'legendaries_10',
    name: 'Legendary Collector',
    description: 'Collect 10 legendary items!',
    icon: '🌟',
    condition: (stats) => stats.legendariesCollected >= 10,
    tier: 'gold',
    color: 0xffd700
  },

  // Money achievements
  {
    id: 'money_10k',
    name: 'Getting Rich',
    description: 'Earn $10,000',
    icon: '💰',
    condition: (stats) => stats.totalMoney >= 10000,
    tier: 'bronze',
    color: 0xcd7f32
  },
  {
    id: 'money_50k',
    name: 'Wealthy',
    description: 'Earn $50,000',
    icon: '💵',
    condition: (stats) => stats.totalMoney >= 50000,
    tier: 'silver',
    color: 0xc0c0c0
  },
  {
    id: 'money_100k',
    name: 'Millionaire Dreams',
    description: 'Earn $100,000!',
    icon: '🏦',
    condition: (stats) => stats.totalMoney >= 100000,
    tier: 'gold',
    color: 0xffd700
  },

  // Boss achievements
  {
    id: 'boss_1',
    name: 'First Blood',
    description: 'Defeat your first boss',
    icon: '🎯',
    condition: (stats) => stats.bossesKilled >= 1,
    tier: 'bronze',
    color: 0xcd7f32
  },
  {
    id: 'boss_5',
    name: 'Boss Hunter',
    description: 'Defeat 5 bosses',
    icon: '⚔️',
    condition: (stats) => stats.bossesKilled >= 5,
    tier: 'silver',
    color: 0xc0c0c0
  },
  {
    id: 'boss_10',
    name: 'Boss Slayer',
    description: 'Defeat 10 bosses!',
    icon: '🗡️',
    condition: (stats) => stats.bossesKilled >= 10,
    tier: 'gold',
    color: 0xffd700
  },

  // Challenge achievements
  {
    id: 'no_death_10',
    name: 'Flawless',
    description: 'Reach floor 10 without dying',
    icon: '🛡️',
    condition: (stats) => stats.floorsCompleted >= 10 && stats.deathCount === 0,
    tier: 'gold',
    color: 0xffd700
  },
  {
    id: 'speedrun_30min',
    name: 'Speed Demon',
    description: 'Reach floor 20 in under 30 minutes',
    icon: '⏱️',
    condition: (stats) => stats.floorsCompleted >= 20 && stats.totalPlayTime < 30 * 60,
    tier: 'platinum',
    color: 0x00d9ff
  },

  // Damage achievements
  {
    id: 'damage_10k',
    name: 'Heavy Hitter',
    description: 'Deal 10,000 total damage',
    icon: '💪',
    condition: (stats) => stats.damageDealt >= 10000,
    tier: 'bronze',
    color: 0xcd7f32
  },
  {
    id: 'damage_100k',
    name: 'Devastator',
    description: 'Deal 100,000 total damage',
    icon: '💣',
    condition: (stats) => stats.damageDealt >= 100000,
    tier: 'silver',
    color: 0xc0c0c0
  },
  {
    id: 'damage_1m',
    name: 'Annihilator',
    description: 'Deal 1,000,000 total damage!',
    icon: '☢️',
    condition: (stats) => stats.damageDealt >= 1000000,
    tier: 'gold',
    color: 0xffd700
  },

  // Critical hit achievements
  {
    id: 'crits_50',
    name: 'Critical Thinker',
    description: 'Land 50 critical hits',
    icon: '❗',
    condition: (stats) => stats.criticalHits >= 50,
    tier: 'bronze',
    color: 0xcd7f32
  },
  {
    id: 'crits_200',
    name: 'Precision Strike',
    description: 'Land 200 critical hits',
    icon: '🎯',
    condition: (stats) => stats.criticalHits >= 200,
    tier: 'silver',
    color: 0xc0c0c0
  },
  {
    id: 'crits_500',
    name: 'Critical Master',
    description: 'Land 500 critical hits!',
    icon: '⚡',
    condition: (stats) => stats.criticalHits >= 500,
    tier: 'gold',
    color: 0xffd700
  },

  // Kill streak achievements
  {
    id: 'killstreak_25',
    name: 'On Fire',
    description: 'Kill 25 enemies in one run',
    icon: '🔥',
    condition: (stats) => stats.enemiesKilledThisRun >= 25,
    tier: 'bronze',
    color: 0xcd7f32
  },
  {
    id: 'killstreak_100',
    name: 'Rampage',
    description: 'Kill 100 enemies in one run',
    icon: '😈',
    condition: (stats) => stats.enemiesKilledThisRun >= 100,
    tier: 'silver',
    color: 0xc0c0c0
  },
  {
    id: 'killstreak_300',
    name: 'One Man Army',
    description: 'Kill 300 enemies in one run!',
    icon: '🦾',
    condition: (stats) => stats.enemiesKilledThisRun >= 300,
    tier: 'gold',
    color: 0xffd700
  },
  {
    id: 'killstreak_500',
    name: 'Genocide',
    description: 'Kill 500 enemies in one run!',
    icon: '💀',
    condition: (stats) => stats.enemiesKilledThisRun >= 500,
    tier: 'platinum',
    color: 0x00d9ff
  },

  // Shop achievements
  {
    id: 'shop_5',
    name: 'Window Shopper',
    description: 'Buy 5 shop upgrades',
    icon: '🛒',
    condition: (stats) => stats.shopUpgradesBought >= 5,
    tier: 'bronze',
    color: 0xcd7f32
  },
  {
    id: 'shop_15',
    name: 'Big Spender',
    description: 'Buy 15 shop upgrades',
    icon: '🛍️',
    condition: (stats) => stats.shopUpgradesBought >= 15,
    tier: 'silver',
    color: 0xc0c0c0
  },
  {
    id: 'shop_30',
    name: 'Maxed Out',
    description: 'Buy 30 shop upgrades!',
    icon: '💎',
    condition: (stats) => stats.shopUpgradesBought >= 30,
    tier: 'gold',
    color: 0xffd700
  },

  // Elite enemy achievements
  {
    id: 'elite_5',
    name: 'Elite Hunter',
    description: 'Kill 5 elite enemies',
    icon: '⭐',
    condition: (stats) => stats.eliteEnemiesKilled >= 5,
    tier: 'bronze',
    color: 0xcd7f32
  },
  {
    id: 'elite_20',
    name: 'Elite Slayer',
    description: 'Kill 20 elite enemies',
    icon: '🌟',
    condition: (stats) => stats.eliteEnemiesKilled >= 20,
    tier: 'silver',
    color: 0xc0c0c0
  },
  {
    id: 'elite_50',
    name: 'Elite Nemesis',
    description: 'Kill 50 elite enemies!',
    icon: '✨',
    condition: (stats) => stats.eliteEnemiesKilled >= 50,
    tier: 'gold',
    color: 0xffd700
  },

  // Special achievements
  {
    id: 'perfect_floor',
    name: 'Untouchable',
    description: 'Complete a floor without taking damage',
    icon: '🛡️',
    condition: (stats) => stats.floorsWithoutDamage >= 1,
    tier: 'silver',
    color: 0xc0c0c0
  },
  {
    id: 'perfect_5',
    name: 'Ghost',
    description: 'Complete 5 floors without taking damage',
    icon: '👻',
    condition: (stats) => stats.floorsWithoutDamage >= 5,
    tier: 'gold',
    color: 0xffd700
  },
  {
    id: 'weapon_master',
    name: 'Weapon Master',
    description: 'Switch weapons 50 times',
    icon: '🔫',
    condition: (stats) => stats.weaponsSwitched >= 50,
    tier: 'silver',
    color: 0xc0c0c0
  },
  {
    id: 'kills_5000',
    name: 'Genocide Protocol',
    description: 'Kill 5000 enemies total',
    icon: '☠️',
    condition: (stats) => stats.totalKills >= 5000,
    tier: 'platinum',
    color: 0x00d9ff
  },
  {
    id: 'kills_10000',
    name: 'Death Incarnate',
    description: 'Kill 10000 enemies total!',
    icon: '💀',
    condition: (stats) => stats.totalKills >= 10000,
    tier: 'platinum',
    color: 0xff0266
  }
]

export class AchievementManager {
  private unlockedAchievements: Set<string> = new Set()
  private onUnlockCallback?: (achievement: Achievement) => void

  constructor() {
    this.loadUnlockedAchievements()
  }

  checkAchievements(stats: GameStats) {
    const newlyUnlocked: Achievement[] = []

    ACHIEVEMENTS.forEach(achievement => {
      if (!this.isUnlocked(achievement.id) && achievement.condition(stats)) {
        this.unlockAchievement(achievement)
        newlyUnlocked.push(achievement)
      }
    })

    return newlyUnlocked
  }

  unlockAchievement(achievement: Achievement) {
    this.unlockedAchievements.add(achievement.id)
    this.saveUnlockedAchievements()

    if (this.onUnlockCallback) {
      this.onUnlockCallback(achievement)
    }
  }

  isUnlocked(achievementId: string): boolean {
    return this.unlockedAchievements.has(achievementId)
  }

  getUnlockedCount(): number {
    return this.unlockedAchievements.size
  }

  getTotalCount(): number {
    return ACHIEVEMENTS.length
  }

  getProgress(): number {
    return (this.getUnlockedCount() / this.getTotalCount()) * 100
  }

  getAllAchievements(): Achievement[] {
    return ACHIEVEMENTS
  }

  getUnlockedAchievements(): Achievement[] {
    return ACHIEVEMENTS.filter(a => this.isUnlocked(a.id))
  }

  onUnlock(callback: (achievement: Achievement) => void) {
    this.onUnlockCallback = callback
  }

  private saveUnlockedAchievements() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('dotslayer_achievements', JSON.stringify(Array.from(this.unlockedAchievements)))
    }
  }

  private loadUnlockedAchievements() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('dotslayer_achievements')
      if (saved) {
        this.unlockedAchievements = new Set(JSON.parse(saved))
      }
    }
  }

  reset() {
    this.unlockedAchievements.clear()
    this.saveUnlockedAchievements()
  }
}

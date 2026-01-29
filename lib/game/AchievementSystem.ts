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
      localStorage.setItem('dotslayer_achievements', JSON.stringify([...this.unlockedAchievements]))
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

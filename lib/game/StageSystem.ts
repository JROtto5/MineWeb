import Phaser from 'phaser'
import { EnemyType } from './EnemyTypes'

export interface StageConfig {
  stageNumber: number
  name: string
  enemyCount: number
  enemyTypes: EnemyType[]
  bossEnabled: boolean
  timeLimit?: number // seconds
  moneyReward: number
  xpReward: number
  backgroundColor: number
  gridColor: number
  specialModifier?: 'fast_enemies' | 'more_health' | 'rapid_spawn' | 'all_bosses'
}

export const STAGES: StageConfig[] = [
  {
    stageNumber: 1,
    name: 'BACKSTREETS',
    enemyCount: 10,
    enemyTypes: [EnemyType.GRUNT],
    bossEnabled: false,
    moneyReward: 100,
    xpReward: 50,
    backgroundColor: 0x1a1a1a,
    gridColor: 0x2a2a2a,
  },
  {
    stageNumber: 2,
    name: 'WAREHOUSE DISTRICT',
    enemyCount: 15,
    enemyTypes: [EnemyType.GRUNT, EnemyType.SCOUT],
    bossEnabled: true,
    moneyReward: 200,
    xpReward: 100,
    backgroundColor: 0x1a1a2a,
    gridColor: 0x2a2a3a,
  },
  {
    stageNumber: 3,
    name: 'DOWNTOWN CHAOS',
    enemyCount: 20,
    enemyTypes: [EnemyType.GRUNT, EnemyType.SCOUT, EnemyType.TANK],
    bossEnabled: true,
    moneyReward: 350,
    xpReward: 150,
    backgroundColor: 0x2a1a1a,
    gridColor: 0x3a2a2a,
    specialModifier: 'fast_enemies',
  },
  {
    stageNumber: 4,
    name: 'INDUSTRIAL COMPLEX',
    enemyCount: 25,
    enemyTypes: [EnemyType.GRUNT, EnemyType.SCOUT, EnemyType.TANK, EnemyType.SNIPER],
    bossEnabled: true,
    moneyReward: 500,
    xpReward: 200,
    backgroundColor: 0x1a2a1a,
    gridColor: 0x2a3a2a,
  },
  {
    stageNumber: 5,
    name: 'CASINO ROYALE',
    enemyCount: 30,
    enemyTypes: [EnemyType.GRUNT, EnemyType.SCOUT, EnemyType.TANK, EnemyType.SNIPER, EnemyType.BERSERKER],
    bossEnabled: true,
    moneyReward: 750,
    xpReward: 300,
    backgroundColor: 0x2a1a2a,
    gridColor: 0x3a2a3a,
    specialModifier: 'more_health',
  },
  {
    stageNumber: 6,
    name: 'ROOFTOP RUMBLE',
    enemyCount: 35,
    enemyTypes: [EnemyType.SCOUT, EnemyType.TANK, EnemyType.SNIPER, EnemyType.BERSERKER],
    bossEnabled: true,
    moneyReward: 1000,
    xpReward: 400,
    backgroundColor: 0x1a1a3a,
    gridColor: 0x2a2a4a,
    specialModifier: 'rapid_spawn',
  },
  {
    stageNumber: 7,
    name: 'UNDERGROUND ARENA',
    enemyCount: 40,
    enemyTypes: [EnemyType.TANK, EnemyType.SNIPER, EnemyType.BERSERKER],
    bossEnabled: true,
    moneyReward: 1500,
    xpReward: 500,
    backgroundColor: 0x3a1a1a,
    gridColor: 0x4a2a2a,
  },
  {
    stageNumber: 8,
    name: 'HARBOR HEIST',
    enemyCount: 45,
    enemyTypes: [EnemyType.GRUNT, EnemyType.SCOUT, EnemyType.TANK, EnemyType.SNIPER, EnemyType.BERSERKER],
    bossEnabled: true,
    moneyReward: 2000,
    xpReward: 600,
    backgroundColor: 0x1a2a2a,
    gridColor: 0x2a3a3a,
    specialModifier: 'fast_enemies',
  },
  {
    stageNumber: 9,
    name: 'SKYSCRAPER SHOWDOWN',
    enemyCount: 50,
    enemyTypes: [EnemyType.TANK, EnemyType.SNIPER, EnemyType.BERSERKER],
    bossEnabled: true,
    moneyReward: 3000,
    xpReward: 800,
    backgroundColor: 0x2a2a1a,
    gridColor: 0x3a3a2a,
    specialModifier: 'more_health',
    timeLimit: 180, // 3 minutes
  },
  {
    stageNumber: 10,
    name: '💀 FINAL BOSS GAUNTLET 💀',
    enemyCount: 60,
    enemyTypes: [EnemyType.BOSS],
    bossEnabled: true,
    moneyReward: 10000,
    xpReward: 2000,
    backgroundColor: 0x4a0a0a,
    gridColor: 0x5a1a1a,
    specialModifier: 'all_bosses',
    timeLimit: 300, // 5 minutes
  },
]

export class ComboSystem {
  private kills = 0
  private lastKillTime = 0
  private comboTimeout = 3000 // 3 seconds
  private bestCombo = 0
  private multiplier = 1.0

  addKill(currentTime: number): { combo: number; multiplier: number; isNewRecord: boolean } {
    // Reset combo if too much time passed
    if (currentTime - this.lastKillTime > this.comboTimeout) {
      this.kills = 0
      this.multiplier = 1.0
    }

    this.kills++
    this.lastKillTime = currentTime

    // Calculate multiplier based on combo
    if (this.kills >= 50) this.multiplier = 5.0
    else if (this.kills >= 30) this.multiplier = 4.0
    else if (this.kills >= 20) this.multiplier = 3.0
    else if (this.kills >= 10) this.multiplier = 2.5
    else if (this.kills >= 5) this.multiplier = 2.0
    else if (this.kills >= 3) this.multiplier = 1.5
    else this.multiplier = 1.0

    const isNewRecord = this.kills > this.bestCombo
    if (isNewRecord) {
      this.bestCombo = this.kills
    }

    return {
      combo: this.kills,
      multiplier: this.multiplier,
      isNewRecord,
    }
  }

  getCombo(): number {
    return this.kills
  }

  getMultiplier(): number {
    return this.multiplier
  }

  getBestCombo(): number {
    return this.bestCombo
  }

  reset() {
    this.kills = 0
    this.multiplier = 1.0
  }

  update(currentTime: number) {
    // Check if combo should expire
    if (currentTime - this.lastKillTime > this.comboTimeout && this.kills > 0) {
      this.reset()
      return true // Combo expired
    }
    return false
  }
}

export class StageManager {
  private currentStage = 0
  private stageStartTime = 0

  getCurrentStage(): StageConfig {
    return STAGES[this.currentStage]
  }

  getCurrentStageNumber(): number {
    return this.currentStage + 1
  }

  getTotalStages(): number {
    return STAGES.length
  }

  nextStage(): boolean {
    if (this.currentStage < STAGES.length - 1) {
      this.currentStage++
      this.stageStartTime = Date.now()
      return true
    }
    return false // No more stages
  }

  resetStage() {
    this.currentStage = 0
    this.stageStartTime = Date.now()
  }

  getTimeRemaining(): number | null {
    const stage = this.getCurrentStage()
    if (!stage.timeLimit) return null

    const elapsed = Math.floor((Date.now() - this.stageStartTime) / 1000)
    return Math.max(0, stage.timeLimit - elapsed)
  }

  isTimedOut(): boolean {
    const remaining = this.getTimeRemaining()
    return remaining !== null && remaining <= 0
  }

  isCompleted(): boolean {
    return this.currentStage >= STAGES.length - 1
  }

  // Apply stage modifiers to enemy stats
  applyStageModifiers(baseHealth: number, baseSpeed: number): { health: number; speed: number } {
    const stage = this.getCurrentStage()
    let health = baseHealth
    let speed = baseSpeed

    switch (stage.specialModifier) {
      case 'fast_enemies':
        speed *= 1.5
        break
      case 'more_health':
        health *= 2.0
        break
      case 'rapid_spawn':
        // Handled in spawn logic
        break
      case 'all_bosses':
        health *= 3.0
        speed *= 1.2
        break
    }

    // Progressive difficulty scaling
    const difficultyMultiplier = 1 + (this.currentStage * 0.15)
    health *= difficultyMultiplier
    speed *= Math.min(1.5, 1 + (this.currentStage * 0.05))

    return { health: Math.floor(health), speed: Math.floor(speed) }
  }
}

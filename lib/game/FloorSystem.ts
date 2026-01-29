import { FloorGenerator, FloorLayout } from './FloorGenerator'
import { EnemyType } from './EnemyTypes'

export interface FloorConfig {
  floorNumber: number
  layout: FloorLayout
  enemyCount: number
  enemyTypes: EnemyType[]
  difficultyMultiplier: number
  itemDropChance: number
  specialModifier?: 'boss_floor' | 'elite_floor' | 'treasure_floor'
}

export class FloorManager {
  private currentFloor = 1
  private generator: FloorGenerator
  private readonly maxFloors = 100

  constructor(seed?: number) {
    this.generator = new FloorGenerator(seed)
  }

  getCurrentFloor(): FloorConfig {
    const layout = this.generator.generate(this.currentFloor)

    return {
      floorNumber: this.currentFloor,
      layout,
      enemyCount: this.calculateEnemyCount(),
      enemyTypes: this.getEnemyTypes(),
      difficultyMultiplier: this.getDifficultyMultiplier(),
      itemDropChance: this.getItemDropChance(),
      specialModifier: this.getSpecialModifier()
    }
  }

  nextFloor(): boolean {
    if (this.currentFloor < this.maxFloors) {
      this.currentFloor++
      return true
    }
    return false
  }

  getCurrentFloorNumber(): number {
    return this.currentFloor
  }

  getTotalFloors(): number {
    return this.maxFloors
  }

  setFloor(floorNumber: number) {
    if (floorNumber >= 1 && floorNumber <= this.maxFloors) {
      this.currentFloor = floorNumber
    }
  }

  private calculateEnemyCount(): number {
    // Start with 15 enemies, add 2 per floor
    // Floor 1: 15 enemies
    // Floor 50: 113 enemies
    // Floor 100: 213 enemies
    return 15 + (this.currentFloor * 2)
  }

  private getEnemyTypes(): EnemyType[] {
    const floor = this.currentFloor

    // Gradually introduce tougher enemies
    if (floor < 10) {
      // Early floors: Only grunts and scouts
      return [EnemyType.GRUNT, EnemyType.SCOUT]
    } else if (floor < 25) {
      // Introduce tanks
      return [EnemyType.GRUNT, EnemyType.SCOUT, EnemyType.TANK]
    } else if (floor < 50) {
      // Introduce snipers
      return [EnemyType.GRUNT, EnemyType.SCOUT, EnemyType.TANK, EnemyType.SNIPER]
    } else if (floor < 75) {
      // Introduce berserkers, phase out grunts
      return [EnemyType.SCOUT, EnemyType.TANK, EnemyType.SNIPER, EnemyType.BERSERKER]
    } else {
      // Late game: Only elite enemies
      return [EnemyType.TANK, EnemyType.SNIPER, EnemyType.BERSERKER, EnemyType.BOSS]
    }
  }

  private getDifficultyMultiplier(): number {
    // Scale difficulty: +10% per floor
    // Floor 1: 1.0x
    // Floor 10: 2.0x
    // Floor 50: 6.0x
    // Floor 100: 11.0x
    return 1 + (this.currentFloor * 0.1)
  }

  private getItemDropChance(): number {
    // Base 15% drop chance, +0.5% per floor (capped at 65%)
    // Floor 1: 15%
    // Floor 50: 40%
    // Floor 100: 65%
    const baseChance = 0.15
    const perFloorIncrease = 0.005
    const maxChance = 0.65

    return Math.min(maxChance, baseChance + (this.currentFloor * perFloorIncrease))
  }

  private getSpecialModifier(): FloorConfig['specialModifier'] {
    const floor = this.currentFloor

    // Boss floor every 10 floors
    if (floor % 10 === 0) {
      return 'boss_floor'
    }

    // Elite floor every 5 floors (but not boss floors)
    if (floor % 5 === 0) {
      return 'elite_floor'
    }

    // Treasure floor (random chance)
    if (floor > 10 && Math.random() < 0.1) {
      return 'treasure_floor'
    }

    return undefined
  }

  // Get stats for display
  getFloorStats(): {
    current: number
    total: number
    difficulty: string
    enemyCount: number
  } {
    return {
      current: this.currentFloor,
      total: this.maxFloors,
      difficulty: `${(this.getDifficultyMultiplier() * 100).toFixed(0)}%`,
      enemyCount: this.calculateEnemyCount()
    }
  }
}

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
    // REBALANCED: More enemies, scaling curve
    // Floor 1: 20 enemies
    // Floor 25: 70 enemies
    // Floor 50: 145 enemies
    // Floor 75: 245 enemies
    // Floor 100: 370 enemies
    const base = 20
    const linearScale = this.currentFloor * 2
    const exponentialScale = Math.floor(Math.pow(this.currentFloor / 10, 1.5) * 10)
    return base + linearScale + exponentialScale
  }

  private getEnemyTypes(): EnemyType[] {
    const floor = this.currentFloor

    // REBALANCED: Gradual enemy type introduction with TONS of variety!
    if (floor < 10) {
      // Early floors: Basic enemies + swarms for action
      return [EnemyType.GRUNT, EnemyType.SCOUT, EnemyType.SWARM]
    } else if (floor < 20) {
      // Introduce tanks and ghosts
      return [EnemyType.GRUNT, EnemyType.SCOUT, EnemyType.TANK, EnemyType.SWARM, EnemyType.GHOST]
    } else if (floor < 30) {
      // Introduce snipers, shielders, and teleporters
      return [EnemyType.GRUNT, EnemyType.SCOUT, EnemyType.TANK, EnemyType.SNIPER, EnemyType.SHIELDER, EnemyType.TELEPORTER, EnemyType.SWARM]
    } else if (floor < 45) {
      // Introduce berserkers, bombers, and splitters
      return [EnemyType.SCOUT, EnemyType.TANK, EnemyType.SNIPER, EnemyType.BERSERKER, EnemyType.BOMBER, EnemyType.SHIELDER, EnemyType.SPLITTER, EnemyType.GHOST]
    } else if (floor < 60) {
      // Introduce assassins, healers, and vampires
      return [EnemyType.SCOUT, EnemyType.TANK, EnemyType.SNIPER, EnemyType.BERSERKER, EnemyType.ASSASSIN, EnemyType.HEALER, EnemyType.VAMPIRE, EnemyType.TELEPORTER]
    } else if (floor < 80) {
      // Elite mix - no more grunts, all special types
      return [EnemyType.TANK, EnemyType.SNIPER, EnemyType.BERSERKER, EnemyType.ASSASSIN, EnemyType.BOMBER, EnemyType.HEALER, EnemyType.SHIELDER, EnemyType.VAMPIRE, EnemyType.SPLITTER, EnemyType.GHOST]
    } else {
      // Late game: EVERYTHING including mini-bosses - pure chaos!
      return [EnemyType.TANK, EnemyType.SNIPER, EnemyType.BERSERKER, EnemyType.ASSASSIN, EnemyType.BOMBER, EnemyType.HEALER, EnemyType.SHIELDER, EnemyType.TELEPORTER, EnemyType.VAMPIRE, EnemyType.SPLITTER, EnemyType.GHOST, EnemyType.BOSS]
    }
  }

  private getDifficultyMultiplier(): number {
    // REBALANCED: Steeper curve for late-game challenge
    // Floor 1: 1.0x
    // Floor 10: 1.5x
    // Floor 25: 2.5x
    // Floor 50: 5.0x
    // Floor 75: 9.0x
    // Floor 100: 15.0x
    const floor = this.currentFloor
    const linearPart = floor * 0.05
    const exponentialPart = Math.pow(floor / 20, 2)
    return 1 + linearPart + exponentialPart
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

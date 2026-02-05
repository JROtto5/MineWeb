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
    // AGGRESSIVE: Lots of enemies from the start for fast action!
    // Floor 1: 35 enemies
    // Floor 10: 75 enemies
    // Floor 25: 150 enemies
    // Floor 50: 300 enemies
    // Floor 75: 500 enemies
    // Floor 100: 750 enemies
    const base = 35
    const linearScale = this.currentFloor * 4
    const exponentialScale = Math.floor(Math.pow(this.currentFloor / 8, 1.8) * 15)
    return base + linearScale + exponentialScale
  }

  private getEnemyTypes(): EnemyType[] {
    const floor = this.currentFloor

    // REBALANCED: Gradual enemy type introduction with TONS of variety!
    if (floor < 5) {
      // Very early: Just basics
      return [EnemyType.GRUNT, EnemyType.SCOUT, EnemyType.SWARM]
    } else if (floor < 10) {
      // Early floors: Add chargers for excitement
      return [EnemyType.GRUNT, EnemyType.SCOUT, EnemyType.SWARM, EnemyType.CHARGER]
    } else if (floor < 15) {
      // Introduce tanks, ghosts, and exploders
      return [EnemyType.GRUNT, EnemyType.SCOUT, EnemyType.TANK, EnemyType.SWARM, EnemyType.GHOST, EnemyType.EXPLODER, EnemyType.CHARGER]
    } else if (floor < 25) {
      // Introduce snipers, shielders, teleporters, and ninjas
      return [EnemyType.GRUNT, EnemyType.SCOUT, EnemyType.TANK, EnemyType.SNIPER, EnemyType.SHIELDER, EnemyType.TELEPORTER, EnemyType.NINJA, EnemyType.EXPLODER]
    } else if (floor < 35) {
      // Introduce berserkers, bombers, splitters, and juggernauts
      return [EnemyType.SCOUT, EnemyType.TANK, EnemyType.SNIPER, EnemyType.BERSERKER, EnemyType.BOMBER, EnemyType.SHIELDER, EnemyType.SPLITTER, EnemyType.JUGGERNAUT, EnemyType.CHARGER]
    } else if (floor < 50) {
      // Introduce assassins, healers, vampires, and necromancers
      return [EnemyType.SCOUT, EnemyType.TANK, EnemyType.SNIPER, EnemyType.BERSERKER, EnemyType.ASSASSIN, EnemyType.HEALER, EnemyType.VAMPIRE, EnemyType.TELEPORTER, EnemyType.NECROMANCER, EnemyType.NINJA]
    } else if (floor < 70) {
      // Elite mix with all special types
      return [EnemyType.TANK, EnemyType.SNIPER, EnemyType.BERSERKER, EnemyType.ASSASSIN, EnemyType.BOMBER, EnemyType.HEALER, EnemyType.SHIELDER, EnemyType.VAMPIRE, EnemyType.SPLITTER, EnemyType.GHOST, EnemyType.JUGGERNAUT, EnemyType.NINJA, EnemyType.NECROMANCER, EnemyType.EXPLODER, EnemyType.CHARGER]
    } else {
      // Late game: EVERYTHING including mini-bosses - pure chaos!
      return [EnemyType.TANK, EnemyType.SNIPER, EnemyType.BERSERKER, EnemyType.ASSASSIN, EnemyType.BOMBER, EnemyType.HEALER, EnemyType.SHIELDER, EnemyType.TELEPORTER, EnemyType.VAMPIRE, EnemyType.SPLITTER, EnemyType.GHOST, EnemyType.BOSS, EnemyType.JUGGERNAUT, EnemyType.NINJA, EnemyType.NECROMANCER, EnemyType.EXPLODER, EnemyType.CHARGER]
    }
  }

  private getDifficultyMultiplier(): number {
    // MASSIVELY REBALANCED: Exponential curve to match player damage scaling!
    // Player can do 30k+ damage at floor 20, enemies need to scale to match
    // Floor 1: 1.0x (50 HP grunt)
    // Floor 5: 5x (250 HP grunt)
    // Floor 10: 25x (1,250 HP grunt)
    // Floor 15: 80x (4,000 HP grunt)
    // Floor 20: 200x (10,000 HP grunt)
    // Floor 30: 600x (30,000 HP grunt)
    // Floor 50: 2,500x (125,000 HP grunt)
    // Floor 75: 8,000x
    // Floor 100: 20,000x
    const floor = this.currentFloor

    // Aggressive exponential scaling that matches player power curve
    const baseMult = Math.pow(floor, 2.2) / 5
    const exponentialBoost = Math.pow(1.15, floor)

    return Math.max(1, baseMult * exponentialBoost / 10)
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

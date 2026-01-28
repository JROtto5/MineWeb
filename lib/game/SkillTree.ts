import Phaser from 'phaser'

export interface Skill {
  id: string
  name: string
  description: string
  maxLevel: number
  cost: number // Skill points needed
  icon: string
  effects: {
    health?: number
    damage?: number
    speed?: number
    fireRate?: number
    critChance?: number
    luck?: number
  }
}

export const SKILLS: Record<string, Skill> = {
  maxHealth: {
    id: 'maxHealth',
    name: 'Vitality',
    description: '+20 Max Health per level',
    maxLevel: 5,
    cost: 1,
    icon: '❤️',
    effects: { health: 20 }
  },
  damage: {
    id: 'damage',
    name: 'Power',
    description: '+10% Damage per level',
    maxLevel: 5,
    cost: 1,
    icon: '💥',
    effects: { damage: 0.1 }
  },
  speed: {
    id: 'speed',
    name: 'Agility',
    description: '+8% Move Speed per level',
    maxLevel: 5,
    cost: 1,
    icon: '⚡',
    effects: { speed: 0.08 }
  },
  fireRate: {
    id: 'fireRate',
    name: 'Rapid Fire',
    description: '+12% Fire Rate per level',
    maxLevel: 5,
    cost: 1,
    icon: '🔫',
    effects: { fireRate: 0.12 }
  },
  critChance: {
    id: 'critChance',
    name: 'Critical Strike',
    description: '+5% Crit Chance per level',
    maxLevel: 5,
    cost: 1,
    icon: '🎯',
    effects: { critChance: 0.05 }
  },
  luck: {
    id: 'luck',
    name: 'Fortune',
    description: '+10% Money & XP per level',
    maxLevel: 5,
    cost: 1,
    icon: '🍀',
    effects: { luck: 0.1 }
  },
}

export class SkillTreeManager {
  private skills: Map<string, number> = new Map()
  private skillPoints = 0

  constructor() {
    // Initialize all skills at level 0
    Object.keys(SKILLS).forEach(skillId => {
      this.skills.set(skillId, 0)
    })
  }

  addSkillPoints(points: number) {
    this.skillPoints += points
  }

  getSkillPoints(): number {
    return this.skillPoints
  }

  // FIX V11++: Add setter to sync skill points
  setSkillPoints(points: number) {
    this.skillPoints = points
  }

  getSkillLevel(skillId: string): number {
    return this.skills.get(skillId) || 0
  }

  canUpgradeSkill(skillId: string): boolean {
    const skill = SKILLS[skillId]
    if (!skill) return false

    const currentLevel = this.getSkillLevel(skillId)
    return (
      this.skillPoints >= skill.cost &&
      currentLevel < skill.maxLevel
    )
  }

  upgradeSkill(skillId: string): boolean {
    if (!this.canUpgradeSkill(skillId)) return false

    const skill = SKILLS[skillId]
    const currentLevel = this.getSkillLevel(skillId)

    this.skills.set(skillId, currentLevel + 1)
    this.skillPoints -= skill.cost

    return true
  }

  getSkillBonus(skillId: string): number {
    const level = this.getSkillLevel(skillId)
    const skill = SKILLS[skillId]

    if (!skill || level === 0) return 0

    // Get the primary effect value
    const effectKey = Object.keys(skill.effects)[0] as keyof typeof skill.effects
    const effectValue = skill.effects[effectKey] || 0

    return effectValue * level
  }

  getTotalBonus(effectType: keyof Skill['effects']): number {
    let total = 0

    Object.values(SKILLS).forEach(skill => {
      if (skill.effects[effectType]) {
        const level = this.getSkillLevel(skill.id)
        total += (skill.effects[effectType] || 0) * level
      }
    })

    return total
  }

  getAllSkills(): Array<{ skill: Skill; level: number }> {
    return Object.values(SKILLS).map(skill => ({
      skill,
      level: this.getSkillLevel(skill.id)
    }))
  }

  reset() {
    let totalPoints = this.skillPoints
    this.skills.forEach((level, skillId) => {
      const skill = SKILLS[skillId]
      totalPoints += skill.cost * level
      this.skills.set(skillId, 0)
    })
    this.skillPoints = totalPoints
  }

  save(): string {
    return JSON.stringify({
      skills: Array.from(this.skills.entries()),
      skillPoints: this.skillPoints,
    })
  }

  load(data: string) {
    try {
      const parsed = JSON.parse(data)
      this.skills = new Map(parsed.skills)
      this.skillPoints = parsed.skillPoints
    } catch (e) {
      console.error('Failed to load skill tree:', e)
    }
  }
}

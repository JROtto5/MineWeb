import * as Phaser from 'phaser'

/**
 * StatusEffects - Handles damage over time, buffs, debuffs, and combat modifiers
 */

export enum StatusType {
  // Damage over time
  POISON = 'poison',
  BURN = 'burn',
  BLEED = 'bleed',

  // Crowd control
  FREEZE = 'freeze',
  STUN = 'stun',
  SLOW = 'slow',

  // Buffs
  REGEN = 'regen',
  HASTE = 'haste',
  SHIELD = 'shield',
  DAMAGE_BOOST = 'damage_boost',

  // Debuffs
  WEAKNESS = 'weakness',
  VULNERABILITY = 'vulnerability',
}

export interface StatusEffect {
  type: StatusType
  duration: number
  startTime: number
  intensity: number // Damage per tick, slow %, etc.
  stackCount: number
  maxStacks: number
  tickInterval: number
  lastTick: number
  source?: string // Who applied this effect
}

export interface StatusConfig {
  duration: number
  intensity: number
  maxStacks: number
  tickInterval: number
  color: number
  icon: string
}

export const STATUS_CONFIGS: Record<StatusType, StatusConfig> = {
  [StatusType.POISON]: {
    duration: 5000,
    intensity: 3, // 3 damage per tick
    maxStacks: 5,
    tickInterval: 500,
    color: 0x9b59b6,
    icon: '☠️'
  },
  [StatusType.BURN]: {
    duration: 3000,
    intensity: 5, // 5 damage per tick
    maxStacks: 3,
    tickInterval: 500,
    color: 0xff6600,
    icon: '🔥'
  },
  [StatusType.BLEED]: {
    duration: 4000,
    intensity: 2, // 2 damage per tick
    maxStacks: 10,
    tickInterval: 300,
    color: 0xcc0000,
    icon: '🩸'
  },
  [StatusType.FREEZE]: {
    duration: 2000,
    intensity: 1, // Complete freeze (speed = 0)
    maxStacks: 1,
    tickInterval: 0,
    color: 0x3498db,
    icon: '❄️'
  },
  [StatusType.STUN]: {
    duration: 1000,
    intensity: 1, // Complete stun
    maxStacks: 1,
    tickInterval: 0,
    color: 0xf1c40f,
    icon: '⚡'
  },
  [StatusType.SLOW]: {
    duration: 3000,
    intensity: 0.5, // 50% speed reduction
    maxStacks: 3,
    tickInterval: 0,
    color: 0x7f8c8d,
    icon: '🐢'
  },
  [StatusType.REGEN]: {
    duration: 5000,
    intensity: 2, // 2 heal per tick
    maxStacks: 3,
    tickInterval: 500,
    color: 0x2ecc71,
    icon: '💚'
  },
  [StatusType.HASTE]: {
    duration: 5000,
    intensity: 0.5, // 50% speed boost
    maxStacks: 2,
    tickInterval: 0,
    color: 0x00d9ff,
    icon: '💨'
  },
  [StatusType.SHIELD]: {
    duration: 8000,
    intensity: 50, // Absorbs 50 damage per stack
    maxStacks: 5,
    tickInterval: 0,
    color: 0x3498db,
    icon: '🛡️'
  },
  [StatusType.DAMAGE_BOOST]: {
    duration: 5000,
    intensity: 0.25, // 25% damage boost per stack
    maxStacks: 4,
    tickInterval: 0,
    color: 0xe74c3c,
    icon: '⚔️'
  },
  [StatusType.WEAKNESS]: {
    duration: 4000,
    intensity: 0.25, // 25% damage reduction to their attacks
    maxStacks: 3,
    tickInterval: 0,
    color: 0x8e44ad,
    icon: '💔'
  },
  [StatusType.VULNERABILITY]: {
    duration: 4000,
    intensity: 0.25, // Takes 25% more damage per stack
    maxStacks: 3,
    tickInterval: 0,
    color: 0xc0392b,
    icon: '🎯'
  }
}

export class StatusEffectManager {
  private effects: Map<StatusType, StatusEffect> = new Map()
  private scene: Phaser.Scene
  private target: any // The entity this manager is attached to
  private statusIcons: Phaser.GameObjects.Container | null = null
  private onDamageCallback?: (damage: number, type: StatusType) => void
  private onHealCallback?: (heal: number, type: StatusType) => void
  private onStatusChangeCallback?: (type: StatusType, active: boolean) => void

  constructor(scene: Phaser.Scene, target: any) {
    this.scene = scene
    this.target = target
  }

  /**
   * Apply a status effect
   */
  apply(type: StatusType, source?: string): boolean {
    const config = STATUS_CONFIGS[type]
    const existing = this.effects.get(type)
    const currentTime = this.scene.time.now

    if (existing) {
      // Stack the effect
      if (existing.stackCount < config.maxStacks) {
        existing.stackCount++
        existing.duration = config.duration // Refresh duration
        existing.startTime = currentTime
        return true
      } else {
        // Already at max stacks, just refresh duration
        existing.startTime = currentTime
        return false
      }
    } else {
      // New effect
      const effect: StatusEffect = {
        type,
        duration: config.duration,
        startTime: currentTime,
        intensity: config.intensity,
        stackCount: 1,
        maxStacks: config.maxStacks,
        tickInterval: config.tickInterval,
        lastTick: currentTime,
        source
      }
      this.effects.set(type, effect)
      this.onStatusChangeCallback?.(type, true)
      return true
    }
  }

  /**
   * Remove a status effect
   */
  remove(type: StatusType) {
    if (this.effects.has(type)) {
      this.effects.delete(type)
      this.onStatusChangeCallback?.(type, false)
    }
  }

  /**
   * Clear all status effects
   */
  clearAll() {
    this.effects.forEach((_, type) => {
      this.onStatusChangeCallback?.(type, false)
    })
    this.effects.clear()
  }

  /**
   * Check if entity has a specific effect
   */
  has(type: StatusType): boolean {
    return this.effects.has(type)
  }

  /**
   * Get stack count of an effect
   */
  getStacks(type: StatusType): number {
    return this.effects.get(type)?.stackCount || 0
  }

  /**
   * Update all effects (call every frame)
   */
  update(time: number): void {
    const toRemove: StatusType[] = []

    this.effects.forEach((effect, type) => {
      const config = STATUS_CONFIGS[type]
      const elapsed = time - effect.startTime

      // Check if expired
      if (elapsed >= effect.duration) {
        toRemove.push(type)
        return
      }

      // Handle tick-based effects
      if (config.tickInterval > 0 && time - effect.lastTick >= config.tickInterval) {
        effect.lastTick = time
        this.applyTick(type, effect)
      }
    })

    // Remove expired effects
    toRemove.forEach(type => this.remove(type))
  }

  private applyTick(type: StatusType, effect: StatusEffect) {
    switch (type) {
      case StatusType.POISON:
      case StatusType.BURN:
      case StatusType.BLEED:
        const damage = effect.intensity * effect.stackCount
        this.onDamageCallback?.(damage, type)
        break

      case StatusType.REGEN:
        const heal = effect.intensity * effect.stackCount
        this.onHealCallback?.(heal, type)
        break
    }
  }

  /**
   * Get speed modifier from all effects
   */
  getSpeedModifier(): number {
    let modifier = 1

    // Freeze = complete stop
    if (this.has(StatusType.FREEZE)) {
      return 0
    }

    // Stun = complete stop
    if (this.has(StatusType.STUN)) {
      return 0
    }

    // Slow
    const slowEffect = this.effects.get(StatusType.SLOW)
    if (slowEffect) {
      modifier *= (1 - slowEffect.intensity * slowEffect.stackCount)
    }

    // Haste
    const hasteEffect = this.effects.get(StatusType.HASTE)
    if (hasteEffect) {
      modifier *= (1 + hasteEffect.intensity * hasteEffect.stackCount)
    }

    return Math.max(0.1, modifier) // Minimum 10% speed
  }

  /**
   * Get damage dealt modifier from all effects
   */
  getDamageDealtModifier(): number {
    let modifier = 1

    // Damage boost
    const boostEffect = this.effects.get(StatusType.DAMAGE_BOOST)
    if (boostEffect) {
      modifier *= (1 + boostEffect.intensity * boostEffect.stackCount)
    }

    // Weakness (reduces damage you deal)
    const weaknessEffect = this.effects.get(StatusType.WEAKNESS)
    if (weaknessEffect) {
      modifier *= (1 - weaknessEffect.intensity * weaknessEffect.stackCount)
    }

    return Math.max(0.1, modifier) // Minimum 10% damage
  }

  /**
   * Get damage taken modifier from all effects
   */
  getDamageTakenModifier(): number {
    let modifier = 1

    // Vulnerability (takes more damage)
    const vulnEffect = this.effects.get(StatusType.VULNERABILITY)
    if (vulnEffect) {
      modifier *= (1 + vulnEffect.intensity * vulnEffect.stackCount)
    }

    return modifier
  }

  /**
   * Process incoming damage (applies shield absorption)
   */
  processDamage(incomingDamage: number): number {
    const shieldEffect = this.effects.get(StatusType.SHIELD)
    if (shieldEffect) {
      const shieldAmount = shieldEffect.intensity * shieldEffect.stackCount
      if (incomingDamage <= shieldAmount) {
        // Shield absorbs all damage
        const newStacks = Math.ceil((shieldAmount - incomingDamage) / shieldEffect.intensity)
        if (newStacks <= 0) {
          this.remove(StatusType.SHIELD)
        } else {
          shieldEffect.stackCount = newStacks
        }
        return 0
      } else {
        // Shield breaks, remaining damage goes through
        this.remove(StatusType.SHIELD)
        return incomingDamage - shieldAmount
      }
    }

    return incomingDamage * this.getDamageTakenModifier()
  }

  /**
   * Check if entity can act (not stunned/frozen)
   */
  canAct(): boolean {
    return !this.has(StatusType.FREEZE) && !this.has(StatusType.STUN)
  }

  /**
   * Get all active effects for display
   */
  getActiveEffects(): Array<{ type: StatusType; stacks: number; remainingMs: number; config: StatusConfig }> {
    const currentTime = this.scene.time.now
    const result: Array<{ type: StatusType; stacks: number; remainingMs: number; config: StatusConfig }> = []

    this.effects.forEach((effect, type) => {
      const remaining = effect.duration - (currentTime - effect.startTime)
      result.push({
        type,
        stacks: effect.stackCount,
        remainingMs: remaining,
        config: STATUS_CONFIGS[type]
      })
    })

    return result
  }

  // Callbacks for external systems
  onDamage(callback: (damage: number, type: StatusType) => void) {
    this.onDamageCallback = callback
  }

  onHeal(callback: (heal: number, type: StatusType) => void) {
    this.onHealCallback = callback
  }

  onStatusChange(callback: (type: StatusType, active: boolean) => void) {
    this.onStatusChangeCallback = callback
  }

  destroy() {
    this.effects.clear()
    this.statusIcons?.destroy()
  }
}

/**
 * StatusEffectUI - Displays status effect icons above entities
 */
export class StatusEffectUI {
  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private target: any
  private manager: StatusEffectManager

  constructor(scene: Phaser.Scene, target: any, manager: StatusEffectManager) {
    this.scene = scene
    this.target = target
    this.manager = manager
    this.container = scene.add.container(0, 0).setDepth(5000)
  }

  update() {
    // Position above target
    this.container.setPosition(this.target.x, this.target.y - 40)

    // Clear old icons
    this.container.removeAll(true)

    // Display active effects
    const effects = this.manager.getActiveEffects()
    let xOffset = -(effects.length - 1) * 12 // Center icons

    effects.forEach((effect, index) => {
      const { config, stacks } = effect

      // Background circle
      const bg = this.scene.add.circle(xOffset + index * 24, 0, 10, config.color, 0.8)

      // Icon
      const icon = this.scene.add.text(xOffset + index * 24, 0, config.icon, {
        fontSize: '12px'
      }).setOrigin(0.5)

      // Stack count (if > 1)
      if (stacks > 1) {
        const stackText = this.scene.add.text(xOffset + index * 24 + 8, 6, `${stacks}`, {
          fontSize: '10px',
          color: '#ffffff',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5)
        this.container.add(stackText)
      }

      this.container.add([bg, icon])
    })
  }

  destroy() {
    this.container.destroy()
  }
}

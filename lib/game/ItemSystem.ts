import Phaser from 'phaser'
import Player from './Player'

export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface ItemDefinition {
  id: string
  name: string
  rarity: ItemRarity
  effect: (player: Player) => void
  description: string
  color: number
}

export const ITEM_POOL: ItemDefinition[] = [
  // Health items
  {
    id: 'health_small',
    name: 'Nano Repair',
    rarity: ItemRarity.COMMON,
    effect: (player) => player.heal(20),
    description: '+20 HP',
    color: 0x2ecc71
  },
  {
    id: 'health_medium',
    name: 'Med Kit',
    rarity: ItemRarity.UNCOMMON,
    effect: (player) => player.heal(50),
    description: '+50 HP',
    color: 0x27ae60
  },
  {
    id: 'health_large',
    name: 'Full Restore',
    rarity: ItemRarity.RARE,
    effect: (player) => player.heal(200),
    description: 'Full HP Restore',
    color: 0x1abc9c
  },

  // Damage upgrades
  {
    id: 'damage_small',
    name: 'Power Core',
    rarity: ItemRarity.COMMON,
    effect: (player) => {
      if (player.shopDamageBonus !== undefined) {
        player.shopDamageBonus += 5
      }
    },
    description: '+5% Damage',
    color: 0xe74c3c
  },
  {
    id: 'damage_medium',
    name: 'Amplifier',
    rarity: ItemRarity.UNCOMMON,
    effect: (player) => {
      if (player.shopDamageBonus !== undefined) {
        player.shopDamageBonus += 10
      }
    },
    description: '+10% Damage',
    color: 0xc0392b
  },
  {
    id: 'damage_large',
    name: 'Quantum Core',
    rarity: ItemRarity.EPIC,
    effect: (player) => {
      if (player.shopDamageBonus !== undefined) {
        player.shopDamageBonus += 25
      }
    },
    description: '+25% Damage!',
    color: 0xff0266
  },

  // Critical hit upgrades
  {
    id: 'crit_chance',
    name: 'Precision Chip',
    rarity: ItemRarity.RARE,
    effect: (player) => {
      if (player.shopCritChance !== undefined) {
        player.shopCritChance += 10
      }
    },
    description: '+10% Crit Chance',
    color: 0xf39c12
  },
  {
    id: 'crit_damage',
    name: 'Critical Matrix',
    rarity: ItemRarity.EPIC,
    effect: (player) => {
      if (player.shopCritDamage !== undefined) {
        player.shopCritDamage += 0.5
      }
    },
    description: '+50% Crit Damage',
    color: 0xe67e22
  },

  // Speed upgrades
  {
    id: 'speed_boost',
    name: 'Thruster Module',
    rarity: ItemRarity.COMMON,
    effect: (player) => {
      if (player.shopSpeedBonus !== undefined) {
        player.shopSpeedBonus += 10
      }
    },
    description: '+10% Speed',
    color: 0x3498db
  },
  {
    id: 'speed_boost_large',
    name: 'Hyper Thrusters',
    rarity: ItemRarity.UNCOMMON,
    effect: (player) => {
      if (player.shopSpeedBonus !== undefined) {
        player.shopSpeedBonus += 20
      }
    },
    description: '+20% Speed',
    color: 0x2980b9
  },

  // Fire rate
  {
    id: 'fire_rate',
    name: 'Overclocked Barrel',
    rarity: ItemRarity.UNCOMMON,
    effect: (player) => {
      if (player.shopFireRateBonus !== undefined) {
        player.shopFireRateBonus += 15
      }
    },
    description: '+15% Fire Rate',
    color: 0x9b59b6
  },
  {
    id: 'fire_rate_large',
    name: 'Rapid Fire Core',
    rarity: ItemRarity.RARE,
    effect: (player) => {
      if (player.shopFireRateBonus !== undefined) {
        player.shopFireRateBonus += 30
      }
    },
    description: '+30% Fire Rate',
    color: 0x8e44ad
  },

  // Ammo
  {
    id: 'ammo_max',
    name: 'Expanded Magazine',
    rarity: ItemRarity.COMMON,
    effect: (player) => {
      const currentWeapon = player.weapons[player.currentWeapon]
      if (currentWeapon) {
        currentWeapon.maxAmmo += 10
        player.currentAmmo += 10
      }
    },
    description: '+10 Max Ammo',
    color: 0x34495e
  },
  {
    id: 'ammo_refill',
    name: 'Ammo Pack',
    rarity: ItemRarity.UNCOMMON,
    effect: (player) => {
      const currentWeapon = player.weapons[player.currentWeapon]
      if (currentWeapon) {
        player.currentAmmo = currentWeapon.maxAmmo
      }
    },
    description: 'Full Ammo Refill',
    color: 0x95a5a6
  },

  // Legendary items
  {
    id: 'max_health',
    name: 'Bio Enhancement',
    rarity: ItemRarity.LEGENDARY,
    effect: (player) => {
      player.maxHealth += 50
      player.heal(50)
    },
    description: '+50 Max HP & Heal',
    color: 0x00ff00
  },
  {
    id: 'god_mode',
    name: 'Quantum Amplifier',
    rarity: ItemRarity.LEGENDARY,
    effect: (player) => {
      if (player.shopDamageBonus !== undefined) {
        player.shopDamageBonus += 50
      }
      if (player.shopFireRateBonus !== undefined) {
        player.shopFireRateBonus += 50
      }
    },
    description: '+50% Damage & Fire Rate!',
    color: 0xff0266
  },
  {
    id: 'super_speed',
    name: 'Warp Drive',
    rarity: ItemRarity.LEGENDARY,
    effect: (player) => {
      if (player.shopSpeedBonus !== undefined) {
        player.shopSpeedBonus += 50
      }
    },
    description: '+50% Speed!',
    color: 0x00d9ff
  }
]

export class ItemDrop extends Phaser.Physics.Arcade.Sprite {
  private item: ItemDefinition
  private floatTween?: Phaser.Tweens.Tween

  constructor(scene: Phaser.Scene, x: number, y: number, item: ItemDefinition) {
    super(scene, x, y, '')

    this.item = item

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.createVisual()
    this.setCollideWorldBounds(true)

    // Floating animation
    this.floatTween = scene.tweens.add({
      targets: this,
      y: y - 15,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Glow effect
    scene.tweens.add({
      targets: this,
      alpha: { from: 0.7, to: 1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  private createVisual() {
    const graphics = this.scene.make.graphics({ x: 0, y: 0 }, false)
    const size = 20

    // Draw item based on rarity
    graphics.fillStyle(this.item.color, 1)

    // Different shapes for different rarities
    switch (this.item.rarity) {
      case ItemRarity.LEGENDARY:
        // Star shape
        graphics.fillStar(size, size, 8, size, size * 0.5)
        // Outer glow
        graphics.lineStyle(3, this.item.color, 0.5)
        graphics.strokeCircle(size, size, size * 1.5)
        break
      case ItemRarity.EPIC:
        // 5-pointed star
        graphics.fillStar(size, size, 5, size, size * 0.5)
        graphics.lineStyle(2, this.item.color, 0.5)
        graphics.strokeCircle(size, size, size * 1.3)
        break
      case ItemRarity.RARE:
        // Diamond
        graphics.fillRect(size * 0.3, size * 0.3, size * 1.4, size * 1.4)
        graphics.lineStyle(2, this.item.color, 0.3)
        graphics.strokeRect(size * 0.1, size * 0.1, size * 1.8, size * 1.8)
        break
      case ItemRarity.UNCOMMON:
        // Triangle
        graphics.fillTriangle(size, 0, 0, size * 2, size * 2, size * 2)
        break
      default:
        // Circle
        graphics.fillCircle(size, size, size)
    }

    graphics.generateTexture(`item_${this.item.id}_${Date.now()}`, size * 2.5, size * 2.5)
    graphics.destroy()

    this.setTexture(`item_${this.item.id}_${Date.now()}`)
    this.setScale(1.2)
  }

  collect(player: Player) {
    // Apply item effect
    this.item.effect(player)

    // Show pickup message with rarity color
    const text = this.scene.add.text(this.x, this.y - 40, this.item.name, {
      fontSize: '18px',
      color: `#${this.item.color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    const descText = this.scene.add.text(this.x, this.y - 20, this.item.description, {
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)

    // Float up and fade out
    this.scene.tweens.add({
      targets: [text, descText],
      y: `-=60`,
      alpha: 0,
      duration: 2000,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        text.destroy()
        descText.destroy()
      }
    })

    // Particle burst effect
    const particles = this.scene.add.particles(this.x, this.y, 'particle', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      tint: this.item.color,
      lifespan: 600,
      quantity: 20,
      blendMode: 'ADD'
    })

    this.scene.time.delayedCall(600, () => particles.destroy())

    // Cleanup
    if (this.floatTween) {
      this.floatTween.remove()
    }
    this.destroy()
  }

  getItem(): ItemDefinition {
    return this.item
  }
}

// Roll for item drop
export function rollItemDrop(floorNumber: number, dropChance: number): ItemDefinition | null {
  // Check if item drops
  if (Math.random() > dropChance) return null

  // Rarity weights (higher floors have better drops)
  const floorBonus = Math.min(floorNumber / 100, 1) // 0 to 1

  const rarityWeights = {
    [ItemRarity.COMMON]: 50 - (floorBonus * 20),      // 50% → 30%
    [ItemRarity.UNCOMMON]: 30,                         // 30% constant
    [ItemRarity.RARE]: 15 + (floorBonus * 10),        // 15% → 25%
    [ItemRarity.EPIC]: 4 + (floorBonus * 8),          // 4% → 12%
    [ItemRarity.LEGENDARY]: 1 + (floorBonus * 2)      // 1% → 3%
  }

  // Roll rarity
  const totalWeight = Object.values(rarityWeights).reduce((a, b) => a + b, 0)
  let roll = Math.random() * totalWeight
  let selectedRarity: ItemRarity = ItemRarity.COMMON

  for (const [rarity, weight] of Object.entries(rarityWeights)) {
    roll -= weight
    if (roll <= 0) {
      selectedRarity = rarity as ItemRarity
      break
    }
  }

  // Filter items by rarity and pick random
  const itemsOfRarity = ITEM_POOL.filter(item => item.rarity === selectedRarity)
  if (itemsOfRarity.length === 0) return null

  return itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)]
}

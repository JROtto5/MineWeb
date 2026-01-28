import Phaser from 'phaser'
import Player from './Player'

export interface ShopItem {
  id: string
  name: string
  description: string
  icon: string
  category: 'weapon' | 'stat' | 'ability'
  basePrice: number
  maxLevel: number
  priceScaling: number // Multiplier per level
  effect: {
    type: 'damage' | 'fireRate' | 'ammo' | 'health' | 'speed' | 'critChance' | 'moneyBoost' | 'xpBoost' | 'dash' | 'shield' | 'timeSlow' |
          'piercing' | 'explosive' | 'reloadSpeed' | 'dualWield' | 'homing' | 'multishot' |
          'healthRegen' | 'dodgeChance' | 'luck' | 'armor' | 'lifesteal' | 'comboBonus' |
          'teleport' | 'berserk' | 'invisibility' | 'orbitalStrike' |
          'explosiveRounds' | 'lifeDrain' | 'bulletTime' |
          'autoClick' | 'autoReload'
    value: number
  }
}

export const SHOP_ITEMS: ShopItem[] = [
  // Weapon Upgrades
  {
    id: 'weapon_damage',
    name: 'Weapon Damage',
    description: '+15% damage per level',
    icon: '💥',
    category: 'weapon',
    basePrice: 500,
    maxLevel: 10,
    priceScaling: 1.5,
    effect: { type: 'damage', value: 0.15 }
  },
  {
    id: 'fire_rate',
    name: 'Fire Rate',
    description: '+20% fire rate per level',
    icon: '🔫',
    category: 'weapon',
    basePrice: 600,
    maxLevel: 10,
    priceScaling: 1.6,
    effect: { type: 'fireRate', value: 0.20 }
  },
  {
    id: 'ammo_capacity',
    name: 'Ammo Capacity',
    description: '+50 max ammo per level',
    icon: '📦',
    category: 'weapon',
    basePrice: 400,
    maxLevel: 5,
    priceScaling: 1.4,
    effect: { type: 'ammo', value: 50 }
  },
  {
    id: 'crit_boost',
    name: 'Critical Boost',
    description: '+8% crit chance per level',
    icon: '🎯',
    category: 'weapon',
    basePrice: 800,
    maxLevel: 5,
    priceScaling: 1.8,
    effect: { type: 'critChance', value: 0.08 }
  },

  // Stat Upgrades
  {
    id: 'max_health',
    name: 'Max Health',
    description: '+50 max health per level',
    icon: '❤️',
    category: 'stat',
    basePrice: 700,
    maxLevel: 8,
    priceScaling: 1.5,
    effect: { type: 'health', value: 50 }
  },
  {
    id: 'movement_speed',
    name: 'Movement Speed',
    description: '+12% speed per level',
    icon: '⚡',
    category: 'stat',
    basePrice: 650,
    maxLevel: 5,
    priceScaling: 1.6,
    effect: { type: 'speed', value: 0.12 }
  },
  {
    id: 'money_magnet',
    name: 'Money Magnet',
    description: '+25% money drops per level',
    icon: '💰',
    category: 'stat',
    basePrice: 900,
    maxLevel: 5,
    priceScaling: 1.7,
    effect: { type: 'moneyBoost', value: 0.25 }
  },
  {
    id: 'xp_booster',
    name: 'XP Booster',
    description: '+20% XP gains per level',
    icon: '✨',
    category: 'stat',
    basePrice: 850,
    maxLevel: 5,
    priceScaling: 1.7,
    effect: { type: 'xpBoost', value: 0.20 }
  },

  // Special Abilities (Keys 1-9)
  {
    id: 'dash_ability',
    name: 'Dash Ability',
    description: 'Key 1: Dash forward - 2s CD',
    icon: '💨',
    category: 'ability',
    basePrice: 2500,
    maxLevel: 1,
    priceScaling: 1,
    effect: { type: 'dash', value: 1 }
  },
  {
    id: 'shield_ability',
    name: 'Energy Shield',
    description: 'Key 2: Blocks 5 hits - 10s CD',
    icon: '🛡️',
    category: 'ability',
    basePrice: 3000,
    maxLevel: 1,
    priceScaling: 1,
    effect: { type: 'shield', value: 1 }
  },
  {
    id: 'time_slow',
    name: 'Time Slow',
    description: 'Key 3: Slow time 5s - 12s CD',
    icon: '⏱️',
    category: 'ability',
    basePrice: 5000,
    maxLevel: 1,
    priceScaling: 1,
    effect: { type: 'timeSlow', value: 1 }
  },

  // CREATIVE EXPANSION: More Weapon Upgrades!
  {
    id: 'piercing_rounds',
    name: 'Piercing Rounds',
    description: 'Bullets go through multiple enemies',
    icon: '🔱',
    category: 'weapon',
    basePrice: 4000,
    maxLevel: 1,
    priceScaling: 1,
    effect: { type: 'piercing', value: 1 }
  },
  {
    id: 'explosive_rounds',
    name: 'Explosive Rounds',
    description: 'Bullets explode on impact',
    icon: '💣',
    category: 'weapon',
    basePrice: 3500,
    maxLevel: 1,
    priceScaling: 1,
    effect: { type: 'explosive', value: 1 }
  },
  {
    id: 'rapid_reload',
    name: 'Rapid Reload',
    description: '+40% reload speed per level',
    icon: '🔄',
    category: 'weapon',
    basePrice: 550,
    maxLevel: 5,
    priceScaling: 1.5,
    effect: { type: 'reloadSpeed', value: 0.40 }
  },
  {
    id: 'dual_wielding',
    name: 'Dual Wielding',
    description: 'Fire two guns simultaneously',
    icon: '🔫🔫',
    category: 'weapon',
    basePrice: 6000,
    maxLevel: 1,
    priceScaling: 1,
    effect: { type: 'dualWield', value: 1 }
  },
  {
    id: 'homing_bullets',
    name: 'Homing Bullets',
    description: 'Bullets track nearby enemies',
    icon: '🎯',
    category: 'weapon',
    basePrice: 4500,
    maxLevel: 1,
    priceScaling: 1,
    effect: { type: 'homing', value: 1 }
  },
  {
    id: 'multishot',
    name: 'Multishot',
    description: '+1 extra bullet per shot per level',
    icon: '🔥',
    category: 'weapon',
    basePrice: 1200,
    maxLevel: 3,
    priceScaling: 2.0,
    effect: { type: 'multishot', value: 1 }
  },

  // CREATIVE EXPANSION: More Stat Upgrades!
  {
    id: 'health_regen',
    name: 'Health Regeneration',
    description: '+2 HP per second per level',
    icon: '💚',
    category: 'stat',
    basePrice: 1000,
    maxLevel: 5,
    priceScaling: 1.8,
    effect: { type: 'healthRegen', value: 2 }
  },
  {
    id: 'dodge_chance',
    name: 'Dodge Master',
    description: '+5% dodge chance per level',
    icon: '🌀',
    category: 'stat',
    basePrice: 1100,
    maxLevel: 4,
    priceScaling: 1.9,
    effect: { type: 'dodgeChance', value: 0.05 }
  },
  {
    id: 'luck_boost',
    name: 'Lucky Charm',
    description: '+15% better loot quality per level',
    icon: '🍀',
    category: 'stat',
    basePrice: 950,
    maxLevel: 5,
    priceScaling: 1.7,
    effect: { type: 'luck', value: 0.15 }
  },
  {
    id: 'armor_plating',
    name: 'Armor Plating',
    description: '+8% damage reduction per level',
    icon: '🛡️',
    category: 'stat',
    basePrice: 1300,
    maxLevel: 5,
    priceScaling: 1.9,
    effect: { type: 'armor', value: 0.08 }
  },
  {
    id: 'lifesteal',
    name: 'Vampiric Touch',
    description: '+3% lifesteal per level',
    icon: '🩸',
    category: 'stat',
    basePrice: 1400,
    maxLevel: 5,
    priceScaling: 2.0,
    effect: { type: 'lifesteal', value: 0.03 }
  },
  {
    id: 'combo_multiplier',
    name: 'Combo Master',
    description: '+10% combo rewards per level',
    icon: '🔥',
    category: 'stat',
    basePrice: 800,
    maxLevel: 5,
    priceScaling: 1.6,
    effect: { type: 'comboBonus', value: 0.10 }
  },

  // ROGUELIKE: Advanced Abilities (Keys 4-9)!
  {
    id: 'explosive_rounds',
    name: 'Explosive Rounds',
    description: 'Key 4: Next 10 shots explode in area - 8s CD',
    icon: '💥',
    category: 'ability',
    basePrice: 5000,
    maxLevel: 1,
    priceScaling: 1,
    effect: { type: 'explosiveRounds', value: 1 }
  },
  {
    id: 'berserk_mode',
    name: 'Berserk Rage',
    description: 'Key 5: 2x fire rate + damage for 8s - 10s CD',
    icon: '😈',
    category: 'ability',
    basePrice: 6000,
    maxLevel: 1,
    priceScaling: 1,
    effect: { type: 'berserk', value: 1 }
  },
  {
    id: 'teleport',
    name: 'Teleportation',
    description: 'Key 6: Instant teleport to cursor - 6s CD',
    icon: '✨',
    category: 'ability',
    basePrice: 7000,
    maxLevel: 1,
    priceScaling: 1,
    effect: { type: 'teleport', value: 1 }
  },
  {
    id: 'life_drain',
    name: 'Life Drain',
    description: 'Key 7: Steal HP from enemies for 10s - 12s CD',
    icon: '🩸',
    category: 'ability',
    basePrice: 8000,
    maxLevel: 1,
    priceScaling: 1,
    effect: { type: 'lifeDrain', value: 1 }
  },
  {
    id: 'bullet_time',
    name: 'Bullet Time',
    description: 'Key 8: Ultra slow-mo for 4s - 15s CD',
    icon: '⏳',
    category: 'ability',
    basePrice: 10000,
    maxLevel: 1,
    priceScaling: 1,
    effect: { type: 'bulletTime', value: 1 }
  },
  {
    id: 'orbital_strike',
    name: 'Orbital Strike',
    description: 'Key 9: Massive AOE damage at cursor - 20s CD',
    icon: '☄️',
    category: 'ability',
    basePrice: 12000,
    maxLevel: 1,
    priceScaling: 1,
    effect: { type: 'orbitalStrike', value: 1 }
  },

  // OPTIMIZATION: More Upgrades!
  {
    id: 'mega_damage',
    name: 'Mega Damage',
    description: '+25% Damage per level',
    icon: '⚔️',
    category: 'weapon',
    basePrice: 1500,
    maxLevel: 10,
    priceScaling: 1.8,
    effect: { type: 'damage', value: 0.25 }
  },
  {
    id: 'ultra_fire_rate',
    name: 'Ultra Fire Rate',
    description: '+20% Fire Rate per level',
    icon: '🔫',
    category: 'weapon',
    basePrice: 1200,
    maxLevel: 10,
    priceScaling: 1.7,
    effect: { type: 'fireRate', value: 0.20 }
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: '+15% Move Speed per level',
    icon: '🏃',
    category: 'stat',
    basePrice: 800,
    maxLevel: 8,
    priceScaling: 1.6,
    effect: { type: 'speed', value: 0.15 }
  },
  {
    id: 'health_regen',
    name: 'Health Regeneration',
    description: '+2 HP/s Regen per level',
    icon: '💚',
    category: 'stat',
    basePrice: 2000,
    maxLevel: 5,
    priceScaling: 2.0,
    effect: { type: 'healthRegen', value: 2 }
  },
  {
    id: 'crit_damage',
    name: 'Critical Damage',
    description: '+30% Crit Damage per level',
    icon: '💀',
    category: 'weapon',
    basePrice: 1800,
    maxLevel: 5,
    priceScaling: 1.9,
    effect: { type: 'critChance', value: 0.30 }
  },
  {
    id: 'money_printer',
    name: 'Money Printer',
    description: '+35% Money Gain per level',
    icon: '💰',
    category: 'stat',
    basePrice: 1000,
    maxLevel: 8,
    priceScaling: 1.8,
    effect: { type: 'moneyBoost', value: 0.35 }
  },
  {
    id: 'xp_magnet',
    name: 'XP Magnet',
    description: '+30% XP Gain per level',
    icon: '⭐',
    category: 'stat',
    basePrice: 1000,
    maxLevel: 8,
    priceScaling: 1.8,
    effect: { type: 'xpBoost', value: 0.30 }
  },
  {
    id: 'combo_master',
    name: 'Combo Master',
    description: '+20% Combo Duration per level',
    icon: '🔥',
    category: 'stat',
    basePrice: 1500,
    maxLevel: 5,
    priceScaling: 1.7,
    effect: { type: 'comboBonus', value: 0.20 }
  },
  {
    id: 'dodge_expert',
    name: 'Dodge Expert',
    description: '+8% Dodge Chance per level',
    icon: '🌪️',
    category: 'stat',
    basePrice: 2500,
    maxLevel: 5,
    priceScaling: 2.0,
    effect: { type: 'dodgeChance', value: 0.08 }
  },
  {
    id: 'armored_plating',
    name: 'Armored Plating',
    description: '+5% Damage Reduction per level',
    icon: '🛡️',
    category: 'stat',
    basePrice: 2000,
    maxLevel: 8,
    priceScaling: 1.8,
    effect: { type: 'armor', value: 0.05 }
  },
  {
    id: 'vampire',
    name: 'Vampire',
    description: '+5% Lifesteal per level',
    icon: '🧛',
    category: 'stat',
    basePrice: 2500,
    maxLevel: 5,
    priceScaling: 2.2,
    effect: { type: 'lifesteal', value: 0.05 }
  },
  {
    id: 'ammo_storage',
    name: 'Ammo Storage',
    description: '+50 Max Ammo per level',
    icon: '📦',
    category: 'weapon',
    basePrice: 500,
    maxLevel: 10,
    priceScaling: 1.5,
    effect: { type: 'ammo', value: 50 }
  },

  // TESTING: Free automation items!
  {
    id: 'auto_click',
    name: 'Auto-Clicker [TEST]',
    description: 'Automatically fires weapon (FREE for testing)',
    icon: '🤖',
    category: 'ability',
    basePrice: 0,
    maxLevel: 1,
    priceScaling: 1,
    effect: { type: 'autoClick', value: 1 }
  },
  {
    id: 'auto_reload',
    name: 'Auto-Reload [TEST]',
    description: 'Automatically reloads weapon (FREE for testing)',
    icon: '🔄',
    category: 'ability',
    basePrice: 0,
    maxLevel: 1,
    priceScaling: 1,
    effect: { type: 'autoReload', value: 1 }
  },
]

export class ShopManager {
  private purchasedItems: Map<string, number> = new Map() // itemId -> level

  constructor() {
    // Initialize all items at level 0
    SHOP_ITEMS.forEach(item => {
      this.purchasedItems.set(item.id, 0)
    })
  }

  getItemLevel(itemId: string): number {
    return this.purchasedItems.get(itemId) || 0
  }

  canPurchase(itemId: string, playerMoney: number): boolean {
    const item = SHOP_ITEMS.find(i => i.id === itemId)
    if (!item) return false

    const currentLevel = this.getItemLevel(itemId)
    if (currentLevel >= item.maxLevel) return false

    const price = this.getPrice(itemId)
    return playerMoney >= price
  }

  getPrice(itemId: string): number {
    const item = SHOP_ITEMS.find(i => i.id === itemId)
    if (!item) return 0

    const currentLevel = this.getItemLevel(itemId)
    return Math.floor(item.basePrice * Math.pow(item.priceScaling, currentLevel))
  }

  purchase(itemId: string): boolean {
    const item = SHOP_ITEMS.find(i => i.id === itemId)
    if (!item) return false

    const currentLevel = this.getItemLevel(itemId)
    if (currentLevel >= item.maxLevel) return false

    this.purchasedItems.set(itemId, currentLevel + 1)
    return true
  }

  getAllItems(): Array<{ item: ShopItem; level: number; price: number; canUpgrade: boolean }> {
    return SHOP_ITEMS.map(item => ({
      item,
      level: this.getItemLevel(item.id),
      price: this.getPrice(item.id),
      canUpgrade: this.getItemLevel(item.id) < item.maxLevel
    }))
  }

  getBonus(effectType: string): number {
    let total = 0
    this.purchasedItems.forEach((level, itemId) => {
      const item = SHOP_ITEMS.find(i => i.id === itemId)
      if (item && item.effect.type === effectType) {
        total += item.effect.value * level
      }
    })
    return total
  }

  hasAbility(abilityType: string): boolean {
    const item = SHOP_ITEMS.find(i => i.effect.type === abilityType)
    if (!item) return false
    return this.getItemLevel(item.id) > 0
  }
}
export class ShopUI {
  private scene: Phaser.Scene
  private shopManager: ShopManager
  private player: Player
  private isOpen = false
  private uiElements: any[] = [] // FIX V11: Store elements like skill tree!
  private overlay!: Phaser.GameObjects.Rectangle
  private currentCategory: 'weapon' | 'stat' | 'ability' = 'weapon'
  private scrollOffset = 0
  private scrollableItems: any[] = []

  constructor(scene: Phaser.Scene, shopManager: ShopManager, player: Player) {
    this.scene = scene
    this.shopManager = shopManager
    this.player = player
  }

  toggle() {
    if (this.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  open() {
    if (this.isOpen) return
    this.isOpen = true

    this.scene.physics.pause()

    const screenWidth = this.scene.scale.width
    const screenHeight = this.scene.scale.height
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    // Dark overlay - NO interactive!
    this.overlay = this.scene.add.rectangle(
      centerX,
      centerY,
      screenWidth * 2,
      screenHeight * 2,
      0x000000,
      0.7 // Reduced opacity for less obstruction
    ).setScrollFactor(0).setDepth(10000).setAlpha(0)

    // Modern UI: Add main panel background with depth
    const panelWidth = Math.min(900, screenWidth * 0.9)
    const panelHeight = Math.min(700, screenHeight * 0.85)

    // Shadow effect (multiple offset rectangles)
    const shadow1 = this.scene.add.rectangle(centerX + 8, centerY + 8, panelWidth, panelHeight, 0x000000, 0.3)
      .setScrollFactor(0).setDepth(10001).setAlpha(0)
    const shadow2 = this.scene.add.rectangle(centerX + 4, centerY + 4, panelWidth, panelHeight, 0x000000, 0.2)
      .setScrollFactor(0).setDepth(10001).setAlpha(0)

    // Main panel
    const mainPanel = this.scene.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x1a1a2e, 0.95)
      .setScrollFactor(0).setDepth(10001)
      .setStrokeStyle(3, 0xf39c12, 1)
      .setAlpha(0)

    // Smooth fade-in animation
    this.scene.tweens.add({
      targets: [this.overlay, shadow1, shadow2, mainPanel],
      alpha: 1,
      duration: 200,
      ease: 'Power2'
    })

    this.uiElements = [this.overlay, shadow1, shadow2, mainPanel]

    // Title with better positioning
    const title = this.scene.add.text(centerX, centerY - (panelHeight / 2) + 50, '🏪 WEAPON SHOP 🏪', {
      fontSize: '42px',
      color: '#f39c12',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10002).setAlpha(0)
    title.disableInteractive()

    this.scene.tweens.add({
      targets: title,
      alpha: 1,
      y: title.y - 10,
      duration: 300,
      ease: 'Back.easeOut'
    })

    this.uiElements.push(title)

    // Money display with animated background
    const moneyBg = this.scene.add.rectangle(centerX, centerY - (panelHeight / 2) + 110, 250, 40, 0x27ae60, 0.9)
      .setScrollFactor(0).setDepth(10002)
      .setStrokeStyle(2, 0x2ecc71, 1)
      .setAlpha(0)

    const moneyText = this.scene.add.text(centerX, centerY - (panelHeight / 2) + 110, `💰 Money: $${this.player.money}`, {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10003).setAlpha(0)
    moneyText.disableInteractive()

    this.scene.tweens.add({
      targets: [moneyBg, moneyText],
      alpha: 1,
      duration: 300,
      delay: 100,
      ease: 'Power2'
    })

    this.uiElements.push(moneyBg, moneyText)

    // Category tabs - Modern pill-style design
    const categories = [
      { id: 'weapon', name: 'WEAPONS', icon: '💥' },
      { id: 'stat', name: 'STATS', icon: '⚡' },
      { id: 'ability', name: 'ABILITIES', icon: '🌟' },
    ]

    const tabsY = centerY - (panelHeight / 2) + 170

    categories.forEach((cat, index) => {
      const tabX = centerX + (-200 + index * 200)
      const isActive = cat.id === this.currentCategory

      // Modern pill-style tabs with glow effect
      const tabBg = this.scene.add.rectangle(tabX, tabsY, 180, 45, isActive ? 0xf39c12 : 0x2c3e50, 0.9)
        .setScrollFactor(0).setDepth(10003)
        .setStrokeStyle(2, isActive ? 0xf1c40f : 0x34495e, 1)
        .setAlpha(0)

      const tabText = this.scene.add.text(tabX, tabsY, `${cat.icon} ${cat.name}`, {
        fontSize: '15px',
        color: isActive ? '#ffffff' : '#bdc3c7',
        fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(10004).setAlpha(0)
      tabText.disableInteractive()

      // Slide-in animation
      this.scene.tweens.add({
        targets: [tabBg, tabText],
        alpha: 1,
        y: tabsY + 5,
        duration: 250,
        delay: 150 + (index * 50),
        ease: 'Back.easeOut'
      })

      // Make interactive IMMEDIATELY
      tabBg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          if (!isActive) {
            tabBg.setFillStyle(0x34495e, 1)
            this.scene.tweens.add({
              targets: tabBg,
              scaleX: 1.05,
              scaleY: 1.05,
              duration: 150
            })
          }
        })
        .on('pointerout', () => {
          if (!isActive) {
            tabBg.setFillStyle(0x2c3e50, 0.9)
            this.scene.tweens.add({
              targets: tabBg,
              scaleX: 1,
              scaleY: 1,
              duration: 150
            })
          }
        })
        .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
          event.stopPropagation()
          this.currentCategory = cat.id as any
          this.close()
          this.open() // Refresh
        })

      this.uiElements.push(tabBg, tabText)
    })

    // Close button (X in corner)
    const closeBtnX = centerX + (panelWidth / 2) - 40
    const closeBtnY = centerY - (panelHeight / 2) + 40
    const closeBtn = this.scene.add.rectangle(closeBtnX, closeBtnY, 50, 50, 0xe74c3c, 0.9)
      .setScrollFactor(0).setDepth(10003)
      .setStrokeStyle(2, 0xc0392b, 1)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        closeBtn.setFillStyle(0xc0392b, 1)
        this.scene.tweens.add({
          targets: closeBtn,
          angle: 90,
          duration: 200
        })
      })
      .on('pointerout', () => {
        closeBtn.setFillStyle(0xe74c3c, 0.9)
        this.scene.tweens.add({
          targets: closeBtn,
          angle: 0,
          duration: 200
        })
      })
      .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
        event.stopPropagation()
        this.close()
      })

    const closeBtnText = this.scene.add.text(closeBtnX, closeBtnY, '✕', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10004).setAlpha(0)
    closeBtnText.disableInteractive()

    this.scene.tweens.add({
      targets: [closeBtn, closeBtnText],
      alpha: 1,
      duration: 250,
      delay: 200,
      ease: 'Power2'
    })

    this.uiElements.push(closeBtn, closeBtnText)

    // Items list - SCROLLABLE! (MODERN CARD LAYOUT)
    const items = this.shopManager.getAllItems().filter(i => i.item.category === this.currentCategory)
    const startY = centerY - (panelHeight / 2) + 240
    const itemHeight = 60 // Card-style spacing
    this.scrollOffset = 0
    this.scrollableItems = []

    // Add scroll hint with better positioning
    const scrollHint = this.scene.add.text(centerX, centerY + (panelHeight / 2) - 30, '🖱️ Scroll with Mouse Wheel', {
      fontSize: '14px',
      color: '#7f8c8d',
      fontStyle: 'italic',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10002).setAlpha(0)
    scrollHint.disableInteractive()

    this.scene.tweens.add({
      targets: scrollHint,
      alpha: 0.7,
      duration: 500,
      delay: 400,
      ease: 'Power2',
      yoyo: true,
      repeat: -1
    })

    this.uiElements.push(scrollHint)

    // Mouse wheel scroll for shop with smooth scrolling
    this.scene.input.on('wheel', (pointer: any, gameObjects: any[], deltaX: number, deltaY: number) => {
      if (this.isOpen) {
        this.scrollOffset += deltaY * 0.25
        const maxScroll = Math.max(0, items.length * itemHeight - (panelHeight - 350))
        this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset, 0, maxScroll)

        // Visibility clipping bounds relative to panel
        const visibleTop = centerY - (panelHeight / 2) + 220
        const visibleBottom = centerY + (panelHeight / 2) - 80

        this.scrollableItems.forEach(el => {
          const idx = this.scrollableItems.indexOf(el) / 8 // 8 elements per item (shadow, bg, text, desc, levelBg, levelText, priceBg, priceText)
          const baseY = startY + Math.floor(idx) * itemHeight
          const newY = baseY - this.scrollOffset
          el.setY(newY)

          // AGGRESSIVE clipping - account for full card extent including text
          // Card: ±26px, Text extends: -16px (top of name) to +15px (bottom of desc)
          // Total extent: ±30px to be safe
          const fullExtent = 30
          const isVisible = (newY + fullExtent >= visibleTop) && (newY - fullExtent <= visibleBottom)
          el.setVisible(isVisible)
        })
      }
    })

    items.forEach((itemData, index) => {
      const item = itemData.item
      const absY = startY + index * itemHeight

      const canAfford = this.player.money >= itemData.price
      const canBuy = itemData.canUpgrade && canAfford

      // Modern card with depth - shadow layer
      const cardShadow = this.scene.add.rectangle(centerX + 2, absY + 2, 700, 52, 0x000000, 0.3)
        .setScrollFactor(0).setDepth(10003).setAlpha(0)

      // Card background with gradient effect
      const bgColor = canBuy ? 0x27ae60 : (itemData.canUpgrade ? 0x2c3e50 : 0x7f8c8d)
      const itemBg = this.scene.add.rectangle(centerX, absY, 700, 52, bgColor, 0.95)
        .setScrollFactor(0).setDepth(10003)
        .setStrokeStyle(2, canBuy ? 0x2ecc71 : 0x34495e, 0.8)
        .setAlpha(0)

      // Fade in animation for cards
      this.scene.tweens.add({
        targets: [cardShadow, itemBg],
        alpha: 1,
        duration: 200,
        delay: 300 + (index * 30),
        ease: 'Power2'
      })

      // Icon and name with better spacing
      const itemText = this.scene.add.text(centerX - 330, absY - 8, `${item.icon} ${item.name}`, {
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(10004).setAlpha(0)
      itemText.disableInteractive()

      // Description with better color
      const descText = this.scene.add.text(centerX - 330, absY + 9, item.description, {
        fontSize: '11px',
        color: '#95a5a6',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(10004).setAlpha(0)
      descText.disableInteractive()

      // Level indicator with pill background
      const levelBg = this.scene.add.rectangle(centerX + 150, absY, 70, 24, 0x34495e, 0.8)
        .setScrollFactor(0).setDepth(10003).setAlpha(0)
        .setStrokeStyle(1, itemData.level === item.maxLevel ? 0xf1c40f : 0x7f8c8d, 1)

      const levelText = this.scene.add.text(centerX + 150, absY, `${itemData.level}/${item.maxLevel}`, {
        fontSize: '12px',
        color: itemData.level === item.maxLevel ? '#f1c40f' : '#ecf0f1',
        fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(10004).setAlpha(0)
      levelText.disableInteractive()

      // Price button with modern pill style
      const priceColor = canAfford ? 0x27ae60 : 0xe74c3c
      const priceBg = this.scene.add.rectangle(centerX + 270, absY, 110, 38, priceColor, itemData.canUpgrade ? 0.9 : 0.5)
        .setScrollFactor(0).setDepth(10003)
        .setStrokeStyle(2, canAfford ? 0x2ecc71 : 0xc0392b, 1)
        .setAlpha(0)

      const priceText = this.scene.add.text(centerX + 270, absY, itemData.canUpgrade ? `$${itemData.price}` : 'MAX', {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(10004).setAlpha(0)
      priceText.disableInteractive()

      // Fade in text elements
      this.scene.tweens.add({
        targets: [itemText, descText, levelBg, levelText, priceBg, priceText],
        alpha: 1,
        duration: 200,
        delay: 320 + (index * 30),
        ease: 'Power2'
      })

      this.uiElements.push(cardShadow, itemBg, itemText, descText, levelBg, levelText, priceBg, priceText)
      this.scrollableItems.push(cardShadow, itemBg, itemText, descText, levelBg, levelText, priceBg, priceText)

      // Make clickable with modern hover effects
      if (canBuy) {
        itemBg.setInteractive({ useHandCursor: true })
          .on('pointerover', () => {
            itemBg.setFillStyle(0x2ecc71, 1)
            this.scene.tweens.add({
              targets: itemBg,
              scaleX: 1.02,
              scaleY: 1.08,
              duration: 150,
              ease: 'Power2'
            })
            this.scene.cameras.main.flash(50, 0, 255, 0)
          })
          .on('pointerout', () => {
            itemBg.setFillStyle(0x27ae60, 0.95)
            this.scene.tweens.add({
              targets: itemBg,
              scaleX: 1,
              scaleY: 1,
              duration: 150,
              ease: 'Power2'
            })
          })
          .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
            event.stopPropagation()
            // Pulse animation on purchase
            this.scene.tweens.add({
              targets: itemBg,
              scaleX: 0.95,
              scaleY: 0.95,
              duration: 100,
              yoyo: true,
              ease: 'Power2'
            })
            this.buyItem(item.id)
          })

        priceBg.setInteractive({ useHandCursor: true })
          .on('pointerover', () => {
            priceBg.setFillStyle(0x27ae60, 1)
          })
          .on('pointerout', () => priceBg.setFillStyle(0x2ecc71, 0.9))
          .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
            event.stopPropagation()
            this.buyItem(item.id)
          })
      }
    })
  }
  private buyItem(itemId: string) {
    const price = this.shopManager.getPrice(itemId)
    if (this.player.money >= price) {
      this.shopManager.purchase(itemId)
      this.player.addMoney(-price)

      const item = SHOP_ITEMS.find(i => i.id === itemId)!
      this.emitMessage(`✅ Purchased ${item.icon} ${item.name}!`, 'success')

      const screenWidth = this.scene.scale.width
      const screenHeight = this.scene.scale.height
      this.showPurchasePopup(screenWidth / 2, screenHeight / 2 - 50, item.name)
      this.createPurchaseParticles(screenWidth / 2, screenHeight / 2 - 50, 0x2ecc71)

      this.player.applyShopBonuses(this.shopManager)
      this.close()
      this.open() // Refresh
    }
  }

  private showPurchasePopup(x: number, y: number, itemName: string) {
    const popup = this.scene.add.text(
      x, y,
      `✨ ${itemName} Upgraded! ✨`,
      {
        fontSize: '32px',
        color: '#2ecc71',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(15000)

    this.scene.tweens.add({
      targets: popup,
      scale: 1.5,
      alpha: 0,
      duration: 1500,
      ease: 'Cubic.easeOut',
      onComplete: () => popup.destroy()
    })
  }

  private createPurchaseParticles(x: number, y: number, color: number) {
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2
      const distance = Phaser.Math.Between(50, 150)

      const particle = this.scene.add.circle(x, y, 6, color)
        .setScrollFactor(0)
        .setDepth(14000)

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        duration: 800,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      })
    }
  }

  close() {
    if (!this.isOpen) return
    this.isOpen = false

    this.scene.physics.resume()

    // FIX V11: Destroy all elements like skill tree!
    this.uiElements.forEach(el => el.destroy())
    this.uiElements = []
  }

  isShopOpen(): boolean {
    return this.isOpen
  }

  private emitMessage(text: string, type: 'success' | 'warning' | 'danger') {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gameEvent', {
        detail: { type: 'message', data: { text, type } }
      }))
    }
  }
}

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

  // Special Abilities (expensive, single purchase)
  {
    id: 'dash_ability',
    name: 'Dash Ability',
    description: 'Unlock dash ability (Space key)',
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
    description: 'Unlock shield ability (Q key) - blocks 5 hits',
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
    description: 'Unlock time slow ability (F key) - 5s duration',
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

  // CREATIVE EXPANSION: More Special Abilities!
  {
    id: 'teleport',
    name: 'Teleportation',
    description: 'Unlock teleport ability (V key) - instant movement',
    icon: '✨',
    category: 'ability',
    basePrice: 7000,
    maxLevel: 1,
    priceScaling: 1,
    effect: { type: 'teleport', value: 1 }
  },
  {
    id: 'berserk_mode',
    name: 'Berserk Rage',
    description: 'Unlock berserk mode (G key) - 3x damage for 10s',
    icon: '😈',
    category: 'ability',
    basePrice: 8000,
    maxLevel: 1,
    priceScaling: 1,
    effect: { type: 'berserk', value: 1 }
  },
  {
    id: 'invisibility',
    name: 'Ghost Cloak',
    description: 'Unlock invisibility (H key) - enemies ignore you for 8s',
    icon: '👻',
    category: 'ability',
    basePrice: 9000,
    maxLevel: 1,
    priceScaling: 1,
    effect: { type: 'invisibility', value: 1 }
  },
  {
    id: 'orbital_strike',
    name: 'Orbital Strike',
    description: 'Unlock orbital strike (Z key) - massive AOE damage',
    icon: '☄️',
    category: 'ability',
    basePrice: 12000,
    maxLevel: 1,
    priceScaling: 1,
    effect: { type: 'orbitalStrike', value: 1 }
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
      0.85
    ).setScrollFactor(0).setDepth(10000)

    this.uiElements = [this.overlay]

    // FIX V11: Use ABSOLUTE positioning like skill tree!

    // Title
    const title = this.scene.add.text(centerX, centerY - 280, '🏪 WEAPON SHOP 🏪', {
      fontSize: '48px',
      color: '#f39c12',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10002)
    title.disableInteractive()
    this.uiElements.push(title)

    // Money display
    const moneyText = this.scene.add.text(centerX, centerY - 230, `💰 Money: $${this.player.money}`, {
      fontSize: '24px',
      color: '#2ecc71',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10002)
    moneyText.disableInteractive()
    this.uiElements.push(moneyText)

    // Category tabs - ABSOLUTE positions!
    const categories = [
      { id: 'weapon', name: 'WEAPONS', icon: '💥' },
      { id: 'stat', name: 'STATS', icon: '⚡' },
      { id: 'ability', name: 'ABILITIES', icon: '🌟' },
    ]

    const tabsY = centerY - 180

    categories.forEach((cat, index) => {
      const tabX = centerX + (-200 + index * 200)
      const isActive = cat.id === this.currentCategory

      const tabBg = this.scene.add.rectangle(tabX, tabsY, 180, 50, isActive ? 0xf39c12 : 0x34495e, 1)
        .setScrollFactor(0).setDepth(10003)
      
      const tabText = this.scene.add.text(tabX, tabsY, `${cat.icon} ${cat.name}`, {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(10004)
      tabText.disableInteractive()

      // Make interactive IMMEDIATELY
      tabBg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          if (!isActive) {
            tabBg.setFillStyle(0x2c3e50, 1)
          }
        })
        .on('pointerout', () => {
          if (!isActive) {
            tabBg.setFillStyle(0x34495e, 1)
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

    // Items list - SCROLLABLE!
    const items = this.shopManager.getAllItems().filter(i => i.item.category === this.currentCategory)
    const startY = centerY - 120
    const itemHeight = 70
    this.scrollOffset = 0
    this.scrollableItems = []

    // Add scroll hint
    const scrollHint = this.scene.add.text(centerX, centerY + 240, '🖱️ Scroll with Mouse Wheel', {
      fontSize: '16px',
      color: '#95a5a6',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10002)
    scrollHint.disableInteractive()
    this.uiElements.push(scrollHint)

    // Mouse wheel scroll for shop
    this.scene.input.on('wheel', (pointer: any, gameObjects: any[], deltaX: number, deltaY: number) => {
      if (this.isOpen) {
        this.scrollOffset += deltaY * 0.3
        const maxScroll = Math.max(0, items.length * itemHeight - 350)
        this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset, 0, maxScroll)

        // Visibility clipping bounds
        const visibleTop = centerY - 150
        const visibleBottom = centerY + 200

        this.scrollableItems.forEach(el => {
          const idx = this.scrollableItems.indexOf(el) / 5 // 5 elements per item
          const baseY = startY + Math.floor(idx) * itemHeight
          const newY = baseY - this.scrollOffset
          el.setY(newY)

          // Hide elements outside visible bounds to prevent overlap
          const isVisible = newY >= visibleTop - 35 && newY <= visibleBottom + 35
          el.setVisible(isVisible)
        })
      }
    })

    items.forEach((itemData, index) => {
      const item = itemData.item
      const absY = startY + index * itemHeight

      const canAfford = this.player.money >= itemData.price
      const canBuy = itemData.canUpgrade && canAfford

      // Background
      const bgColor = canBuy ? 0x27ae60 : (itemData.canUpgrade ? 0x34495e : 0x7f8c8d)
      const itemBg = this.scene.add.rectangle(centerX, absY, 650, 65, bgColor, 0.9)
        .setScrollFactor(0).setDepth(10003)

      // Icon and name
      const itemText = this.scene.add.text(centerX - 300, absY, `${item.icon} ${item.name}`, {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(10004)
      itemText.disableInteractive()

      // Description
      const descText = this.scene.add.text(centerX - 300, absY + 20, item.description, {
        fontSize: '13px',
        color: '#bdc3c7',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(10004)
      descText.disableInteractive()

      // Level
      const levelText = this.scene.add.text(centerX + 140, absY, `Level: ${itemData.level}/${item.maxLevel}`, {
        fontSize: '16px',
        color: itemData.level === item.maxLevel ? '#f1c40f' : '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(10004)
      levelText.disableInteractive()

      // Price button
      const priceColor = canAfford ? 0x2ecc71 : 0xe74c3c
      const priceBg = this.scene.add.rectangle(centerX + 260, absY, 120, 50, priceColor, itemData.canUpgrade ? 0.9 : 0.5)
        .setScrollFactor(0).setDepth(10003)

      const priceText = this.scene.add.text(centerX + 260, absY, itemData.canUpgrade ? `$${itemData.price}` : 'MAX', {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(10004)
      priceText.disableInteractive()

      this.uiElements.push(itemBg, itemText, descText, levelText, priceBg, priceText)
      this.scrollableItems.push(itemBg, itemText, descText, levelText, priceBg, priceText)

      // Make clickable IMMEDIATELY
      if (canBuy) {
        itemBg.setInteractive({ useHandCursor: true })
          .on('pointerover', () => {
            itemBg.setFillStyle(0x2ecc71, 1)
            this.scene.cameras.main.flash(50, 0, 255, 0)
          })
          .on('pointerout', () => itemBg.setFillStyle(0x27ae60, 0.9))
          .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
            event.stopPropagation()
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

    // Close button
    const closeBtn = this.scene.add.rectangle(centerX, centerY + 260, 250, 55, 0xe74c3c, 0.9)
      .setScrollFactor(0).setDepth(10003)
    const closeTxt = this.scene.add.text(centerX, centerY + 260, 'Close (ESC)', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10004)
    closeTxt.disableInteractive()

    this.uiElements.push(closeBtn, closeTxt)

    // Make close button interactive IMMEDIATELY
    closeBtn.setInteractive({ useHandCursor: true })
      .on('pointerover', () => closeBtn.setFillStyle(0xc0392b, 1))
      .on('pointerout', () => closeBtn.setFillStyle(0xe74c3c, 0.9))
      .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
        event.stopPropagation()
        this.close()
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

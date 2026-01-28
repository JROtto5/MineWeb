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
    type: 'damage' | 'fireRate' | 'ammo' | 'health' | 'speed' | 'critChance' | 'moneyBoost' | 'xpBoost' | 'dash' | 'shield' | 'timeSlow'
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
  private ui: any = null
  private currentCategory: 'weapon' | 'stat' | 'ability' = 'weapon'

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

    // FIX V5: Use screen dimensions for proper positioning!
    const screenWidth = this.scene.scale.width
    const screenHeight = this.scene.scale.height

    // Dark overlay - FIX V7: Make interactive to block clicks!
    const overlay = this.scene.add.rectangle(
      screenWidth / 2,
      screenHeight / 2,
      screenWidth * 2,
      screenHeight * 2,
      0x000000,
      0.85
    ).setScrollFactor(0).setDepth(10000)

    // CRITICAL: Make overlay interactive to consume all clicks
    overlay.setInteractive()
      .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
        // Stop event from reaching game world below
        event.stopPropagation()
      })

    const container = this.scene.add.container(
      screenWidth / 2,
      screenHeight / 2
    ).setScrollFactor(0).setDepth(10001)

    // Title - FIX V7: Disable text interactivity
    const title = this.scene.add.text(0, -280, '🏪 WEAPON SHOP 🏪', {
      fontSize: '48px',
      color: '#f39c12',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5)
    title.disableInteractive()

    // Money display - FIX V7: Disable text interactivity
    const moneyText = this.scene.add.text(0, -230, `💰 Money: $${this.player.money}`, {
      fontSize: '24px',
      color: '#2ecc71',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    moneyText.disableInteractive()

    // Category tabs - FIX V5: Create tabs OUTSIDE container for proper click handling!
    const categories = [
      { id: 'weapon', name: 'WEAPONS', icon: '💥' },
      { id: 'stat', name: 'STATS', icon: '⚡' },
      { id: 'ability', name: 'ABILITIES', icon: '🌟' },
    ]

    const tabsY = screenHeight / 2 - 180
    const tabObjects: any[] = []

    categories.forEach((cat, index) => {
      const tabX = screenWidth / 2 + (-200 + index * 200)
      const isActive = cat.id === this.currentCategory

      const tabBg = this.scene.add.rectangle(tabX, tabsY, 180, 50, isActive ? 0xf39c12 : 0x34495e, 1)
        .setScrollFactor(0)
        .setDepth(10002) // Above container!
      const tabText = this.scene.add.text(tabX, tabsY, `${cat.icon} ${cat.name}`, {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(10003) // Above background!
      tabText.disableInteractive() // FIX V7: Prevent text from blocking clicks

      // Make interactive AFTER setting position and depth
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
          event.stopPropagation() // FIX V7: Stop event from bubbling
          this.currentCategory = cat.id as any
          this.close()
          this.open() // Refresh
        })

      tabObjects.push(tabBg, tabText)
    })

    // Items list - FIX V6: Create items with ABSOLUTE positioning (still in container but higher depth!)
    const items = this.shopManager.getAllItems().filter(i => i.item.category === this.currentCategory)
    const startY = screenHeight / 2 - 120
    const itemHeight = 70

    items.forEach((itemData, index) => {
      const item = itemData.item
      const absY = startY + index * itemHeight

      // Can afford?
      const canAfford = this.player.money >= itemData.price
      const canBuy = itemData.canUpgrade && canAfford

      // Background - HIGHER DEPTH for clickable items!
      const bgColor = canBuy ? 0x27ae60 : (itemData.canUpgrade ? 0x34495e : 0x7f8c8d)
      const itemBg = this.scene.add.rectangle(screenWidth / 2, absY, 650, 65, bgColor, 0.9)
        .setScrollFactor(0)
        .setDepth(canBuy ? 10005 : 10003) // MUCH higher if clickable!

      // Icon and name - FIX V7: Disable text interactivity
      const itemText = this.scene.add.text(screenWidth / 2 - 300, absY, `${item.icon} ${item.name}`, {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(10006)
      itemText.disableInteractive()

      // Description - FIX V7: Disable text interactivity
      const descText = this.scene.add.text(screenWidth / 2 - 300, absY + 20, item.description, {
        fontSize: '13px',
        color: '#bdc3c7',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(10006)
      descText.disableInteractive()

      // Level - FIX V7: Disable text interactivity
      const levelText = this.scene.add.text(screenWidth / 2 + 140, absY, `Level: ${itemData.level}/${item.maxLevel}`, {
        fontSize: '16px',
        color: itemData.level === item.maxLevel ? '#f1c40f' : '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(10006)
      levelText.disableInteractive()

      // Price button - ABSOLUTE positioning!
      const priceColor = canAfford ? 0x2ecc71 : 0xe74c3c
      const priceBg = this.scene.add.rectangle(screenWidth / 2 + 260, absY, 120, 50, priceColor, itemData.canUpgrade ? 0.9 : 0.5)
        .setScrollFactor(0)
        .setDepth(canBuy ? 10005 : 10003)

      const priceText = this.scene.add.text(screenWidth / 2 + 260, absY, itemData.canUpgrade ? `$${itemData.price}` : 'MAX', {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(10007)
      priceText.disableInteractive() // FIX V7: Prevent text from blocking clicks

      // Make clickable AFTER positioning and depth!
      if (canBuy) {
        itemBg.setInteractive({ useHandCursor: true })
          .on('pointerover', () => {
            itemBg.setFillStyle(0x2ecc71, 1)
            this.scene.cameras.main.flash(50, 0, 255, 0)
          })
          .on('pointerout', () => itemBg.setFillStyle(0x27ae60, 0.9))
          .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
            event.stopPropagation() // FIX V7: Stop event from bubbling
            this.buyItem(item.id)
          })

        priceBg.setInteractive({ useHandCursor: true })
          .on('pointerover', () => {
            priceBg.setFillStyle(0x27ae60, 1)
          })
          .on('pointerout', () => priceBg.setFillStyle(0x2ecc71, 0.9))
          .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
            event.stopPropagation() // FIX V7: Stop event from bubbling
            this.buyItem(item.id)
          })
      }

      container.add([itemBg, itemText, descText, levelText, priceBg, priceText])
    })

    // Close button
    const closeBtn = this.scene.add.rectangle(0, 260, 250, 55, 0xe74c3c, 0.9)
    const closeTxt = this.scene.add.text(0, 260, 'Close (ESC)', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    closeTxt.disableInteractive() // FIX V7: Prevent text from blocking clicks

    closeBtn.setInteractive({ useHandCursor: true })
      .on('pointerover', () => closeBtn.setFillStyle(0xc0392b, 1))
      .on('pointerout', () => closeBtn.setFillStyle(0xe74c3c, 0.9))
      .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
        event.stopPropagation() // FIX V7: Stop event from bubbling
        this.close()
      })

    container.add([title, moneyText, closeBtn, closeTxt])

    this.ui = { overlay, container, tabObjects }
  }

  private buyItem(itemId: string) {
    const price = this.shopManager.getPrice(itemId)

    if (this.shopManager.canPurchase(itemId, this.player.money)) {
      this.player.money -= price
      this.shopManager.purchase(itemId)
      this.player.applyShopBonuses(this.shopManager)

      // Get item for feedback
      const item = SHOP_ITEMS.find(i => i.id === itemId)
      if (item) {
        // FIX V6: BIG POPUP + Flash + Particles!
        this.showBigPopup(`${item.icon} ${item.name} Purchased!`, '#2ecc71')
        this.scene.cameras.main.flash(200, 50, 255, 50)

        // Create particle burst at center
        this.createPurchaseParticles(this.scene.scale.width / 2, this.scene.scale.height / 2, 0x2ecc71)

        this.emitMessage(`✅ Purchased ${item.name}!`, 'success')
      }

      // Refresh shop
      this.close()
      this.open()
    }
  }

  // FIX V6: Big popup notification for purchases!
  private showBigPopup(text: string, color: string) {
    const popup = this.scene.add.text(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2 - 100,
      text,
      {
        fontSize: '42px',
        color: color,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(15000)

    // Scale up and fade out
    this.scene.tweens.add({
      targets: popup,
      scale: 1.5,
      alpha: 0,
      duration: 1500,
      ease: 'Cubic.easeOut',
      onComplete: () => popup.destroy()
    })
  }

  // FIX V6: Particle effects for purchases!
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

    if (this.ui) {
      this.ui.overlay.destroy()
      this.ui.container.destroy()
      // FIX V5: Destroy tab objects too!
      if (this.ui.tabObjects) {
        this.ui.tabObjects.forEach((obj: any) => obj.destroy())
      }
      this.ui = null
    }
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

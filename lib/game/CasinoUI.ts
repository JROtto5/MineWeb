import Phaser from 'phaser'
import { CasinoManager } from './Casino'
import Player from './Player'

export class CasinoUI {
  private scene: Phaser.Scene
  private casinoManager: CasinoManager
  private player: Player
  private isOpen = false
  private container!: Phaser.GameObjects.Container
  private overlay!: Phaser.GameObjects.Rectangle

  constructor(scene: Phaser.Scene, casinoManager: CasinoManager, player: Player) {
    this.scene = scene
    this.casinoManager = casinoManager
    this.player = player
  }

  open() {
    if (this.isOpen) return
    this.isOpen = true

    // Pause game
    this.scene.physics.pause()

    // FIX V5: Use screen dimensions for proper positioning!
    const screenWidth = this.scene.scale.width
    const screenHeight = this.scene.scale.height

    // Dark overlay
    this.overlay = this.scene.add.rectangle(
      screenWidth / 2,
      screenHeight / 2,
      screenWidth * 2,
      screenHeight * 2,
      0x000000,
      0.8
    ).setScrollFactor(0).setDepth(1000)

    // Create main container
    this.container = this.scene.add.container(
      screenWidth / 2,
      screenHeight / 2
    ).setScrollFactor(0).setDepth(1001)

    this.showMainMenu()
  }

  private showMainMenu() {
    this.clearContainer()

    const screenWidth = this.scene.scale.width
    const screenHeight = this.scene.scale.height

    // Title - ABSOLUTE position!
    const title = this.scene.add.text(screenWidth / 2, screenHeight / 2 - 200, '🎰 CASINO 🎰', {
      fontSize: '48px',
      color: '#f39c12',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)

    // Money display
    const moneyText = this.scene.add.text(screenWidth / 2, screenHeight / 2 - 140, `Your Money: $${this.player.money}`, {
      fontSize: '24px',
      color: '#2ecc71',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)

    // Buttons - createButton now returns {bg, label}
    const buttonY = -50
    const buttonGap = 70

    const slotBtn = this.createButton(0, buttonY, '🎰 Slot Machine', () => this.openSlotMachine())
    const blackjackBtn = this.createButton(0, buttonY + buttonGap, '🃏 Blackjack', () => this.openBlackjack())
    const rouletteBtn = this.createButton(0, buttonY + buttonGap * 2, '🎲 Roulette', () => this.openRoulette())
    const lootboxBtn = this.createButton(0, buttonY + buttonGap * 3, '📦 Loot Box ($100)', () => this.openLootBox())
    const closeBtn = this.createButton(0, buttonY + buttonGap * 4 + 20, 'Close', () => this.close(), 0xe74c3c)

    this.container.add([title, moneyText,
      slotBtn.bg, slotBtn.label,
      blackjackBtn.bg, blackjackBtn.label,
      rouletteBtn.bg, rouletteBtn.label,
      lootboxBtn.bg, lootboxBtn.label,
      closeBtn.bg, closeBtn.label
    ])
  }

  private openSlotMachine() {
    this.clearContainer()

    const title = this.scene.add.text(0, -200, '🎰 SLOT MACHINE 🎰', {
      fontSize: '36px',
      color: '#f39c12',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    const betText = this.scene.add.text(0, -140, 'Bet: $50 | Match 3 symbols to win!', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5)

    // Reels
    const reelTexts: Phaser.GameObjects.Text[] = []
    for (let i = 0; i < 3; i++) {
      const reel = this.scene.add.text(-100 + i * 100, -50, '❓', {
        fontSize: '64px',
      }).setOrigin(0.5)
      reelTexts.push(reel)
    }

    const resultText = this.scene.add.text(0, 50, '', {
      fontSize: '24px',
      color: '#f1c40f',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    const spinBtn = this.createButton(0, 150, '🎰 SPIN ($50)', () => {
      if (this.player.money < 50) {
        resultText.setText('Not enough money!')
        resultText.setColor('#e74c3c')
        return
      }

      this.player.addMoney(-50)

      // Spin animation
      let spins = 0
      const spinInterval = this.scene.time.addEvent({
        delay: 100,
        callback: () => {
          reelTexts.forEach(reel => {
            reel.setText(['🍒', '🍋', '🍊', '💎', '7️⃣', '⭐'][Phaser.Math.Between(0, 5)])
          })
          spins++
          if (spins >= 15) {
            spinInterval.destroy()

            // Final result
            const result = this.casinoManager.spinSlots(50)
            reelTexts.forEach((reel, i) => {
              reel.setText(result.symbols[i])
            })

            if (result.isWin) {
              resultText.setText(`WIN! +$${result.payout}`)
              resultText.setColor('#2ecc71')
              this.player.addMoney(result.payout)
            } else {
              resultText.setText('No win. Try again!')
              resultText.setColor('#e74c3c')
            }

            betText.setText(`Your Money: $${this.player.money}`)
          }
        },
        loop: true,
      })
    })

    const backBtn = this.createButton(0, 220, 'Back', () => this.showMainMenu(), 0x95a5a6)

    this.container.add([title, betText, ...reelTexts, resultText, spinBtn.bg, spinBtn.label, backBtn.bg, backBtn.label])
  }

  private openBlackjack() {
    this.clearContainer()

    const title = this.scene.add.text(0, -200, '🃏 BLACKJACK 🃏', {
      fontSize: '36px',
      color: '#f39c12',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    const betText = this.scene.add.text(0, -140, 'Bet: $100 | Get closer to 21 than dealer!', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5)

    const playerHandText = this.scene.add.text(0, -50, '', {
      fontSize: '24px',
      color: '#3498db',
    }).setOrigin(0.5)

    const dealerHandText = this.scene.add.text(0, 0, '', {
      fontSize: '24px',
      color: '#e74c3c',
    }).setOrigin(0.5)

    const resultText = this.scene.add.text(0, 50, '', {
      fontSize: '28px',
      color: '#f1c40f',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    const playBtn = this.createButton(0, 140, '🃏 PLAY ($100)', () => {
      if (this.player.money < 100) {
        resultText.setText('Not enough money!')
        resultText.setColor('#e74c3c')
        return
      }

      this.player.addMoney(-100)
      const result = this.casinoManager.playBlackjack(100)

      playerHandText.setText(`Your Hand: ${result.playerHand}`)
      dealerHandText.setText(`Dealer Hand: ${result.dealerHand}`)
      resultText.setText(result.result)

      if (result.payout > 100) {
        resultText.setColor('#2ecc71')
        this.player.addMoney(result.payout)
      } else if (result.payout === 100) {
        resultText.setColor('#f39c12')
        this.player.addMoney(result.payout)
      } else {
        resultText.setColor('#e74c3c')
      }

      betText.setText(`Your Money: $${this.player.money}`)
    })

    const backBtn = this.createButton(0, 210, 'Back', () => this.showMainMenu(), 0x95a5a6)

    this.container.add([title, betText, playerHandText, dealerHandText, resultText, playBtn.bg, playBtn.label, backBtn.bg, backBtn.label])
  }

  private openRoulette() {
    this.clearContainer()

    const title = this.scene.add.text(0, -200, '🎲 ROULETTE 🎲', {
      fontSize: '36px',
      color: '#f39c12',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    const betText = this.scene.add.text(0, -140, 'Bet: $75 | Choose Red or Black!', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5)

    const resultText = this.scene.add.text(0, -50, '', {
      fontSize: '32px',
      color: '#f1c40f',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    const outcomeText = this.scene.add.text(0, 20, '', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5)

    const redBtn = this.createButton(-120, 100, '🔴 RED', () => {
      if (this.player.money < 75) {
        resultText.setText('Not enough money!')
        return
      }

      this.player.addMoney(-75)
      const result = this.casinoManager.spinRouletteWheel(75, 'red')

      resultText.setText(result.result === 'red' ? '🔴 RED' : '⚫ BLACK')
      outcomeText.setText(result.isWin ? `WIN! +$${result.payout}` : 'LOSE!')
      outcomeText.setColor(result.isWin ? '#2ecc71' : '#e74c3c')

      if (result.isWin) {
        this.player.addMoney(result.payout)
      }

      betText.setText(`Your Money: $${this.player.money}`)
    }, 0xe74c3c)

    const blackBtn = this.createButton(120, 100, '⚫ BLACK', () => {
      if (this.player.money < 75) {
        resultText.setText('Not enough money!')
        return
      }

      this.player.addMoney(-75)
      const result = this.casinoManager.spinRouletteWheel(75, 'black')

      resultText.setText(result.result === 'red' ? '🔴 RED' : '⚫ BLACK')
      outcomeText.setText(result.isWin ? `WIN! +$${result.payout}` : 'LOSE!')
      outcomeText.setColor(result.isWin ? '#2ecc71' : '#e74c3c')

      if (result.isWin) {
        this.player.addMoney(result.payout)
      }

      betText.setText(`Your Money: $${this.player.money}`)
    }, 0x000000)

    const backBtn = this.createButton(0, 180, 'Back', () => this.showMainMenu(), 0x95a5a6)

    this.container.add([title, betText, resultText, outcomeText, redBtn.bg, redBtn.label, blackBtn.bg, blackBtn.label, backBtn.bg, backBtn.label])
  }

  private openLootBox() {
    this.clearContainer()

    const title = this.scene.add.text(0, -200, '📦 MYSTERY LOOT BOX 📦', {
      fontSize: '36px',
      color: '#f39c12',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    const infoText = this.scene.add.text(0, -140, 'Cost: $100 | Rare rewards inside!', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5)

    const rewardText = this.scene.add.text(0, -50, '', {
      fontSize: '32px',
    }).setOrigin(0.5)

    const rarityText = this.scene.add.text(0, 20, '', {
      fontSize: '24px',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    const valueText = this.scene.add.text(0, 60, '', {
      fontSize: '20px',
      color: '#2ecc71',
    }).setOrigin(0.5)

    const openBtn = this.createButton(0, 140, '📦 OPEN ($100)', () => {
      if (this.player.money < 100) {
        rarityText.setText('Not enough money!')
        rarityText.setColor('#e74c3c')
        return
      }

      this.player.addMoney(-100)
      const result = this.casinoManager.openLootBox(100)

      rewardText.setText(result.reward)
      rarityText.setText(result.rarity)

      // Set color based on rarity
      const colors: Record<string, string> = {
        'Common': '#95a5a6',
        'Uncommon': '#2ecc71',
        'Rare': '#3498db',
        'Epic': '#9b59b6',
        'Legendary': '#f39c12',
      }
      rarityText.setColor(colors[result.rarity])

      valueText.setText(`Value: $${result.value}`)
      this.player.addMoney(result.value)

      infoText.setText(`Your Money: $${this.player.money}`)
    })

    const backBtn = this.createButton(0, 210, 'Back', () => this.showMainMenu(), 0x95a5a6)

    this.container.add([title, infoText, rewardText, rarityText, valueText, openBtn.bg, openBtn.label, backBtn.bg, backBtn.label])
  }

  // FIX V6: Create buttons with ABSOLUTE positioning (no nested containers!)
  private createButton(
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    color: number = 0x3498db
  ): { bg: Phaser.GameObjects.Rectangle, label: Phaser.GameObjects.Text } {
    // Get absolute screen position
    const screenWidth = this.scene.scale.width
    const screenHeight = this.scene.scale.height
    const absX = screenWidth / 2 + x
    const absY = screenHeight / 2 + y

    const bg = this.scene.add.rectangle(absX, absY, 280, 50, color)
      .setScrollFactor(0)
      .setDepth(1005) // Higher than overlay!

    const label = this.scene.add.text(absX, absY, text, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1006)

    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        bg.setFillStyle(color, 0.8)
      })
      .on('pointerout', () => bg.setFillStyle(color, 1))
      .on('pointerdown', () => {
        this.scene.cameras.main.flash(100, 0, 255, 0)
        onClick()
      })

    return { bg, label }
  }

  private clearContainer() {
    if (this.container) {
      this.container.removeAll(true)
    }
  }

  close() {
    if (!this.isOpen) return

    this.isOpen = false
    this.scene.physics.resume()

    if (this.container) {
      this.container.destroy()
    }

    if (this.overlay) {
      this.overlay.destroy()
    }
  }
}

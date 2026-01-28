import Phaser from 'phaser'
import { CasinoManager } from './Casino'
import Player from './Player'

export class CasinoUI {
  private scene: Phaser.Scene
  private casinoManager: CasinoManager
  private player: Player
  private _isOpen = false
  private uiElements: any[] = [] // FIX V11: Store elements like skill tree!
  private overlay!: Phaser.GameObjects.Rectangle

  constructor(scene: Phaser.Scene, casinoManager: CasinoManager, player: Player) {
    this.scene = scene
    this.casinoManager = casinoManager
    this.player = player
  }

  get isOpen(): boolean {
    return this._isOpen
  }

  open() {
    if (this._isOpen) return
    this._isOpen = true

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
      0.8
    ).setScrollFactor(0).setDepth(1000)

    this.showMainMenu()
  }

  private showMainMenu() {
    this.clearElements()

    const screenWidth = this.scene.scale.width
    const screenHeight = this.scene.scale.height
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    // FIX V11: Use ABSOLUTE positioning like skill tree!

    // Title
    const title = this.scene.add.text(centerX, centerY - 200, '🎰 CASINO 🎰', {
      fontSize: '48px',
      color: '#f39c12',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)
    title.disableInteractive()

    // Money display
    const moneyText = this.scene.add.text(centerX, centerY - 140, `Your Money: $${this.player.money}`, {
      fontSize: '24px',
      color: '#2ecc71',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)
    moneyText.disableInteractive()

    // Buttons - ABSOLUTE positions!
    const buttonY = centerY - 50
    const buttonGap = 70

    const { bg: slotBg, label: slotLabel } = this.createButton(centerX, buttonY, '🎰 Slot Machine', () => this.openSlotMachine())
    const { bg: bjBg, label: bjLabel } = this.createButton(centerX, buttonY + buttonGap, '🃏 Blackjack', () => this.openBlackjack())
    const { bg: rouletteBg, label: rouletteLabel } = this.createButton(centerX, buttonY + buttonGap * 2, '🎲 Roulette', () => this.openRoulette())
    const { bg: lootBg, label: lootLabel } = this.createButton(centerX, buttonY + buttonGap * 3, '📦 Loot Box ($100)', () => this.openLootBox())
    const { bg: closeBg, label: closeLabel } = this.createButton(centerX, buttonY + buttonGap * 4 + 20, 'Close', () => this.close(), 0xe74c3c)

    this.uiElements = [title, moneyText, slotBg, slotLabel, bjBg, bjLabel, rouletteBg, rouletteLabel, lootBg, lootLabel, closeBg, closeLabel]
  }

  private openSlotMachine() {
    this.clearElements()

    const screenWidth = this.scene.scale.width
    const screenHeight = this.scene.scale.height
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    const title = this.scene.add.text(centerX, centerY - 200, '🎰 SLOT MACHINE 🎰', {
      fontSize: '36px',
      color: '#f39c12',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)
    title.disableInteractive()

    const betText = this.scene.add.text(centerX, centerY - 140, 'Bet: $50 | Match 3 symbols to win!', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)
    betText.disableInteractive()

    // Reels
    const reelTexts: Phaser.GameObjects.Text[] = []
    for (let i = 0; i < 3; i++) {
      const reel = this.scene.add.text(centerX - 100 + i * 100, centerY - 50, '❓', {
        fontSize: '64px',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)
      reel.disableInteractive()
      reelTexts.push(reel)
    }

    const resultText = this.scene.add.text(centerX, centerY + 50, '', {
      fontSize: '24px',
      color: '#f1c40f',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)
    resultText.disableInteractive()

    const { bg: spinBg, label: spinLabel } = this.createButton(centerX, centerY + 150, '🎰 SPIN ($50)', () => {
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

    const { bg: backBg, label: backLabel } = this.createButton(centerX, centerY + 220, 'Back', () => this.showMainMenu(), 0x95a5a6)

    this.uiElements = [title, betText, ...reelTexts, resultText, spinBg, spinLabel, backBg, backLabel]
  }

  private openBlackjack() {
    this.clearElements()

    const screenWidth = this.scene.scale.width
    const screenHeight = this.scene.scale.height
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    const title = this.scene.add.text(centerX, centerY - 200, '🃏 BLACKJACK 🃏', {
      fontSize: '36px',
      color: '#f39c12',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)
    title.disableInteractive()

    const betText = this.scene.add.text(centerX, centerY - 140, 'Bet: $100 | Get closer to 21 than dealer!', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)
    betText.disableInteractive()

    const playerHandText = this.scene.add.text(centerX, centerY - 50, '', {
      fontSize: '24px',
      color: '#3498db',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)
    playerHandText.disableInteractive()

    const dealerHandText = this.scene.add.text(centerX, centerY, '', {
      fontSize: '24px',
      color: '#e74c3c',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)
    dealerHandText.disableInteractive()

    const resultText = this.scene.add.text(centerX, centerY + 50, '', {
      fontSize: '28px',
      color: '#f1c40f',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)
    resultText.disableInteractive()

    const { bg: playBg, label: playLabel } = this.createButton(centerX, centerY + 140, '🃏 PLAY ($100)', () => {
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

    const { bg: backBg, label: backLabel } = this.createButton(centerX, centerY + 210, 'Back', () => this.showMainMenu(), 0x95a5a6)

    this.uiElements = [title, betText, playerHandText, dealerHandText, resultText, playBg, playLabel, backBg, backLabel]
  }

  private openRoulette() {
    this.clearElements()

    const screenWidth = this.scene.scale.width
    const screenHeight = this.scene.scale.height
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    const title = this.scene.add.text(centerX, centerY - 200, '🎲 ROULETTE 🎲', {
      fontSize: '36px',
      color: '#f39c12',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)
    title.disableInteractive()

    const betText = this.scene.add.text(centerX, centerY - 140, 'Bet: $75 | Choose Red or Black!', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)
    betText.disableInteractive()

    const resultText = this.scene.add.text(centerX, centerY - 50, '', {
      fontSize: '32px',
      color: '#f1c40f',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)
    resultText.disableInteractive()

    const outcomeText = this.scene.add.text(centerX, centerY + 20, '', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)
    outcomeText.disableInteractive()

    const { bg: redBg, label: redLabel } = this.createButton(centerX - 120, centerY + 100, '🔴 RED', () => {
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

    const { bg: blackBg, label: blackLabel } = this.createButton(centerX + 120, centerY + 100, '⚫ BLACK', () => {
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

    const { bg: backBg, label: backLabel } = this.createButton(centerX, centerY + 180, 'Back', () => this.showMainMenu(), 0x95a5a6)

    this.uiElements = [title, betText, resultText, outcomeText, redBg, redLabel, blackBg, blackLabel, backBg, backLabel]
  }

  private openLootBox() {
    this.clearElements()

    const screenWidth = this.scene.scale.width
    const screenHeight = this.scene.scale.height
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    const title = this.scene.add.text(centerX, centerY - 200, '📦 MYSTERY LOOT BOX 📦', {
      fontSize: '36px',
      color: '#f39c12',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)
    title.disableInteractive()

    const infoText = this.scene.add.text(centerX, centerY - 140, 'Cost: $100 | Rare rewards inside!', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)
    infoText.disableInteractive()

    const rewardText = this.scene.add.text(centerX, centerY - 50, '', {
      fontSize: '32px',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)
    rewardText.disableInteractive()

    const rarityText = this.scene.add.text(centerX, centerY + 20, '', {
      fontSize: '24px',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)
    rarityText.disableInteractive()

    const valueText = this.scene.add.text(centerX, centerY + 60, '', {
      fontSize: '20px',
      color: '#2ecc71',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002)
    valueText.disableInteractive()

    const { bg: openBg, label: openLabel } = this.createButton(centerX, centerY + 140, '📦 OPEN ($100)', () => {
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

    const { bg: backBg, label: backLabel } = this.createButton(centerX, centerY + 210, 'Back', () => this.showMainMenu(), 0x95a5a6)

    this.uiElements = [title, infoText, rewardText, rarityText, valueText, openBg, openLabel, backBg, backLabel]
  }

  // FIX V11: Create buttons with ABSOLUTE positioning and make interactive immediately!
  private createButton(
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    color: number = 0x3498db
  ): { bg: Phaser.GameObjects.Rectangle, label: Phaser.GameObjects.Text } {
    // ABSOLUTE position!
    const bg = this.scene.add.rectangle(x, y, 280, 50, color)
      .setScrollFactor(0).setDepth(1003) // Higher depth for buttons!

    const label = this.scene.add.text(x, y, text, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1004) // Text above button!
    label.disableInteractive()

    // FIX V11: Make interactive IMMEDIATELY like skill tree!
    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        bg.setFillStyle(color, 0.8)
      })
      .on('pointerout', () => bg.setFillStyle(color, 1))
      .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
        event.stopPropagation()
        this.scene.cameras.main.flash(100, 0, 255, 0)
        onClick()
      })

    return { bg, label }
  }

  private clearElements() {
    this.uiElements.forEach(el => el.destroy())
    this.uiElements = []
  }

  close() {
    if (!this._isOpen) return

    this._isOpen = false
    this.scene.physics.resume()

    this.clearElements()

    if (this.overlay) {
      this.overlay.destroy()
    }
  }
}

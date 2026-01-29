import Phaser from 'phaser'
import { SaveManager } from '../supabase/SaveManager'
import { LeaderboardService } from '../supabase/LeaderboardService'
import { SaveData, LeaderboardEntry } from '../supabase/client'

// Color palette for dark crime theme
const COLORS = {
  bg: 0x0a0a0a,
  panel: 0x1a1a2e,
  accent: 0xbb86fc,
  accent2: 0x03dac6,
  highlight: 0xff0266,
  text: 0xe0e0e0,
  gold: 0xffd700,
  silver: 0xc0c0c0,
  bronze: 0xcd7f32,
}

export default class MenuScene extends Phaser.Scene {
  private leaderboardService!: LeaderboardService
  private saveManager!: SaveManager
  private leaderboardContainer!: Phaser.GameObjects.Container
  private saveSlotContainers: Phaser.GameObjects.Container[] = []
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter
  private refreshTimer?: Phaser.Time.TimerEvent
  private playerName: string = 'Player' // Default player name

  constructor() {
    super({ key: 'MenuScene' })
  }

  preload() {
    // Create a simple square particle texture
    const graphics = this.add.graphics()
    graphics.fillStyle(COLORS.accent, 1)
    graphics.fillRect(0, 0, 8, 8)
    graphics.generateTexture('particle', 8, 8)
    graphics.destroy()
  }

  create() {
    this.initServices()
    this.createBackground()
    this.createParticles()
    this.createTitle()
    this.loadAndDisplayLeaderboard()
    this.loadAndDisplaySaveSlots()
    this.startAutoRefresh()
  }

  private initServices() {
    this.leaderboardService = LeaderboardService.getInstance()
    this.saveManager = SaveManager.getInstance()
  }

  private createBackground() {
    const { width, height } = this.scale

    // Almost black background
    this.add.rectangle(0, 0, width * 2, height * 2, COLORS.bg).setOrigin(0)

    // Animated grid pattern
    const graphics = this.add.graphics()
    graphics.lineStyle(1, COLORS.panel, 0.3)

    const gridSize = 50
    for (let x = 0; x <= width; x += gridSize) {
      graphics.lineBetween(x, 0, x, height)
    }
    for (let y = 0; y <= height; y += gridSize) {
      graphics.lineBetween(0, y, width, y)
    }
  }

  private createParticles() {
    const { width, height } = this.scale

    // Floating glowing squares
    this.particles = this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: width },
      y: { min: -100, max: height + 100 },
      speedY: { min: 20, max: 50 },
      lifespan: 10000,
      scale: { start: 0.5, end: 0.2 },
      alpha: { start: 0.8, end: 0 },
      tint: [COLORS.accent, COLORS.accent2, COLORS.highlight],
      frequency: 300,
      blendMode: 'ADD'
    })
  }

  private createTitle() {
    const { width } = this.scale

    // Main title
    const title = this.add.text(width / 2, 80, 'CRIME CITY', {
      fontSize: '72px',
      fontStyle: 'bold',
      color: `#${COLORS.accent.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5)

    // Subtitle
    const subtitle = this.add.text(width / 2, 140, 'UNDERGROUND EMPIRE', {
      fontSize: '28px',
      color: `#${COLORS.accent2.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5)

    // Pulsing glow effect
    this.tweens.add({
      targets: [title, subtitle],
      scale: { from: 1, to: 1.02 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  private async loadAndDisplayLeaderboard() {
    const { width, height } = this.scale
    const centerX = width / 2
    const centerY = height / 2

    // Leaderboard panel background
    const panelWidth = Math.min(800, width * 0.7)
    const panelHeight = 420
    const panelX = centerX
    const panelY = centerY - 50

    const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, COLORS.panel, 0.9)
    panel.setStrokeStyle(2, COLORS.accent, 0.5)

    // Header
    const header = this.add.text(panelX, panelY - panelHeight/2 + 30, '🏆 GLOBAL LEADERBOARD', {
      fontSize: '36px',
      fontStyle: 'bold',
      color: `#${COLORS.accent2.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5)

    // Container for leaderboard entries
    this.leaderboardContainer = this.add.container(0, 0)

    // Fetch and display leaderboard
    await this.refreshLeaderboard()
  }

  private async refreshLeaderboard() {
    if (!this.leaderboardContainer) return

    // Clear existing entries
    this.leaderboardContainer.removeAll(true)

    const { width, height } = this.scale
    const centerX = width / 2
    const centerY = height / 2
    const startY = centerY - 50 - 420/2 + 80

    try {
      const topScores = await this.leaderboardService.getTopScores(10)

      if (topScores.length === 0) {
        const noScoresText = this.add.text(centerX, centerY - 20, 'No scores yet! Be the first to play!', {
          fontSize: '20px',
          color: `#${COLORS.text.toString(16).padStart(6, '0')}`,
        }).setOrigin(0.5)
        this.leaderboardContainer.add(noScoresText)
        return
      }

      topScores.forEach((entry, index) => {
        const entryY = startY + index * 32
        this.createLeaderboardEntry(entry, index + 1, entryY)
      })
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
      const errorText = this.add.text(centerX, centerY - 20, 'Failed to load leaderboard', {
        fontSize: '20px',
        color: `#${COLORS.highlight.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5)
      this.leaderboardContainer.add(errorText)
    }
  }

  private createLeaderboardEntry(entry: LeaderboardEntry, rank: number, y: number) {
    const { width } = this.scale
    const centerX = width / 2
    const panelWidth = Math.min(800, width * 0.7)

    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`
    let textColor = COLORS.text

    if (rank === 1) textColor = COLORS.gold
    else if (rank === 2) textColor = COLORS.silver
    else if (rank === 3) textColor = COLORS.bronze

    // Rank/medal
    const rankText = this.add.text(centerX - panelWidth/2 + 40, y, medal, {
      fontSize: '20px',
      color: `#${textColor.toString(16).padStart(6, '0')}`,
      fontStyle: rank <= 3 ? 'bold' : 'normal',
    }).setOrigin(0, 0.5)

    // Player name
    const nameText = this.add.text(centerX - panelWidth/2 + 100, y, entry.player_name, {
      fontSize: '18px',
      color: `#${COLORS.text.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5)

    // Score
    const scoreText = this.add.text(centerX + 50, y, `$${entry.score.toLocaleString()}`, {
      fontSize: '18px',
      fontStyle: 'bold',
      color: `#${COLORS.accent.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5)

    // Stage reached
    const stageText = this.add.text(centerX + panelWidth/2 - 100, y, `Stage ${entry.stage_reached}`, {
      fontSize: '16px',
      color: `#${COLORS.accent2.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5)

    this.leaderboardContainer.add([rankText, nameText, scoreText, stageText])
  }

  private async loadAndDisplaySaveSlots() {
    const { width, height } = this.scale
    const centerX = width / 2
    const bottomY = height - 240

    // Save slots label
    const label = this.add.text(centerX, bottomY - 60, 'SAVE SLOTS', {
      fontSize: '24px',
      fontStyle: 'bold',
      color: `#${COLORS.accent2.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5)

    try {
      const saves = await this.saveManager.listSaves(this.playerName)
      const savesBySlot = new Map<number, SaveData>()
      saves.forEach(save => savesBySlot.set(save.save_slot, save))

      // Create 3 save slots
      for (let slot = 1; slot <= 3; slot++) {
        const slotX = centerX + (slot - 2) * 250
        const slotY = bottomY
        const saveData = savesBySlot.get(slot)

        this.createSaveSlot(slot, slotX, slotY, saveData)
      }
    } catch (error) {
      console.error('Failed to load saves:', error)
    }
  }

  private createSaveSlot(slot: number, x: number, y: number, saveData?: SaveData) {
    const container = this.add.container(x, y)

    // Slot background
    const bg = this.add.rectangle(0, 0, 220, 120, COLORS.panel, 0.9)
    bg.setStrokeStyle(2, COLORS.accent, 0.5)
    bg.setInteractive({ useHandCursor: true })

    // Slot label
    const slotLabel = this.add.text(0, -45, `SLOT ${slot}`, {
      fontSize: '16px',
      fontStyle: 'bold',
      color: `#${COLORS.accent.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5)

    container.add([bg, slotLabel])

    if (saveData) {
      // Display save info
      const pd = saveData.player_data

      const levelText = this.add.text(0, -15, `Level ${pd.level}`, {
        fontSize: '18px',
        fontStyle: 'bold',
        color: `#${COLORS.text.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5)

      const moneyText = this.add.text(0, 5, `$${pd.money.toLocaleString()}`, {
        fontSize: '16px',
        color: `#${COLORS.accent2.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5)

      const stageText = this.add.text(0, 25, `Stage ${saveData.stage_number}`, {
        fontSize: '14px',
        color: `#${COLORS.text.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5)

      container.add([levelText, moneyText, stageText])

      // Continue button
      bg.on('pointerover', () => {
        bg.setStrokeStyle(3, COLORS.accent2, 1)
        this.tweens.add({
          targets: container,
          scale: 1.05,
          duration: 200,
        })
      })

      bg.on('pointerout', () => {
        bg.setStrokeStyle(2, COLORS.accent, 0.5)
        this.tweens.add({
          targets: container,
          scale: 1,
          duration: 200,
        })
      })

      bg.on('pointerdown', () => {
        this.continueGame(saveData)
      })
    } else {
      // Empty slot - New Game
      const newGameText = this.add.text(0, 0, 'NEW GAME', {
        fontSize: '20px',
        fontStyle: 'bold',
        color: `#${COLORS.highlight.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5)

      container.add(newGameText)

      // New game button
      bg.on('pointerover', () => {
        bg.setStrokeStyle(3, COLORS.highlight, 1)
        this.tweens.add({
          targets: container,
          scale: 1.05,
          duration: 200,
        })
      })

      bg.on('pointerout', () => {
        bg.setStrokeStyle(2, COLORS.accent, 0.5)
        this.tweens.add({
          targets: container,
          scale: 1,
          duration: 200,
        })
      })

      bg.on('pointerdown', () => {
        this.startNewGame()
      })
    }

    this.saveSlotContainers.push(container)
  }

  private startAutoRefresh() {
    // Refresh leaderboard every 30 seconds
    this.refreshTimer = this.time.addEvent({
      delay: 30000,
      callback: () => this.refreshLeaderboard(),
      loop: true
    })
  }

  private startNewGame() {
    // Fade out with purple flash
    this.cameras.main.flash(300, 187, 134, 252, false)

    this.time.delayedCall(300, () => {
      this.scene.start('GameSceneV3')
    })
  }

  private async continueGame(saveData: SaveData) {
    // Store save data for GameSceneV3 to load
    this.registry.set('loadSaveData', saveData)

    // Fade out with cyan flash
    this.cameras.main.flash(300, 3, 218, 198, false)

    this.time.delayedCall(300, () => {
      this.scene.start('GameSceneV3')
    })
  }

  shutdown() {
    // Cleanup
    if (this.refreshTimer) {
      this.refreshTimer.remove()
    }
    if (this.particles) {
      this.particles.stop()
    }
  }
}

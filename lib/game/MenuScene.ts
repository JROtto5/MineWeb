import * as Phaser from 'phaser'
import { SaveManager } from '../supabase/SaveManager'
import { LeaderboardService } from '../supabase/LeaderboardService'
import { SaveData, LeaderboardEntry } from '../supabase/client'

// Color palette for sci-fi cyber theme
const COLORS = {
  bg: 0x0a1929,          // Deep space blue
  panel: 0x1a2332,       // Dark blue-grey
  accent: 0x05878a,      // Cyan tech
  accent2: 0x00d9ff,     // Bright cyan
  highlight: 0x0fefef,   // Electric blue
  text: 0xe0f4ff,        // Light blue-white
  gold: 0x00d9ff,        // Cyan (replaced gold)
  silver: 0x88c0d0,
  bronze: 0x5e81ac,
}

// PLAYER CLASSES - Different starting weapons and stats!
export interface PlayerClass {
  id: string
  name: string
  description: string
  icon: string
  color: number
  startingWeapon: number // weapon index
  bonusHealth: number    // extra health %
  bonusDamage: number    // extra damage %
  bonusSpeed: number     // extra speed %
  bonusFireRate: number  // extra fire rate %
  special: string        // unique ability description
}

export const PLAYER_CLASSES: PlayerClass[] = [
  {
    id: 'soldier',
    name: 'SOLDIER',
    description: 'Balanced fighter. Good all-around stats.',
    icon: '🎖️',
    color: 0x3498db,
    startingWeapon: 0,  // Pistol
    bonusHealth: 10,
    bonusDamage: 10,
    bonusSpeed: 0,
    bonusFireRate: 0,
    special: '+10% HP & Damage'
  },
  {
    id: 'gunslinger',
    name: 'GUNSLINGER',
    description: 'Fast shooter with rapid fire. Low health.',
    icon: '🔫',
    color: 0xf39c12,
    startingWeapon: 1,  // SMG
    bonusHealth: -20,
    bonusDamage: 0,
    bonusSpeed: 15,
    bonusFireRate: 30,
    special: '+30% Fire Rate, -20% HP'
  },
  {
    id: 'tank',
    name: 'TANK',
    description: 'Heavy armor, slow but powerful.',
    icon: '🛡️',
    color: 0x27ae60,
    startingWeapon: 2,  // Shotgun
    bonusHealth: 50,
    bonusDamage: 25,
    bonusSpeed: -20,
    bonusFireRate: -15,
    special: '+50% HP, +25% Damage'
  },
  {
    id: 'assassin',
    name: 'ASSASSIN',
    description: 'Glass cannon. Extreme damage, fragile.',
    icon: '🗡️',
    color: 0x9b59b6,
    startingWeapon: 3,  // Sniper
    bonusHealth: -30,
    bonusDamage: 75,
    bonusSpeed: 25,
    bonusFireRate: -10,
    special: '+75% Damage, -30% HP'
  },
  {
    id: 'berserker',
    name: 'BERSERKER',
    description: 'Gets stronger as health drops!',
    icon: '🔥',
    color: 0xe74c3c,
    startingWeapon: 0,  // Pistol
    bonusHealth: 0,
    bonusDamage: 0,
    bonusSpeed: 10,
    bonusFireRate: 10,
    special: 'Damage +50% when below 50% HP'
  },
  {
    id: 'vampire',
    name: 'VAMPIRE',
    description: 'Heals from kills. Start weak, grow strong.',
    icon: '🧛',
    color: 0x8e44ad,
    startingWeapon: 1,  // SMG
    bonusHealth: -10,
    bonusDamage: -10,
    bonusSpeed: 15,
    bonusFireRate: 20,
    special: 'Heal 3% HP per kill'
  }
]

export default class MenuScene extends Phaser.Scene {
  private leaderboardService!: LeaderboardService
  private saveManager!: SaveManager
  private leaderboardContainer!: Phaser.GameObjects.Container
  private saveSlotContainers: Phaser.GameObjects.Container[] = []
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter
  private refreshTimer?: Phaser.Time.TimerEvent
  private userId: string | null = null // Authenticated user ID
  private playerName: string = 'Player' // Default player name

  // Class selection
  private classSelectionContainer: Phaser.GameObjects.Container | null = null
  private selectedClass: PlayerClass = PLAYER_CLASSES[0]

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

    // Get authenticated user from registry
    const currentUser = this.registry.get('currentUser')
    if (currentUser) {
      this.userId = currentUser.id
      this.playerName = currentUser.displayName || 'Player'
    }

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
    const title = this.add.text(width / 2, 80, 'DOT SLAYER', {
      fontSize: '72px',
      fontStyle: 'bold',
      color: `#${COLORS.accent.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5)

    // Subtitle
    const subtitle = this.add.text(width / 2, 140, '100 FLOORS CHALLENGE', {
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
    const isSmallScreen = width < 600

    // Leaderboard panel background - responsive sizing
    const panelWidth = Math.min(700, width * 0.9)
    const panelHeight = Math.min(380, height * 0.45)
    const panelX = centerX
    const panelY = centerY - 30

    const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, COLORS.panel, 0.9)
    panel.setStrokeStyle(2, COLORS.accent, 0.5)

    // Header - responsive font size
    const headerFontSize = isSmallScreen ? '24px' : '32px'
    const header = this.add.text(panelX, panelY - panelHeight/2 + 25, '🏆 LEADERBOARD', {
      fontSize: headerFontSize,
      fontStyle: 'bold',
      color: `#${COLORS.accent2.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 3,
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
    const isSmallScreen = width < 600
    const panelHeight = Math.min(380, height * 0.45)
    const startY = centerY - 30 - panelHeight/2 + 60
    const entrySpacing = isSmallScreen ? 28 : 32

    try {
      // Limit entries on small screens
      const maxEntries = isSmallScreen ? 8 : 10
      const topScores = await this.leaderboardService.getTopScores(maxEntries)

      // Check if scene is still active after async operation
      if (!this.scene || !this.scene.isActive() || !this.add) return

      if (topScores.length === 0) {
        const noScoresText = this.add.text(centerX, centerY - 20, 'No scores yet!', {
          fontSize: isSmallScreen ? '16px' : '20px',
          color: `#${COLORS.text.toString(16).padStart(6, '0')}`,
        }).setOrigin(0.5)
        this.leaderboardContainer.add(noScoresText)
        return
      }

      topScores.forEach((entry, index) => {
        const entryY = startY + index * entrySpacing
        this.createLeaderboardEntry(entry, index + 1, entryY)
      })
    } catch (error) {
      console.error('Failed to load leaderboard:', error)

      // Check if scene is still active before showing error
      if (!this.scene || !this.scene.isActive() || !this.add) return

      const errorText = this.add.text(centerX, centerY - 20, 'Failed to load', {
        fontSize: isSmallScreen ? '16px' : '20px',
        color: `#${COLORS.highlight.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5)
      this.leaderboardContainer.add(errorText)
    }
  }

  private createLeaderboardEntry(entry: LeaderboardEntry, rank: number, y: number) {
    const { width } = this.scale
    const centerX = width / 2
    const panelWidth = Math.min(700, width * 0.85)
    const isSmallScreen = width < 600

    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`
    let textColor = COLORS.text

    if (rank === 1) textColor = COLORS.gold
    else if (rank === 2) textColor = COLORS.silver
    else if (rank === 3) textColor = COLORS.bronze

    // Font sizes based on screen size
    const fontSize = isSmallScreen ? '14px' : '18px'
    const smallFontSize = isSmallScreen ? '12px' : '16px'

    // Rank/medal
    const rankText = this.add.text(centerX - panelWidth/2 + 20, y, medal, {
      fontSize: fontSize,
      color: `#${textColor.toString(16).padStart(6, '0')}`,
      fontStyle: rank <= 3 ? 'bold' : 'normal',
    }).setOrigin(0, 0.5)

    // Player name - truncate long names
    let playerName = entry.display_name || 'Anonymous'
    const maxNameLength = isSmallScreen ? 8 : 12
    if (playerName.length > maxNameLength) {
      playerName = playerName.substring(0, maxNameLength) + '...'
    }
    const nameText = this.add.text(centerX - panelWidth/2 + 60, y, playerName, {
      fontSize: fontSize,
      color: `#${COLORS.text.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5)

    // Score - positioned relative to panel
    const scoreX = isSmallScreen ? centerX + 20 : centerX + 30
    const scoreText = this.add.text(scoreX, y, `$${entry.score.toLocaleString()}`, {
      fontSize: fontSize,
      fontStyle: 'bold',
      color: `#${COLORS.accent.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5)

    // Stage reached - right aligned
    const stageText = this.add.text(centerX + panelWidth/2 - 20, y, `F${entry.floor_reached}`, {
      fontSize: smallFontSize,
      color: `#${COLORS.accent2.toString(16).padStart(6, '0')}`,
    }).setOrigin(1, 0.5)

    this.leaderboardContainer.add([rankText, nameText, scoreText, stageText])
  }

  private async loadAndDisplaySaveSlots() {
    const { width, height } = this.scale
    const centerX = width / 2
    const isSmallScreen = width < 600
    const bottomY = height - (isSmallScreen ? 180 : 200)

    // Save slots label - responsive
    const label = this.add.text(centerX, bottomY - 50, 'SAVE SLOTS', {
      fontSize: isSmallScreen ? '18px' : '24px',
      fontStyle: 'bold',
      color: `#${COLORS.accent2.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)

    // Responsive slot spacing
    const slotSpacing = isSmallScreen ? Math.min(180, width / 3.5) : 220

    try {
      // Check if user is authenticated
      if (!this.userId) {
        console.error('No user ID available - user not authenticated')
        // Still create empty slots for UI
        for (let slot = 1; slot <= 3; slot++) {
          const slotX = centerX + (slot - 2) * slotSpacing
          const slotY = bottomY
          this.createSaveSlot(slot, slotX, slotY, undefined)
        }
        return
      }

      const saves = await this.saveManager.listSaves(this.userId)

      // Check if scene is still active after async operation
      if (!this.scene || !this.scene.isActive() || !this.add) return

      const savesBySlot = new Map<number, SaveData>()
      saves.forEach(save => savesBySlot.set(save.save_slot, save))

      // Create 3 save slots
      for (let slot = 1; slot <= 3; slot++) {
        const slotX = centerX + (slot - 2) * slotSpacing
        const slotY = bottomY
        const saveData = savesBySlot.get(slot)

        this.createSaveSlot(slot, slotX, slotY, saveData)
      }
    } catch (error) {
      console.error('Failed to load saves:', error)
    }
  }

  private createSaveSlot(slot: number, x: number, y: number, saveData?: SaveData) {
    const { width } = this.scale
    const isSmallScreen = width < 600
    const container = this.add.container(x, y)

    // Slot background - responsive sizing
    const slotWidth = isSmallScreen ? 160 : 200
    const slotHeight = isSmallScreen ? 90 : 110
    const bg = this.add.rectangle(0, 0, slotWidth, slotHeight, COLORS.panel, 0.9)
    bg.setStrokeStyle(2, COLORS.accent, 0.5)
    bg.setInteractive({ useHandCursor: true })

    // Slot label - responsive
    const labelY = isSmallScreen ? -35 : -42
    const slotLabel = this.add.text(0, labelY, `SLOT ${slot}`, {
      fontSize: isSmallScreen ? '12px' : '14px',
      fontStyle: 'bold',
      color: `#${COLORS.accent.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5)

    container.add([bg, slotLabel])

    if (saveData) {
      const pd = saveData.player_data

      // Check if save is dead
      if (!saveData.is_alive) {
        // Dead save - show skull and grayed out
        bg.setFillStyle(0x2c1010, 0.9)
        bg.setStrokeStyle(2, 0x8b0000, 0.7)

        const skullText = this.add.text(0, -20, '💀', {
          fontSize: '40px',
        }).setOrigin(0.5)

        const deadText = this.add.text(0, 15, 'DEAD', {
          fontSize: '24px',
          fontStyle: 'bold',
          color: '#8b0000',
        }).setOrigin(0.5)

        const statsText = this.add.text(0, 35, `Lvl ${pd.level} | Floor ${saveData.floor_number}`, {
          fontSize: '12px',
          color: '#666666',
        }).setOrigin(0.5)

        container.add([skullText, deadText, statsText])

        // Click to start new game in this slot
        bg.on('pointerover', () => {
          bg.setStrokeStyle(3, COLORS.highlight, 1)
          this.tweens.add({
            targets: container,
            scale: 1.05,
            duration: 200,
          })
        })

        bg.on('pointerout', () => {
          bg.setStrokeStyle(2, 0x8b0000, 0.7)
          this.tweens.add({
            targets: container,
            scale: 1,
            duration: 200,
          })
        })

        bg.on('pointerdown', () => {
          // Start new game (will overwrite dead save)
          this.startNewGame()
        })
      } else {
        // Alive save - display save info
        const levelText = this.add.text(0, -15, `Level ${pd.level}`, {
          fontSize: '18px',
          fontStyle: 'bold',
          color: `#${COLORS.text.toString(16).padStart(6, '0')}`,
        }).setOrigin(0.5)

        const moneyText = this.add.text(0, 5, `$${pd.money.toLocaleString()}`, {
          fontSize: '16px',
          color: `#${COLORS.accent2.toString(16).padStart(6, '0')}`,
        }).setOrigin(0.5)

        const stageText = this.add.text(0, 25, `Floor ${saveData.floor_number}`, {
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
      }
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
    // Show class selection UI
    this.showClassSelection()
  }

  private showClassSelection() {
    const { width, height } = this.scale
    const centerX = width / 2
    const centerY = height / 2

    // Create container for class selection
    this.classSelectionContainer = this.add.container(0, 0)

    // Dark overlay
    const overlay = this.add.rectangle(0, 0, width * 2, height * 2, 0x000000, 0.85)
    overlay.setOrigin(0)
    this.classSelectionContainer.add(overlay)

    // Title
    const title = this.add.text(centerX, 60, 'CHOOSE YOUR CLASS', {
      fontSize: '36px',
      fontStyle: 'bold',
      color: `#${COLORS.accent2.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5)
    this.classSelectionContainer.add(title)

    // Subtitle
    const subtitle = this.add.text(centerX, 100, 'Each class has unique bonuses and starting weapons', {
      fontSize: '16px',
      color: `#${COLORS.text.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5)
    this.classSelectionContainer.add(subtitle)

    // Create class cards - 3 per row
    const cardWidth = 180
    const cardHeight = 200
    const cardsPerRow = 3
    const spacing = 20
    const startX = centerX - ((cardWidth + spacing) * (cardsPerRow - 1)) / 2
    const startY = 150

    PLAYER_CLASSES.forEach((playerClass, index) => {
      const row = Math.floor(index / cardsPerRow)
      const col = index % cardsPerRow
      const x = startX + col * (cardWidth + spacing)
      const y = startY + row * (cardHeight + spacing)

      this.createClassCard(playerClass, x, y, cardWidth, cardHeight)
    })

    // Back button
    const backBtn = this.add.rectangle(centerX - 100, height - 60, 150, 45, COLORS.panel, 0.9)
    backBtn.setStrokeStyle(2, COLORS.accent, 0.5)
    backBtn.setInteractive({ useHandCursor: true })

    const backText = this.add.text(centerX - 100, height - 60, '← BACK', {
      fontSize: '20px',
      fontStyle: 'bold',
      color: `#${COLORS.text.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5)

    backBtn.on('pointerover', () => backBtn.setStrokeStyle(3, COLORS.highlight, 1))
    backBtn.on('pointerout', () => backBtn.setStrokeStyle(2, COLORS.accent, 0.5))
    backBtn.on('pointerdown', () => this.hideClassSelection())

    this.classSelectionContainer.add([backBtn, backText])

    // Start button
    const startBtn = this.add.rectangle(centerX + 100, height - 60, 150, 45, COLORS.accent, 0.9)
    startBtn.setStrokeStyle(2, COLORS.accent2, 1)
    startBtn.setInteractive({ useHandCursor: true })

    const startText = this.add.text(centerX + 100, height - 60, 'START →', {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5)

    startBtn.on('pointerover', () => {
      startBtn.setFillStyle(COLORS.accent2, 1)
      this.tweens.add({ targets: startBtn, scale: 1.05, duration: 100 })
    })
    startBtn.on('pointerout', () => {
      startBtn.setFillStyle(COLORS.accent, 0.9)
      this.tweens.add({ targets: startBtn, scale: 1, duration: 100 })
    })
    startBtn.on('pointerdown', () => this.launchGameWithClass())

    this.classSelectionContainer.add([startBtn, startText])
  }

  private createClassCard(playerClass: PlayerClass, x: number, y: number, width: number, height: number) {
    if (!this.classSelectionContainer) return

    const isSelected = this.selectedClass.id === playerClass.id

    // Card background
    const bg = this.add.rectangle(x, y, width, height, isSelected ? playerClass.color : COLORS.panel, 0.9)
    bg.setStrokeStyle(isSelected ? 3 : 2, isSelected ? COLORS.highlight : COLORS.accent, isSelected ? 1 : 0.5)
    bg.setInteractive({ useHandCursor: true })

    // Icon
    const icon = this.add.text(x, y - 60, playerClass.icon, {
      fontSize: '40px',
    }).setOrigin(0.5)

    // Name
    const name = this.add.text(x, y - 20, playerClass.name, {
      fontSize: '16px',
      fontStyle: 'bold',
      color: isSelected ? '#ffffff' : `#${COLORS.accent2.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5)

    // Description
    const desc = this.add.text(x, y + 10, playerClass.description, {
      fontSize: '11px',
      color: isSelected ? '#dddddd' : `#${COLORS.text.toString(16).padStart(6, '0')}`,
      wordWrap: { width: width - 20 },
      align: 'center',
    }).setOrigin(0.5, 0)

    // Special ability
    const special = this.add.text(x, y + 65, playerClass.special, {
      fontSize: '12px',
      fontStyle: 'bold',
      color: isSelected ? '#ffff00' : `#${COLORS.gold.toString(16).padStart(6, '0')}`,
      wordWrap: { width: width - 10 },
      align: 'center',
    }).setOrigin(0.5)

    this.classSelectionContainer.add([bg, icon, name, desc, special])

    // Click handler
    bg.on('pointerdown', () => {
      this.selectedClass = playerClass
      this.hideClassSelection()
      this.showClassSelection() // Refresh to show new selection
    })

    bg.on('pointerover', () => {
      if (!isSelected) {
        bg.setStrokeStyle(3, COLORS.highlight, 0.8)
        this.tweens.add({ targets: [bg, icon, name, desc, special], scale: 1.02, duration: 100 })
      }
    })

    bg.on('pointerout', () => {
      if (!isSelected) {
        bg.setStrokeStyle(2, COLORS.accent, 0.5)
        this.tweens.add({ targets: [bg, icon, name, desc, special], scale: 1, duration: 100 })
      }
    })
  }

  private hideClassSelection() {
    if (this.classSelectionContainer) {
      this.classSelectionContainer.destroy()
      this.classSelectionContainer = null
    }
  }

  private launchGameWithClass() {
    // Store selected class in registry
    this.registry.set('selectedClass', this.selectedClass)

    // Fade out with class color flash
    const r = (this.selectedClass.color >> 16) & 0xff
    const g = (this.selectedClass.color >> 8) & 0xff
    const b = this.selectedClass.color & 0xff
    this.cameras.main.flash(300, r, g, b, false)

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

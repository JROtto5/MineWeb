import * as Phaser from 'phaser'
import Player from './Player'
import { AdvancedEnemy, EnemyType, ENEMY_STATS } from './EnemyTypes'
import { WeaponSystem } from './Weapon'
import { CasinoManager } from './Casino'
import { CasinoUI } from './CasinoUI'
import { PowerUpManager, PowerUpType } from './PowerUps'
import { ComboSystem, StageManager, STAGES } from './StageSystem'
import { SkillTreeManager, SKILLS } from './SkillTree'
import { ShopManager, ShopUI } from './ShopSystem'
import Boss, { BossType, BOSS_CONFIGS } from './Boss'
import { AudioManager } from './AudioManager'
import { SaveManager } from '../supabase/SaveManager'
import { LeaderboardService } from '../supabase/LeaderboardService'
import { FloorManager, FloorConfig } from './FloorSystem'
import { ItemDrop, rollItemDrop, ItemRarity, ITEM_POOL } from './ItemSystem'
import { AchievementManager, GameStats as AchievementStats } from './AchievementSystem'
// NEW SYSTEMS - Making the game awesome!
import { VisualEffects } from './VisualEffects'
import { FloorThemeRenderer, getThemeForFloor } from './FloorThemes'
import { Minimap } from './Minimap'
import { EnemyAIController, AI_PRESETS, AIBehavior } from './EnemyAI'
import { StatusEffectManager, StatusType, STATUS_CONFIGS } from './StatusEffects'
import { crossGameSynergy } from './CrossGameSynergy'

export default class GameSceneV3 extends Phaser.Scene {
  private player!: Player
  private enemies!: Phaser.GameObjects.Group
  private bosses!: Phaser.GameObjects.Group
  private weaponSystem!: WeaponSystem
  private casinoManager!: CasinoManager
  private casinoUI!: CasinoUI
  private powerUpManager!: PowerUpManager
  private comboSystem!: ComboSystem
  private stageManager!: StageManager
  private floorManager!: FloorManager
  private shopManager!: ShopManager
  private shopUI!: ShopUI
  private audioManager!: AudioManager
  private saveManager!: SaveManager
  private leaderboardService!: LeaderboardService
  private itemDrops!: Phaser.GameObjects.Group
  private achievementManager!: AchievementManager
  private itemsCollectedThisRun = 0
  private legendariesCollectedThisRun = 0
  private startTime = 0

  // NEW AWESOME SYSTEMS
  private visualEffects!: VisualEffects
  private floorThemeRenderer!: FloorThemeRenderer
  private minimap: Minimap | null = null  // Disabled - conflicts with React HUD

  private currentUserId: string | null = null
  private currentPlayerName: string = 'Player'
  private currentSaveSlot: number | null = null

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: any

  private enemiesKilled = 0
  private totalEnemies = 0
  private bossSpawned = false
  private stageCompleted = false // FIX: Prevent multiple completions

  private worldWidth = 3000 // Expanded for procedural floors
  private worldHeight = 2000 // Expanded for procedural floors
  private floorGraphics: Phaser.GameObjects.Graphics[] = []
  private shopNPCs: Phaser.GameObjects.Sprite[] = []
  private treasureChests: Phaser.GameObjects.Sprite[] = []

  private casinoZones: any[] = []
  private skillTreeUI: any = null
  private pauseMenuUI: any[] = []
  private isPaused = false
  private autoSaveTimer: Phaser.Time.TimerEvent | null = null
  private lastAutoSave = 0
  private skillTreeScrollOffset = 0
  private skillTreeSkillElements: any[] = []
  private enemyLocators: any[] = []

  // ROGUELIKE: Run statistics!
  private runStats = {
    startTime: 0,
    totalKills: 0,
    totalMoney: 0,
    highestCombo: 0,
    stagesCompleted: 0,
    bossesKilled: 0,
    damageDealt: 0,
    damageTaken: 0
  }

  // Persistent UI elements
  private comboDisplay!: Phaser.GameObjects.Container
  private killFeedContainer!: Phaser.GameObjects.Container
  private killFeedMessages: Array<{ text: Phaser.GameObjects.Text; time: number }> = []

  constructor() {
    super({ key: 'GameSceneV3' })
  }

  preload() {
    this.load.image('pixel', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==')
  }

  create() {
    // ROGUELIKE: Initialize run statistics
    this.runStats = {
      startTime: Date.now(),
      totalKills: 0,
      totalMoney: 0,
      highestCombo: 0,
      stagesCompleted: 0,
      bossesKilled: 0,
      damageDealt: 0,
      damageTaken: 0
    }

    // Initialize systems
    this.stageManager = new StageManager()
    this.floorManager = new FloorManager()
    this.comboSystem = new ComboSystem()
    this.weaponSystem = new WeaponSystem(this)
    this.casinoManager = new CasinoManager(this)
    this.powerUpManager = new PowerUpManager(this)
    this.shopManager = new ShopManager()
    this.audioManager = AudioManager.getInstance()
    this.saveManager = SaveManager.getInstance()
    this.leaderboardService = LeaderboardService.getInstance()
    this.achievementManager = new AchievementManager()
    this.startTime = Date.now()

    // NEW AWESOME SYSTEMS
    this.visualEffects = new VisualEffects(this)
    this.floorThemeRenderer = new FloorThemeRenderer(this)

    // Setup achievement unlock notifications
    this.achievementManager.onUnlock((achievement) => {
      this.showAchievementUnlock(achievement)
    })

    // Start background music (after user interaction)
    this.input.once('pointerdown', () => {
      this.audioManager.enableAudio()
    })

    // Set world bounds
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight)

    // Create background (DotSlayer style!)
    this.createInitialBackground()

    // Create player
    this.player = new Player(this, this.worldWidth / 2, this.worldHeight / 2, this.weaponSystem)

    // Apply class bonuses if selected
    const selectedClass = this.registry.get('selectedClass')
    if (selectedClass) {
      this.applyClassBonuses(selectedClass)
      this.registry.remove('selectedClass')
    }

    // Load cross-game synergy from Dot Clicker
    this.player.loadClickerSynergy()
    if (this.player.clickerSynergyBonus > 0) {
      this.time.delayedCall(2000, () => {
        this.addKillFeedMessage(`🔗 Clicker Synergy: +${Math.round(this.player.clickerSynergyBonus * 100)}% damage!`, '#f39c12', 5000)
      })
    }

    // Get current user from auth context (passed via registry from React)
    const currentUser = this.registry.get('currentUser')
    if (currentUser) {
      this.currentUserId = currentUser.id
      this.currentPlayerName = currentUser.displayName || 'Player'
    }

    // Check if we're loading a saved game
    const loadSaveData = this.registry.get('loadSaveData')
    if (loadSaveData) {
      this.currentUserId = loadSaveData.user_id
      this.currentSaveSlot = loadSaveData.save_slot
      this.saveManager.applySaveData(loadSaveData, this.player, this.shopManager)

      // Set floor manager to the correct floor
      if (loadSaveData.floor_number) {
        this.floorManager.setFloor(loadSaveData.floor_number)
      }

      this.registry.remove('loadSaveData') // Clear the registry
    } else {
      // Apply initial shop bonuses for new game
      this.player.applyShopBonuses(this.shopManager)
    }

    // Casino UI
    this.casinoUI = new CasinoUI(this, this.casinoManager, this.player)

    // Shop UI
    this.shopUI = new ShopUI(this, this.shopManager, this.player)

    // Create enemies group
    this.enemies = this.add.group()

    // CREATIVE EXPANSION: Create bosses group!
    this.bosses = this.add.group()

    // Create item drops group
    this.itemDrops = this.add.group()

    // Minimap disabled - conflicts with React HUD overlay
    // The React UI covers top-left (stats), top-right (money/mission),
    // bottom-left (controls), bottom-right (weapon)
    // TODO: Add minimap as React component instead if needed

    // Create persistent UI
    this.createPersistentUI()

    // Spawn initial floor (DotSlayer procedural system!)
    this.loadFloor()

    // Camera setup
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight)
    this.cameras.main.setZoom(1.2)

    // Input setup
    this.setupInput()

    // Collisions
    this.setupCollisions()

    // Listen for player shot events (muzzle flash) - with safety check
    this.events.on('playerShot', (data: { x: number; y: number; angle: number }) => {
      try {
        if (this.visualEffects) this.visualEffects.createMuzzleFlash(data.x, data.y, data.angle)
      } catch (e) {
        // Silently ignore visual effect errors
      }
    })

    // Listen for orbital strike events
    this.events.on('orbitalStrike', (data: { x: number; y: number }) => {
      try {
        this.createOrbitalStrikeEffect(data.x, data.y)
      } catch (e) {
        // Silently ignore effect errors
      }
    })

    // Listen for boss summon minions events (Mega Boss ability)
    if (typeof window !== 'undefined') {
      const summonHandler = (event: Event) => {
        const customEvent = event as CustomEvent
        const { x, y, count } = customEvent.detail
        this.spawnMinionsAtLocation(x, y, count)
      }
      window.addEventListener('bossSummonMinions', summonHandler)

      // Listen for splitter death events
      const splitterHandler = (event: Event) => {
        const customEvent = event as CustomEvent
        const { x, y, count } = customEvent.detail
        this.spawnSplitEnemies(x, y, count)
      }
      window.addEventListener('splitterDeath', splitterHandler)

      // Listen for necromancer summon events
      const necromancerHandler = (event: Event) => {
        const customEvent = event as CustomEvent
        const { x, y, count } = customEvent.detail
        this.spawnNecromancerMinions(x, y, count)
      }
      window.addEventListener('necromancerSummon', necromancerHandler)

      // Listen for exploder death events
      const exploderHandler = (event: Event) => {
        const customEvent = event as CustomEvent
        const { x, y, damage, radius } = customEvent.detail
        this.handleExploderExplosion(x, y, damage, radius)
      }
      window.addEventListener('exploderDeath', exploderHandler)

      this.events.on('destroy', () => {
        window.removeEventListener('bossSummonMinions', summonHandler)
        window.removeEventListener('splitterDeath', splitterHandler)
        window.removeEventListener('necromancerSummon', necromancerHandler)
        window.removeEventListener('exploderDeath', exploderHandler)
      })
    }

    // Create casino zones
    this.createCasinoZones()

    // UI updates
    this.updateUI()

    // Auto-save every 60 seconds
    this.setupAutoSave()

    // Welcome message - DotSlayer!
    this.addKillFeedMessage('⚡ DOTSLAYER - Systems Online!', '#00d9ff', 5000)
    this.addKillFeedMessage('Hold mouse to auto-fire • Press B for Shop • Press T for Skills', '#88c0d0', 6000)
  }

  private applyClassBonuses(playerClass: any) {
    // Apply health bonus
    if (playerClass.bonusHealth !== 0) {
      const healthMult = 1 + (playerClass.bonusHealth / 100)
      this.player.maxHealth = Math.floor(this.player.maxHealth * healthMult)
      this.player.health = this.player.maxHealth
    }

    // Apply damage bonus
    if (playerClass.bonusDamage !== 0) {
      this.player.classDamageBonus = playerClass.bonusDamage / 100
    }

    // Apply speed bonus via shop bonus system (cleaner integration)
    if (playerClass.bonusSpeed !== 0) {
      // Add to shop speed bonus - this gets properly capped in recalculateSpeed
      this.player.shopSpeedBonus += playerClass.bonusSpeed / 100
    }

    // Apply fire rate bonus (capped in getModifiedFireRate)
    if (playerClass.bonusFireRate !== 0) {
      this.player.classFireRateBonus = playerClass.bonusFireRate / 100
    }

    // Store class for special abilities
    this.player.playerClass = playerClass

    // Set starting weapon based on class
    if (playerClass.startingWeapon > 0) {
      this.player.setCurrentWeapon(Math.min(playerClass.startingWeapon, this.player.weapons.length - 1))
    }

    // Show class message
    const className = playerClass.name || 'Unknown'
    const special = playerClass.special || ''
    this.time.delayedCall(500, () => {
      this.addKillFeedMessage(`${playerClass.icon} Class: ${className}`, `#${playerClass.color.toString(16).padStart(6, '0')}`, 4000)
      this.addKillFeedMessage(`Special: ${special}`, '#f39c12', 5000)
    })
  }

  private abilityHotbarUI: any[] = []
  private enemyTrackerUI: any = null
  private floorDisplayUI: { container: Phaser.GameObjects.Container, floorText: Phaser.GameObjects.Text, subText: Phaser.GameObjects.Text } | null = null

  private createPersistentUI() {
    // Combo display (always visible when combo > 0)
    this.comboDisplay = this.add.container(0, 0).setDepth(5000).setScrollFactor(0)

    const comboBg = this.add.rectangle(0, 0, 200, 80, 0x000000, 0.8)
    const comboIcon = this.add.text(0, -20, '🔥', { fontSize: '32px' }).setOrigin(0.5)
    const comboText = this.add.text(0, 10, '0x COMBO', {
      fontSize: '24px',
      color: '#e74c3c',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.comboDisplay.add([comboBg, comboIcon, comboText])
    this.comboDisplay.setVisible(false)

    // Kill feed (top right, shows last 5 kills)
    this.killFeedContainer = this.add.container(0, 0).setDepth(5000).setScrollFactor(0)

    // PROMINENT FLOOR DISPLAY (top center)
    this.createFloorDisplay()

    // WOW-STYLE ABILITY HOTBAR (bottom center)
    this.createAbilityHotbar()

    // PERSISTENT ENEMY TRACKER (always visible)
    this.createEnemyTracker()

    // Add resize event listener for responsive UI
    this.scale.on('resize', this.handleResize, this)
  }

  private handleResize() {
    // Reposition ability hotbar
    this.repositionAbilityHotbar()
    // Reposition enemy tracker
    this.repositionEnemyTracker()
    // Reposition floor display
    this.repositionFloorDisplay()
    // Ensure minimap stays visible
    if (this.minimap) {
      this.minimap.setVisible(true)
    }
  }

  // Create prominent floor display at top center
  private createFloorDisplay() {
    const screenWidth = this.scale.width
    const container = this.add.container(screenWidth / 2, 50).setDepth(5000).setScrollFactor(0)

    // Background
    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.7)
    bg.fillRoundedRect(-80, -30, 160, 60, 10)
    bg.lineStyle(2, 0x00d9ff, 1)
    bg.strokeRoundedRect(-80, -30, 160, 60, 10)

    // Floor number text
    const floorText = this.add.text(0, -8, 'FLOOR 1', {
      fontSize: '28px',
      color: '#00d9ff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5)

    // Sub text (stage info)
    const subText = this.add.text(0, 18, 'Stage 1/5', {
      fontSize: '14px',
      color: '#88c0d0',
    }).setOrigin(0.5)

    container.add([bg, floorText, subText])

    this.floorDisplayUI = { container, floorText, subText }
  }

  private repositionFloorDisplay() {
    if (!this.floorDisplayUI) return
    const screenWidth = this.scale.width
    this.floorDisplayUI.container.setPosition(screenWidth / 2, 50)
  }

  // Update the floor display
  private updateFloorDisplay() {
    if (!this.floorDisplayUI) return

    const currentFloor = this.floorManager.getCurrentFloorNumber()
    const currentStage = this.stageManager.getCurrentStageNumber()

    this.floorDisplayUI.floorText.setText(`FLOOR ${currentFloor}`)
    this.floorDisplayUI.subText.setText(`Stage ${currentStage % 5 || 5}/5`)

    // Color coding based on floor difficulty
    if (currentFloor >= 20) {
      this.floorDisplayUI.floorText.setColor('#ff0000') // Red for danger
    } else if (currentFloor >= 10) {
      this.floorDisplayUI.floorText.setColor('#f39c12') // Orange for hard
    } else if (currentFloor >= 5) {
      this.floorDisplayUI.floorText.setColor('#ffd700') // Gold for medium
    } else {
      this.floorDisplayUI.floorText.setColor('#00d9ff') // Cyan for easy
    }
  }

  private repositionAbilityHotbar() {
    const screenWidth = this.scale.width
    const screenHeight = this.scale.height
    const slotSize = 60
    const slotGap = 10
    const totalSlots = 9
    const startX = (screenWidth - (totalSlots * (slotSize + slotGap) - slotGap)) / 2
    const barY = screenHeight - 100

    this.abilityHotbarUI.forEach((slot: any, index: number) => {
      const x = startX + index * (slotSize + slotGap)

      slot.slotBg.setPosition(x, barY)
      slot.slotBorder.setPosition(x, barY)
      slot.keyText.setPosition(x - 22, barY - 22)

      if (slot.icon) {
        slot.icon.setPosition(x, barY)
        slot.cooldownOverlay.setPosition(x, barY)
        slot.cooldownText.setPosition(x, barY)
      }

      if (slot.emptyText) {
        slot.emptyText.setPosition(x, barY)
      }
    })
  }

  private repositionEnemyTracker() {
    if (!this.enemyTrackerUI) return

    const screenWidth = this.scale.width
    const screenHeight = this.scale.height
    const trackerX = screenWidth / 2
    const trackerY = screenHeight - 210

    this.enemyTrackerUI.bg.setPosition(trackerX, trackerY)
    this.enemyTrackerUI.title.setPosition(trackerX, trackerY - 25)
    this.enemyTrackerUI.distText.setPosition(trackerX, trackerY + 5)
    this.enemyTrackerUI.arrow.setPosition(trackerX, trackerY + 30)
  }

  private updateComboDisplay() {
    const combo = this.comboSystem.getCombo()

    if (combo > 0) {
      this.comboDisplay.setVisible(true)

      // Position in center top - FIX V5: Use screen dimensions
      this.comboDisplay.setPosition(
        this.scale.width / 2,
        100
      )

      // Update text
      const comboText = this.comboDisplay.getAt(2) as Phaser.GameObjects.Text
      const multiplier = this.comboSystem.getMultiplier()

      comboText.setText(`${combo}x COMBO\n${multiplier.toFixed(1)}x Rewards`)

      // Pulse effect
      const scale = 1 + Math.sin(this.time.now / 100) * 0.1
      this.comboDisplay.setScale(scale)

      // Color based on combo level
      if (combo >= 50) comboText.setColor('#ff6b00')
      else if (combo >= 30) comboText.setColor('#f39c12')
      else if (combo >= 10) comboText.setColor('#e74c3c')
      else comboText.setColor('#e74c3c')
    } else {
      this.comboDisplay.setVisible(false)
    }
  }

  private addKillFeedMessage(text: string, color: string, duration: number = 3000) {
    // FIX V5: Use screen dimensions for kill feed
    const screenWidth = this.scale.width

    const message = this.add.text(screenWidth - 20, 20 + this.killFeedMessages.length * 35, text, {
      fontSize: '18px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'right',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(5000)

    // Slide in animation
    message.setAlpha(0)
    message.setX(screenWidth + 20)

    this.tweens.add({
      targets: message,
      x: screenWidth - 20,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
    })

    this.killFeedMessages.push({ text: message, time: this.time.now + duration })

    // Keep only last 5 messages
    while (this.killFeedMessages.length > 5) {
      const oldest = this.killFeedMessages.shift()
      if (oldest) {
        oldest.text.destroy()
      }
    }
  }

  private updateKillFeed() {
    const currentTime = this.time.now
    const screenWidth = this.scale.width

    // Remove expired messages
    this.killFeedMessages = this.killFeedMessages.filter(msg => {
      if (currentTime >= msg.time) {
        this.tweens.add({
          targets: msg.text,
          alpha: 0,
          x: screenWidth + 20,
          duration: 300,
          onComplete: () => msg.text.destroy(),
        })
        return false
      }
      return true
    })

    // Reposition messages
    this.killFeedMessages.forEach((msg, index) => {
      this.tweens.add({
        targets: msg.text,
        y: 20 + index * 35,
        duration: 200,
        ease: 'Sine.easeOut',
      })
    })
  }

  private createAbilityHotbar() {
    const screenWidth = this.scale.width
    const screenHeight = this.scale.height
    const slotSize = 60
    const slotGap = 10
    const totalSlots = 9
    const startX = (screenWidth - (totalSlots * (slotSize + slotGap) - slotGap)) / 2
    const barY = screenHeight - 100

    const abilities = [
      { key: '1', name: 'Dash', icon: '💨', check: () => this.player.canDash() },
      { key: '2', name: 'Shield', icon: '🛡️', check: () => this.player.canActivateShield() },
      { key: '3', name: 'Time Slow', icon: '⏰', check: () => this.player.canActivateTimeSlow() },
      { key: '4', name: 'Explosive Rounds', icon: '💥', check: () => this.player.canActivateExplosiveRounds() },
      { key: '5', name: 'Berserk', icon: '😈', check: () => this.player.canActivateBerserk() },
      { key: '6', name: 'Teleport', icon: '✨', check: () => this.player.canActivateTeleport() },
      { key: '7', name: 'Life Drain', icon: '🩸', check: () => this.player.canActivateLifeDrain() },
      { key: '8', name: 'Bullet Time', icon: '⏳', check: () => this.player.canActivateBulletTime() },
      { key: '9', name: 'Orbital Strike', icon: '☄️', check: () => this.player.canActivateOrbitalStrike() },
    ]

    for (let i = 0; i < totalSlots; i++) {
      const x = startX + i * (slotSize + slotGap)
      const ability = abilities[i]

      // Slot background
      const slotBg = this.add.rectangle(x, barY, slotSize, slotSize, 0x000000, 0.7)
        .setScrollFactor(0).setDepth(5000)

      // Slot border
      const slotBorder = this.add.rectangle(x, barY, slotSize, slotSize)
        .setStrokeStyle(3, 0x444444)
        .setScrollFactor(0).setDepth(5001)

      // Key number
      const keyText = this.add.text(x - 22, barY - 22, (i + 1).toString(), {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0, 0).setScrollFactor(0).setDepth(5003)

      if (ability) {
        // Ability icon
        const icon = this.add.text(x, barY, ability.icon, {
          fontSize: '32px',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5002)

        // Cooldown overlay (hidden initially)
        const cooldownOverlay = this.add.rectangle(x, barY, slotSize, slotSize, 0x000000, 0.7)
          .setScrollFactor(0).setDepth(5002).setVisible(false)

        // Cooldown text (hidden initially)
        const cooldownText = this.add.text(x, barY, '', {
          fontSize: '20px',
          color: '#ffffff',
          fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5003).setVisible(false)

        this.abilityHotbarUI.push({
          slotBg,
          slotBorder,
          keyText,
          icon,
          cooldownOverlay,
          cooldownText,
          ability,
        })
      } else {
        // Empty slot
        const emptyText = this.add.text(x, barY, '—', {
          fontSize: '24px',
          color: '#666666',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5002)

        this.abilityHotbarUI.push({
          slotBg,
          slotBorder,
          keyText,
          emptyText,
        })
      }
    }
  }

  private updateAbilityHotbar() {
    const currentTime = this.time.now

    this.abilityHotbarUI.forEach((slot: any) => {
      if (!slot.ability) return

      const canUse = slot.ability.check()

      if (canUse) {
        // Ability ready - highlight border
        slot.slotBorder.setStrokeStyle(3, 0x2ecc71)
        slot.cooldownOverlay.setVisible(false)
        slot.cooldownText.setVisible(false)
      } else {
        // On cooldown - show overlay
        slot.slotBorder.setStrokeStyle(3, 0x444444)
        slot.cooldownOverlay.setVisible(true)
        slot.cooldownText.setVisible(true)

        // Calculate remaining cooldown (approximate)
        // Note: This is a simplified version - actual cooldown tracking would need to be improved
        const cdText = '...'
        slot.cooldownText.setText(cdText)
      }
    })
  }

  private createEnemyTracker() {
    // QOL: Position above ability hotbar at bottom of screen
    const screenWidth = this.scale.width
    const screenHeight = this.scale.height
    const trackerX = screenWidth / 2
    const trackerY = screenHeight - 210 // Above the hotbar (100) + tracker height (90) + gap (20)

    // Background panel
    const bg = this.add.rectangle(trackerX, trackerY, 280, 90, 0x000000, 0.8)
      .setScrollFactor(0).setDepth(5000)

    // Title
    const title = this.add.text(trackerX, trackerY - 25, '🎯 NEAREST ENEMY', {
      fontSize: '14px',
      color: '#f39c12',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(5001)

    // Distance text
    const distText = this.add.text(trackerX, trackerY + 5, '---', {
      fontSize: '28px',
      color: '#e74c3c',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(5001)

    // Direction arrow
    const arrow = this.add.triangle(trackerX, trackerY + 30, 0, -10, -8, 10, 8, 10, 0xff0000)
      .setScrollFactor(0).setDepth(5001)

    this.enemyTrackerUI = { bg, title, distText, arrow }
  }

  private updateEnemyTracker() {
    if (!this.enemyTrackerUI) return

    // Find nearest enemy
    let nearest: any = null
    let minDist = Infinity

    this.enemies.children.entries.forEach((enemy: any) => {
      if (enemy.active) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y)
        if (dist < minDist) {
          minDist = dist
          nearest = enemy
        }
      }
    })

    this.bosses.children.entries.forEach((boss: any) => {
      if (boss.active) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, boss.x, boss.y)
        if (dist < minDist) {
          minDist = dist
          nearest = boss
        }
      }
    })

    if (nearest) {
      // Update distance
      const distMeters = Math.floor(minDist)
      this.enemyTrackerUI.distText.setText(`${distMeters}m`)

      // Update arrow direction
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, nearest.x, nearest.y)
      this.enemyTrackerUI.arrow.setRotation(angle + Math.PI / 2)

      // Color based on distance
      if (distMeters < 200) {
        this.enemyTrackerUI.distText.setColor('#e74c3c') // Red - close
      } else if (distMeters < 500) {
        this.enemyTrackerUI.distText.setColor('#f39c12') // Orange - medium
      } else {
        this.enemyTrackerUI.distText.setColor('#3498db') // Blue - far
      }
    } else {
      // No enemies
      this.enemyTrackerUI.distText.setText('---')
      this.enemyTrackerUI.distText.setColor('#666666')
    }
  }

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      R: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      E: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      T: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T),
      Q: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      F: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F),
      SPACE: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      ONE: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      TWO: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      THREE: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      ESC: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC), // FIX V8: Add ESC key!
    }

    // Shooting - FIX V8: Block if casino is open too!
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown() && !this.skillTreeUI && !this.shopUI.isShopOpen() && !this.casinoUI.isOpen) {
        this.player.shoot(pointer.worldX, pointer.worldY)
      }
    })

    // ROGUELIKE: Ability Hotbar (keys 1-9)!
    this.input.keyboard!.on('keydown-ONE', () => {
      if (!this.skillTreeUI && !this.shopUI.isShopOpen() && !this.casinoUI.isOpen) {
        if (this.player.canDash()) {
          this.player.performDash()
        }
      }
    })
    this.input.keyboard!.on('keydown-TWO', () => {
      if (!this.skillTreeUI && !this.shopUI.isShopOpen() && !this.casinoUI.isOpen) {
        if (this.player.canActivateShield()) {
          this.player.activateShield()
        }
      }
    })
    this.input.keyboard!.on('keydown-THREE', () => {
      if (!this.skillTreeUI && !this.shopUI.isShopOpen() && !this.casinoUI.isOpen) {
        if (this.player.canActivateTimeSlow()) {
          this.player.activateTimeSlow()
        }
      }
    })
    this.input.keyboard!.on('keydown-FOUR', () => {
      if (!this.skillTreeUI && !this.shopUI.isShopOpen() && !this.casinoUI.isOpen) {
        if (this.player.canActivateExplosiveRounds()) {
          this.player.activateExplosiveRounds()
        }
      }
    })
    this.input.keyboard!.on('keydown-FIVE', () => {
      if (!this.skillTreeUI && !this.shopUI.isShopOpen() && !this.casinoUI.isOpen) {
        if (this.player.canActivateBerserk()) {
          this.player.activateBerserk()
        }
      }
    })
    this.input.keyboard!.on('keydown-SIX', () => {
      if (!this.skillTreeUI && !this.shopUI.isShopOpen() && !this.casinoUI.isOpen) {
        if (this.player.canActivateTeleport()) {
          const pointer = this.input.activePointer
          const worldX = pointer.worldX
          const worldY = pointer.worldY
          this.player.activateTeleport(worldX, worldY)
        }
      }
    })
    this.input.keyboard!.on('keydown-SEVEN', () => {
      if (!this.skillTreeUI && !this.shopUI.isShopOpen() && !this.casinoUI.isOpen) {
        if (this.player.canActivateLifeDrain()) {
          this.player.activateLifeDrain()
        }
      }
    })
    this.input.keyboard!.on('keydown-EIGHT', () => {
      if (!this.skillTreeUI && !this.shopUI.isShopOpen() && !this.casinoUI.isOpen) {
        if (this.player.canActivateBulletTime()) {
          this.player.activateBulletTime()
        }
      }
    })
    this.input.keyboard!.on('keydown-NINE', () => {
      if (!this.skillTreeUI && !this.shopUI.isShopOpen() && !this.casinoUI.isOpen) {
        if (this.player.canActivateOrbitalStrike()) {
          const pointer = this.input.activePointer
          const worldX = pointer.worldX
          const worldY = pointer.worldY
          this.player.activateOrbitalStrike(worldX, worldY)
        }
      }
    })

    // Reload - FIX V8: Block when UI open!
    this.input.keyboard!.on('keydown-R', () => {
      if (!this.skillTreeUI && !this.shopUI.isShopOpen() && !this.casinoUI.isOpen) {
        this.player.reload()
      }
    })

    // Skill tree (T key)
    this.input.keyboard!.on('keydown-T', () => this.toggleSkillTree())

    // Shop (B key)
    this.input.keyboard!.on('keydown-B', () => this.shopUI.toggle())

    // ESC key: closes UIs or toggles pause menu
    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.skillTreeUI) {
        this.closeSkillTree()
      } else if (this.shopUI.isShopOpen()) {
        this.shopUI.close()
      } else if (this.casinoUI.isOpen) {
        this.casinoUI.close()
      } else {
        // Toggle pause menu
        this.togglePauseMenu()
      }
    })

    // Abilities - FIX V8: Block when UI open!
    this.input.keyboard!.on('keydown-SPACE', () => {
      if (!this.skillTreeUI && !this.shopUI.isShopOpen() && !this.casinoUI.isOpen) {
        if (this.player.canDash()) {
          this.player.performDash()
        }
      }
    })

    this.input.keyboard!.on('keydown-Q', () => {
      if (!this.skillTreeUI && !this.shopUI.isShopOpen() && !this.casinoUI.isOpen) {
        if (this.player.canActivateShield()) {
          this.player.activateShield()
        }
      }
    })

    this.input.keyboard!.on('keydown-F', () => {
      if (!this.skillTreeUI && !this.shopUI.isShopOpen() && !this.casinoUI.isOpen) {
        if (this.player.canActivateTimeSlow()) {
          this.player.activateTimeSlow()
        }
      }
    })
  }

  private setupCollisions() {
    // Player bullets hit enemies
    this.physics.add.overlap(
      this.weaponSystem.bullets,
      this.enemies,
      this.bulletHitEnemy as any,
      undefined,
      this
    )

    // CREATIVE EXPANSION: Player bullets hit bosses!
    this.physics.add.overlap(
      this.weaponSystem.bullets,
      this.bosses,
      this.bulletHitBoss as any,
      undefined,
      this
    )

    // Enemy bullets hit player
    this.physics.add.overlap(
      this.player,
      this.weaponSystem.enemyBullets,
      this.enemyBulletHitPlayer as any,
      undefined,
      this
    )

    // Enemies touch player
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.playerHitEnemy as any,
      undefined,
      this
    )

    // CREATIVE EXPANSION: Bosses touch player!
    this.physics.add.overlap(
      this.player,
      this.bosses,
      this.playerHitBoss as any,
      undefined,
      this
    )

    // Player collects power-ups
    this.physics.add.overlap(
      this.player,
      this.powerUpManager.powerUps,
      this.collectPowerUp as any,
      undefined,
      this
    )

    // Player collects item drops
    this.physics.add.overlap(
      this.player,
      this.itemDrops,
      this.collectItemDrop as any,
      undefined,
      this
    )
  }

  update(time: number, delta: number) {
    // FIX V8: Block ALL input when any UI is open!
    const uiOpen = this.skillTreeUI || this.shopUI.isShopOpen() || this.casinoUI.isOpen

    // Player movement - only if no UI open
    if (!uiOpen) {
      const moveX = (this.wasd.D.isDown ? 1 : 0) - (this.wasd.A.isDown ? 1 : 0)
      const moveY = (this.wasd.S.isDown ? 1 : 0) - (this.wasd.W.isDown ? 1 : 0)
      this.player.move(moveX, moveY)

      // TESTING: Auto-click (auto shoot at nearest enemy)
      if (this.player && this.player.hasAutoClick()) {
        const nearestEnemy = this.getNearestEnemy()
        if (nearestEnemy) {
          this.player.shoot(nearestEnemy.x, nearestEnemy.y)
        }
      }

      // TESTING: Auto-reload
      if (this.player && this.player.hasAutoReload()) {
        if (this.player.currentAmmo <= 0) {
          this.player.reload()
        }
      }

      // Auto-fire on mouse hold
      if (this.input.activePointer.isDown && this.input.activePointer.leftButtonDown()) {
        this.player.shoot(this.input.activePointer.worldX, this.input.activePointer.worldY)
      }
    }

    // Weapon system
    this.weaponSystem.update(time, delta)

    // Update enemies (pass enemies group for healer behavior)
    this.enemies.children.entries.forEach((enemy: any) => {
      if (enemy.active) {
        enemy.update(this.player, this.weaponSystem, this.enemies)
      }
    })

    // CREATIVE EXPANSION: Update bosses!
    this.bosses.children.entries.forEach((boss: any) => {
      if (boss.active) {
        boss.update(this.player, delta)
      }
    })

    // Combo system (REDUCED POPUPS: removed "Combo ended!" message)
    this.comboSystem.update(time)

    // Update persistent UI
    this.updateComboDisplay()
    this.updateKillFeed()
    this.updateAbilityHotbar()
    this.updateEnemyTracker()
    this.updateFloorDisplay()

    // Check stage completion
    if (!this.stageCompleted) {
      this.checkStageCompletion()
    }

    // Check casino interaction
    this.checkCasinoInteraction()

    // Update UI
    this.updateUI()

    // Update minimap (with safety check)
    try {
      if (this.minimap) this.minimap.update()
    } catch (e) {
      console.warn('Minimap update error:', e)
    }

    // Update low health vignette effect (with safety check)
    try {
      if (this.visualEffects && this.player) {
        const healthPercent = this.player.health / this.player.maxHealth
        this.visualEffects.updateLowHealthVignette(healthPercent)
      }
    } catch (e) {
      console.warn('Visual effects update error:', e)
    }

    // ROGUELIKE: Update enemy locators
    this.updateEnemyLocators()
  }

  // ROGUELIKE: Enemy locator for finding last enemies!
  private updateEnemyLocators() {
    // Clear old locators
    this.enemyLocators.forEach(loc => loc.destroy())
    this.enemyLocators = []

    // Only show when 3 or fewer enemies remain
    const enemyCount = this.enemies.countActive(true) + this.bosses.countActive(true)
    if (enemyCount > 3 || enemyCount === 0) return

    const screenWidth = this.scale.width
    const screenHeight = this.scale.height

    // Get all active enemies
    const allEnemies: any[] = []
    this.enemies.children.entries.forEach((enemy: any) => {
      if (enemy.active) allEnemies.push(enemy)
    })
    this.bosses.children.entries.forEach((boss: any) => {
      if (boss.active) allEnemies.push(boss)
    })

    // Create locator for each enemy
    allEnemies.forEach((enemy, index) => {
      const angle = Phaser.Math.Angle.Between(
        this.player.x, this.player.y,
        enemy.x, enemy.y
      )

      // Position arrow at edge of screen pointing to enemy
      const edgeDist = 100
      const arrowX = this.player.x + Math.cos(angle) * edgeDist
      const arrowY = this.player.y + Math.sin(angle) * edgeDist

      // Create arrow indicator
      const arrow = this.add.triangle(
        arrowX, arrowY,
        0, -15,
        -10, 15,
        10, 15,
        0xff0000
      ).setDepth(4000).setAlpha(0.8)

      arrow.setRotation(angle + Math.PI / 2)

      // Distance text
      const dist = Math.floor(Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        enemy.x, enemy.y
      ))

      const distText = this.add.text(arrowX, arrowY + 25, `${dist}m`, {
        fontSize: '14px',
        color: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(4000)

      this.enemyLocators.push(arrow, distText)
    })
  }

  private startStage() {
    const stage = this.stageManager.getCurrentStage()

    this.enemiesKilled = 0
    this.totalEnemies = stage.enemyCount
    this.bossSpawned = false
    this.stageCompleted = false // FIX: Reset flag

    // Clear existing enemies
    this.enemies.clear(true, true)

    // CREATIVE EXPANSION: Clear existing bosses!
    this.bosses.clear(true, true)

    // Spawn ALL enemies (including boss count)
    this.spawnEnemies(stage.enemyCount, stage.enemyTypes)

    // Update background
    this.createStageBackground()

    this.addKillFeedMessage(`Stage ${this.stageManager.getCurrentStageNumber()}: ${stage.name}`, '#f39c12', 5000)
  }

  // DOTSLAYER: Load procedurally generated floor
  private loadFloor() {
    const floor = this.floorManager.getCurrentFloor()
    const floorNum = this.floorManager.getCurrentFloorNumber()

    // Clear everything
    this.enemies.clear(true, true)
    this.bosses.clear(true, true)
    this.itemDrops.clear(true, true)
    this.floorGraphics.forEach(g => g.destroy())
    this.floorGraphics = []
    this.shopNPCs.forEach(npc => npc.destroy())
    this.shopNPCs = []
    this.treasureChests.forEach(chest => chest.destroy())
    this.treasureChests = []

    // Reset counters
    this.enemiesKilled = 0
    this.totalEnemies = floor.enemyCount
    this.bossSpawned = false
    this.stageCompleted = false

    // Render floor visually
    this.renderFloorLayout(floor)

    // Spawn enemies in rooms
    this.spawnFloorEnemies(floor)

    // Create special room objects
    this.createRoomObjects(floor)

    // Apply floor theme (NEW VISUAL VARIETY!) - with safety check
    let theme: any = { name: 'DotSlayer' }
    try {
      if (this.floorThemeRenderer) {
        theme = this.floorThemeRenderer.applyTheme(floorNum, this.worldWidth, this.worldHeight)
      }
    } catch (e) {
      console.warn('Floor theme error:', e)
    }

    // Update minimap floor display - with safety check
    try {
      if (this.minimap) this.minimap.setFloor(floorNum)
    } catch (e) {
      console.warn('Minimap setFloor error:', e)
    }

    // Announce floor with theme name
    const modifier = floor.specialModifier
    let message = `Floor ${floorNum} - ${theme.name}`
    let color = '#00d9ff'

    if (modifier === 'boss_floor') {
      message = `Floor ${floorNum} - BOSS FLOOR!`
      color = '#ff0266'
    } else if (modifier === 'elite_floor') {
      message = `Floor ${floorNum} - Elite ${theme.name}`
      color = '#ff6b00'
    } else if (modifier === 'treasure_floor') {
      message = `Floor ${floorNum} - Treasure ${theme.name}!`
      color = '#ffd700'
    }

    this.addKillFeedMessage(message, color, 5000)

    // Show epic floor transition effect - with safety check
    try {
      if (this.visualEffects) this.visualEffects.createFloorTransition(floorNum)
    } catch (e) {
      console.warn('Floor transition effect error:', e)
    }
  }

  private renderFloorLayout(floor: FloorConfig) {
    // Floor layout is generated but NOT rendered visually
    // Rooms exist for enemy spawning logic but players see open space
    // Clean, simple gameplay without visual clutter!
  }

  private spawnFloorEnemies(floor: FloorConfig) {
    const { enemyTypes, enemyCount, difficultyMultiplier } = floor

    // Spawn enemies in open world (simple and reliable!)
    for (let i = 0; i < enemyCount; i++) {
      const x = Phaser.Math.Between(200, this.worldWidth - 200)
      const y = Phaser.Math.Between(200, this.worldHeight - 200)

      // Don't spawn too close to player
      const distToPlayer = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y)
      if (distToPlayer < 400) {
        i--
        continue
      }

      // Pick random enemy type from floor's allowed types
      const type = Phaser.Math.RND.pick(enemyTypes)
      const enemy = new AdvancedEnemy(this, x, y, type)

      // Apply difficulty multiplier based on floor
      if (difficultyMultiplier > 1) {
        enemy.health *= difficultyMultiplier
        enemy.maxHealth = enemy.health
      }

      this.enemies.add(enemy)
    }
  }

  private createRoomObjects(floor: FloorConfig) {
    // Spawn shop NPCs in random locations (1 per 20 floors)
    if (floor.floorNumber % 20 === 0 || floor.floorNumber === 5) {
      const shopX = Phaser.Math.Between(400, this.worldWidth - 400)
      const shopY = Phaser.Math.Between(400, this.worldHeight - 400)
      this.createShopNPC(shopX, shopY)
    }

    // Spawn legendary treasure items (1 per 15 floors)
    if (floor.floorNumber % 15 === 0 || floor.specialModifier === 'treasure_floor') {
      const treasureX = Phaser.Math.Between(400, this.worldWidth - 400)
      const treasureY = Phaser.Math.Between(400, this.worldHeight - 400)
      this.createTreasureChest(treasureX, treasureY)
    }

    // Spawn boss on boss floors
    if (floor.specialModifier === 'boss_floor') {
      const bossX = Phaser.Math.Between(600, this.worldWidth - 600)
      const bossY = Phaser.Math.Between(600, this.worldHeight - 600)
      this.spawnFloorBoss(bossX, bossY, floor.floorNumber)
    }
  }

  private createShopNPC(x: number, y: number) {
    // Create a glowing shop NPC (green circle with $ sign)
    const npc = this.add.circle(x, y, 30, 0x2ecc71)
    const dollarSign = this.add.text(x, y, '$', {
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5)

    // Pulsing animation
    this.tweens.add({
      targets: [npc, dollarSign],
      scale: { from: 1, to: 1.2 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Interaction
    npc.setInteractive({ useHandCursor: true })
    npc.on('pointerdown', () => {
      this.shopUI.toggle()
    })

    this.shopNPCs.push(npc as any)
  }

  private createTreasureChest(x: number, y: number) {
    // Just spawn legendary items directly - no interaction needed!
    const legendaryItems = ITEM_POOL.filter(item => item.rarity === ItemRarity.LEGENDARY)
    const item = Phaser.Math.RND.pick(legendaryItems)

    if (item) {
      const itemDrop = new ItemDrop(this, x, y, item)
      this.itemDrops.add(itemDrop)

      // Show treasure message
      this.addKillFeedMessage('✨ LEGENDARY TREASURE! ✨', '#ffd700', 4000)
    }
  }

  private spawnFloorBoss(x: number, y: number, floorNumber: number) {
    // Determine boss type based on floor
    let bossType: BossType
    if (floorNumber >= 80) {
      bossType = 'mega'
    } else if (floorNumber >= 60) {
      bossType = 'healer'
    } else if (floorNumber >= 40) {
      bossType = 'sniper'
    } else if (floorNumber >= 20) {
      bossType = 'speed'
    } else {
      bossType = 'tank'
    }

    const boss = new Boss(this, x, y, bossType)

    // Scale boss health with floor number
    const healthMultiplier = 1 + (floorNumber * 0.15)
    boss.health *= healthMultiplier
    boss.maxHealth = boss.health

    this.bosses.add(boss)
    this.bossSpawned = true

    this.addKillFeedMessage(`💀 FLOOR ${floorNumber} BOSS! 💀`, '#ff0266', 5000)
  }

  private createFloorBackground(floorNumber: number) {
    // Change background hue based on floor depth
    const bgGraphics = this.add.graphics()

    // Deep space gradient - gets darker as you descend
    const darkness = Math.min(0.5, floorNumber / 200)
    const baseColor = Phaser.Display.Color.ValueToColor(0x0a1929)
    const darkenedColor = Phaser.Display.Color.GetColor(
      Math.floor(baseColor.red * (1 - darkness)),
      Math.floor(baseColor.green * (1 - darkness)),
      Math.floor(baseColor.blue * (1 - darkness))
    )

    bgGraphics.fillStyle(darkenedColor, 1)
    bgGraphics.fillRect(0, 0, this.worldWidth, this.worldHeight)
    bgGraphics.setDepth(-100)
  }

  private spawnEnemies(count: number, types: EnemyType[]) {
    // Get difficulty multiplier for health scaling
    const floor = this.floorManager.getCurrentFloor()
    const difficultyMult = floor.difficultyMultiplier

    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(200, this.worldWidth - 200)
      const y = Phaser.Math.Between(200, this.worldHeight - 200)

      // Don't spawn too close to player
      const distToPlayer = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y)
      if (distToPlayer < 400) {
        i--
        continue
      }

      // Pick random enemy type from allowed types
      const type = Phaser.Math.RND.pick(types)
      const enemy = new AdvancedEnemy(this, x, y, type)

      // IMPORTANT: Apply floor-based health scaling!
      if (difficultyMult > 1) {
        enemy.health = Math.floor(enemy.health * difficultyMult)
        enemy.maxHealth = Math.floor(enemy.maxHealth * difficultyMult)
      }

      this.enemies.add(enemy)
    }
  }

  // CREATIVE EXPANSION: New epic boss system!
  private spawnBoss() {
    const stageNum = this.stageManager.getCurrentStageNumber()

    // Spawn bosses every 5 stages (5, 10, 15, 20, etc.)
    if (stageNum % 5 !== 0) return

    if (this.bossSpawned) return
    this.bossSpawned = true

    // Spawn boss far from player
    let bossX, bossY
    do {
      bossX = Phaser.Math.Between(400, this.worldWidth - 400)
      bossY = Phaser.Math.Between(400, this.worldHeight - 400)
    } while (Phaser.Math.Distance.Between(bossX, bossY, this.player.x, this.player.y) < 800)

    // Choose boss type based on stage
    let bossType: BossType
    if (stageNum >= 20) {
      bossType = 'mega' // Crime Lord at stage 20+
    } else if (stageNum >= 15) {
      bossType = 'healer' // Plague Doctor at stage 15
    } else if (stageNum >= 10) {
      bossType = 'sniper' // Death Archer at stage 10
    } else if (stageNum === 5) {
      const types: BossType[] = ['tank', 'speed']
      bossType = Phaser.Math.RND.pick(types)
    } else {
      bossType = 'tank'
    }

    const boss = new Boss(this, bossX, bossY, bossType)
    this.bosses.add(boss)

    this.addKillFeedMessage(`💀 ${BOSS_CONFIGS[bossType].icon} BOSS WAVE! 💀`, '#ff0000', 5000)
  }

  // Mega Boss ability: Spawn minions at location
  private spawnMinionsAtLocation(x: number, y: number, count: number) {
    const minionTypes = [EnemyType.GRUNT, EnemyType.SCOUT, EnemyType.BERSERKER]

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const distance = 100 + Math.random() * 50
      const minionX = x + Math.cos(angle) * distance
      const minionY = y + Math.sin(angle) * distance

      // Clamp to world bounds
      const clampedX = Phaser.Math.Clamp(minionX, 50, this.worldWidth - 50)
      const clampedY = Phaser.Math.Clamp(minionY, 50, this.worldHeight - 50)

      const type = Phaser.Math.RND.pick(minionTypes)
      const minion = new AdvancedEnemy(this, clampedX, clampedY, type)
      this.enemies.add(minion)
      this.totalEnemies++

      // Spawn animation
      minion.setAlpha(0)
      minion.setScale(0.5)
      this.tweens.add({
        targets: minion,
        alpha: 1,
        scale: 1,
        duration: 300,
        ease: 'Back.easeOut'
      })
    }

    this.addKillFeedMessage(`👑 CRIME LORD summons ${count} minions!`, '#ff6600', 3000)
  }

  // Splitter enemy: Spawn smaller enemies on death
  private spawnSplitEnemies(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const distance = 40 + Math.random() * 20
      const splitX = x + Math.cos(angle) * distance
      const splitY = y + Math.sin(angle) * distance

      // Clamp to world bounds
      const clampedX = Phaser.Math.Clamp(splitX, 50, this.worldWidth - 50)
      const clampedY = Phaser.Math.Clamp(splitY, 50, this.worldHeight - 50)

      // Spawn smaller SWARM type enemies
      const splitEnemy = new AdvancedEnemy(this, clampedX, clampedY, EnemyType.SWARM)
      this.enemies.add(splitEnemy)
      this.totalEnemies++

      // Spawn animation - burst outward
      splitEnemy.setAlpha(0.5)
      splitEnemy.setScale(0.3)
      this.tweens.add({
        targets: splitEnemy,
        alpha: 1,
        scale: 1,
        x: clampedX + Math.cos(angle) * 30,
        y: clampedY + Math.sin(angle) * 30,
        duration: 200,
        ease: 'Back.easeOut'
      })
    }
  }

  // Necromancer: Spawn undead minions
  private spawnNecromancerMinions(x: number, y: number, count: number) {
    const minionTypes = [EnemyType.SWARM, EnemyType.GHOST]
    const floor = this.floorManager.getCurrentFloor()
    const difficultyMult = floor.difficultyMultiplier

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
      const distance = 60 + Math.random() * 40
      const minionX = Phaser.Math.Clamp(x + Math.cos(angle) * distance, 50, this.worldWidth - 50)
      const minionY = Phaser.Math.Clamp(y + Math.sin(angle) * distance, 50, this.worldHeight - 50)

      const type = Phaser.Math.RND.pick(minionTypes)
      const minion = new AdvancedEnemy(this, minionX, minionY, type)

      // Apply floor scaling
      if (difficultyMult > 1) {
        minion.health = Math.floor(minion.health * difficultyMult * 0.5) // Minions are weaker
        minion.maxHealth = minion.health
      }

      this.enemies.add(minion)
      this.totalEnemies++

      // Spooky rise from ground animation
      minion.setAlpha(0)
      minion.setY(minionY + 30)
      this.tweens.add({
        targets: minion,
        alpha: 1,
        y: minionY,
        duration: 400,
        ease: 'Power2'
      })
    }
  }

  // Exploder: Deal area damage when dying
  private handleExploderExplosion(x: number, y: number, damage: number, radius: number) {
    // Check if player is in blast radius
    const distToPlayer = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y)
    if (distToPlayer < radius) {
      // Damage falls off with distance
      const damageMultiplier = 1 - (distToPlayer / radius)
      const actualDamage = Math.floor(damage * damageMultiplier)
      this.player.takeDamage(actualDamage)

      // Show damage to player
      this.addKillFeedMessage(`💥 Explosion hit you for ${actualDamage} damage!`, '#ff4500', 2000)

      if (this.player.isDead()) {
        this.gameOver()
      }
    }

    // Screen shake for explosion
    try {
      if (this.visualEffects) {
        this.visualEffects.shakeScreen('medium')
      }
    } catch (e) {}
  }

  private hitCounter = 0 // Track hits to reduce visual spam

  private bulletHitEnemy(bullet: any, enemy: any) {
    const damage = this.player.getCurrentWeaponDamage()
    // Actual crit calculation (15% base chance + shop bonus)
    const critChance = 0.15 + this.player.shopCritBonus
    const isCrit = Math.random() < critChance
    const finalDamage = isCrit ? Math.floor(damage * 2) : damage

    this.hitCounter++

    // REDUCED VISUAL SPAM: Only show damage numbers for crits, kills, or every 8th hit
    const shouldShowDamage = isCrit || this.hitCounter % 8 === 0 || enemy.health <= finalDamage

    try {
      if (this.visualEffects) {
        // Always show small hit spark, but fewer particles
        this.visualEffects.createHitSparks(enemy.x, enemy.y, isCrit ? 0xff6600 : 0xffff00, isCrit ? 8 : 3)

        // Only show damage number when appropriate
        if (shouldShowDamage) {
          this.visualEffects.showDamageNumber(enemy.x, enemy.y, finalDamage, isCrit)
        }

        // Blood splatter only on crits
        if (isCrit) {
          this.visualEffects.createBloodSplatter(enemy.x, enemy.y, 0.5)
        }
      }
    } catch (e) {
      // Silently ignore visual effect errors
    }

    bullet.destroy()

    const killed = enemy.takeDamage(finalDamage)

    if (killed) {
      this.enemiesKilled++

      // VAMPIRE CLASS: Heal on kill
      this.player.onKillEnemy()

      // Play kill sound
      this.audioManager.playSound('kill')

      // ROGUELIKE: Track run stats
      this.runStats.totalKills++

      // Combo system
      const combo = this.comboSystem.addKill(this.time.now)

      // ROGUELIKE: Track highest combo
      if (combo.combo > this.runStats.highestCombo) {
        this.runStats.highestCombo = combo.combo
      }

      // Calculate rewards with combo multiplier
      const money = Math.floor(enemy.getMoneyDrop() * combo.multiplier)
      const xp = Math.floor(enemy.getXPDrop() * combo.multiplier)

      this.player.addMoney(money)
      this.player.addXP(xp)

      // ROGUELIKE: Track money earned
      this.runStats.totalMoney += money

      // REDUCED POPUPS: Only show kill messages for combo milestones or every 10 kills
      const shouldShowKillMessage = (combo.combo % 5 === 0 && combo.combo >= 5) || this.enemiesKilled % 10 === 0
      if (shouldShowKillMessage) {
        const killColor = combo.combo > 10 ? '#ff6b00' : combo.combo > 5 ? '#f39c12' : '#2ecc71'
        this.addKillFeedMessage(`+$${money} +${xp}XP (${combo.combo}x)`, killColor, 3000)
      }

      // New record?
      if (combo.isNewRecord && combo.combo >= 10) { // Only show for combo 10+
        this.addKillFeedMessage(`🔥 NEW RECORD: ${combo.combo}! 🔥`, '#ff6b00', 4000)
      }

      // Drop power-up chance
      this.powerUpManager.tryDropPowerUp(enemy.x, enemy.y)

      // Drop item chance (DotSlayer loot system!)
      const currentFloor = this.floorManager.getCurrentFloorNumber()
      const dropChance = this.floorManager.getCurrentFloor().itemDropChance
      const item = rollItemDrop(currentFloor, dropChance)
      if (item) {
        const itemDrop = new ItemDrop(this, enemy.x, enemy.y, item)
        this.itemDrops.add(itemDrop)
      }

      // ENHANCED DEATH EFFECTS - using new visual effects system! (with safety checks)
      try {
        if (this.visualEffects) {
          const enemyType = enemy.enemyType as EnemyType
          const enemyColor = (enemyType && ENEMY_STATS[enemyType]?.color) || 0xff0000
          this.visualEffects.createDeathExplosion(enemy.x, enemy.y, enemyColor, enemy.isBoss() ? 1.5 : 1)
          this.visualEffects.showMoneyGain(enemy.x, enemy.y - 20, money)
          this.visualEffects.showXPGain(enemy.x + 30, enemy.y - 20, xp)

          // Check combo milestones
          this.visualEffects.showComboMilestone(combo.combo)

          // Screen shake on kill
          if (combo.combo >= 10) {
            this.visualEffects.shakeScreen('light')
          }
        }
      } catch (e) {
        // Silently ignore visual effect errors
      }

      // Legacy effects (keeping for backwards compatibility)
      this.createExplosion(enemy.x, enemy.y, enemy.isBoss())
      this.createKillParticles(enemy.x, enemy.y, enemy.isBoss())

      enemy.destroy()
    }
  }

  // FIX V6: Kill particle effects!
  private createKillParticles(x: number, y: number, isBig: boolean) {
    const count = isBig ? 40 : 20
    const colors = [0xff0000, 0xff6b00, 0xffff00, 0xff00ff]

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Phaser.Math.Between(100, isBig ? 300 : 200)
      const color = Phaser.Math.RND.pick(colors)

      const particle = this.add.circle(x, y, isBig ? 8 : 4, color)

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: isBig ? 1000 : 600,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      })
    }
  }

  private enemyBulletHitPlayer(player: any, bullet: any) {
    bullet.destroy()
    player.takeDamage(10)

    if (player.isDead()) {
      this.gameOver()
    }
  }

  private playerHitEnemy(player: any, enemy: any) {
    // Throttle damage
    if (this.time.now % 500 < 50) {
      player.takeDamage(enemy.getDamage())

      if (player.isDead()) {
        this.gameOver()
      }
    }
  }

  // CREATIVE EXPANSION: Boss collision handlers!
  private bulletHitBoss(bullet: any, boss: any) {
    const damage = this.player.getCurrentWeaponDamage()
    const isCrit = damage > 100 // Boss crits are special

    // EPIC hit feedback for bosses (with safety checks)
    try {
      if (this.visualEffects) {
        const bossType = boss.getBossType() as BossType
        this.visualEffects.createHitSparks(boss.x, boss.y, (bossType && BOSS_CONFIGS[bossType]?.color) || 0xff00ff, 12)
        this.visualEffects.showDamageNumber(boss.x, boss.y, damage, isCrit)
        this.visualEffects.createBloodSplatter(boss.x, boss.y, 1)
      }
    } catch (e) {
      // Silently ignore visual effect errors
    }

    bullet.destroy()

    const killed = boss.takeDamage(damage)

    if (killed) {
      // Boss defeated! Count as enemy kill
      this.enemiesKilled++

      // ROGUELIKE: Track boss kills
      this.runStats.totalKills++
      this.runStats.bossesKilled++

      const combo = this.comboSystem.addKill(this.time.now)

      // ROGUELIKE: Track highest combo
      if (combo.combo > this.runStats.highestCombo) {
        this.runStats.highestCombo = combo.combo
      }

      // EPIC rewards with combo multiplier
      const money = Math.floor(boss.getMoneyDrop() * combo.multiplier)
      const xp = Math.floor(boss.getXPDrop() * combo.multiplier)

      this.player.addMoney(money)
      this.player.addXP(xp)

      // ROGUELIKE: Track money earned
      this.runStats.totalMoney += money

      // Add skill point for boss kill!
      this.player.skillPoints++
      this.audioManager.playSound('levelUp')

      // EPIC boss death effects! (with safety checks)
      try {
        if (this.visualEffects) {
          const bossDeathType = boss.getBossType() as BossType
          const bossColor = (bossDeathType && BOSS_CONFIGS[bossDeathType]?.color) || 0xff00ff
          this.visualEffects.createBossDeathExplosion(boss.x, boss.y, bossColor)
          this.visualEffects.showMoneyGain(boss.x, boss.y - 40, money)
          this.visualEffects.showXPGain(boss.x + 50, boss.y - 40, xp)
        }
      } catch (e) {
        // Silently ignore visual effect errors
      }

      // Epic kill feed message
      this.addKillFeedMessage(`💀 BOSS DEFEATED! 💀`, '#ff0000', 5000)
      this.addKillFeedMessage(`+$${money} +${xp}XP +1 SKILL POINT`, '#ffd700', 5000)

      // Ping boss death location on minimap (with safety check)
      try {
        if (this.minimap) this.minimap.ping(boss.x, boss.y, 'BOSS DOWN!')
      } catch (e) {
        // Silently ignore minimap errors
      }

      // The boss death explosion already handles camera shake

      // Check if stage complete (boss was last enemy)
      this.checkStageCompletion()
    }
  }

  private playerHitBoss(player: any, boss: any) {
    // Throttle damage - bosses hit HARD
    if (this.time.now % 500 < 50) {
      player.takeDamage(boss.getDamage())

      if (player.isDead()) {
        this.gameOver()
      }
    }
  }

  private collectPowerUp(player: any, powerUp: any) {
    powerUp.collect(player)
  }

  private collectItemDrop(player: any, itemDrop: any) {
    // Play collect sound
    this.audioManager.playSound('upgrade')

    // Track item collection
    this.itemsCollectedThisRun++
    if (itemDrop.getItem().rarity === ItemRarity.LEGENDARY) {
      this.legendariesCollectedThisRun++

      // Enhanced particles for legendary drops!
      this.createLegendaryParticles(itemDrop.x, itemDrop.y)
    }

    // Collect the item (applies effect and shows message)
    itemDrop.collect(player)

    // Check achievements after collecting
    this.checkAchievementsProgress()
  }

  private createLegendaryParticles(x: number, y: number) {
    // Epic particle burst for legendary items!
    const colors = [0xffd700, 0xff0266, 0x00d9ff, 0xff6b00, 0x00ff00]

    // Big explosion
    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 * i) / 50
      const speed = 200 + Math.random() * 100
      const color = Phaser.Math.RND.pick(colors)

      const particle = this.add.circle(x, y, 8, color)
      particle.setBlendMode(Phaser.BlendModes.ADD)

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 1500,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      })
    }

    // Shockwave ring
    const ring = this.add.circle(x, y, 10, 0xffd700, 0)
    ring.setStrokeStyle(4, 0xffd700, 1)
    ring.setBlendMode(Phaser.BlendModes.ADD)

    this.tweens.add({
      targets: ring,
      radius: 150,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    })

    // Star particles
    for (let i = 0; i < 20; i++) {
      const starText = this.add.text(x, y, '✨', {
        fontSize: '24px'
      })

      const angle = Math.random() * Math.PI * 2
      const distance = 100 + Math.random() * 100

      this.tweens.add({
        targets: starText,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance - 50,
        alpha: 0,
        duration: 2000,
        ease: 'Cubic.easeOut',
        onComplete: () => starText.destroy()
      })
    }
  }

  // TESTING: Helper for auto-click
  private getNearestEnemy(): any {
    let nearest = null
    let minDist = Infinity

    this.enemies.children.entries.forEach((enemy: any) => {
      if (enemy.active) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y)
        if (dist < minDist) {
          minDist = dist
          nearest = enemy
        }
      }
    })

    this.bosses.children.entries.forEach((boss: any) => {
      if (boss.active) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, boss.x, boss.y)
        if (dist < minDist) {
          minDist = dist
          nearest = boss
        }
      }
    })

    return nearest
  }

  private checkStageCompletion() {
    // Check floor completion
    if (this.enemiesKilled >= this.totalEnemies && this.bosses.children.size === 0) {
      this.completeFloor()
    }
  }

  private completeFloor() {
    if (this.stageCompleted) return // Prevent multiple calls
    this.stageCompleted = true

    const floorNum = this.floorManager.getCurrentFloorNumber()

    // ROGUELIKE: Track floors completed
    this.runStats.stagesCompleted = floorNum

    // Floor completion rewards (scaled by floor)
    const moneyReward = 100 + (floorNum * 50)
    const xpReward = 50 + (floorNum * 25)

    this.player.addMoney(moneyReward)
    this.player.addXP(xpReward)

    // ROGUELIKE: Track money earned
    this.runStats.totalMoney += moneyReward

    this.addKillFeedMessage(`Floor ${floorNum} Complete! +$${moneyReward} +${xpReward}XP`, '#2ecc71', 6000)

    // Check for achievements
    this.checkAchievementsProgress()

    // Save progress for cross-game synergy with Dot Clicker
    try {
      const currentProgress = JSON.parse(localStorage.getItem('dotslayer_progress') || '{"floorsCleared":0,"highestFloor":0}')
      currentProgress.floorsCleared = floorNum
      currentProgress.highestFloor = Math.max(currentProgress.highestFloor || 0, floorNum)
      currentProgress.lastPlayed = Date.now()
      localStorage.setItem('dotslayer_progress', JSON.stringify(currentProgress))
    } catch (e) {
      console.warn('Failed to save cross-game progress:', e)
    }

    // Auto-save on floor completion (important checkpoint!)
    this.performAutoSave()

    // Check if more floors
    if (this.floorManager.nextFloor()) {
      // Next floor
      this.time.delayedCall(3000, () => {
        this.loadFloor()
        this.showFloorIntro()
      })
    } else {
      // GAME WON! Beat all 100 floors!
      this.gameWon()
    }
  }

  private showFloorIntro() {
    const floorNum = this.floorManager.getCurrentFloorNumber()
    const floor = this.floorManager.getCurrentFloor()

    let message = `FLOOR ${floorNum}`
    let subtitle = `${floor.enemyCount} enemies`

    if (floor.specialModifier === 'boss_floor') {
      subtitle = 'BOSS FLOOR - Prepare yourself!'
      // Play boss music!
      this.playBossMusic()
    } else if (floor.specialModifier === 'elite_floor') {
      subtitle = 'Elite enemies ahead...'
    } else if (floor.specialModifier === 'treasure_floor') {
      subtitle = 'Treasure awaits!'
    }

    this.showBigPopup(message, '#00d9ff')
    this.time.delayedCall(1000, () => {
      this.addKillFeedMessage(subtitle, '#88c0d0', 4000)
    })
  }

  private playBossMusic() {
    // Switch to dramatic boss music
    this.audioManager.playBossMusic()
  }

  private checkAchievementsProgress() {
    const stats: AchievementStats = {
      floorsCompleted: this.floorManager.getCurrentFloorNumber(),
      totalKills: this.runStats.totalKills,
      totalMoney: this.runStats.totalMoney,
      highestCombo: this.runStats.highestCombo,
      itemsCollected: this.itemsCollectedThisRun,
      legendariesCollected: this.legendariesCollectedThisRun,
      bossesKilled: this.runStats.bossesKilled,
      deathCount: 0, // TODO: Track deaths
      totalPlayTime: Math.floor((Date.now() - this.startTime) / 1000)
    }

    this.achievementManager.checkAchievements(stats)
  }

  private showAchievementUnlock(achievement: any) {
    // Play achievement sound
    this.audioManager.playSound('upgrade')

    // Create achievement popup
    const centerX = this.cameras.main.worldView.centerX
    const centerY = this.cameras.main.worldView.centerY

    const container = this.add.container(centerX, centerY - 200).setScrollFactor(0).setDepth(10000)

    // Background
    const bg = this.add.rectangle(0, 0, 500, 150, 0x1a2332, 0.95)
    bg.setStrokeStyle(4, achievement.color, 1)

    // Icon
    const icon = this.add.text(-180, 0, achievement.icon, {
      fontSize: '64px'
    }).setOrigin(0.5)

    // Title
    const title = this.add.text(-20, -30, 'ACHIEVEMENT UNLOCKED!', {
      fontSize: '20px',
      color: `#${achievement.color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold'
    }).setOrigin(0, 0.5)

    // Achievement name
    const name = this.add.text(-20, 0, achievement.name, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5)

    // Description
    const desc = this.add.text(-20, 30, achievement.description, {
      fontSize: '16px',
      color: '#88c0d0'
    }).setOrigin(0, 0.5)

    // Tier badge
    const tierText = achievement.tier.toUpperCase()
    const tierBadge = this.add.text(200, -50, tierText, {
      fontSize: '14px',
      color: `#${achievement.color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5)

    container.add([bg, icon, title, name, desc, tierBadge])

    // Slide in animation
    container.setY(centerY - 400)
    container.setAlpha(0)

    this.tweens.add({
      targets: container,
      y: centerY - 200,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut'
    })

    // Particle burst
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30
      const particle = this.add.circle(
        centerX,
        centerY - 200,
        6,
        achievement.color
      ).setScrollFactor(0).setDepth(9999).setBlendMode(Phaser.BlendModes.ADD)

      this.tweens.add({
        targets: particle,
        x: centerX + Math.cos(angle) * 150,
        y: centerY - 200 + Math.sin(angle) * 150,
        alpha: 0,
        duration: 1500,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      })
    }

    // Auto-hide after 5 seconds
    this.time.delayedCall(5000, () => {
      this.tweens.add({
        targets: container,
        y: centerY - 400,
        alpha: 0,
        duration: 500,
        ease: 'Back.easeIn',
        onComplete: () => container.destroy()
      })
    })
  }

  // PAUSE MENU
  private togglePauseMenu() {
    if (this.isPaused) {
      this.closePauseMenu()
    } else {
      this.showPauseMenu()
    }
  }

  private showPauseMenu() {
    this.isPaused = true
    this.physics.pause()

    const screenWidth = this.scale.width
    const screenHeight = this.scale.height
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    // Dark overlay
    const overlay = this.add.rectangle(centerX, centerY, screenWidth * 2, screenHeight * 2, 0x000000, 0.85)
      .setScrollFactor(0).setDepth(15000)

    // Title
    const title = this.add.text(centerX, centerY - 150, '⏸️ PAUSED', {
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(15001)

    // Stats
    const stats = this.add.text(centerX, centerY - 60,
      `Level ${this.player.level} | Money: $${this.player.money} | Stage ${this.stageManager.getCurrentStageNumber()}`,
      {
        fontSize: '24px',
        color: '#f39c12',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(15001)

    // Resume button
    const resumeBg = this.add.rectangle(centerX, centerY + 20, 300, 60, 0x2ecc71)
      .setScrollFactor(0).setDepth(15001)
    const resumeLabel = this.add.text(centerX, centerY + 20, 'Resume (ESC)', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(15002)

    resumeBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => resumeBg.setFillStyle(0x27ae60))
      .on('pointerout', () => resumeBg.setFillStyle(0x2ecc71))
      .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
        event.stopPropagation()
        this.closePauseMenu()
      })

    // Restart button
    const restartBg = this.add.rectangle(centerX, centerY + 100, 300, 60, 0xe74c3c)
      .setScrollFactor(0).setDepth(15001)
    const restartLabel = this.add.text(centerX, centerY + 100, 'Restart', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(15002)

    restartBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => restartBg.setFillStyle(0xc0392b))
      .on('pointerout', () => restartBg.setFillStyle(0xe74c3c))
      .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
        event.stopPropagation()
        this.scene.restart()
      })

    // Audio controls title
    const audioTitle = this.add.text(centerX, centerY + 180, '🔊 AUDIO CONTROLS', {
      fontSize: '20px',
      color: '#3498db',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(15001)

    // Mute All button
    const muteAllBg = this.add.rectangle(centerX, centerY + 230, 300, 50, 0x3498db)
      .setScrollFactor(0).setDepth(15001)
    const muteAllLabel = this.add.text(centerX, centerY + 230,
      this.audioManager.isMusicMuted() ? '🔇 Unmute All' : '🔊 Mute All', {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(15002)

    muteAllBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => muteAllBg.setFillStyle(0x2980b9))
      .on('pointerout', () => muteAllBg.setFillStyle(0x3498db))
      .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
        event.stopPropagation()
        const muted = this.audioManager.toggleAllMute()
        muteAllLabel.setText(muted ? '🔇 Unmute All' : '🔊 Mute All')
      })

    // Mute Music button
    const muteMusicBg = this.add.rectangle(centerX - 160, centerY + 295, 140, 45, 0x9b59b6)
      .setScrollFactor(0).setDepth(15001)
    const muteMusicLabel = this.add.text(centerX - 160, centerY + 295,
      this.audioManager.isMusicMuted() ? '🎵 Music: OFF' : '🎵 Music: ON', {
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(15002)

    muteMusicBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => muteMusicBg.setFillStyle(0x8e44ad))
      .on('pointerout', () => muteMusicBg.setFillStyle(0x9b59b6))
      .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
        event.stopPropagation()
        const muted = this.audioManager.toggleMusicMute()
        muteMusicLabel.setText(muted ? '🎵 Music: OFF' : '🎵 Music: ON')
      })

    // Mute SFX button
    const muteSfxBg = this.add.rectangle(centerX + 160, centerY + 295, 140, 45, 0xe67e22)
      .setScrollFactor(0).setDepth(15001)
    const muteSfxLabel = this.add.text(centerX + 160, centerY + 295,
      this.audioManager.isSfxMuted() ? '🔔 SFX: OFF' : '🔔 SFX: ON', {
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(15002)

    muteSfxBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => muteSfxBg.setFillStyle(0xd35400))
      .on('pointerout', () => muteSfxBg.setFillStyle(0xe67e22))
      .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
        event.stopPropagation()
        const muted = this.audioManager.toggleSfxMute()
        muteSfxLabel.setText(muted ? '🔔 SFX: OFF' : '🔔 SFX: ON')
      })

    // Save Game button
    const saveBg = this.add.rectangle(centerX - 160, centerY + 360, 280, 55, 0x1abc9c)
      .setScrollFactor(0).setDepth(15001)
    const saveLabel = this.add.text(centerX - 160, centerY + 360, '💾 Save', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(15002)

    saveBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => saveBg.setFillStyle(0x16a085))
      .on('pointerout', () => saveBg.setFillStyle(0x1abc9c))
      .on('pointerdown', async (pointer: any, x: number, y: number, event: any) => {
        event.stopPropagation()

        // Quick save to current slot (or slot 1 if new game)
        const saveSlot = this.currentSaveSlot || 1
        this.currentSaveSlot = saveSlot // Track it for future saves

        // Check if user is authenticated
        if (!this.currentUserId) {
          saveLabel.setText('❌ Not logged in')
          return
        }

        const result = await this.saveManager.saveGame(
          this.currentUserId,
          saveSlot,
          this.player,
          this.floorManager.getCurrentFloorNumber(),
          this.shopManager
        )

        // Show save result
        saveLabel.setText(result.success ? '✅ Saved!' : '❌ Failed')
        this.time.delayedCall(2000, () => {
          if (this.pauseMenuUI.includes(saveLabel)) {
            saveLabel.setText('💾 Save')
          }
        })
      })

    // Return to Menu button
    const menuBg = this.add.rectangle(centerX + 160, centerY + 360, 280, 55, 0x9b59b6)
      .setScrollFactor(0).setDepth(15001)
    const menuLabel = this.add.text(centerX + 160, centerY + 360, '🏠 Menu', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(15002)

    menuBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => menuBg.setFillStyle(0x8e44ad))
      .on('pointerout', () => menuBg.setFillStyle(0x9b59b6))
      .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
        event.stopPropagation()
        this.closePauseMenu()
        this.scene.start('MenuScene')
      })

    this.pauseMenuUI = [overlay, title, stats, resumeBg, resumeLabel, restartBg, restartLabel,
      audioTitle, muteAllBg, muteAllLabel, muteMusicBg, muteMusicLabel, muteSfxBg, muteSfxLabel,
      saveBg, saveLabel, menuBg, menuLabel]
  }

  private closePauseMenu() {
    this.isPaused = false
    this.physics.resume()

    this.pauseMenuUI.forEach(el => el.destroy())
    this.pauseMenuUI = []
  }

  // Auto-save system
  private setupAutoSave() {
    // Only auto-save if user is logged in and has a save slot
    if (!this.currentUserId) return

    // Auto-save every 60 seconds
    this.autoSaveTimer = this.time.addEvent({
      delay: 60000, // 60 seconds
      callback: () => this.performAutoSave(),
      loop: true
    })

    // Also save when completing a floor (handled in completeFloor)
  }

  private async performAutoSave() {
    // Don't auto-save if paused, dead, or no user
    if (this.isPaused || this.player.isDead() || !this.currentUserId) return

    // Don't save too frequently
    const now = Date.now()
    if (now - this.lastAutoSave < 30000) return // Min 30 seconds between saves

    const saveSlot = this.currentSaveSlot || 1
    this.currentSaveSlot = saveSlot

    try {
      const result = await this.saveManager.saveGame(
        this.currentUserId,
        saveSlot,
        this.player,
        this.floorManager.getCurrentFloorNumber(),
        this.shopManager,
        {
          totalKills: this.runStats.totalKills,
          totalMoney: this.runStats.totalMoney,
          highestCombo: this.runStats.highestCombo,
          bossesKilled: this.runStats.bossesKilled,
          startTime: this.runStats.startTime
        }
      )

      if (result.success) {
        this.lastAutoSave = now
        // Show subtle notification
        this.addKillFeedMessage('💾 Auto-saved', '#888', 2000)
      }
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }

  // Public method called by GameWrapper before destroying the game
  // This saves the game and stops music when navigating away (e.g., to hub)
  public async cleanupBeforeExit(): Promise<void> {
    console.log('GameSceneV3: Cleaning up before exit...')

    // Stop the music immediately
    if (this.audioManager) {
      this.audioManager.cleanup()
    }

    // Stop the auto-save timer
    if (this.autoSaveTimer) {
      this.autoSaveTimer.remove()
      this.autoSaveTimer = null
    }

    // Perform a final save if player is alive and we have user info
    if (this.player && !this.player.isDead() && this.currentUserId) {
      try {
        const saveSlot = this.currentSaveSlot || 1
        await this.saveManager.saveGame(
          this.currentUserId,
          saveSlot,
          this.player,
          this.floorManager.getCurrentFloorNumber(),
          this.shopManager,
          {
            totalKills: this.runStats.totalKills,
            totalMoney: this.runStats.totalMoney,
            highestCombo: this.runStats.highestCombo,
            bossesKilled: this.runStats.bossesKilled,
            startTime: this.runStats.startTime
          }
        )
        console.log('GameSceneV3: Auto-saved before exit')
      } catch (error) {
        console.error('Failed to save before exit:', error)
      }
    }
  }

  private gameOver() {
    // Play death sound and stop music
    this.audioManager.playSound('death')
    this.audioManager.stopMusic()

    this.addKillFeedMessage('💀 GAME OVER 💀', '#e74c3c', 3000)
    this.showRunStats(false)

    // Save cross-game synergy stats
    this.saveSynergyStats(false)

    // Submit to leaderboard
    this.time.delayedCall(2000, () => {
      this.showLeaderboardPrompt(false)
    })

    this.time.delayedCall(12000, () => {
      this.scene.restart()
    })
  }

  // Save stats to cross-game synergy service
  private saveSynergyStats(victory: boolean) {
    try {
      const currentFloor = this.floorManager.getCurrentFloorNumber()
      const existingStats = crossGameSynergy.getSlayerStats()

      crossGameSynergy.saveSlayerStats({
        highestFloor: Math.max(existingStats.highestFloor, currentFloor),
        totalKills: existingStats.totalKills + this.runStats.totalKills,
        bossesKilled: existingStats.bossesKilled + this.runStats.bossesKilled,
        gamesWon: existingStats.gamesWon + (victory ? 1 : 0),
        totalPlaytime: existingStats.totalPlaytime + (Date.now() - this.runStats.startTime)
      })
    } catch (e) {
      console.warn('Failed to save synergy stats:', e)
    }
  }

  private gameWon() {
    this.addKillFeedMessage('🏆 YOU WON! ALL STAGES CLEARED! 🏆', '#2ecc71', 6000)
    this.showRunStats(true)

    // Save cross-game synergy stats - VICTORY!
    this.saveSynergyStats(true)

    // Submit to leaderboard
    this.time.delayedCall(2000, () => {
      this.showLeaderboardPrompt(true)
    })

    this.time.delayedCall(14000, () => {
      this.scene.restart()
    })
  }

  // ROGUELIKE: Show run statistics!
  private showRunStats(victory: boolean) {
    const screenWidth = this.scale.width
    const screenHeight = this.scale.height
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    // Calculate run time
    const runTime = Math.floor((Date.now() - this.runStats.startTime) / 1000)
    const minutes = Math.floor(runTime / 60)
    const seconds = runTime % 60

    // Create stats display
    const title = this.add.text(centerX, centerY - 200, victory ? '🏆 VICTORY! 🏆' : '💀 RUN ENDED 💀', {
      fontSize: '48px',
      color: victory ? '#2ecc71' : '#e74c3c',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20000)

    const stats = [
      `⏱️  Time: ${minutes}m ${seconds}s`,
      `🎯  Kills: ${this.runStats.totalKills}`,
      `👑  Bosses: ${this.runStats.bossesKilled}`,
      `💰  Money: $${this.runStats.totalMoney}`,
      `🔥  Max Combo: ${this.runStats.highestCombo}x`,
      `📊  Stages: ${this.runStats.stagesCompleted}`,
      `⚔️  Level: ${this.player.level}`
    ]

    stats.forEach((stat, index) => {
      this.add.text(centerX, centerY - 120 + index * 40, stat, {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setScrollFactor(0).setDepth(20000)
    })

    this.add.text(centerX, centerY + 180, 'Restarting...', {
      fontSize: '20px',
      color: '#95a5a6',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20000)
  }

  private createInitialBackground() {
    // DotSlayer sci-fi background
    const graphics = this.add.graphics().setDepth(-100)

    // Deep space blue background
    graphics.fillStyle(0x0a1929, 1)
    graphics.fillRect(0, 0, this.worldWidth, this.worldHeight)

    // Cyan grid
    graphics.lineStyle(1, 0x05878a, 0.3)
    const gridSize = 64

    for (let x = 0; x <= this.worldWidth; x += gridSize) {
      graphics.lineBetween(x, 0, x, this.worldHeight)
    }

    for (let y = 0; y <= this.worldHeight; y += gridSize) {
      graphics.lineBetween(0, y, this.worldWidth, y)
    }
  }

  private createStageBackground() {
    // Legacy function - no longer used
  }

  private showStageIntro() {
    const stage = this.stageManager.getCurrentStage()

    const introText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      `STAGE ${stage.stageNumber}\n${stage.name}\n\nEnemies: ${stage.enemyCount}`,
      {
        fontSize: '48px',
        color: '#f39c12',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 6,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(2000)

    this.tweens.add({
      targets: introText,
      alpha: 0,
      duration: 3000,
      delay: 1000,
      onComplete: () => introText.destroy(),
    })
  }

  private createExplosion(x: number, y: number, isBig: boolean = false) {
    const particleCount = isBig ? 30 : 15
    const radius = isBig ? 80 : 40

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const distance = Phaser.Math.Between(0, radius)

      const particle = this.add.circle(x, y, isBig ? 8 : 4, isBig ? 0xff6b00 : 0xff0000)

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        duration: 600,
        onComplete: () => particle.destroy(),
      })
    }

    // Flash
    const flash = this.add.circle(x, y, isBig ? 60 : 30, 0xffffff, 0.8)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => flash.destroy(),
    })

    if (isBig) {
      this.cameras.main.shake(150, 0.003)
    }
  }

  // EPIC ORBITAL STRIKE EFFECT!
  private createOrbitalStrikeEffect(x: number, y: number) {
    // Warning indicator
    const warning = this.add.circle(x, y, 100, 0xff0000, 0.3)
    warning.setStrokeStyle(4, 0xff0000, 0.8)

    // Pulsing warning
    this.tweens.add({
      targets: warning,
      scale: { from: 0.5, to: 1.2 },
      alpha: { from: 0.5, to: 0.1 },
      duration: 300,
      repeat: 3,
      onComplete: () => {
        warning.destroy()

        // IMPACT!
        this.visualEffects.screenFlash(0xff6600, 0.6, 200)
        this.visualEffects.shakeScreen('extreme')

        // Create massive explosion
        for (let wave = 0; wave < 5; wave++) {
          this.time.delayedCall(wave * 100, () => {
            const waveRadius = 50 + wave * 40
            const ring = this.add.circle(x, y, waveRadius, 0xff6600, 0)
              .setStrokeStyle(8 - wave, 0xff6600, 1 - wave * 0.15)
              .setDepth(5000)

            this.tweens.add({
              targets: ring,
              scale: 3,
              alpha: 0,
              duration: 500,
              ease: 'Cubic.easeOut',
              onComplete: () => ring.destroy()
            })
          })
        }

        // Particle explosion
        for (let i = 0; i < 50; i++) {
          const angle = (i / 50) * Math.PI * 2
          const speed = Phaser.Math.Between(100, 300)
          const colors = [0xff6600, 0xff0000, 0xffff00, 0xffffff]

          const particle = this.add.circle(x, y, Phaser.Math.Between(4, 12), Phaser.Math.RND.pick(colors))
            .setDepth(5000)

          this.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * speed,
            y: y + Math.sin(angle) * speed,
            alpha: 0,
            scale: 0,
            duration: Phaser.Math.Between(500, 1000),
            ease: 'Cubic.easeOut',
            onComplete: () => particle.destroy()
          })
        }

        // Damage enemies in radius
        const damageRadius = 200
        const strikeDamage = 500

        this.enemies.children.entries.forEach((enemy: any) => {
          if (enemy.active) {
            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y)
            if (dist < damageRadius) {
              const falloff = 1 - (dist / damageRadius)
              const damage = Math.floor(strikeDamage * falloff)
              enemy.takeDamage(damage)
              this.visualEffects.showDamageNumber(enemy.x, enemy.y, damage, true)

              if (enemy.isDead()) {
                this.enemiesKilled++
                this.runStats.totalKills++
                enemy.destroy()
              }
            }
          }
        })

        this.bosses.children.entries.forEach((boss: any) => {
          if (boss.active) {
            const dist = Phaser.Math.Distance.Between(x, y, boss.x, boss.y)
            if (dist < damageRadius) {
              const falloff = 1 - (dist / damageRadius)
              const damage = Math.floor(strikeDamage * falloff)
              boss.takeDamage(damage)
              this.visualEffects.showDamageNumber(boss.x, boss.y, damage, true)
            }
          }
        })

        this.addKillFeedMessage('☄️ ORBITAL STRIKE!', '#ff6600', 3000)
      }
    })
  }

  private createCasinoZones() {
    const locations = [
      { x: 800, y: 600 },
      { x: 2400, y: 600 },
      { x: 1600, y: 1800 },
    ]

    locations.forEach(loc => {
      const zone = this.add.rectangle(loc.x, loc.y, 200, 200, 0xf39c12, 0.3)
      const text = this.add.text(loc.x, loc.y - 120, '🎰 CASINO (E)', {
        fontSize: '24px',
        color: '#f39c12',
        fontStyle: 'bold',
      }).setOrigin(0.5)

      this.physics.add.existing(zone)
      this.casinoZones.push({ zone, text, location: loc })
    })
  }

  private checkCasinoInteraction() {
    for (const casino of this.casinoZones) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        casino.location.x,
        casino.location.y
      )

      if (dist < 150 && Phaser.Input.Keyboard.JustDown(this.wasd.E)) {
        this.casinoUI.open()
      }
    }
  }

  private toggleSkillTree() {
    if (this.skillTreeUI) {
      this.closeSkillTree()
    } else {
      this.openSkillTree()
    }
  }

  private openSkillTree() {
    if (this.skillTreeUI) return

    this.physics.pause()

    // FIX V11++: Sync skillTree skillPoints with player skillPoints!
    this.player.skillTree.setSkillPoints(this.player.skillPoints)

    // FIX V6: Use actual screen dimensions!
    const screenWidth = this.scale.width
    const screenHeight = this.scale.height
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    // Modern UI: Dark overlay with reduced opacity
    const overlay = this.add.rectangle(
      centerX,
      centerY,
      screenWidth * 2,
      screenHeight * 2,
      0x000000,
      0.7 // Reduced opacity
    ).setScrollFactor(0).setDepth(8000).setAlpha(0)

    // Modern panel with depth
    const panelWidth = Math.min(800, screenWidth * 0.85)
    const panelHeight = Math.min(650, screenHeight * 0.8)

    // Shadow layers
    const shadow1 = this.add.rectangle(centerX + 8, centerY + 8, panelWidth, panelHeight, 0x000000, 0.3)
      .setScrollFactor(0).setDepth(8001).setAlpha(0)
    const shadow2 = this.add.rectangle(centerX + 4, centerY + 4, panelWidth, panelHeight, 0x000000, 0.2)
      .setScrollFactor(0).setDepth(8001).setAlpha(0)

    // Main panel with border
    const mainPanel = this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x1a1a2e, 0.95)
      .setScrollFactor(0).setDepth(8001)
      .setStrokeStyle(3, 0x9b59b6, 1) // Purple border for skill tree
      .setAlpha(0)

    // Smooth fade-in animation
    this.tweens.add({
      targets: [overlay, shadow1, shadow2, mainPanel],
      alpha: 1,
      duration: 200,
      ease: 'Power2'
    })

    // Store all UI elements for cleanup
    const uiElements: any[] = [overlay, shadow1, shadow2, mainPanel]

    // Title with animation
    const title = this.add.text(centerX, centerY - (panelHeight / 2) + 50, '⚡ SKILL TREE ⚡', {
      fontSize: '38px',
      color: '#9b59b6',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(9002).setAlpha(0)
    title.disableInteractive()

    this.tweens.add({
      targets: title,
      alpha: 1,
      y: title.y - 10,
      duration: 300,
      ease: 'Back.easeOut'
    })

    // Points display with background
    const pointsBg = this.add.rectangle(centerX, centerY - (panelHeight / 2) + 110, 220, 38, 0xf39c12, 0.9)
      .setScrollFactor(0).setDepth(9001)
      .setStrokeStyle(2, 0xf1c40f, 1)
      .setAlpha(0)

    const pointsText = this.add.text(centerX, centerY - (panelHeight / 2) + 110, `⚡ Points: ${this.player.skillPoints}`, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(9002).setAlpha(0)
    pointsText.disableInteractive()

    this.tweens.add({
      targets: [pointsBg, pointsText],
      alpha: 1,
      duration: 300,
      delay: 100,
      ease: 'Power2'
    })

    // Close button
    const closeBtnX = centerX + (panelWidth / 2) - 40
    const closeBtnY = centerY - (panelHeight / 2) + 40
    const closeBtn = this.add.rectangle(closeBtnX, closeBtnY, 50, 50, 0xe74c3c, 0.9)
      .setScrollFactor(0).setDepth(9003)
      .setStrokeStyle(2, 0xc0392b, 1)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        closeBtn.setFillStyle(0xc0392b, 1)
        this.tweens.add({
          targets: closeBtn,
          angle: 90,
          duration: 200
        })
      })
      .on('pointerout', () => {
        closeBtn.setFillStyle(0xe74c3c, 0.9)
        this.tweens.add({
          targets: closeBtn,
          angle: 0,
          duration: 200
        })
      })
      .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
        event.stopPropagation()
        this.closeSkillTree()
      })

    const closeBtnText = this.add.text(closeBtnX, closeBtnY, '✕', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(9004).setAlpha(0)
    closeBtnText.disableInteractive()

    this.tweens.add({
      targets: [closeBtn, closeBtnText],
      alpha: 1,
      duration: 250,
      delay: 200,
      ease: 'Power2'
    })

    uiElements.push(title, pointsBg, pointsText, closeBtn, closeBtnText)

    // Skills grid - SCROLLABLE with modern cards
    const skills = this.player.skillTree.getAllSkills()
    const startY = centerY - (panelHeight / 2) + 170
    const gap = 52 // Card spacing
    this.skillTreeScrollOffset = 0
    this.skillTreeSkillElements = []

    // Scroll hint with animation
    const scrollHint = this.add.text(centerX, centerY + (panelHeight / 2) - 25, '🖱️ Scroll with Mouse Wheel', {
      fontSize: '13px',
      color: '#7f8c8d',
      fontStyle: 'italic',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(9002).setAlpha(0)
    scrollHint.disableInteractive()

    this.tweens.add({
      targets: scrollHint,
      alpha: 0.7,
      duration: 500,
      delay: 400,
      ease: 'Power2',
      yoyo: true,
      repeat: -1
    })

    uiElements.push(scrollHint)

    // Mouse wheel scroll with smooth scrolling
    this.input.on('wheel', (pointer: any, gameObjects: any[], deltaX: number, deltaY: number) => {
      if (this.skillTreeUI) {
        this.skillTreeScrollOffset += deltaY * 0.25
        const maxScroll = Math.max(0, skills.length * gap - (panelHeight - 320))
        this.skillTreeScrollOffset = Phaser.Math.Clamp(this.skillTreeScrollOffset, 0, maxScroll)

        // Update element positions with visibility clipping
        const visibleTop = centerY - (panelHeight / 2) + 150
        const visibleBottom = centerY + (panelHeight / 2) - 70

        this.skillTreeSkillElements.forEach((el, idx) => {
          const baseY = startY + Math.floor(idx / 6) * gap // 6 elements per skill (shadow, bg, text, level, btn, label)
          const newY = baseY - this.skillTreeScrollOffset
          el.setY(newY)

          // Clean clipping - just card height now (no more description text)
          const cardHalfHeight = 23 // Half of 46px card height
          const isVisible = (newY + cardHalfHeight >= visibleTop) && (newY - cardHalfHeight <= visibleBottom)
          el.setVisible(isVisible)
        })
      }
    })

    skills.forEach((skillData, index) => {
      const skill = skillData.skill
      const level = skillData.level

      const y = startY + index * gap
      const hasPoints = this.player.skillPoints > 0
      const notMaxed = level < skill.maxLevel
      const canUpgrade = hasPoints && notMaxed

      // Modern card with shadow
      const cardShadow = this.add.rectangle(centerX, y + 2, 680, 46, 0x000000, 0.3)
        .setScrollFactor(0).setDepth(9001).setAlpha(0)

      // Card background with gradient effect
      const bgColor = canUpgrade ? 0x8e44ad : 0x2c3e50
      const skillBg = this.add.rectangle(centerX, y, 680, 46, bgColor, 0.95)
        .setScrollFactor(0).setDepth(9001)
        .setStrokeStyle(2, canUpgrade ? 0x9b59b6 : 0x34495e, 0.8)
        .setAlpha(0)

      // Fade in animation
      this.tweens.add({
        targets: [cardShadow, skillBg],
        alpha: 1,
        duration: 200,
        delay: 300 + (index * 25),
        ease: 'Power2'
      })

      // Icon and name - centered vertically now (no description below)
      const skillText = this.add.text(centerX - 320, y, `${skill.icon} ${skill.name}`, {
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(9004).setAlpha(0)
      skillText.disableInteractive()

      // Level pill
      const levelText = this.add.text(centerX - 70, y, `${level}/${skill.maxLevel}`, {
        fontSize: '13px',
        color: level === skill.maxLevel ? '#f1c40f' : '#ecf0f1',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(9004).setAlpha(0)
      levelText.disableInteractive()

      // Upgrade button with modern style
      const buttonColor = canUpgrade ? 0x27ae60 : (level === skill.maxLevel ? 0x7f8c8d : 0x95a5a6)
      const upgradeBtn = this.add.rectangle(centerX + 280, y, 100, 34, buttonColor, canUpgrade ? 0.9 : 0.5)
        .setScrollFactor(0).setDepth(9003)
        .setStrokeStyle(2, canUpgrade ? 0x2ecc71 : 0x7f8c8d, 1)
        .setAlpha(0)

      const buttonText = canUpgrade ? '⚡ UPGRADE' : (level === skill.maxLevel ? 'MAXED' : 'LOCKED')
      const upgradeLabel = this.add.text(centerX + 280, y, buttonText, {
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(9004).setAlpha(0)
      upgradeLabel.disableInteractive()

      // Fade in text and button
      this.tweens.add({
        targets: [skillText, levelText, upgradeBtn, upgradeLabel],
        alpha: 1,
        duration: 200,
        delay: 320 + (index * 25),
        ease: 'Power2'
      })

      // Create hover tooltip for description
      let tooltip: any = null

      uiElements.push(cardShadow, skillBg, skillText, levelText, upgradeBtn, upgradeLabel)
      this.skillTreeSkillElements.push(cardShadow, skillBg, skillText, levelText, upgradeBtn, upgradeLabel)

      // Add hover tooltip to card background
      skillBg.setInteractive()
        .on('pointerover', (pointer: any) => {
          // Show tooltip with description
          // Use pointer Y position (screen coordinates) instead of card Y (world coordinates)
          const tooltipX = centerX + 350
          const tooltipHeight = 60
          const screenHeight = this.scale.height

          // Use mouse Y position and clamp to screen
          let tooltipY = pointer.y
          if (tooltipY - tooltipHeight / 2 < 10) {
            tooltipY = 10 + tooltipHeight / 2
          } else if (tooltipY + tooltipHeight / 2 > screenHeight - 10) {
            tooltipY = screenHeight - 10 - tooltipHeight / 2
          }

          const tooltipBg = this.add.rectangle(tooltipX, tooltipY, 280, tooltipHeight, 0x1a1a2e, 0.95)
            .setScrollFactor(0).setDepth(15000)
            .setStrokeStyle(2, 0x9b59b6, 1)

          const tooltipText = this.add.text(tooltipX, tooltipY, skill.description, {
            fontSize: '12px',
            color: '#ecf0f1',
            align: 'center',
            wordWrap: { width: 260 }
          }).setOrigin(0.5).setScrollFactor(0).setDepth(15001)
          tooltipText.disableInteractive()

          tooltip = { bg: tooltipBg, text: tooltipText }
          uiElements.push(tooltipBg, tooltipText)
        })
        .on('pointerout', () => {
          // Hide and destroy tooltip
          if (tooltip) {
            tooltip.bg.destroy()
            tooltip.text.destroy()
            tooltip = null
          }
        })

      // Modern hover effects for clickable buttons
      if (canUpgrade) {
        upgradeBtn.setInteractive({ useHandCursor: true })
          .on('pointerover', () => {
            upgradeBtn.setFillStyle(0x2ecc71, 1)
            this.tweens.add({
              targets: upgradeBtn,
              scaleX: 1.05,
              scaleY: 1.1,
              duration: 150,
              ease: 'Power2'
            })
          })
          .on('pointerout', () => {
            upgradeBtn.setFillStyle(0x27ae60, 0.9)
            this.tweens.add({
              targets: upgradeBtn,
              scaleX: 1,
              scaleY: 1,
              duration: 150,
              ease: 'Power2'
            })
          })
          .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
            event.stopPropagation()
            // Pulse animation on upgrade
            this.tweens.add({
              targets: [upgradeBtn, skillBg],
              scaleX: 0.95,
              scaleY: 0.95,
              duration: 100,
              yoyo: true,
              ease: 'Power2'
            })
            // Try to upgrade
            if (this.player.skillTree.upgradeSkill(skill.id)) {
              this.player.skillPoints = this.player.skillTree.getSkillPoints()
              this.player.applySkillBonuses()
              this.closeSkillTree()
              this.openSkillTree() // Refresh
            }
          })
      }
    })

    // Store ALL elements for cleanup (no container!)
    this.skillTreeUI = { elements: uiElements }
  }

  private closeSkillTree() {
    if (!this.skillTreeUI) return

    // FIX V6: Destroy all independent elements
    this.skillTreeUI.elements.forEach((el: any) => el.destroy())
    this.skillTreeUI = null

    // FIX V7: Defer physics resume to avoid race conditions
    this.time.delayedCall(50, () => {
      this.physics.resume()
    })
  }

  private updateUI() {
    const combo = this.comboSystem.getCombo()
    const bestCombo = this.comboSystem.getBestCombo()

    const stats = {
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      ammo: this.player.currentAmmo,
      maxAmmo: this.player.maxAmmo,
      money: this.player.money,
      xp: this.player.xp,
      level: this.player.level,
      weapon: this.player.getCurrentWeaponName(),
      skillPoints: this.player.skillPoints,
      combo,
      bestCombo,
    }

    // DotSlayer floor system!
    const floorNum = this.floorManager.getCurrentFloorNumber()
    const floor = this.floorManager.getCurrentFloor()
    let floorType = 'Standard Floor'

    if (floor.specialModifier === 'boss_floor') {
      floorType = 'BOSS FLOOR'
    } else if (floor.specialModifier === 'elite_floor') {
      floorType = 'Elite Floor'
    } else if (floor.specialModifier === 'treasure_floor') {
      floorType = 'Treasure Floor'
    }

    const mission = {
      title: `FLOOR ${floorNum} - ${floorType}`,
      objective: 'Clear all enemies to proceed',
      progress: `${this.enemiesKilled} / ${this.totalEnemies} enemies`,
    }

    this.emitGameEvent('statsUpdate', stats)
    this.emitGameEvent('missionUpdate', mission)
  }

  private emitGameEvent(type: string, data: any) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gameEvent', {
        detail: { type, data }
      }))
    }
  }

  private emitMessage(text: string, type: 'success' | 'warning' | 'danger') {
    this.emitGameEvent('message', { text, type })
  }

  // FIX V6: Big popup notification for important events!
  private showBigPopup(text: string, color: string) {
    const popup = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      text,
      {
        fontSize: '48px',
        color: color,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(15000)

    // Scale up and fade out
    this.tweens.add({
      targets: popup,
      scale: 1.5,
      alpha: 0,
      duration: 1500,
      ease: 'Cubic.easeOut',
      onComplete: () => popup.destroy()
    })
  }

  // Show leaderboard after game over/victory with name input
  private async showLeaderboardPrompt(victory: boolean) {
    // Mark save as dead if playing from a save slot
    if (this.currentSaveSlot !== null && this.currentUserId) {
      await this.saveManager.markSaveDead(this.currentUserId, this.currentSaveSlot)
    }

    const screenWidth = this.scale.width
    const screenHeight = this.scale.height
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    // Calculate score
    const score = this.runStats.totalMoney + this.runStats.totalKills * 100 + this.runStats.stagesCompleted * 1000

    // Create full screen black overlay
    const overlay = this.add.rectangle(0, 0, screenWidth * 2, screenHeight * 2, 0x000000, 0.95)
      .setOrigin(0).setScrollFactor(0).setDepth(25000)

    // Game Over title
    const gameOverText = this.add.text(centerX, centerY - 150, victory ? '🎉 VICTORY!' : '💀 GAME OVER', {
      fontSize: '48px',
      color: victory ? '#2ecc71' : '#e74c3c',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5).setScrollFactor(0).setDepth(25001)

    // Score display
    const scoreText = this.add.text(centerX, centerY - 90, `Final Score: $${score.toLocaleString()}`, {
      fontSize: '24px',
      color: '#f39c12',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(25001)

    // Enter name prompt
    const promptText = this.add.text(centerX, centerY - 40, 'Enter your name:', {
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(25001)

    // Input field background
    const inputBg = this.add.rectangle(centerX, centerY + 10, 400, 60, 0x2c3e50)
      .setStrokeStyle(3, 0x3498db)
      .setScrollFactor(0).setDepth(25001)

    // Player name text (start with cursor)
    let playerName = ''
    const nameText = this.add.text(centerX, centerY + 10, '_', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(25002)

    // Keyboard input
    const keyboard = this.input.keyboard!
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Backspace') {
        playerName = playerName.slice(0, -1)
        nameText.setText(playerName || '_')
      } else if (event.key === 'Enter' && playerName.length > 0) {
        submitScore()
      } else if (event.key.length === 1 && playerName.length < 20) {
        playerName += event.key
        nameText.setText(playerName + '_')
      }
    }
    keyboard.on('keydown', handleKeyPress)

    // Submit function
    const submitScore = async () => {
      keyboard.off('keydown', handleKeyPress)
      submitBtn.disableInteractive()

      // Calculate time played in seconds
      const timePlayed = Math.floor((Date.now() - this.runStats.startTime) / 1000)

      // Submit to leaderboard (use current user ID and entered name as display name)
      const userId = this.currentUserId || 'anonymous'
      await this.leaderboardService.submitScore(
        userId,
        playerName,
        score,
        this.runStats.stagesCompleted,
        this.runStats.totalKills,
        timePlayed
      )

      // Show brief success message
      overlay.setAlpha(1)
      gameOverText.destroy()
      scoreText.destroy()
      promptText.destroy()
      inputBg.destroy()
      nameText.destroy()
      submitBtn.destroy()
      submitLabel.destroy()

      const successText = this.add.text(centerX, centerY - 30, '✅ Score Submitted!', {
        fontSize: '36px',
        color: '#2ecc71',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6
      }).setOrigin(0.5).setScrollFactor(0).setDepth(25001)

      const returnText = this.add.text(centerX, centerY + 30, 'Returning to menu...', {
        fontSize: '20px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setScrollFactor(0).setDepth(25001)

      // Return to menu after 1.5 seconds
      this.time.delayedCall(1500, () => {
        this.scene.start('MenuScene')
      })
    }

    // Submit button
    const submitBtn = this.add.rectangle(centerX, centerY + 90, 250, 60, 0x27ae60)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0).setDepth(25001)

    submitBtn.on('pointerover', () => submitBtn.setFillStyle(0x2ecc71))
    submitBtn.on('pointerout', () => submitBtn.setFillStyle(0x27ae60))
    submitBtn.on('pointerdown', submitScore)

    const submitLabel = this.add.text(centerX, centerY + 90, 'SUBMIT', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(25002)
  }
}

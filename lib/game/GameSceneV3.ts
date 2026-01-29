import Phaser from 'phaser'
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
  private shopManager!: ShopManager
  private shopUI!: ShopUI
  private audioManager!: AudioManager
  private saveManager!: SaveManager
  private leaderboardService!: LeaderboardService

  private currentPlayerName: string = 'Player'
  private currentSaveSlot: number | null = null

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: any

  private enemiesKilled = 0
  private totalEnemies = 0
  private bossSpawned = false
  private stageCompleted = false // FIX: Prevent multiple completions

  private worldWidth = 2000 // Much smaller arena (was 3200)
  private worldHeight = 1500 // Much smaller arena (was 2400)

  private casinoZones: any[] = []
  private skillTreeUI: any = null
  private pauseMenuUI: any[] = []
  private isPaused = false
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
    this.comboSystem = new ComboSystem()
    this.weaponSystem = new WeaponSystem(this)
    this.casinoManager = new CasinoManager(this)
    this.powerUpManager = new PowerUpManager(this)
    this.shopManager = new ShopManager()
    this.audioManager = AudioManager.getInstance()
    this.saveManager = SaveManager.getInstance()
    this.leaderboardService = LeaderboardService.getInstance()

    // Start background music (after user interaction)
    this.input.once('pointerdown', () => {
      this.audioManager.enableAudio()
    })

    // Set world bounds
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight)

    // Create background
    this.createStageBackground()

    // Create player
    this.player = new Player(this, this.worldWidth / 2, this.worldHeight / 2, this.weaponSystem)

    // Check if we're loading a saved game
    const loadSaveData = this.registry.get('loadSaveData')
    if (loadSaveData) {
      this.currentPlayerName = loadSaveData.player_name
      this.currentSaveSlot = loadSaveData.save_slot
      this.saveManager.applySaveData(loadSaveData, this.player, this.shopManager)
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

    // Create persistent UI
    this.createPersistentUI()

    // Spawn initial stage enemies
    this.startStage()

    // Camera setup
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight)
    this.cameras.main.setZoom(1.2)

    // Input setup
    this.setupInput()

    // Collisions
    this.setupCollisions()

    // Create casino zones
    this.createCasinoZones()

    // UI updates
    this.updateUI()

    // Welcome message
    this.addKillFeedMessage('🎮 CRIME CITY V3 - All systems online!', '#2ecc71', 5000)
    this.showStageIntro()
  }

  private abilityHotbarUI: any[] = []
  private enemyTrackerUI: any = null

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
    }

    // Weapon system
    this.weaponSystem.update(time, delta)

    // Update enemies
    this.enemies.children.entries.forEach((enemy: any) => {
      if (enemy.active) {
        enemy.update(this.player, this.weaponSystem)
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

    // Check stage completion
    if (!this.stageCompleted) {
      this.checkStageCompletion()
    }

    // Check casino interaction
    this.checkCasinoInteraction()

    // Update UI
    this.updateUI()

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

  private spawnEnemies(count: number, types: EnemyType[]) {
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

  private bulletHitEnemy(bullet: any, enemy: any) {
    bullet.destroy()

    const killed = enemy.takeDamage(this.player.getCurrentWeaponDamage())

    if (killed) {
      this.enemiesKilled++

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

      // Create explosion effect
      this.createExplosion(enemy.x, enemy.y, enemy.isBoss())

      // FIX V6: Add extra kill particles!
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
    bullet.destroy()

    const killed = boss.takeDamage(this.player.getCurrentWeaponDamage())

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

      // Epic kill feed message
      this.addKillFeedMessage(`💀 BOSS DEFEATED! 💀`, '#ff0000', 5000)
      this.addKillFeedMessage(`+$${money} +${xp}XP +1 SKILL POINT`, '#ffd700', 5000)

      // Camera shake for epic feel (reduced)
      this.cameras.main.shake(150, 0.003)

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
    const stage = this.stageManager.getCurrentStage()

    // FAST-PACED: Spawn boss at 60% completion instead of 95%!
    const bossSpawnThreshold = Math.floor(this.totalEnemies * 0.6)
    if (stage.bossEnabled && !this.bossSpawned && this.enemiesKilled >= bossSpawnThreshold) {
      this.spawnBoss()
    }

    // Stage complete
    if (this.enemiesKilled >= this.totalEnemies) {
      this.completeStage()
    }
  }

  private completeStage() {
    if (this.stageCompleted) return // FIX: Prevent multiple calls
    this.stageCompleted = true

    const stage = this.stageManager.getCurrentStage()

    // ROGUELIKE: Track stages completed
    this.runStats.stagesCompleted++

    // Rewards
    this.player.addMoney(stage.moneyReward)
    this.player.addXP(stage.xpReward)

    // ROGUELIKE: Track money earned
    this.runStats.totalMoney += stage.moneyReward

    this.addKillFeedMessage(`Stage Complete! +$${stage.moneyReward} +${stage.xpReward}XP`, '#2ecc71', 6000)

    // Check if more stages
    if (this.stageManager.nextStage()) {
      // Next stage
      this.time.delayedCall(3000, () => {
        this.startStage()
        this.showStageIntro()
      })
    } else {
      // GAME WON!
      this.gameWon()
    }
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
        const result = await this.saveManager.saveGame(
          this.currentPlayerName,
          saveSlot,
          this.player,
          this.stageManager.getCurrentStageNumber(),
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

  private gameOver() {
    // Play death sound and stop music
    this.audioManager.playSound('death')
    this.audioManager.stopMusic()

    this.addKillFeedMessage('💀 GAME OVER 💀', '#e74c3c', 3000)
    this.showRunStats(false)

    // Submit to leaderboard
    this.time.delayedCall(2000, () => {
      this.showLeaderboardPrompt(false)
    })

    this.time.delayedCall(12000, () => {
      this.scene.restart()
    })
  }

  private gameWon() {
    this.addKillFeedMessage('🏆 YOU WON! ALL STAGES CLEARED! 🏆', '#2ecc71', 6000)
    this.showRunStats(true)

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

  private createStageBackground() {
    const stage = this.stageManager.getCurrentStage()
    const graphics = this.add.graphics().setDepth(-1)

    graphics.fillStyle(stage.backgroundColor, 1)
    graphics.fillRect(0, 0, this.worldWidth, this.worldHeight)

    graphics.lineStyle(1, stage.gridColor, 0.5)
    const gridSize = 64

    for (let x = 0; x <= this.worldWidth; x += gridSize) {
      graphics.lineBetween(x, 0, x, this.worldHeight)
    }

    for (let y = 0; y <= this.worldHeight; y += gridSize) {
      graphics.lineBetween(0, y, this.worldWidth, y)
    }
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

    const stage = this.stageManager.getCurrentStage()
    const mission = {
      title: `STAGE ${stage.stageNumber}: ${stage.name}`,
      objective: 'Eliminate all enemies',
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
    if (this.currentSaveSlot !== null) {
      await this.saveManager.markSaveDead(this.currentPlayerName, this.currentSaveSlot)
    }

    const screenWidth = this.scale.width
    const screenHeight = this.scale.height
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    // Create overlay
    const overlay = this.add.rectangle(0, 0, screenWidth * 2, screenHeight * 2, 0x000000, 0.7)
      .setOrigin(0).setScrollFactor(0).setDepth(20000)

    // Title
    const title = this.add.text(centerX, centerY - 200, '💀 ENTER YOUR NAME', {
      fontSize: '32px',
      color: '#e74c3c',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20001)

    // Input field background
    const inputBg = this.add.rectangle(centerX, centerY - 140, 400, 60, 0x2c3e50)
      .setStrokeStyle(3, 0x3498db)
      .setScrollFactor(0).setDepth(20001)

    // Player name text
    let playerName = this.currentPlayerName
    const nameText = this.add.text(centerX, centerY - 140, playerName, {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20002)

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
        nameText.setText(playerName)
      }
    }
    keyboard.on('keydown', handleKeyPress)

    // Submit function
    const submitScore = async () => {
      keyboard.off('keydown', handleKeyPress)
      submitBtn.disableInteractive()

      // Calculate score (money + kills * 100 + stage * 1000)
      const score = this.runStats.totalMoney + this.runStats.totalKills * 100 + this.runStats.stagesCompleted * 1000

      // Calculate time played in seconds
      const timePlayed = Math.floor((Date.now() - this.runStats.startTime) / 1000)

      // Submit to leaderboard
      const result = await this.leaderboardService.submitScore(
        playerName,
        score,
        this.runStats.stagesCompleted,
        this.runStats.totalKills,
        timePlayed
      )

      // Show result message
      const resultText = this.add.text(centerX, centerY - 70, result.message, {
        fontSize: '20px',
        color: result.success ? '#2ecc71' : '#e74c3c',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setScrollFactor(0).setDepth(20001)

      // Hide input UI
      title.destroy()
      inputBg.destroy()
      nameText.destroy()
      submitBtn.destroy()
      submitLabel.destroy()

      // Load and display top 10 leaderboard
      this.time.delayedCall(1000, async () => {
        const topScores = await this.leaderboardService.getTopScores(10)

        if (topScores.length > 0) {
          const lbTitle = this.add.text(centerX - 300, centerY - 250, '🏆 TOP 10 LEADERBOARD', {
            fontSize: '28px',
            color: '#f39c12',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
          }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(20001)

          topScores.forEach((entry, index) => {
            const rank = index + 1
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`
            const text = `${medal} ${entry.player_name} - $${entry.score} (Stage ${entry.stage_reached})`

            this.add.text(centerX - 300, centerY - 200 + index * 30, text, {
              fontSize: '18px',
              color: rank <= 3 ? '#f39c12' : '#ffffff',
              fontStyle: rank <= 3 ? 'bold' : 'normal',
              stroke: '#000000',
              strokeThickness: 3
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(20001)
          })
        }
      })
    }

    // Submit button
    const submitBtn = this.add.rectangle(centerX, centerY - 60, 200, 50, 0x27ae60)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0).setDepth(20001)

    submitBtn.on('pointerover', () => submitBtn.setFillStyle(0x2ecc71))
    submitBtn.on('pointerout', () => submitBtn.setFillStyle(0x27ae60))
    submitBtn.on('pointerdown', submitScore)

    const submitLabel = this.add.text(centerX, centerY - 60, 'SUBMIT', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20002)
  }
}

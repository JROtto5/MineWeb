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

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: any

  private enemiesKilled = 0
  private totalEnemies = 0
  private bossSpawned = false
  private stageCompleted = false // FIX: Prevent multiple completions

  private worldWidth = 3200
  private worldHeight = 2400

  private casinoZones: any[] = []
  private skillTreeUI: any = null
  private pauseMenuUI: any[] = []
  private isPaused = false
  private skillTreeScrollOffset = 0
  private skillTreeSkillElements: any[] = []

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
    // Initialize systems
    this.stageManager = new StageManager()
    this.comboSystem = new ComboSystem()
    this.weaponSystem = new WeaponSystem(this)
    this.casinoManager = new CasinoManager(this)
    this.powerUpManager = new PowerUpManager(this)
    this.shopManager = new ShopManager()

    // Set world bounds
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight)

    // Create background
    this.createStageBackground()

    // Create player
    this.player = new Player(this, this.worldWidth / 2, this.worldHeight / 2, this.weaponSystem)

    // Apply initial shop bonuses
    this.player.applyShopBonuses(this.shopManager)

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

    // FIX V8: Listen for weapon switch events and show shorter messages
    if (typeof window !== 'undefined') {
      window.addEventListener('gameEvent', ((event: CustomEvent) => {
        if (event.detail.type === 'message' && event.detail.data.text.includes('Switched to')) {
          // Show weapon switch with SHORT duration (1 second)
          this.addKillFeedMessage(event.detail.data.text, '#3498db', 1000)
        }
      }) as EventListener)
    }
  }

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

    // Weapon switching - FIX V8: Block when UI open!
    this.input.keyboard!.on('keydown-ONE', () => {
      if (!this.skillTreeUI && !this.shopUI.isShopOpen() && !this.casinoUI.isOpen) {
        this.player.switchWeapon(0)
      }
    })
    this.input.keyboard!.on('keydown-TWO', () => {
      if (!this.skillTreeUI && !this.shopUI.isShopOpen() && !this.casinoUI.isOpen) {
        this.player.switchWeapon(1)
      }
    })
    this.input.keyboard!.on('keydown-THREE', () => {
      if (!this.skillTreeUI && !this.shopUI.isShopOpen() && !this.casinoUI.isOpen) {
        this.player.switchWeapon(2)
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

    // Check stage completion
    if (!this.stageCompleted) {
      this.checkStageCompletion()
    }

    // Check casino interaction
    this.checkCasinoInteraction()

    // Update UI
    this.updateUI()
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

    // Spawn regular enemies
    const regularCount = stage.bossEnabled ? stage.enemyCount - 1 : stage.enemyCount
    this.spawnEnemies(regularCount, stage.enemyTypes)

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

      // Combo system
      const combo = this.comboSystem.addKill(this.time.now)

      // Calculate rewards with combo multiplier
      const money = Math.floor(enemy.getMoneyDrop() * combo.multiplier)
      const xp = Math.floor(enemy.getXPDrop() * combo.multiplier)

      this.player.addMoney(money)
      this.player.addXP(xp)

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

      // FIX V6: FLASH SCREEN + BIG EXPLOSION!
      this.cameras.main.flash(enemy.isBoss() ? 200 : 100, 255, 100, 0)

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

      const combo = this.comboSystem.addKill(this.time.now)

      // EPIC rewards with combo multiplier
      const money = Math.floor(boss.getMoneyDrop() * combo.multiplier)
      const xp = Math.floor(boss.getXPDrop() * combo.multiplier)

      this.player.addMoney(money)
      this.player.addXP(xp)

      // Add skill point for boss kill!
      this.player.skillPoints++

      // Epic kill feed message
      this.addKillFeedMessage(`💀 BOSS DEFEATED! 💀`, '#ff0000', 5000)
      this.addKillFeedMessage(`+$${money} +${xp}XP +1 SKILL POINT`, '#ffd700', 5000)

      // Camera shake for epic feel
      this.cameras.main.shake(800, 0.02)

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

    // Spawn boss when almost done
    if (stage.bossEnabled && !this.bossSpawned && this.enemiesKilled >= this.totalEnemies - 1) {
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

    // Rewards
    this.player.addMoney(stage.moneyReward)
    this.player.addXP(stage.xpReward)

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

    this.pauseMenuUI = [overlay, title, stats, resumeBg, resumeLabel, restartBg, restartLabel]
  }

  private closePauseMenu() {
    this.isPaused = false
    this.physics.resume()

    this.pauseMenuUI.forEach(el => el.destroy())
    this.pauseMenuUI = []
  }

  private gameOver() {
    this.addKillFeedMessage('💀 GAME OVER 💀', '#e74c3c', 3000)
    this.time.delayedCall(2000, () => {
      this.scene.restart()
    })
  }

  private gameWon() {
    this.addKillFeedMessage('🏆 YOU WON! ALL STAGES CLEARED! 🏆', '#2ecc71', 6000)
    this.time.delayedCall(5000, () => {
      this.scene.restart()
    })
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
      this.cameras.main.shake(800, 0.02)
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

    // FIX V11: Overlay should NOT be interactive - it blocks button clicks!
    // The buttons at depth 9003/9004 are above overlay at depth 8000
    const overlay = this.add.rectangle(
      centerX,
      centerY,
      screenWidth * 2,
      screenHeight * 2,
      0x000000,
      0.9
    ).setScrollFactor(0).setDepth(8000) // LOWER depth!

    // FIX V11: DON'T make overlay interactive - let buttons handle clicks!
    // overlay.setInteractive()
    //   .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
    //     // Stop event from reaching game world below
    //     event.stopPropagation()
    //   })

    // Store all UI elements for cleanup
    const uiElements: any[] = [overlay]

    // FIX V6: Create ALL elements with ABSOLUTE positioning (no container!)
    const title = this.add.text(centerX, centerY - 250, '⚡ SKILL TREE ⚡', {
      fontSize: '42px',
      color: '#f39c12',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(9002)
    title.disableInteractive() // FIX V7: Prevent text from blocking clicks

    const pointsText = this.add.text(centerX, centerY - 200, `Skill Points: ${this.player.skillPoints}`, {
      fontSize: '24px',
      color: '#2ecc71',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(9002)
    pointsText.disableInteractive() // FIX V7: Prevent text from blocking clicks

    uiElements.push(title, pointsText)

    // Skills grid - SCROLLABLE!
    const skills = this.player.skillTree.getAllSkills()
    const startY = centerY - 140
    const gap = 55
    this.skillTreeScrollOffset = 0
    this.skillTreeSkillElements = []

    // Add scroll hint
    const scrollHint = this.add.text(centerX, centerY + 180, '🖱️ Scroll with Mouse Wheel', {
      fontSize: '16px',
      color: '#95a5a6',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(9002)
    scrollHint.disableInteractive()
    uiElements.push(scrollHint)

    // Mouse wheel scroll
    this.input.on('wheel', (pointer: any, gameObjects: any[], deltaX: number, deltaY: number) => {
      if (this.skillTreeUI) {
        this.skillTreeScrollOffset += deltaY * 0.3
        // Clamp scroll: can't go above 0, max is (skills.length * gap) - viewable area
        const maxScroll = Math.max(0, skills.length * gap - 400)
        this.skillTreeScrollOffset = Phaser.Math.Clamp(this.skillTreeScrollOffset, 0, maxScroll)

        // Update all skill element positions
        this.skillTreeSkillElements.forEach((el, idx) => {
          const baseY = startY + Math.floor(idx / 6) * gap
          el.setY(baseY - this.skillTreeScrollOffset)
        })
      }
    })

    skills.forEach((skillData, index) => {
      const skill = skillData.skill
      const level = skillData.level

      const y = startY + index * gap
      // FIX V11++: Check if player has points AND skill can be upgraded!
      const hasPoints = this.player.skillPoints > 0
      const notMaxed = level < skill.maxLevel
      const canUpgrade = hasPoints && notMaxed

      // Background - ABSOLUTE position!
      const skillBg = this.add.rectangle(centerX - 30, y, 400, 48, 0x2c3e50, 0.8)
        .setScrollFactor(0)
        .setDepth(9001)

      // FIX V11: CRITICAL - Disable text interactivity so it doesn't block clicks!
      const skillText = this.add.text(centerX - 220, y, `${skill.icon} ${skill.name}`, {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(9004)
      skillText.disableInteractive() // Prevent text from intercepting events

      const levelText = this.add.text(centerX - 70, y, `Lv ${level}/${skill.maxLevel}`, {
        fontSize: '16px',
        color: level === skill.maxLevel ? '#f1c40f' : '#95a5a6',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(9004)
      levelText.disableInteractive() // Prevent text from intercepting events

      const descText = this.add.text(centerX - 220, y + 18, skill.description, {
        fontSize: '12px',
        color: '#bdc3c7',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(9004)
      descText.disableInteractive() // Prevent text from intercepting events

      // FIX V11: Add visible UPGRADE button like Casino/Shop!
      const buttonColor = canUpgrade ? 0x2ecc71 : (level === skill.maxLevel ? 0x7f8c8d : 0x95a5a6)
      const upgradeBtn = this.add.rectangle(centerX + 200, y, 100, 42, buttonColor, canUpgrade ? 0.9 : 0.5)
        .setScrollFactor(0)
        .setDepth(9003)

      const buttonText = canUpgrade ? '⚡ UPGRADE' : (level === skill.maxLevel ? 'MAX' : 'LOCKED')
      const upgradeLabel = this.add.text(centerX + 200, y, buttonText, {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(9004)
      upgradeLabel.disableInteractive()

      uiElements.push(skillBg, skillText, levelText, descText, upgradeBtn, upgradeLabel)
      this.skillTreeSkillElements.push(skillBg, skillText, levelText, descText, upgradeBtn, upgradeLabel)

      // Make BUTTON clickable immediately!
      if (canUpgrade) {
        upgradeBtn.setInteractive({ useHandCursor: true })
          .on('pointerover', () => {
            upgradeBtn.setFillStyle(0x27ae60, 1)
            this.cameras.main.flash(50, 0, 255, 0)
          })
          .on('pointerout', () => upgradeBtn.setFillStyle(0x2ecc71, 0.9))
          .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
            event.stopPropagation()
            // FIX V11++: Try to upgrade (handles skill point deduction internally)
            if (this.player.skillTree.upgradeSkill(skill.id)) {
              // Sync player skillPoints with skillTree
              this.player.skillPoints = this.player.skillTree.getSkillPoints()
              this.player.applySkillBonuses()
              // REDUCED POPUPS: Removed showBigPopup, only flash
              this.cameras.main.flash(150, 50, 255, 50)
              this.closeSkillTree()
              this.openSkillTree() // Refresh
            }
          })
      }
    })

    // Close button - ABSOLUTE position!
    const closeBtn = this.add.rectangle(centerX, centerY + 220, 220, 50, 0xe74c3c, 0.9)
      .setScrollFactor(0)
      .setDepth(9003)

    const closeTxt = this.add.text(centerX, centerY + 220, 'Close (T)', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(9004)
    closeTxt.disableInteractive() // FIX V7: Prevent text from blocking clicks

    closeBtn.setInteractive({ useHandCursor: true })
      .on('pointerover', () => closeBtn.setFillStyle(0xc0392b, 1))
      .on('pointerout', () => closeBtn.setFillStyle(0xe74c3c, 0.9))
      .on('pointerdown', (pointer: any, x: number, y: number, event: any) => {
        event.stopPropagation() // FIX V7: Stop event from bubbling
        this.closeSkillTree()
      })

    uiElements.push(closeBtn, closeTxt)

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
}

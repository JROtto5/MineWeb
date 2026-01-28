import Phaser from 'phaser'
import Player from './Player'
import { AdvancedEnemy, EnemyType, ENEMY_STATS } from './EnemyTypes'
import { WeaponSystem } from './Weapon'
import { CasinoManager } from './Casino'
import { CasinoUI } from './CasinoUI'
import { PowerUpManager, PowerUpType } from './PowerUps'
import { ComboSystem, StageManager, STAGES } from './StageSystem'
import { SkillTreeManager, SKILLS } from './SkillTree'

export default class GameSceneV3 extends Phaser.Scene {
  private player!: Player
  private enemies!: Phaser.GameObjects.Group
  private weaponSystem!: WeaponSystem
  private casinoManager!: CasinoManager
  private casinoUI!: CasinoUI
  private powerUpManager!: PowerUpManager
  private comboSystem!: ComboSystem
  private stageManager!: StageManager

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

    // Set world bounds
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight)

    // Create background
    this.createStageBackground()

    // Create player
    this.player = new Player(this, this.worldWidth / 2, this.worldHeight / 2, this.weaponSystem)

    // Casino UI
    this.casinoUI = new CasinoUI(this, this.casinoManager, this.player)

    // Create enemies group
    this.enemies = this.add.group()

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

      // Position in center top
      const cam = this.cameras.main
      this.comboDisplay.setPosition(
        cam.width / 2,
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
    const cam = this.cameras.main

    const message = this.add.text(cam.width - 20, 20 + this.killFeedMessages.length * 35, text, {
      fontSize: '18px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'right',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(5000)

    // Slide in animation
    message.setAlpha(0)
    message.setX(cam.width + 20)

    this.tweens.add({
      targets: message,
      x: cam.width - 20,
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

    // Remove expired messages
    this.killFeedMessages = this.killFeedMessages.filter(msg => {
      if (currentTime >= msg.time) {
        this.tweens.add({
          targets: msg.text,
          alpha: 0,
          x: this.cameras.main.width + 20,
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
      ONE: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      TWO: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      THREE: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
    }

    // Shooting
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown() && !this.skillTreeUI) {
        this.player.shoot(pointer.worldX, pointer.worldY)
      }
    })

    // Weapon switching
    this.input.keyboard!.on('keydown-ONE', () => this.player.switchWeapon(0))
    this.input.keyboard!.on('keydown-TWO', () => this.player.switchWeapon(1))
    this.input.keyboard!.on('keydown-THREE', () => this.player.switchWeapon(2))

    // Reload
    this.input.keyboard!.on('keydown-R', () => this.player.reload())

    // Skill tree (T key)
    this.input.keyboard!.on('keydown-T', () => this.toggleSkillTree())
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
    // Player movement
    const moveX = (this.wasd.D.isDown ? 1 : 0) - (this.wasd.A.isDown ? 1 : 0)
    const moveY = (this.wasd.S.isDown ? 1 : 0) - (this.wasd.W.isDown ? 1 : 0)
    this.player.move(moveX, moveY)

    // Weapon system
    this.weaponSystem.update(time, delta)

    // Update enemies
    this.enemies.children.entries.forEach((enemy: any) => {
      if (enemy.active) {
        enemy.update(this.player, this.weaponSystem)
      }
    })

    // Combo system
    if (this.comboSystem.update(time)) {
      this.addKillFeedMessage('Combo ended!', '#f39c12', 2000)
    }

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

  private spawnBoss() {
    if (this.bossSpawned) return
    this.bossSpawned = true

    // Spawn boss far from player
    let bossX, bossY
    do {
      bossX = Phaser.Math.Between(300, this.worldWidth - 300)
      bossY = Phaser.Math.Between(300, this.worldHeight - 300)
    } while (Phaser.Math.Distance.Between(bossX, bossY, this.player.x, this.player.y) < 600)

    const boss = new AdvancedEnemy(this, bossX, bossY, EnemyType.BOSS)
    this.enemies.add(boss)

    this.addKillFeedMessage('💀 BOSS HAS ARRIVED! 💀', '#ff0000', 5000)
    this.cameras.main.shake(500, 0.01)
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

      // Add to kill feed
      const killColor = combo.combo > 10 ? '#ff6b00' : combo.combo > 5 ? '#f39c12' : '#2ecc71'
      this.addKillFeedMessage(`+$${money} +${xp}XP (${combo.combo}x)`, killColor, 4000)

      // New record?
      if (combo.isNewRecord && combo.combo >= 5) {
        this.addKillFeedMessage(`🔥 NEW RECORD: ${combo.combo}! 🔥`, '#ff6b00', 5000)
      }

      // Drop power-up chance
      this.powerUpManager.tryDropPowerUp(enemy.x, enemy.y)

      // Explosion effect
      this.createExplosion(enemy.x, enemy.y, enemy.isBoss())

      enemy.destroy()
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

  private collectPowerUp(player: any, powerUp: any) {
    powerUp.collect(player)
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

    const cam = this.cameras.main

    // Overlay - FIX: Use proper positioning without scrollFactor issues
    const overlay = this.add.rectangle(
      cam.width / 2,
      cam.height / 2,
      cam.width * 2, // Make it larger to cover everything
      cam.height * 2,
      0x000000,
      0.9
    ).setScrollFactor(0).setDepth(9000).setInteractive()

    const container = this.add.container(
      cam.width / 2,
      cam.height / 2
    ).setScrollFactor(0).setDepth(9001)

    const title = this.add.text(0, -250, '⚡ SKILL TREE ⚡', {
      fontSize: '42px',
      color: '#f39c12',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5)

    const pointsText = this.add.text(0, -200, `Skill Points: ${this.player.skillPoints}`, {
      fontSize: '24px',
      color: '#2ecc71',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // Skills grid
    const skills = this.player.skillTree.getAllSkills()
    const startY = -140
    const gap = 55

    skills.forEach((skillData, index) => {
      const skill = skillData.skill
      const level = skillData.level

      const y = startY + index * gap
      const canUpgrade = this.player.skillTree.canUpgradeSkill(skill.id)

      const skillBg = this.add.rectangle(0, y, 520, 48, canUpgrade ? 0x27ae60 : 0x34495e, canUpgrade ? 0.9 : 0.6)
      const skillText = this.add.text(-240, y, `${skill.icon} ${skill.name}`, {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5)

      const levelText = this.add.text(0, y, `${level}/${skill.maxLevel}`, {
        fontSize: '18px',
        color: level === skill.maxLevel ? '#f1c40f' : '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5)

      const descText = this.add.text(70, y, skill.description, {
        fontSize: '13px',
        color: '#ecf0f1',
      }).setOrigin(0, 0.5)

      // Upgrade button - FIX: Make it more interactive
      if (canUpgrade) {
        skillBg.setInteractive({ useHandCursor: true })
          .on('pointerover', () => skillBg.setFillStyle(0x2ecc71, 1))
          .on('pointerout', () => skillBg.setFillStyle(0x27ae60, 0.9))
          .on('pointerdown', () => {
            if (this.player.skillTree.upgradeSkill(skill.id)) {
              this.player.skillPoints--
              this.player.applySkillBonuses()
              this.addKillFeedMessage(`⚡ Upgraded ${skill.name}!`, '#f39c12', 3000)
              this.closeSkillTree()
              this.openSkillTree() // Refresh
            }
          })
      }

      container.add([skillBg, skillText, levelText, descText])
    })

    const closeBtn = this.add.rectangle(0, 220, 220, 50, 0xe74c3c, 0.9)
    const closeTxt = this.add.text(0, 220, 'Close (T)', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    closeBtn.setInteractive({ useHandCursor: true })
      .on('pointerover', () => closeBtn.setFillStyle(0xc0392b, 1))
      .on('pointerout', () => closeBtn.setFillStyle(0xe74c3c, 0.9))
      .on('pointerdown', () => this.closeSkillTree())

    container.add([title, pointsText, closeBtn, closeTxt])

    this.skillTreeUI = { overlay, container }
  }

  private closeSkillTree() {
    if (!this.skillTreeUI) return

    this.physics.resume()
    this.skillTreeUI.overlay.destroy()
    this.skillTreeUI.container.destroy()
    this.skillTreeUI = null
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
}

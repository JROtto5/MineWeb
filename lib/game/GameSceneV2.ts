import Phaser from 'phaser'
import Player from './Player'
import { AdvancedEnemy, EnemyType, ENEMY_STATS } from './EnemyTypes'
import { WeaponSystem } from './Weapon'
import { CasinoManager } from './Casino'
import { CasinoUI } from './CasinoUI'
import { PowerUpManager, PowerUpType } from './PowerUps'
import { ComboSystem, StageManager, STAGES } from './StageSystem'
import { SkillTreeManager, SKILLS } from './SkillTree'

export default class GameSceneV2 extends Phaser.Scene {
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

  private worldWidth = 3200
  private worldHeight = 2400

  private casinoZones: any[] = []
  private skillTreeUI: any = null

  constructor() {
    super({ key: 'GameSceneV2' })
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
    this.emitMessage('🎮 CRIME CITY V2 - All systems online!', 'success')
    this.showStageIntro()
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
      if (pointer.leftButtonDown()) {
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
      this.emitMessage('Combo ended!', 'warning')
    }

    // Check stage completion
    this.checkStageCompletion()

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

    // Clear existing enemies
    this.enemies.clear(true, true)

    // Spawn regular enemies
    const regularCount = stage.bossEnabled ? stage.enemyCount - 1 : stage.enemyCount
    this.spawnEnemies(regularCount, stage.enemyTypes)

    // Update background
    this.createStageBackground()

    this.emitMessage(`Stage ${this.stageManager.getCurrentStageNumber()}: ${stage.name}`, 'warning')
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

      // Apply stage modifiers
      const baseHealth = ENEMY_STATS[type].health
      const baseSpeed = ENEMY_STATS[type].speed
      const modified = this.stageManager.applyStageModifiers(baseHealth, baseSpeed)

      // Apply modifiers (need to access private health property - we'll keep base stats for now)

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

    this.emitMessage('💀 BOSS HAS ARRIVED! 💀', 'danger')
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

      // Show combo message
      if (combo.combo > 1) {
        this.emitMessage(`${combo.combo}x COMBO! +$${money} +${xp}XP`, 'success')
      } else {
        this.emitMessage(`+$${money} +${xp}XP`, 'success')
      }

      // New record?
      if (combo.isNewRecord && combo.combo >= 5) {
        this.emitMessage(`🔥 NEW COMBO RECORD: ${combo.combo}! 🔥`, 'warning')
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
    const stage = this.stageManager.getCurrentStage()

    // Rewards
    this.player.addMoney(stage.moneyReward)
    this.player.addXP(stage.xpReward)

    this.emitMessage(`Stage Complete! +$${stage.moneyReward} +${stage.xpReward}XP`, 'success')

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
    this.emitMessage('💀 GAME OVER 💀', 'danger')
    this.time.delayedCall(2000, () => {
      this.scene.restart()
    })
  }

  private gameWon() {
    this.emitMessage('🏆 YOU WON! ALL STAGES CLEARED! 🏆', 'success')
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
      this.cameras.main.scrollX + this.cameras.main.width / 2,
      this.cameras.main.scrollY + this.cameras.main.height / 2,
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

    // Overlay
    const overlay = this.add.rectangle(
      this.cameras.main.scrollX + this.cameras.main.width / 2,
      this.cameras.main.scrollY + this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.8
    ).setScrollFactor(0).setDepth(3000)

    const container = this.add.container(
      this.cameras.main.scrollX + this.cameras.main.width / 2,
      this.cameras.main.scrollY + this.cameras.main.height / 2
    ).setScrollFactor(0).setDepth(3001)

    const title = this.add.text(0, -250, '⚡ SKILL TREE ⚡', {
      fontSize: '42px',
      color: '#f39c12',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    const pointsText = this.add.text(0, -200, `Skill Points: ${this.player.skillPoints}`, {
      fontSize: '24px',
      color: '#2ecc71',
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

      const skillBg = this.add.rectangle(0, y, 500, 45, canUpgrade ? 0x27ae60 : 0x34495e, 0.6)
      const skillText = this.add.text(-230, y, `${skill.icon} ${skill.name}`, {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5)

      const levelText = this.add.text(0, y, `${level}/${skill.maxLevel}`, {
        fontSize: '16px',
        color: level === skill.maxLevel ? '#f1c40f' : '#ffffff',
      }).setOrigin(0.5)

      const descText = this.add.text(80, y, skill.description, {
        fontSize: '12px',
        color: '#95a5a6',
      }).setOrigin(0, 0.5)

      // Upgrade button
      if (canUpgrade) {
        skillBg.setInteractive({ useHandCursor: true })
          .on('pointerdown', () => {
            if (this.player.skillTree.upgradeSkill(skill.id)) {
              this.player.skillPoints--
              this.player.applySkillBonuses()
              this.emitMessage(`Upgraded ${skill.name}!`, 'success')
              this.closeSkillTree()
              this.openSkillTree() // Refresh
            }
          })
      }

      container.add([skillBg, skillText, levelText, descText])
    })

    const closeBtn = this.add.rectangle(0, 220, 200, 45, 0xe74c3c)
    const closeTxt = this.add.text(0, 220, 'Close (T)', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    closeBtn.setInteractive({ useHandCursor: true })
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

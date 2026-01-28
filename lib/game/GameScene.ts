import Phaser from 'phaser'
import Player from './Player'
import Enemy from './Enemy'
import { WeaponSystem } from './Weapon'
import { CasinoManager } from './Casino'

export default class GameScene extends Phaser.Scene {
  private player!: Player
  private enemies!: Phaser.GameObjects.Group
  private weaponSystem!: WeaponSystem
  private casinoManager!: CasinoManager

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: any

  private enemiesKilled = 0
  private totalEnemies = 10

  constructor() {
    super({ key: 'GameScene' })
  }

  preload() {
    // We'll use simple shapes for now - no external assets needed
    this.load.image('pixel', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==')
  }

  create() {
    // Set up world bounds
    const worldWidth = 3200
    const worldHeight = 2400
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight)

    // Create background grid
    this.createBackground(worldWidth, worldHeight)

    // Initialize systems
    this.weaponSystem = new WeaponSystem(this)
    this.casinoManager = new CasinoManager(this)

    // Create player
    this.player = new Player(this, worldWidth / 2, worldHeight / 2, this.weaponSystem)

    // Create enemies
    this.enemies = this.add.group()
    this.spawnEnemies(this.totalEnemies)

    // Set up camera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight)
    this.cameras.main.setZoom(1.2)

    // Input setup
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      R: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      E: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      ONE: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      TWO: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      THREE: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
    }

    // Shooting input
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

    // Collisions
    this.physics.add.overlap(
      this.weaponSystem.bullets,
      this.enemies,
      this.bulletHitEnemy as any,
      undefined,
      this
    )

    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.playerHitEnemy as any,
      undefined,
      this
    )

    // Create some casino zones
    this.createCasinoZones()

    // Initial stats update
    this.updateUI()

    // Welcome message
    this.emitMessage('Welcome to Crime City!', 'success')
    this.emitMessage('Eliminate all enemies to complete your mission', 'warning')
  }

  update(time: number, delta: number) {
    // Player movement
    const moveX = (this.wasd.D.isDown ? 1 : 0) - (this.wasd.A.isDown ? 1 : 0)
    const moveY = (this.wasd.S.isDown ? 1 : 0) - (this.wasd.W.isDown ? 1 : 0)

    this.player.move(moveX, moveY)

    // Update weapon system
    this.weaponSystem.update(time, delta)

    // Update enemies
    this.enemies.children.entries.forEach((enemy: any) => {
      if (enemy.active) {
        enemy.update(this.player)
      }
    })

    // Check mission completion
    if (this.enemiesKilled >= this.totalEnemies) {
      this.completeLevel()
    }

    // Update UI
    this.updateUI()
  }

  private createBackground(width: number, height: number) {
    const graphics = this.add.graphics()

    // Dark background
    graphics.fillStyle(0x1a1a1a, 1)
    graphics.fillRect(0, 0, width, height)

    // Grid lines
    graphics.lineStyle(1, 0x2a2a2a, 0.5)
    const gridSize = 64

    for (let x = 0; x <= width; x += gridSize) {
      graphics.lineBetween(x, 0, x, height)
    }

    for (let y = 0; y <= height; y += gridSize) {
      graphics.lineBetween(0, y, width, y)
    }
  }

  private spawnEnemies(count: number) {
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(200, 3000)
      const y = Phaser.Math.Between(200, 2200)

      // Don't spawn too close to player
      const distToPlayer = Phaser.Math.Distance.Between(x, y, 1600, 1200)
      if (distToPlayer < 300) {
        i--
        continue
      }

      const enemy = new Enemy(this, x, y)
      this.enemies.add(enemy)
    }
  }

  private createCasinoZones() {
    // Create a few casino zones in the world
    const casinoLocations = [
      { x: 800, y: 600 },
      { x: 2400, y: 600 },
      { x: 1600, y: 1800 },
    ]

    casinoLocations.forEach(loc => {
      const zone = this.add.rectangle(loc.x, loc.y, 200, 200, 0xf39c12, 0.3)
      const text = this.add.text(loc.x, loc.y - 120, '🎰 CASINO', {
        fontSize: '24px',
        color: '#f39c12',
        fontStyle: 'bold',
      }).setOrigin(0.5)

      this.physics.add.existing(zone)

      this.physics.add.overlap(this.player, zone, () => {
        if (Phaser.Input.Keyboard.JustDown(this.wasd.E)) {
          this.openCasino()
        }
      })
    })
  }

  private openCasino() {
    this.emitMessage('Press E to gamble! (Casino coming soon)', 'warning')
    // TODO: Implement casino UI
  }

  private bulletHitEnemy(bullet: any, enemy: any) {
    bullet.destroy()

    enemy.takeDamage(this.player.getCurrentWeaponDamage())

    if (enemy.isDead()) {
      this.enemiesKilled++

      // Drop loot
      const money = Phaser.Math.Between(10, 50)
      const xp = Phaser.Math.Between(5, 20)

      this.player.addMoney(money)
      this.player.addXP(xp)

      this.emitMessage(`+$${money} +${xp}XP`, 'success')

      enemy.destroy()
    }
  }

  private playerHitEnemy(player: any, enemy: any) {
    player.takeDamage(5)

    if (player.isDead()) {
      this.gameOver()
    }
  }

  private completeLevel() {
    if (this.enemiesKilled === this.totalEnemies) {
      this.enemiesKilled++ // Prevent multiple triggers

      this.emitMessage('Mission Complete! +$500', 'success')
      this.player.addMoney(500)
      this.player.addXP(100)

      // Spawn more enemies
      this.time.delayedCall(3000, () => {
        this.totalEnemies += 5
        this.spawnEnemies(5)
        this.emitMessage('New wave incoming!', 'danger')
      })
    }
  }

  private gameOver() {
    this.emitMessage('Game Over! Restarting...', 'danger')
    this.time.delayedCall(2000, () => {
      this.scene.restart()
    })
  }

  private updateUI() {
    const stats = {
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      ammo: this.player.currentAmmo,
      maxAmmo: this.player.maxAmmo,
      money: this.player.money,
      xp: this.player.xp,
      level: this.player.level,
      weapon: this.player.getCurrentWeaponName(),
    }

    const mission = {
      title: 'ELIMINATE TARGETS',
      objective: 'Clear out the gang members',
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

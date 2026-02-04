import * as Phaser from 'phaser'
import Player from './Player'

export enum EnemyType {
  GRUNT = 'grunt',
  SCOUT = 'scout',
  TANK = 'tank',
  SNIPER = 'sniper',
  BERSERKER = 'berserker',
  BOSS = 'boss',
  // ENEMY TYPES
  ASSASSIN = 'assassin',
  BOMBER = 'bomber',
  HEALER = 'healer',
  SHIELDER = 'shielder',
  // NEW ENEMIES - More variety!
  TELEPORTER = 'teleporter',
  SWARM = 'swarm',
  VAMPIRE = 'vampire',
  SPLITTER = 'splitter',
  GHOST = 'ghost',
}

export interface EnemyStats {
  health: number
  speed: number
  damage: number
  attackRange: number
  attackSpeed: number
  moneyDrop: [number, number]
  xpDrop: [number, number]
  color: number
  size: number
  behavior: 'chase' | 'ranged' | 'tank' | 'fast' | 'berserker'
}

export const ENEMY_STATS: Record<EnemyType, EnemyStats> = {
  [EnemyType.GRUNT]: {
    health: 50,
    speed: 200, // MUCH FASTER! (was 140)
    damage: 5,
    attackRange: 400, // Larger range
    attackSpeed: 1000,
    moneyDrop: [10, 30],
    xpDrop: [5, 15],
    color: 0xff6b6b, // Red dot
    size: 16,
    behavior: 'chase',
  },
  [EnemyType.SCOUT]: {
    health: 30,
    speed: 300, // ULTRA FAST! (was 220)
    damage: 3,
    attackRange: 350,
    attackSpeed: 500,
    moneyDrop: [15, 35],
    xpDrop: [8, 18],
    color: 0x4ecdc4, // Cyan dot
    size: 12,
    behavior: 'fast',
  },
  [EnemyType.TANK]: {
    health: 200,
    speed: 110, // Much faster tank (was 70)
    damage: 15,
    attackRange: 400,
    attackSpeed: 2000,
    moneyDrop: [30, 80],
    xpDrop: [25, 50],
    color: 0x9b59b6, // Purple dot
    size: 24,
    behavior: 'tank',
  },
  [EnemyType.SNIPER]: {
    health: 40,
    speed: 150, // Much faster (was 100)
    damage: 25,
    attackRange: 600,
    attackSpeed: 2500, // Shoots faster (was 3000)
    moneyDrop: [20, 50],
    xpDrop: [15, 30],
    color: 0xf1c40f, // Yellow dot
    size: 14,
    behavior: 'ranged',
  },
  [EnemyType.BERSERKER]: {
    health: 100,
    speed: 240, // ULTRA FAST! (was 170)
    damage: 20,
    attackRange: 450,
    attackSpeed: 600,
    moneyDrop: [40, 90],
    xpDrop: [30, 60],
    color: 0xe74c3c, // Dark red dot
    size: 20,
    behavior: 'berserker',
  },
  [EnemyType.BOSS]: {
    health: 500,
    speed: 130, // Much faster boss (was 90)
    damage: 30,
    attackRange: 550,
    attackSpeed: 1200, // Attacks faster (was 1500)
    moneyDrop: [200, 500],
    xpDrop: [100, 200],
    color: 0x00ff00, // Bright green dot (Matrix style)
    size: 40,
    behavior: 'tank',
  },
  // NEW ENEMY TYPES FOR VARIETY!
  [EnemyType.ASSASSIN]: {
    health: 60,
    speed: 350, // ULTRA fast
    damage: 40, // High damage
    attackRange: 300,
    attackSpeed: 800,
    moneyDrop: [50, 100],
    xpDrop: [30, 50],
    color: 0x2c3e50, // Dark grey - stealthy
    size: 14,
    behavior: 'fast', // Dart in and out
  },
  [EnemyType.BOMBER]: {
    health: 80,
    speed: 180,
    damage: 60, // Explodes on contact!
    attackRange: 500,
    attackSpeed: 3000,
    moneyDrop: [35, 70],
    xpDrop: [25, 45],
    color: 0xff9500, // Orange - explosive
    size: 18,
    behavior: 'chase', // Rushes player to explode
  },
  [EnemyType.HEALER]: {
    health: 120,
    speed: 140,
    damage: 8,
    attackRange: 400,
    attackSpeed: 2000,
    moneyDrop: [60, 120],
    xpDrop: [40, 80],
    color: 0x2ecc71, // Green - healer
    size: 20,
    behavior: 'ranged', // Stays back, heals allies
  },
  [EnemyType.SHIELDER]: {
    health: 300,
    speed: 100,
    damage: 12,
    attackRange: 350,
    attackSpeed: 1500,
    moneyDrop: [45, 90],
    xpDrop: [35, 65],
    color: 0x3498db, // Blue - protective
    size: 26,
    behavior: 'tank', // Protects other enemies
  },
  // NEW ENEMIES!
  [EnemyType.TELEPORTER]: {
    health: 70,
    speed: 200,
    damage: 25,
    attackRange: 500,
    attackSpeed: 2000,
    moneyDrop: [60, 120],
    xpDrop: [40, 70],
    color: 0xaa00ff, // Purple - magical
    size: 16,
    behavior: 'fast', // Teleports around
  },
  [EnemyType.SWARM]: {
    health: 15,
    speed: 280,
    damage: 5,
    attackRange: 300,
    attackSpeed: 400,
    moneyDrop: [5, 15],
    xpDrop: [3, 8],
    color: 0x888888, // Grey - small
    size: 8,
    behavior: 'chase', // Swarms in groups
  },
  [EnemyType.VAMPIRE]: {
    health: 150,
    speed: 180,
    damage: 20,
    attackRange: 400,
    attackSpeed: 1200,
    moneyDrop: [70, 140],
    xpDrop: [45, 80],
    color: 0x8b0000, // Dark red - bloodsucker
    size: 22,
    behavior: 'chase', // Drains health
  },
  [EnemyType.SPLITTER]: {
    health: 100,
    speed: 160,
    damage: 15,
    attackRange: 400,
    attackSpeed: 1000,
    moneyDrop: [40, 80],
    xpDrop: [30, 55],
    color: 0x00ff88, // Teal - divides
    size: 22,
    behavior: 'tank', // Splits into smaller enemies
  },
  [EnemyType.GHOST]: {
    health: 50,
    speed: 220,
    damage: 30,
    attackRange: 450,
    attackSpeed: 1500,
    moneyDrop: [55, 100],
    xpDrop: [35, 60],
    color: 0xccccff, // Pale blue - ethereal
    size: 18,
    behavior: 'fast', // Phases through walls
  },
}

export class AdvancedEnemy extends Phaser.Physics.Arcade.Sprite {
  public health: number
  public maxHealth: number
  private speed: number
  private damage: number
  private attackRange: number
  private attackSpeed: number
  private lastAttack = 0
  private moneyDrop: [number, number]
  private xpDrop: [number, number]
  private behavior: string
  private healthBar!: Phaser.GameObjects.Graphics
  private nameTag!: Phaser.GameObjects.Text
  private enemyType: EnemyType
  private enraged = false

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: EnemyType = EnemyType.GRUNT
  ) {
    super(scene, x, y, '')

    const stats = ENEMY_STATS[type]
    this.enemyType = type
    this.health = stats.health
    this.maxHealth = stats.health
    this.speed = stats.speed
    this.damage = stats.damage
    this.attackRange = stats.attackRange
    this.attackSpeed = stats.attackSpeed
    this.moneyDrop = stats.moneyDrop
    this.xpDrop = stats.xpDrop
    this.behavior = stats.behavior

    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Create visual
    this.createVisual(stats.color, stats.size)

    // Set up physics
    this.setCollideWorldBounds(true)
    this.setSize(stats.size * 2, stats.size * 2)

    // Create health bar
    this.healthBar = scene.add.graphics()

    // Create name tag
    const typeNames: Record<EnemyType, string> = {
      [EnemyType.GRUNT]: 'Grunt',
      [EnemyType.SCOUT]: 'Scout',
      [EnemyType.TANK]: 'Tank',
      [EnemyType.SNIPER]: 'Sniper',
      [EnemyType.BERSERKER]: 'Berserker',
      [EnemyType.BOSS]: '💀 BOSS 💀',
      [EnemyType.ASSASSIN]: '🗡️ Assassin',
      [EnemyType.BOMBER]: '💣 Bomber',
      [EnemyType.HEALER]: '💚 Healer',
      [EnemyType.SHIELDER]: '🛡️ Shielder',
      [EnemyType.TELEPORTER]: '🌀 Teleporter',
      [EnemyType.SWARM]: 'Swarm',
      [EnemyType.VAMPIRE]: '🧛 Vampire',
      [EnemyType.SPLITTER]: '⚡ Splitter',
      [EnemyType.GHOST]: '👻 Ghost',
    }

    this.nameTag = scene.add.text(x, y - 35, typeNames[type], {
      fontSize: type === EnemyType.BOSS ? '16px' : '10px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    this.updateHealthBar()
  }

  private createVisual(color: number, size: number) {
    const graphics = this.scene.make.graphics({ x: 0, y: 0 }, false)

    // Body
    graphics.fillStyle(color, 1)
    graphics.fillCircle(size, size, size)

    // Eyes (angry)
    graphics.fillStyle(0xffffff, 1)
    const eyeSize = Math.max(2, size / 5)
    graphics.fillCircle(size - eyeSize * 1.5, size - eyeSize, eyeSize)
    graphics.fillCircle(size + eyeSize * 1.5, size - eyeSize, eyeSize)

    // Pupils (red)
    graphics.fillStyle(0xff0000, 1)
    graphics.fillCircle(size - eyeSize * 1.5, size - eyeSize, eyeSize * 0.7)
    graphics.fillCircle(size + eyeSize * 1.5, size - eyeSize, eyeSize * 0.7)

    // Special markers for types
    if (this.enemyType === EnemyType.TANK) {
      // Armor lines
      graphics.lineStyle(2, 0x000000, 1)
      graphics.strokeCircle(size, size, size - 2)
      graphics.strokeCircle(size, size, size - 5)
    } else if (this.enemyType === EnemyType.SNIPER) {
      // Scope crosshair
      graphics.lineStyle(1, 0x00ff00, 0.8)
      graphics.lineBetween(size - 8, size, size + 8, size)
      graphics.lineBetween(size, size - 8, size, size + 8)
    } else if (this.enemyType === EnemyType.BERSERKER) {
      // Angry mouth
      graphics.lineStyle(2, 0x000000, 1)
      graphics.strokeCircle(size, size + eyeSize * 2, 4)
    } else if (this.enemyType === EnemyType.BOSS) {
      // Crown
      graphics.fillStyle(0xf1c40f, 1)
      graphics.fillTriangle(
        size - size / 2, size - size,
        size - size / 3, size - size * 1.3,
        size - size / 6, size - size
      )
      graphics.fillTriangle(
        size - size / 6, size - size,
        size, size - size * 1.5,
        size + size / 6, size - size
      )
      graphics.fillTriangle(
        size + size / 6, size - size,
        size + size / 3, size - size * 1.3,
        size + size / 2, size - size
      )
    }

    const textureName = `enemy_${this.enemyType}`
    graphics.generateTexture(textureName, size * 2, size * 2)
    graphics.destroy()

    this.setTexture(textureName)
  }

  update(player: Player, weaponSystem?: any) {
    if (!player || !player.active) return

    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      player.x,
      player.y
    )

    // Behavior logic
    switch (this.behavior) {
      case 'chase':
        this.chasePlayer(player, distance)
        break
      case 'fast':
        this.fastChasePlayer(player, distance)
        break
      case 'tank':
        this.slowChasePlayer(player, distance)
        break
      case 'ranged':
        this.rangedBehavior(player, distance, weaponSystem)
        break
      case 'berserker':
        this.berserkerBehavior(player, distance)
        break
    }

    // Update health bar and name tag
    this.updateHealthBar()
    this.nameTag.setPosition(this.x, this.y - (this.enemyType === EnemyType.BOSS ? 50 : 35))
  }

  private chasePlayer(player: Player, distance: number) {
    if (distance < this.attackRange) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
      this.setVelocity(
        Math.cos(angle) * this.speed,
        Math.sin(angle) * this.speed
      )
      this.setRotation(angle + Math.PI / 2)
    } else {
      this.setVelocity(0, 0)
    }
  }

  private fastChasePlayer(player: Player, distance: number) {
    // Scouts dart in and out
    if (distance < this.attackRange && distance > 100) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
      this.setVelocity(
        Math.cos(angle) * this.speed,
        Math.sin(angle) * this.speed
      )
      this.setRotation(angle + Math.PI / 2)
    } else if (distance <= 100) {
      // Too close, back away
      const angle = Phaser.Math.Angle.Between(player.x, player.y, this.x, this.y)
      this.setVelocity(
        Math.cos(angle) * this.speed * 0.7,
        Math.sin(angle) * this.speed * 0.7
      )
      this.setRotation(angle + Math.PI / 2)
    } else {
      this.setVelocity(0, 0)
    }
  }

  private slowChasePlayer(player: Player, distance: number) {
    if (distance < this.attackRange) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
      this.setVelocity(
        Math.cos(angle) * this.speed,
        Math.sin(angle) * this.speed
      )
      this.setRotation(angle + Math.PI / 2)
    } else {
      this.setVelocity(0, 0)
    }
  }

  private rangedBehavior(player: Player, distance: number, weaponSystem: any) {
    // Keep distance and shoot
    if (distance < 400) {
      // Too close, back away
      const angle = Phaser.Math.Angle.Between(player.x, player.y, this.x, this.y)
      this.setVelocity(
        Math.cos(angle) * this.speed,
        Math.sin(angle) * this.speed
      )
      this.setRotation(angle + Math.PI / 2)
    } else if (distance < this.attackRange) {
      this.setVelocity(0, 0)
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
      this.setRotation(angle + Math.PI / 2)

      // Shoot at player
      if (weaponSystem && this.scene.time.now - this.lastAttack > this.attackSpeed) {
        this.lastAttack = this.scene.time.now
        weaponSystem.fireEnemyBullet(this.x, this.y, angle, this.damage)
      }
    }
  }

  private berserkerBehavior(player: Player, distance: number) {
    // Gets faster as health decreases
    const healthPercent = this.health / this.maxHealth
    if (healthPercent < 0.5 && !this.enraged) {
      this.enraged = true
      this.speed *= 1.5
      this.setTint(0xff0000)
    }

    if (distance < this.attackRange) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
      this.setVelocity(
        Math.cos(angle) * this.speed,
        Math.sin(angle) * this.speed
      )
      this.setRotation(angle + Math.PI / 2)
    }
  }

  takeDamage(amount: number): boolean {
    this.health -= amount
    if (this.health < 0) this.health = 0

    // Visual feedback
    this.setTint(0xffffff)
    this.scene.time.delayedCall(100, () => {
      if (this.active) {
        if (this.enraged) {
          this.setTint(0xff0000)
        } else {
          this.clearTint()
        }
      }
    })

    this.updateHealthBar()

    // Return true if killed
    return this.health <= 0
  }

  isDead(): boolean {
    return this.health <= 0
  }

  getMoneyDrop(): number {
    return Phaser.Math.Between(this.moneyDrop[0], this.moneyDrop[1])
  }

  getXPDrop(): number {
    return Phaser.Math.Between(this.xpDrop[0], this.xpDrop[1])
  }

  getDamage(): number {
    return this.damage
  }

  isBoss(): boolean {
    return this.enemyType === EnemyType.BOSS
  }

  private updateHealthBar() {
    this.healthBar.clear()

    if (this.health > 0 && this.health < this.maxHealth) {
      const barWidth = this.enemyType === EnemyType.BOSS ? 80 : 40
      const barHeight = this.enemyType === EnemyType.BOSS ? 6 : 4
      const yOffset = this.enemyType === EnemyType.BOSS ? 35 : 25

      // Background
      this.healthBar.fillStyle(0x000000, 0.5)
      this.healthBar.fillRect(
        this.x - barWidth / 2,
        this.y - yOffset,
        barWidth,
        barHeight
      )

      // Health
      const healthPercent = this.health / this.maxHealth
      let healthColor = 0xe74c3c
      if (healthPercent > 0.6) healthColor = 0x2ecc71
      else if (healthPercent > 0.3) healthColor = 0xf39c12

      this.healthBar.fillStyle(healthColor, 1)
      this.healthBar.fillRect(
        this.x - barWidth / 2,
        this.y - yOffset,
        barWidth * healthPercent,
        barHeight
      )
    }
  }

  destroy(fromScene?: boolean) {
    this.healthBar.destroy()
    this.nameTag.destroy()
    super.destroy(fromScene)
  }
}

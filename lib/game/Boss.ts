import Phaser from 'phaser'
import Player from './Player'
import Enemy from './Enemy'

export type BossType = 'tank' | 'speed' | 'sniper' | 'healer' | 'mega'

export interface BossConfig {
  type: BossType
  name: string
  health: number
  speed: number
  size: number
  damage: number
  color: number
  icon: string
  specialAbility: string
  moneyDrop: number
  xpDrop: number
}

export const BOSS_CONFIGS: Record<BossType, BossConfig> = {
  tank: {
    type: 'tank',
    name: 'IRON GOLEM',
    health: 5000,
    speed: 50,
    size: 64,
    damage: 50,
    color: 0x7f8c8d,
    icon: '🛡️',
    specialAbility: 'Damage Reduction',
    moneyDrop: 1000,
    xpDrop: 500
  },
  speed: {
    type: 'speed',
    name: 'SHADOW DEMON',
    health: 2000,
    speed: 200,
    size: 48,
    damage: 30,
    color: 0x8e44ad,
    icon: '👹',
    specialAbility: 'Lightning Fast',
    moneyDrop: 800,
    xpDrop: 400
  },
  sniper: {
    type: 'sniper',
    name: 'DEATH ARCHER',
    health: 3000,
    speed: 60,
    size: 52,
    damage: 100,
    color: 0x16a085,
    icon: '🏹',
    specialAbility: 'Long Range Shots',
    moneyDrop: 1200,
    xpDrop: 600
  },
  healer: {
    type: 'healer',
    name: 'PLAGUE DOCTOR',
    health: 4000,
    speed: 70,
    size: 56,
    damage: 40,
    color: 0x27ae60,
    icon: '💉',
    specialAbility: 'Heals Nearby Enemies',
    moneyDrop: 1500,
    xpDrop: 700
  },
  mega: {
    type: 'mega',
    name: 'CRIME LORD',
    health: 10000,
    speed: 80,
    size: 80,
    damage: 75,
    color: 0xc0392b,
    icon: '👑',
    specialAbility: 'Summons Minions',
    moneyDrop: 5000,
    xpDrop: 2000
  }
}

export default class Boss extends Phaser.Physics.Arcade.Sprite {
  private health: number
  private maxHealth: number
  private speed: number
  private attackRange = 500
  private healthBar!: Phaser.GameObjects.Graphics
  private nameText!: Phaser.GameObjects.Text
  private bossConfig: BossConfig
  private specialAbilityTimer = 0

  constructor(scene: Phaser.Scene, x: number, y: number, bossType: BossType) {
    super(scene, x, y, '')

    this.bossConfig = BOSS_CONFIGS[bossType]
    this.health = this.bossConfig.health
    this.maxHealth = this.bossConfig.health
    this.speed = this.bossConfig.speed

    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Create boss visual
    this.createVisual()

    // Set up physics
    this.setCollideWorldBounds(true)
    this.setSize(this.bossConfig.size, this.bossConfig.size)

    // Create health bar
    this.healthBar = scene.add.graphics()

    // Create name text
    this.nameText = scene.add.text(0, 0, `${this.bossConfig.icon} ${this.bossConfig.name}`, {
      fontSize: '24px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(1000)

    this.updateHealthBar()

    // Boss entrance effect
    scene.cameras.main.shake(500, 0.01)
    scene.cameras.main.flash(500, 255, 0, 0)

    // Announce boss spawn
    this.announceBoss()
  }

  private createVisual() {
    const graphics = this.scene.make.graphics({ x: 0, y: 0 }, false)
    const size = this.bossConfig.size

    // Body (boss color with glow)
    graphics.fillStyle(this.bossConfig.color, 1)
    graphics.fillCircle(size / 2, size / 2, size / 2)

    // Glow effect
    graphics.lineStyle(4, this.bossConfig.color, 0.5)
    graphics.strokeCircle(size / 2, size / 2, size / 2 + 4)
    graphics.strokeCircle(size / 2, size / 2, size / 2 + 8)

    // Eyes (glowing)
    graphics.fillStyle(0xff0000, 1)
    graphics.fillCircle(size / 3, size / 3, 6)
    graphics.fillCircle(size * 2 / 3, size / 3, 6)

    // Crown for mega boss
    if (this.bossConfig.type === 'mega') {
      graphics.fillStyle(0xf1c40f, 1)
      for (let i = 0; i < 5; i++) {
        graphics.fillTriangle(
          size / 6 + i * size / 6, size / 6,
          size / 6 + i * size / 6 - 3, size / 4,
          size / 6 + i * size / 6 + 3, size / 4
        )
      }
    }

    graphics.generateTexture(`boss_${this.bossConfig.type}`, size, size)
    graphics.destroy()

    this.setTexture(`boss_${this.bossConfig.type}`)
  }

  private announceBoss() {
    const screenWidth = this.scene.scale.width
    const screenHeight = this.scene.scale.height

    const announcement = this.scene.add.text(
      screenWidth / 2,
      screenHeight / 2,
      `⚠️ BOSS SPAWNED ⚠️\n${this.bossConfig.icon} ${this.bossConfig.name}`,
      {
        fontSize: '48px',
        color: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center'
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(10000)

    this.scene.tweens.add({
      targets: announcement,
      scale: 1.5,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => announcement.destroy()
    })
  }

  update(player: Player, delta: number) {
    if (!player || !player.active) return

    // Calculate distance to player
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      player.x,
      player.y
    )

    // Chase player if in range
    if (distance < this.attackRange) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)

      this.setVelocity(
        Math.cos(angle) * this.speed,
        Math.sin(angle) * this.speed
      )

      // Rotate to face player
      this.setRotation(angle + Math.PI / 2)
    } else {
      this.setVelocity(0, 0)
    }

    // Update special ability
    this.specialAbilityTimer += delta
    if (this.specialAbilityTimer > 3000) {
      this.useSpecialAbility(player)
      this.specialAbilityTimer = 0
    }

    this.updateHealthBar()
    this.updateNameText()
  }

  private useSpecialAbility(player: Player) {
    switch (this.bossConfig.type) {
      case 'tank':
        // Flash to show damage reduction active
        this.setTint(0xffffff)
        this.scene.time.delayedCall(200, () => this.clearTint())
        break

      case 'speed':
        // Dash toward player
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
        this.setVelocity(
          Math.cos(angle) * this.speed * 3,
          Math.sin(angle) * this.speed * 3
        )
        this.scene.time.delayedCall(500, () => {
          this.setVelocity(
            Math.cos(angle) * this.speed,
            Math.sin(angle) * this.speed
          )
        })
        break

      case 'sniper':
        // Visual indicator of charging shot
        this.setTint(0xff0000)
        this.scene.time.delayedCall(300, () => this.clearTint())
        break

      case 'healer':
        // Heal self
        this.heal(50)
        // Create heal effect
        const healEffect = this.scene.add.circle(this.x, this.y, this.bossConfig.size, 0x2ecc71, 0.5)
        this.scene.tweens.add({
          targets: healEffect,
          scale: 2,
          alpha: 0,
          duration: 500,
          onComplete: () => healEffect.destroy()
        })
        break

      case 'mega':
        // Create explosion effect
        this.scene.cameras.main.shake(200, 0.005)
        break
    }
  }

  takeDamage(amount: number): boolean {
    // Tank boss has damage reduction
    if (this.bossConfig.type === 'tank') {
      amount *= 0.7 // 30% damage reduction
    }

    this.health -= amount
    this.health = Math.max(0, this.health)

    // Flash white
    this.setTint(0xffffff)
    this.scene.time.delayedCall(100, () => this.clearTint())

    this.updateHealthBar()

    if (this.health <= 0) {
      this.die()
      return true
    }

    return false
  }

  heal(amount: number) {
    this.health = Math.min(this.maxHealth, this.health + amount)
    this.updateHealthBar()
  }

  private updateHealthBar() {
    this.healthBar.clear()

    const barWidth = this.bossConfig.size + 20
    const barHeight = 8
    const barX = this.x - barWidth / 2
    const barY = this.y - this.bossConfig.size / 2 - 20

    // Background
    this.healthBar.fillStyle(0x000000, 0.8)
    this.healthBar.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4)

    // Health
    const healthPercent = this.health / this.maxHealth
    const healthColor = healthPercent > 0.5 ? 0xff0000 : 0xff0000
    this.healthBar.fillStyle(healthColor, 1)
    this.healthBar.fillRect(barX, barY, barWidth * healthPercent, barHeight)

    // Border
    this.healthBar.lineStyle(2, 0xffffff, 1)
    this.healthBar.strokeRect(barX, barY, barWidth, barHeight)
  }

  private updateNameText() {
    this.nameText.setPosition(this.x, this.y - this.bossConfig.size / 2 - 40)
  }

  private die() {
    // Death explosion
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2
      const particle = this.scene.add.circle(
        this.x,
        this.y,
        8,
        this.bossConfig.color
      )

      this.scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(angle) * 200,
        y: this.y + Math.sin(angle) * 200,
        alpha: 0,
        scale: 0,
        duration: 1000,
        onComplete: () => particle.destroy()
      })
    }

    // Camera effects
    this.scene.cameras.main.shake(800, 0.02)
    this.scene.cameras.main.flash(800, 255, 215, 0)

    // Emit boss death event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bossKilled', {
        detail: {
          bossType: this.bossConfig.type,
          name: this.bossConfig.name,
          money: this.bossConfig.moneyDrop,
          xp: this.bossConfig.xpDrop
        }
      }))
    }

    this.healthBar.destroy()
    this.nameText.destroy()
    this.destroy()
  }

  getMoneyDrop(): number {
    return this.bossConfig.moneyDrop
  }

  getXPDrop(): number {
    return this.bossConfig.xpDrop
  }

  getDamage(): number {
    return this.bossConfig.damage
  }

  getBossType(): BossType {
    return this.bossConfig.type
  }

  getHealth(): number {
    return this.health
  }

  getMaxHealth(): number {
    return this.maxHealth
  }
}

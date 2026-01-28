import Phaser from 'phaser'
import Player from './Player'

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  private health = 100
  private maxHealth = 100
  private speed = 80
  private attackRange = 300
  private healthBar!: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, '')

    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Create enemy visual
    this.createVisual()

    // Set up physics
    this.setCollideWorldBounds(true)
    this.setSize(32, 32)

    // Create health bar
    this.healthBar = scene.add.graphics()
    this.updateHealthBar()
  }

  private createVisual() {
    const graphics = this.scene.make.graphics({ x: 0, y: 0 }, false)

    // Body (red)
    graphics.fillStyle(0xe74c3c, 1)
    graphics.fillCircle(16, 16, 16)

    // Eyes (angry)
    graphics.fillStyle(0xffffff, 1)
    graphics.fillCircle(12, 12, 3)
    graphics.fillCircle(20, 12, 3)

    // Pupils (red)
    graphics.fillStyle(0xff0000, 1)
    graphics.fillCircle(12, 12, 2)
    graphics.fillCircle(20, 12, 2)

    // Mouth (frown)
    graphics.lineStyle(2, 0x000000, 1)
    graphics.beginPath()
    graphics.arc(16, 20, 6, 0, Math.PI, false)
    graphics.strokePath()

    graphics.generateTexture('enemy', 32, 32)
    graphics.destroy()

    this.setTexture('enemy')
  }

  update(player: Player) {
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

    // Update health bar position
    this.updateHealthBar()
  }

  takeDamage(amount: number) {
    this.health -= amount
    if (this.health < 0) this.health = 0

    // Visual feedback
    this.setTint(0xffffff)
    this.scene.time.delayedCall(100, () => {
      if (this.active) {
        this.clearTint()
      }
    })

    this.updateHealthBar()
  }

  isDead(): boolean {
    return this.health <= 0
  }

  private updateHealthBar() {
    this.healthBar.clear()

    if (this.health > 0 && this.health < this.maxHealth) {
      const barWidth = 40
      const barHeight = 4

      // Background
      this.healthBar.fillStyle(0x000000, 0.5)
      this.healthBar.fillRect(
        this.x - barWidth / 2,
        this.y - 25,
        barWidth,
        barHeight
      )

      // Health
      const healthPercent = this.health / this.maxHealth
      this.healthBar.fillStyle(0xe74c3c, 1)
      this.healthBar.fillRect(
        this.x - barWidth / 2,
        this.y - 25,
        barWidth * healthPercent,
        barHeight
      )
    }
  }

  destroy(fromScene?: boolean) {
    this.healthBar.destroy()
    super.destroy(fromScene)
  }
}

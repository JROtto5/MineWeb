import Phaser from 'phaser'
import { WeaponSystem, WeaponType } from './Weapon'

export default class Player extends Phaser.Physics.Arcade.Sprite {
  public health = 100
  public maxHealth = 100
  public money = 0
  public xp = 0
  public level = 1

  public currentAmmo = 30
  public maxAmmo = 30

  private speed = 200
  private currentWeapon = 0
  private weaponSystem: WeaponSystem

  private weapons: WeaponType[] = [
    { name: 'Pistol', damage: 20, fireRate: 300, ammo: 30, maxAmmo: 30 },
    { name: 'SMG', damage: 15, fireRate: 100, ammo: 50, maxAmmo: 50 },
    { name: 'Shotgun', damage: 40, fireRate: 600, ammo: 8, maxAmmo: 8 },
  ]

  private lastShot = 0
  private aimLine!: Phaser.GameObjects.Line

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    weaponSystem: WeaponSystem
  ) {
    super(scene, x, y, '')

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.weaponSystem = weaponSystem

    // Create player visual
    this.createVisual()

    // Set up physics
    this.setCollideWorldBounds(true)
    this.setSize(32, 32)

    // Create aim line
    this.aimLine = scene.add.line(0, 0, 0, 0, 0, 0, 0xff0000, 0.3)
    this.aimLine.setOrigin(0, 0)
    this.aimLine.setLineWidth(2)
  }

  private createVisual() {
    const graphics = this.scene.make.graphics({ x: 0, y: 0 }, false)

    // Body (blue)
    graphics.fillStyle(0x3498db, 1)
    graphics.fillCircle(16, 16, 16)

    // Eyes
    graphics.fillStyle(0xffffff, 1)
    graphics.fillCircle(12, 12, 3)
    graphics.fillCircle(20, 12, 3)

    // Pupils
    graphics.fillStyle(0x000000, 1)
    graphics.fillCircle(12, 12, 1.5)
    graphics.fillCircle(20, 12, 1.5)

    graphics.generateTexture('player', 32, 32)
    graphics.destroy()

    this.setTexture('player')
  }

  move(directionX: number, directionY: number) {
    // Normalize diagonal movement
    if (directionX !== 0 && directionY !== 0) {
      directionX *= 0.707
      directionY *= 0.707
    }

    this.setVelocity(directionX * this.speed, directionY * this.speed)

    // Update aim line
    const pointer = this.scene.input.activePointer
    const worldX = pointer.worldX
    const worldY = pointer.worldY

    this.aimLine.setTo(this.x, this.y, worldX, worldY)

    // Rotate player to face cursor
    const angle = Phaser.Math.Angle.Between(this.x, this.y, worldX, worldY)
    this.setRotation(angle + Math.PI / 2)
  }

  shoot(targetX: number, targetY: number) {
    const currentTime = this.scene.time.now
    const weapon = this.weapons[this.currentWeapon]

    // Check fire rate
    if (currentTime - this.lastShot < weapon.fireRate) {
      return
    }

    // Check ammo
    if (this.currentAmmo <= 0) {
      return
    }

    this.lastShot = currentTime
    this.currentAmmo--

    // Calculate direction
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY)

    // Shotgun fires multiple pellets
    if (weapon.name === 'Shotgun') {
      for (let i = 0; i < 5; i++) {
        const spread = (Math.random() - 0.5) * 0.3
        this.weaponSystem.fireBullet(
          this.x,
          this.y,
          angle + spread,
          weapon.damage
        )
      }
    } else {
      this.weaponSystem.fireBullet(this.x, this.y, angle, weapon.damage)
    }

    // Visual feedback
    this.scene.cameras.main.shake(50, 0.002)
  }

  reload() {
    const weapon = this.weapons[this.currentWeapon]

    if (this.currentAmmo < weapon.maxAmmo) {
      this.currentAmmo = weapon.maxAmmo
      this.maxAmmo = weapon.maxAmmo

      // Message
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gameEvent', {
          detail: {
            type: 'message',
            data: { text: 'Reloaded!', type: 'success' }
          }
        }))
      }
    }
  }

  switchWeapon(index: number) {
    if (index >= 0 && index < this.weapons.length) {
      this.currentWeapon = index
      const weapon = this.weapons[index]

      this.currentAmmo = weapon.ammo
      this.maxAmmo = weapon.maxAmmo

      // Message
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gameEvent', {
          detail: {
            type: 'message',
            data: { text: `Switched to ${weapon.name}`, type: 'success' }
          }
        }))
      }
    }
  }

  getCurrentWeaponName(): string {
    return this.weapons[this.currentWeapon].name
  }

  getCurrentWeaponDamage(): number {
    return this.weapons[this.currentWeapon].damage
  }

  takeDamage(amount: number) {
    this.health -= amount
    if (this.health < 0) this.health = 0

    // Visual feedback
    this.setTint(0xff0000)
    this.scene.time.delayedCall(100, () => {
      this.clearTint()
    })

    this.scene.cameras.main.shake(200, 0.01)
  }

  addMoney(amount: number) {
    this.money += amount
  }

  addXP(amount: number) {
    this.xp += amount

    // Level up every 100 XP
    const newLevel = Math.floor(this.xp / 100) + 1
    if (newLevel > this.level) {
      this.level = newLevel
      this.maxHealth += 20
      this.health = this.maxHealth

      // Message
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gameEvent', {
          detail: {
            type: 'message',
            data: { text: `Level Up! Now level ${this.level}`, type: 'success' }
          }
        }))
      }
    }
  }

  isDead(): boolean {
    return this.health <= 0
  }
}

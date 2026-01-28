import Phaser from 'phaser'
import { WeaponSystem, WeaponType } from './Weapon'
import { SkillTreeManager } from './SkillTree'

export default class Player extends Phaser.Physics.Arcade.Sprite {
  public health = 100
  public maxHealth = 100
  public money = 0
  public xp = 0
  public level = 1

  public currentAmmo = 30
  public maxAmmo = 30
  public skillPoints = 0

  private baseSpeed = 200
  private speed = 200
  private currentWeapon = 0
  private weaponSystem: WeaponSystem
  public skillTree: SkillTreeManager

  private weapons: WeaponType[] = [
    { name: 'Pistol', damage: 20, fireRate: 300, ammo: 30, maxAmmo: 30 },
    { name: 'SMG', damage: 15, fireRate: 100, ammo: 50, maxAmmo: 50 },
    { name: 'Shotgun', damage: 40, fireRate: 600, ammo: 8, maxAmmo: 8 },
  ]

  // Power-up states
  private damageBoostActive = false
  private damageBoostEnd = 0
  private speedBoostActive = false
  private speedBoostEnd = 0
  private invincibilityActive = false
  private invincibilityEnd = 0
  private multiShotActive = false
  private multiShotEnd = 0
  private rapidFireActive = false
  private rapidFireEnd = 0

  private lastShot = 0
  private aimLine!: Phaser.GameObjects.Line
  private powerUpIndicators: Phaser.GameObjects.Container

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
    this.skillTree = new SkillTreeManager()

    // Create player visual
    this.createVisual()

    // Set up physics
    this.setCollideWorldBounds(true)
    this.setSize(32, 32)

    // Create aim line
    this.aimLine = scene.add.line(0, 0, 0, 0, 0, 0, 0xff0000, 0.3)
    this.aimLine.setOrigin(0, 0)
    this.aimLine.setLineWidth(2)

    // Power-up indicators container
    this.powerUpIndicators = scene.add.container(0, 0).setDepth(100)
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
    // Update power-ups
    this.updatePowerUps()

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

  isDead(): boolean {
    return this.health <= 0
  }

  // POWER-UP METHODS
  heal(amount: number) {
    this.health = Math.min(this.maxHealth, this.health + amount)
  }

  addAmmo(amount: number) {
    const weapon = this.weapons[this.currentWeapon]
    this.currentAmmo = Math.min(weapon.maxAmmo, this.currentAmmo + amount)
  }

  activateDamageBoost(duration: number) {
    this.damageBoostActive = true
    this.damageBoostEnd = this.scene.time.now + duration
    this.setTint(0xff6b6b)
  }

  activateSpeedBoost(duration: number) {
    this.speedBoostActive = true
    this.speedBoostEnd = this.scene.time.now + duration
    this.speed = this.baseSpeed * 1.5
  }

  activateInvincibility(duration: number) {
    this.invincibilityActive = true
    this.invincibilityEnd = this.scene.time.now + duration
    this.setAlpha(0.7)
  }

  activateMultiShot(duration: number) {
    this.multiShotActive = true
    this.multiShotEnd = this.scene.time.now + duration
  }

  activateRapidFire(duration: number) {
    this.rapidFireActive = true
    this.rapidFireEnd = this.scene.time.now + duration
  }

  updatePowerUps() {
    const currentTime = this.scene.time.now

    // Check damage boost
    if (this.damageBoostActive && currentTime >= this.damageBoostEnd) {
      this.damageBoostActive = false
      if (!this.invincibilityActive) this.clearTint()
    }

    // Check speed boost
    if (this.speedBoostActive && currentTime >= this.speedBoostEnd) {
      this.speedBoostActive = false
      this.recalculateSpeed()
    }

    // Check invincibility
    if (this.invincibilityActive && currentTime >= this.invincibilityEnd) {
      this.invincibilityActive = false
      this.setAlpha(1)
    }

    // Check multi-shot
    if (this.multiShotActive && currentTime >= this.multiShotEnd) {
      this.multiShotActive = false
    }

    // Check rapid fire
    if (this.rapidFireActive && currentTime >= this.rapidFireEnd) {
      this.rapidFireActive = false
    }
  }

  isInvincible(): boolean {
    return this.invincibilityActive
  }

  // SKILL TREE INTEGRATION
  applySkillBonuses() {
    // Update max health
    const healthBonus = this.skillTree.getTotalBonus('health')
    this.maxHealth = 100 + healthBonus

    // Update speed
    this.recalculateSpeed()
  }

  private recalculateSpeed() {
    const speedBonus = this.skillTree.getTotalBonus('speed')
    this.baseSpeed = 200 * (1 + speedBonus)

    if (this.speedBoostActive) {
      this.speed = this.baseSpeed * 1.5
    } else {
      this.speed = this.baseSpeed
    }
  }

  getCurrentDamage(): number {
    let damage = this.weapons[this.currentWeapon].damage

    // Apply skill bonus
    const damageBonus = this.skillTree.getTotalBonus('damage')
    damage *= (1 + damageBonus)

    // Apply power-up bonus
    if (this.damageBoostActive) {
      damage *= 2
    }

    // Critical hit chance
    const critChance = this.skillTree.getTotalBonus('critChance')
    if (Math.random() < critChance) {
      damage *= 3 // Critical hit!
      this.emitCriticalHit()
    }

    return Math.floor(damage)
  }

  getModifiedFireRate(): number {
    let fireRate = this.weapons[this.currentWeapon].fireRate

    // Apply skill bonus
    const fireRateBonus = this.skillTree.getTotalBonus('fireRate')
    fireRate *= (1 - fireRateBonus)

    // Apply rapid fire power-up
    if (this.rapidFireActive) {
      fireRate *= 0.5
    }

    return fireRate
  }

  applyLuckBonus(amount: number): number {
    const luckBonus = this.skillTree.getTotalBonus('luck')
    return Math.floor(amount * (1 + luckBonus))
  }

  private emitCriticalHit() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gameEvent', {
        detail: {
          type: 'message',
          data: { text: '💥 CRITICAL HIT! 💥', type: 'warning' }
        }
      }))
    }
  }

  // Override existing methods to use new damage system
  getCurrentWeaponDamage(): number {
    return this.getCurrentDamage()
  }

  // Override shoot method for multi-shot
  shoot(targetX: number, targetY: number) {
    const currentTime = this.scene.time.now
    const weapon = this.weapons[this.currentWeapon]
    const modifiedFireRate = this.getModifiedFireRate()

    // Check fire rate
    if (currentTime - this.lastShot < modifiedFireRate) {
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
    const damage = this.getCurrentDamage()

    // Multi-shot power-up
    if (this.multiShotActive) {
      // Fire 3 shots in a spread
      for (let i = -1; i <= 1; i++) {
        const spreadAngle = angle + (i * 0.2)
        this.weaponSystem.fireBullet(this.x, this.y, spreadAngle, damage)
      }
    }
    // Shotgun fires multiple pellets
    else if (weapon.name === 'Shotgun') {
      for (let i = 0; i < 5; i++) {
        const spread = (Math.random() - 0.5) * 0.3
        this.weaponSystem.fireBullet(this.x, this.y, angle + spread, damage)
      }
    }
    // Normal shot
    else {
      this.weaponSystem.fireBullet(this.x, this.y, angle, damage)
    }

    // Visual feedback
    this.scene.cameras.main.shake(50, 0.002)
  }

  // Override takeDamage for invincibility
  takeDamage(amount: number) {
    if (this.invincibilityActive) return

    this.health -= amount
    if (this.health < 0) this.health = 0

    // Visual feedback
    this.setTint(0xff0000)
    this.scene.time.delayedCall(100, () => {
      if (this.damageBoostActive) {
        this.setTint(0xff6b6b)
      } else {
        this.clearTint()
      }
    })

    this.scene.cameras.main.shake(200, 0.01)
  }

  // Override addXP for skill points
  addXP(amount: number) {
    // Apply luck bonus
    amount = this.applyLuckBonus(amount)

    this.xp += amount

    // Level up every 100 XP
    const newLevel = Math.floor(this.xp / 100) + 1
    if (newLevel > this.level) {
      this.level = newLevel
      this.skillPoints++ // Gain 1 skill point per level
      this.applySkillBonuses()
      this.health = this.maxHealth

      // Message
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gameEvent', {
          detail: {
            type: 'message',
            data: { text: `Level Up! Now level ${this.level} (+1 Skill Point)`, type: 'success' }
          }
        }))
      }
    }
  }

  // Override addMoney for luck bonus
  addMoney(amount: number) {
    if (amount > 0) {
      amount = this.applyLuckBonus(amount)
    }
    this.money += amount
  }

  destroy(fromScene?: boolean) {
    this.aimLine.destroy()
    this.powerUpIndicators.destroy()
    super.destroy(fromScene)
  }
}

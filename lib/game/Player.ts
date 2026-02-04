import Phaser from 'phaser'
import { WeaponSystem, WeaponType } from './Weapon'
import { SkillTreeManager } from './SkillTree'
import { ShopManager } from './ShopSystem'

export default class Player extends Phaser.Physics.Arcade.Sprite {
  public health = 100
  public maxHealth = 100
  public money = 0
  public xp = 0
  public level = 1

  public currentAmmo = 30
  public maxAmmo = 30
  public skillPoints = 0

  private baseSpeed = 250 // FAST: Increased from 200
  private speed = 250
  private readonly MAX_SPEED = 800 // Absolute max speed cap to prevent velocity bugs
  private currentWeapon = 2 // ROGUELIKE: Always shotgun!
  private weaponSystem: WeaponSystem
  public skillTree: SkillTreeManager
  private shopManager: ShopManager | null = null

  // Shop bonuses (cached for performance) - public for item effects
  public shopDamageBonus = 0
  public shopFireRateBonus = 0
  public shopAmmoBonus = 0
  public shopHealthBonus = 0
  public shopSpeedBonus = 0
  public shopCritBonus = 0
  public shopMoneyBonus = 0
  public shopXPBonus = 0

  // Cross-game synergy bonus from Dot Clicker
  public clickerSynergyBonus = 0

  // Abilities
  private hasDash = false
  private hasShield = false
  private hasTimeSlow = false
  private shieldHits = 0
  private timeSlowActive = false
  private timeSlowEnd = 0
  private dashCooldown = 0
  private shieldCooldown = 0
  private timeSlowCooldown = 0

  // NEW ABILITIES (Keys 4-9)
  private hasExplosiveRounds = false
  private explosiveRoundsActive = false
  private explosiveRoundsShots = 0
  private explosiveRoundsCooldown = 0

  private hasBerserk = false
  private berserkActive = false
  private berserkEnd = 0
  private berserkCooldown = 0

  private hasTeleport = false
  private teleportCooldown = 0

  private hasLifeDrain = false
  private lifeDrainActive = false
  private lifeDrainEnd = 0
  private lifeDrainCooldown = 0

  private hasBulletTime = false
  private bulletTimeActive = false
  private bulletTimeEnd = 0
  private bulletTimeCooldown = 0

  private hasOrbitalStrike = false
  private orbitalStrikeCooldown = 0

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

    // Update abilities
    this.updateAbilities()

    // Safety check: clamp speed to prevent runaway velocity
    if (this.speed > this.MAX_SPEED || !isFinite(this.speed)) {
      this.speed = this.MAX_SPEED
    }
    if (this.speed < 0) {
      this.speed = this.baseSpeed
    }

    // Normalize diagonal movement
    if (directionX !== 0 && directionY !== 0) {
      directionX *= 0.707
      directionY *= 0.707
    }

    const velocityX = directionX * this.speed
    const velocityY = directionY * this.speed

    // Safety check: prevent NaN or Infinity velocities
    if (!isFinite(velocityX) || !isFinite(velocityY)) {
      this.setVelocity(0, 0)
      return
    }

    this.setVelocity(velocityX, velocityY)

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
    // ROGUELIKE: Weapon switching disabled - always shotgun!
    return
  }

  getCurrentWeaponName(): string {
    return this.weapons[this.currentWeapon].name
  }

  getCurrentWeapon(): number {
    return this.currentWeapon
  }

  setCurrentWeapon(weaponIndex: number) {
    this.currentWeapon = weaponIndex
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
    this.maxHealth = 100 + healthBonus + this.shopHealthBonus

    // Update speed
    this.recalculateSpeed()
  }

  // CROSS-GAME SYNERGY: Load bonus from Dot Clicker
  loadClickerSynergy() {
    try {
      if (typeof localStorage !== 'undefined') {
        const clickerSave = localStorage.getItem('dotclicker_save')
        if (clickerSave) {
          const save = JSON.parse(clickerSave)
          const prestiges = save.totalPrestiges || 0
          // 5% damage bonus per prestige
          this.clickerSynergyBonus = prestiges * 0.05
        }
      }
    } catch (e) {
      console.warn('Failed to load clicker synergy:', e)
    }
  }

  // SHOP SYSTEM INTEGRATION
  applyShopBonuses(shopManager: ShopManager) {
    this.shopManager = shopManager

    // Cache bonuses for performance
    this.shopDamageBonus = shopManager.getBonus('damage')
    this.shopFireRateBonus = shopManager.getBonus('fireRate')
    this.shopAmmoBonus = shopManager.getBonus('ammo')
    this.shopHealthBonus = shopManager.getBonus('health')
    this.shopSpeedBonus = shopManager.getBonus('speed')
    this.shopCritBonus = shopManager.getBonus('critChance')
    this.shopMoneyBonus = shopManager.getBonus('moneyBoost')
    this.shopXPBonus = shopManager.getBonus('xpBoost')

    // Abilities (Keys 1-3)
    this.hasDash = shopManager.hasAbility('dash')
    this.hasShield = shopManager.hasAbility('shield')
    this.hasTimeSlow = shopManager.hasAbility('timeSlow')

    // ROGUELIKE: Advanced Abilities (Keys 4-9)
    this.hasExplosiveRounds = shopManager.hasAbility('explosiveRounds')
    this.hasBerserk = shopManager.hasAbility('berserk')
    this.hasTeleport = shopManager.hasAbility('teleport')
    this.hasLifeDrain = shopManager.hasAbility('lifeDrain')
    this.hasBulletTime = shopManager.hasAbility('bulletTime')
    this.hasOrbitalStrike = shopManager.hasAbility('orbitalStrike')

    // Update stats
    this.applySkillBonuses()

    // Update weapon max ammo
    this.weapons.forEach(weapon => {
      weapon.maxAmmo += this.shopAmmoBonus
    })
  }

  private recalculateSpeed() {
    const skillSpeedBonus = this.skillTree.getTotalBonus('speed')
    // Cap the bonus multiplier to prevent extreme speeds
    const totalBonus = Math.min(skillSpeedBonus + this.shopSpeedBonus, 2.0) // Max 200% bonus
    this.baseSpeed = 200 * (1 + totalBonus)

    if (this.speedBoostActive) {
      this.speed = this.baseSpeed * 1.5
    } else {
      this.speed = this.baseSpeed
    }

    // Enforce absolute max speed
    this.speed = Math.min(this.speed, this.MAX_SPEED)
    this.baseSpeed = Math.min(this.baseSpeed, this.MAX_SPEED)
  }

  getCurrentDamage(): number {
    let damage = this.weapons[this.currentWeapon].damage

    // Apply skill bonus
    const skillDamageBonus = this.skillTree.getTotalBonus('damage')
    damage *= (1 + skillDamageBonus + this.shopDamageBonus)

    // Apply cross-game synergy bonus from Dot Clicker
    damage *= (1 + this.clickerSynergyBonus)

    // Apply power-up bonus
    if (this.damageBoostActive) {
      damage *= 2
    }

    // Shield protection visual
    if (this.shieldHits > 0) {
      // Shield is active
    }

    // Critical hit chance (skill + shop)
    const skillCritChance = this.skillTree.getTotalBonus('critChance')
    const totalCritChance = skillCritChance + this.shopCritBonus
    if (Math.random() < totalCritChance) {
      damage *= 3 // Critical hit!
      this.emitCriticalHit()
    }

    return Math.floor(damage)
  }

  getModifiedFireRate(): number {
    let fireRate = this.weapons[this.currentWeapon].fireRate

    // Apply skill bonus
    const skillFireRateBonus = this.skillTree.getTotalBonus('fireRate')
    fireRate *= (1 - skillFireRateBonus - this.shopFireRateBonus)

    // Apply rapid fire power-up
    if (this.rapidFireActive) {
      fireRate *= 0.5
    }

    // Time slow ability
    if (this.timeSlowActive) {
      fireRate *= 0.5 // Fire twice as fast during time slow
    }

    return fireRate
  }

  applyLuckBonus(amount: number): number {
    const skillLuckBonus = this.skillTree.getTotalBonus('luck')
    return Math.floor(amount * (1 + skillLuckBonus))
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

    // Emit shot event for visual effects (muzzle flash)
    this.scene.events.emit('playerShot', { x: this.x, y: this.y, angle })

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

    // Visual feedback removed (too flashy)
  }

  // Override takeDamage for invincibility and shield
  takeDamage(amount: number) {
    if (this.invincibilityActive) return

    // Shield blocks damage
    if (this.shieldHits > 0) {
      this.shieldHits--
      if (this.shieldHits === 0) {
        this.emitMessage('🛡️ Shield depleted!', 'warning')
      }
      return
    }

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

    this.scene.cameras.main.shake(50, 0.002)
  }

  // ABILITY METHODS
  canDash(): boolean {
    return this.hasDash && this.scene.time.now >= this.dashCooldown
  }

  performDash() {
    if (!this.canDash()) return

    this.dashCooldown = this.scene.time.now + 2000 // FAST: 2 second cooldown

    // Get cursor direction
    const pointer = this.scene.input.activePointer
    const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY)

    // Dash in that direction
    const dashDistance = 300
    const dashX = this.x + Math.cos(angle) * dashDistance
    const dashY = this.y + Math.sin(angle) * dashDistance

    // Tween for smooth dash
    this.scene.tweens.add({
      targets: this,
      x: dashX,
      y: dashY,
      duration: 150,
      ease: 'Cubic.easeOut',
    })

    // Invincibility during dash
    this.activateInvincibility(200)

    this.emitMessage('💨 DASH!', 'success')
  }

  canActivateShield(): boolean {
    return this.hasShield && this.shieldHits === 0 && this.scene.time.now >= this.shieldCooldown
  }

  activateShield() {
    if (!this.canActivateShield()) return

    this.shieldHits = 5
    this.shieldCooldown = this.scene.time.now + 10000 // FAST: 10 second cooldown

    // Visual feedback
    this.setTint(0x00ffff)
    this.scene.time.delayedCall(200, () => this.clearTint())

    this.emitMessage('🛡️ Shield activated! (5 hits)', 'success')
  }

  canActivateTimeSlow(): boolean {
    return this.hasTimeSlow && !this.timeSlowActive && this.scene.time.now >= this.timeSlowCooldown
  }

  activateTimeSlow() {
    if (!this.canActivateTimeSlow()) return

    this.timeSlowActive = true
    this.timeSlowEnd = this.scene.time.now + 5000 // 5 seconds
    this.timeSlowCooldown = this.scene.time.now + 12000 // FAST: 12 second cooldown

    // Slow down enemies (handled in GameScene)
    this.scene.time.timeScale = 0.5

    this.emitMessage('⏱️ TIME SLOW ACTIVATED!', 'warning')
  }

  // NEW ABILITIES (Keys 4-9)
  canActivateExplosiveRounds(): boolean {
    return this.hasExplosiveRounds && !this.explosiveRoundsActive && this.scene.time.now >= this.explosiveRoundsCooldown
  }

  activateExplosiveRounds() {
    if (!this.canActivateExplosiveRounds()) return
    this.explosiveRoundsActive = true
    this.explosiveRoundsShots = 10 // Next 10 shots explode
    this.explosiveRoundsCooldown = this.scene.time.now + 8000 // FAST: 8 second cooldown
    this.setTint(0xff6600)
    this.scene.time.delayedCall(200, () => this.clearTint())
  }

  canActivateBerserk(): boolean {
    return this.hasBerserk && !this.berserkActive && this.scene.time.now >= this.berserkCooldown
  }

  activateBerserk() {
    if (!this.canActivateBerserk()) return
    this.berserkActive = true
    this.berserkEnd = this.scene.time.now + 8000 // 8 seconds
    this.berserkCooldown = this.scene.time.now + 10000 // FAST: 10 second cooldown
    this.setTint(0xff0000)
  }

  canActivateTeleport(): boolean {
    return this.hasTeleport && this.scene.time.now >= this.teleportCooldown
  }

  activateTeleport(targetX: number, targetY: number) {
    if (!this.canActivateTeleport()) return
    // Teleport particle effect
    const startX = this.x
    const startY = this.y

    // Instant teleport
    this.setPosition(targetX, targetY)
    this.teleportCooldown = this.scene.time.now + 6000 // FAST: 6 second cooldown

    // Flash effect removed (too flashy)
  }

  canActivateLifeDrain(): boolean {
    return this.hasLifeDrain && !this.lifeDrainActive && this.scene.time.now >= this.lifeDrainCooldown
  }

  activateLifeDrain() {
    if (!this.canActivateLifeDrain()) return
    this.lifeDrainActive = true
    this.lifeDrainEnd = this.scene.time.now + 10000 // 10 seconds
    this.lifeDrainCooldown = this.scene.time.now + 12000 // FAST: 12 second cooldown
    this.setTint(0x9900ff)
  }

  canActivateBulletTime(): boolean {
    return this.hasBulletTime && !this.bulletTimeActive && this.scene.time.now >= this.bulletTimeCooldown
  }

  activateBulletTime() {
    if (!this.canActivateBulletTime()) return
    this.bulletTimeActive = true
    this.bulletTimeEnd = this.scene.time.now + 4000 // 4 seconds
    this.bulletTimeCooldown = this.scene.time.now + 15000 // FAST: 15 second cooldown
    this.scene.time.timeScale = 0.3 // Even slower than time slow
    this.setTint(0x00ffff)
  }

  canActivateOrbitalStrike(): boolean {
    return this.hasOrbitalStrike && this.scene.time.now >= this.orbitalStrikeCooldown
  }

  activateOrbitalStrike(targetX: number, targetY: number) {
    if (!this.canActivateOrbitalStrike()) return
    this.orbitalStrikeCooldown = this.scene.time.now + 20000 // FAST: 20 second cooldown
    // Emit event for GameScene to handle the strike
    this.scene.events.emit('orbitalStrike', { x: targetX, y: targetY })
    this.scene.cameras.main.shake(150, 0.003)
  }

  // Getters for ability states
  isExplosiveRoundsActive(): boolean { return this.explosiveRoundsActive }
  isBerserkActive(): boolean { return this.berserkActive }
  isLifeDrainActive(): boolean { return this.lifeDrainActive }
  isBulletTimeActive(): boolean { return this.bulletTimeActive }

  // TESTING: Auto-click/reload checkers
  hasAutoClick(): boolean {
    return this.shopManager ? this.shopManager.hasAbility('autoClick') : false
  }

  hasAutoReload(): boolean {
    return this.shopManager ? this.shopManager.hasAbility('autoReload') : false
  }

  updateAbilities() {
    // Check time slow expiration
    if (this.timeSlowActive && this.scene.time.now >= this.timeSlowEnd) {
      this.timeSlowActive = false
      this.scene.time.timeScale = 1.0
    }

    // Check berserk expiration
    if (this.berserkActive && this.scene.time.now >= this.berserkEnd) {
      this.berserkActive = false
      this.clearTint()
    }

    // Check life drain expiration
    if (this.lifeDrainActive && this.scene.time.now >= this.lifeDrainEnd) {
      this.lifeDrainActive = false
      this.clearTint()
    }

    // Check bullet time expiration
    if (this.bulletTimeActive && this.scene.time.now >= this.bulletTimeEnd) {
      this.bulletTimeActive = false
      this.scene.time.timeScale = 1.0
      this.clearTint()
    }

    // Reset explosive rounds when shots run out
    if (this.explosiveRoundsActive && this.explosiveRoundsShots <= 0) {
      this.explosiveRoundsActive = false
      this.clearTint()
    }
  }

  isTimeSlowActive(): boolean {
    return this.timeSlowActive
  }

  getShieldHits(): number {
    return this.shieldHits
  }

  private emitMessage(text: string, type: 'success' | 'warning' | 'danger') {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gameEvent', {
        detail: {
          type: 'message',
          data: { text, type }
        }
      }))
    }
  }

  // CREATIVE EXPANSION: XP requirement calculator for level scaling
  private getXPForLevel(level: number): number {
    // Exponential scaling: level 1 needs 100 XP, level 50 needs ~12,500 XP, level 100 needs ~50,000 XP
    return Math.floor(100 * Math.pow(level, 1.3))
  }

  private getTotalXPForLevel(targetLevel: number): number {
    let total = 0
    for (let i = 1; i < targetLevel; i++) {
      total += this.getXPForLevel(i)
    }
    return total
  }

  // Override addXP for skill points
  addXP(amount: number) {
    // Apply luck bonus
    amount = this.applyLuckBonus(amount)

    // Apply shop XP bonus
    amount = Math.floor(amount * (1 + this.shopXPBonus))

    this.xp += amount

    // CREATIVE EXPANSION: Level scaling up to level 100!
    const MAX_LEVEL = 100

    while (this.level < MAX_LEVEL) {
      const xpNeeded = this.getTotalXPForLevel(this.level + 1)
      if (this.xp >= xpNeeded) {
        this.level++
        this.skillPoints++ // Gain 1 skill point per level

        // CREATIVE EXPANSION: Milestone rewards!
        let bonusMessage = ''
        if (this.level === 10) {
          this.money += 5000
          bonusMessage = ' +$5000 BONUS!'
        } else if (this.level === 25) {
          this.money += 15000
          bonusMessage = ' +$15000 BONUS!'
        } else if (this.level === 50) {
          this.money += 50000
          this.skillPoints += 5
          bonusMessage = ' +$50000 + 5 SKILL POINTS!'
        } else if (this.level === 75) {
          this.money += 100000
          this.skillPoints += 10
          bonusMessage = ' +$100000 + 10 SKILL POINTS!'
        } else if (this.level === 100) {
          this.money += 500000
          this.skillPoints += 25
          bonusMessage = ' 🎉 MAX LEVEL! +$500000 + 25 SKILL POINTS!'
        }

        this.applySkillBonuses()
        this.health = this.maxHealth

        // Message
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('gameEvent', {
            detail: {
              type: 'message',
              data: { text: `Level Up! Now level ${this.level} (+1 Skill Point)${bonusMessage}`, type: 'success' }
            }
          }))
        }
      } else {
        break
      }
    }
  }

  // Override addMoney for luck bonus
  addMoney(amount: number) {
    if (amount > 0) {
      amount = this.applyLuckBonus(amount)
      // Apply shop money bonus
      amount = Math.floor(amount * (1 + this.shopMoneyBonus))
    }
    this.money += amount
  }

  destroy(fromScene?: boolean) {
    this.aimLine.destroy()
    this.powerUpIndicators.destroy()
    super.destroy(fromScene)
  }
}

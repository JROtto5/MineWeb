import * as Phaser from 'phaser'
import Player from './Player'
import Enemy from './Enemy'

export type BossType = 'tank' | 'speed' | 'sniper' | 'healer' | 'mega' | 'hydra' | 'dragon' | 'reaper' | 'titan' | 'phoenix'

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
  },
  // ═══════════════════════════════════════════════════════════════
  // LEGENDARY BOSSES - Epic encounters with devastating abilities!
  // ═══════════════════════════════════════════════════════════════
  hydra: {
    type: 'hydra',
    name: 'THE HYDRA',
    health: 15000,
    speed: 100,
    size: 100,
    damage: 60,
    color: 0x1abc9c,
    icon: '🐉',
    specialAbility: 'Multi-Head Attack',
    moneyDrop: 8000,
    xpDrop: 4000
  },
  dragon: {
    type: 'dragon',
    name: 'INFERNO DRAGON',
    health: 20000,
    speed: 150,
    size: 120,
    damage: 100,
    color: 0xff4500,
    icon: '🔥',
    specialAbility: 'Fire Breath',
    moneyDrop: 12000,
    xpDrop: 6000
  },
  reaper: {
    type: 'reaper',
    name: 'SOUL REAPER',
    health: 12000,
    speed: 200,
    size: 90,
    damage: 150,
    color: 0x2c2c54,
    icon: '💀',
    specialAbility: 'Soul Drain',
    moneyDrop: 10000,
    xpDrop: 5000
  },
  titan: {
    type: 'titan',
    name: 'ANCIENT TITAN',
    health: 50000,
    speed: 40,
    size: 150,
    damage: 200,
    color: 0x6c5b7b,
    icon: '🗿',
    specialAbility: 'Ground Slam',
    moneyDrop: 25000,
    xpDrop: 12000
  },
  phoenix: {
    type: 'phoenix',
    name: 'ETERNAL PHOENIX',
    health: 18000,
    speed: 180,
    size: 100,
    damage: 80,
    color: 0xf9ca24,
    icon: '🦅',
    specialAbility: 'Resurrection',
    moneyDrop: 15000,
    xpDrop: 8000
  }
}

export default class Boss extends Phaser.Physics.Arcade.Sprite {
  public health: number
  public maxHealth: number
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

    // Boss entrance effect (minimal)
    scene.cameras.main.shake(150, 0.003)

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

    // ═══════════════════════════════════════════════════════════════
    // LEGENDARY BOSS VISUALS - Epic appearances!
    // ═══════════════════════════════════════════════════════════════

    if (this.bossConfig.type === 'hydra') {
      // Multiple "heads" around the main body
      graphics.fillStyle(0x16a085, 1)
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2
        graphics.fillCircle(
          size / 2 + Math.cos(angle) * (size / 3),
          size / 2 + Math.sin(angle) * (size / 3),
          size / 6
        )
      }
    }

    if (this.bossConfig.type === 'dragon') {
      // Fire aura / wings effect
      graphics.fillStyle(0xff6600, 0.6)
      graphics.fillTriangle(
        size / 4, size / 2,
        -size / 4, size / 4,
        -size / 4, size * 3 / 4
      )
      graphics.fillTriangle(
        size * 3 / 4, size / 2,
        size + size / 4, size / 4,
        size + size / 4, size * 3 / 4
      )
      // Flame crown
      graphics.fillStyle(0xff4500, 1)
      for (let i = 0; i < 7; i++) {
        const flameX = size / 6 + i * size / 8
        graphics.fillTriangle(
          flameX, size / 6,
          flameX - 5, size / 3,
          flameX + 5, size / 3
        )
      }
    }

    if (this.bossConfig.type === 'reaper') {
      // Scythe-like marking
      graphics.lineStyle(4, 0x9b59b6, 1)
      graphics.beginPath()
      graphics.arc(size / 2, size / 2, size / 3, -Math.PI, 0)
      graphics.strokePath()
      // Hood effect
      graphics.fillStyle(0x1a1a2e, 1)
      graphics.fillTriangle(
        size / 2, size / 6,
        size / 4, size / 2,
        size * 3 / 4, size / 2
      )
    }

    if (this.bossConfig.type === 'titan') {
      // Ancient markings / runes
      graphics.lineStyle(3, 0xdfe6e9, 0.8)
      graphics.strokeCircle(size / 2, size / 2, size / 3)
      graphics.strokeCircle(size / 2, size / 2, size / 2.5)
      // Stone cracks
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2
        graphics.lineBetween(
          size / 2,
          size / 2,
          size / 2 + Math.cos(angle) * size / 2.2,
          size / 2 + Math.sin(angle) * size / 2.2
        )
      }
    }

    if (this.bossConfig.type === 'phoenix') {
      // Flame wings
      graphics.fillStyle(0xff6600, 0.7)
      graphics.fillTriangle(
        size / 4, size / 2,
        -size / 3, size / 5,
        -size / 6, size * 4 / 5
      )
      graphics.fillTriangle(
        size * 3 / 4, size / 2,
        size + size / 3, size / 5,
        size + size / 6, size * 4 / 5
      )
      // Fire crest
      graphics.fillStyle(0xf9ca24, 1)
      graphics.fillTriangle(size / 2, -size / 6, size / 3, size / 4, size * 2 / 3, size / 4)
      graphics.fillTriangle(size / 2 - size / 6, 0, size / 4, size / 4, size / 2, size / 6)
      graphics.fillTriangle(size / 2 + size / 6, 0, size / 2, size / 6, size * 3 / 4, size / 4)
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
        // Summon minions around the boss!
        this.summonMinions()
        // Visual effect for summoning
        const summonEffect = this.scene.add.circle(this.x, this.y, 80, 0xff0000, 0.4)
        this.scene.tweens.add({
          targets: summonEffect,
          scale: 2.5,
          alpha: 0,
          duration: 800,
          onComplete: () => summonEffect.destroy()
        })
        break

      // ═══════════════════════════════════════════════════════════════
      // LEGENDARY BOSS ABILITIES - Devastating attacks!
      // ═══════════════════════════════════════════════════════════════

      case 'hydra':
        // Multi-head attack - fires projectiles in 8 directions!
        this.hydraMultiAttack(player)
        break

      case 'dragon':
        // Fire breath - creates a deadly fire cone!
        this.dragonFireBreath(player)
        break

      case 'reaper':
        // Soul drain - pulls player toward reaper and damages
        this.reaperSoulDrain(player)
        break

      case 'titan':
        // Ground slam - massive AOE shockwave!
        this.titanGroundSlam()
        break

      case 'phoenix':
        // Fire nova - expanding ring of flames!
        this.phoenixFireNova()
        break
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // LEGENDARY BOSS ABILITY IMPLEMENTATIONS
  // ═══════════════════════════════════════════════════════════════

  private hydraMultiAttack(player: Player) {
    // Fire 8 projectiles in all directions!
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const projectile = this.scene.add.circle(this.x, this.y, 12, 0x1abc9c)

      this.scene.tweens.add({
        targets: projectile,
        x: this.x + Math.cos(angle) * 400,
        y: this.y + Math.sin(angle) * 400,
        duration: 800,
        ease: 'Power1',
        onComplete: () => {
          // Explosion at end
          const explosion = this.scene.add.circle(projectile.x, projectile.y, 8, 0x1abc9c, 0.8)
          this.scene.tweens.add({
            targets: explosion,
            scale: 4,
            alpha: 0,
            duration: 300,
            onComplete: () => explosion.destroy()
          })
          projectile.destroy()
        }
      })
    }

    // Screen effect
    this.scene.cameras.main.shake(200, 0.004)

    // Emit damage event for projectiles
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bossProjectileAttack', {
        detail: { x: this.x, y: this.y, damage: 30, radius: 400, projectileCount: 8 }
      }))
    }
  }

  private dragonFireBreath(player: Player) {
    // Calculate angle to player
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)

    // Create fire breath cone effect
    for (let i = 0; i < 20; i++) {
      const spreadAngle = angle + (Math.random() - 0.5) * 0.8
      const distance = 100 + Math.random() * 300
      const particle = this.scene.add.circle(
        this.x,
        this.y,
        8 + Math.random() * 12,
        Phaser.Display.Color.GetColor(255, Math.floor(100 + Math.random() * 155), 0)
      )

      this.scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(spreadAngle) * distance,
        y: this.y + Math.sin(spreadAngle) * distance,
        scale: 0,
        alpha: 0,
        duration: 400 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      })
    }

    // Add screen flash
    this.scene.cameras.main.flash(200, 255, 100, 0, false)

    // Emit fire breath damage event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dragonFireBreath', {
        detail: { x: this.x, y: this.y, angle: angle, damage: 50, range: 350 }
      }))
    }
  }

  private reaperSoulDrain(player: Player) {
    // Create dark tendrils reaching toward player
    const tendrilCount = 6
    for (let i = 0; i < tendrilCount; i++) {
      const startAngle = (i / tendrilCount) * Math.PI * 2
      const tendril = this.scene.add.graphics()
      tendril.lineStyle(4, 0x2c2c54, 0.8)

      let t = 0
      const animateTendril = () => {
        t += 0.1
        if (t > 1) {
          tendril.destroy()
          return
        }
        tendril.clear()
        tendril.lineStyle(4, 0x2c2c54, 0.8 * (1 - t))

        const startX = this.x + Math.cos(startAngle) * 30
        const startY = this.y + Math.sin(startAngle) * 30
        const endX = Phaser.Math.Linear(startX, player.x, t)
        const endY = Phaser.Math.Linear(startY, player.y, t)

        tendril.lineBetween(startX, startY, endX, endY)
        this.scene.time.delayedCall(50, animateTendril)
      }
      animateTendril()
    }

    // Pull effect on player
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('reaperPull', {
        detail: { x: this.x, y: this.y, pullStrength: 200, damage: 30 }
      }))
    }

    // Dark aura effect
    const aura = this.scene.add.circle(this.x, this.y, 60, 0x2c2c54, 0.3)
    this.scene.tweens.add({
      targets: aura,
      scale: 4,
      alpha: 0,
      duration: 1000,
      onComplete: () => aura.destroy()
    })
  }

  private titanGroundSlam() {
    // Massive ground slam with shockwave rings!
    this.scene.cameras.main.shake(500, 0.02)

    // Create multiple shockwave rings
    for (let ring = 0; ring < 4; ring++) {
      this.scene.time.delayedCall(ring * 150, () => {
        const shockwave = this.scene.add.circle(this.x, this.y, 30, 0x6c5b7b, 0.6)
        shockwave.setStrokeStyle(8, 0x6c5b7b)

        this.scene.tweens.add({
          targets: shockwave,
          scale: 15 + ring * 3,
          alpha: 0,
          duration: 800,
          ease: 'Power2',
          onComplete: () => shockwave.destroy()
        })
      })
    }

    // Ground crack effect
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const crack = this.scene.add.rectangle(
        this.x,
        this.y,
        8,
        200,
        0x4a4a4a
      ).setOrigin(0.5, 0).setRotation(angle)

      this.scene.tweens.add({
        targets: crack,
        scaleY: 2,
        alpha: 0,
        duration: 600,
        delay: 100,
        onComplete: () => crack.destroy()
      })
    }

    // Emit ground slam damage
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('titanSlam', {
        detail: { x: this.x, y: this.y, damage: 100, radius: 400 }
      }))
    }
  }

  private phoenixFireNova() {
    // Create expanding fire ring!
    const ringCount = 3
    for (let r = 0; r < ringCount; r++) {
      this.scene.time.delayedCall(r * 200, () => {
        // Main fire ring
        const ring = this.scene.add.circle(this.x, this.y, 40, 0xf9ca24, 0)
        ring.setStrokeStyle(12, 0xff6b00)

        this.scene.tweens.add({
          targets: ring,
          scale: 8 + r * 2,
          alpha: 0,
          duration: 600,
          onComplete: () => ring.destroy()
        })

        // Fire particles on the ring
        for (let i = 0; i < 24; i++) {
          const angle = (i / 24) * Math.PI * 2
          const flame = this.scene.add.circle(
            this.x + Math.cos(angle) * 40,
            this.y + Math.sin(angle) * 40,
            6,
            0xf9ca24
          )

          this.scene.tweens.add({
            targets: flame,
            x: this.x + Math.cos(angle) * 350,
            y: this.y + Math.sin(angle) * 350,
            scale: 0,
            duration: 600 + r * 100,
            onComplete: () => flame.destroy()
          })
        }
      })
    }

    // Screen flash effect
    this.scene.cameras.main.flash(300, 255, 200, 0, false)

    // Emit fire nova damage
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('phoenixNova', {
        detail: { x: this.x, y: this.y, damage: 40, maxRadius: 350 }
      }))
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

    // Health with proper color coding
    const healthPercent = this.health / this.maxHealth
    let healthColor = 0xe74c3c // Red for low health
    if (healthPercent > 0.6) healthColor = 0x2ecc71 // Green
    else if (healthPercent > 0.3) healthColor = 0xf39c12 // Orange
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
    const isLegendary = ['hydra', 'dragon', 'reaper', 'titan', 'phoenix'].includes(this.bossConfig.type)

    // Standard death explosion
    const particleCount = isLegendary ? 60 : 30
    const explosionRadius = isLegendary ? 400 : 200

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const particle = this.scene.add.circle(
        this.x,
        this.y,
        isLegendary ? 12 : 8,
        this.bossConfig.color
      )

      this.scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(angle) * explosionRadius,
        y: this.y + Math.sin(angle) * explosionRadius,
        alpha: 0,
        scale: 0,
        duration: isLegendary ? 1500 : 1000,
        onComplete: () => particle.destroy()
      })
    }

    // ═══════════════════════════════════════════════════════════════
    // LEGENDARY BOSS DEATH EFFECTS - Spectacular finales!
    // ═══════════════════════════════════════════════════════════════

    if (isLegendary) {
      // Epic screen shake
      this.scene.cameras.main.shake(800, 0.03)

      // Multiple explosion rings
      for (let ring = 0; ring < 5; ring++) {
        this.scene.time.delayedCall(ring * 100, () => {
          const shockwave = this.scene.add.circle(this.x, this.y, 50, this.bossConfig.color, 0)
          shockwave.setStrokeStyle(6, this.bossConfig.color)
          this.scene.tweens.add({
            targets: shockwave,
            scale: 10 + ring * 2,
            alpha: 0,
            duration: 600,
            onComplete: () => shockwave.destroy()
          })
        })
      }

      // Screen flash
      this.scene.cameras.main.flash(500, 255, 255, 255, false)

      // Particle fountain
      for (let burst = 0; burst < 3; burst++) {
        this.scene.time.delayedCall(burst * 200, () => {
          for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2
            const speed = 100 + Math.random() * 300
            const particle = this.scene.add.circle(
              this.x,
              this.y,
              4 + Math.random() * 8,
              this.bossConfig.color
            )
            this.scene.tweens.add({
              targets: particle,
              x: this.x + Math.cos(angle) * speed,
              y: this.y + Math.sin(angle) * speed - 100,
              alpha: 0,
              duration: 800 + Math.random() * 400,
              onComplete: () => particle.destroy()
            })
          }
        })
      }

      // Boss-specific death effects
      if (this.bossConfig.type === 'dragon') {
        // Fire explosion
        for (let i = 0; i < 30; i++) {
          const flame = this.scene.add.circle(
            this.x + (Math.random() - 0.5) * 100,
            this.y + (Math.random() - 0.5) * 100,
            10 + Math.random() * 20,
            Phaser.Display.Color.GetColor(255, Math.floor(Math.random() * 150), 0)
          )
          this.scene.tweens.add({
            targets: flame,
            y: flame.y - 200 - Math.random() * 200,
            alpha: 0,
            scale: 0,
            duration: 1000 + Math.random() * 500,
            onComplete: () => flame.destroy()
          })
        }
      }

      if (this.bossConfig.type === 'phoenix') {
        // Phoenix rebirth effect (visual only on death)
        const rebirth = this.scene.add.circle(this.x, this.y, 20, 0xf9ca24, 1)
        this.scene.tweens.add({
          targets: rebirth,
          scale: 20,
          alpha: 0,
          duration: 1500,
          onComplete: () => rebirth.destroy()
        })
      }

      if (this.bossConfig.type === 'titan') {
        // Crumbling rocks
        for (let i = 0; i < 20; i++) {
          const rock = this.scene.add.rectangle(
            this.x + (Math.random() - 0.5) * 80,
            this.y + (Math.random() - 0.5) * 80,
            20 + Math.random() * 30,
            20 + Math.random() * 30,
            0x6c5b7b
          ).setRotation(Math.random() * Math.PI)

          this.scene.tweens.add({
            targets: rock,
            y: rock.y + 300,
            rotation: rock.rotation + Math.PI * 2,
            alpha: 0,
            duration: 1500,
            onComplete: () => rock.destroy()
          })
        }
      }

      if (this.bossConfig.type === 'reaper') {
        // Soul release effect
        for (let i = 0; i < 15; i++) {
          const soul = this.scene.add.circle(
            this.x + (Math.random() - 0.5) * 60,
            this.y,
            8,
            0x9b59b6,
            0.6
          )
          this.scene.tweens.add({
            targets: soul,
            y: soul.y - 300 - Math.random() * 200,
            x: soul.x + (Math.random() - 0.5) * 200,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => soul.destroy()
          })
        }
      }

      // Victory text for legendary kills
      const victoryText = this.scene.add.text(
        this.scene.scale.width / 2,
        this.scene.scale.height / 3,
        `⚔️ ${this.bossConfig.name} SLAIN! ⚔️`,
        {
          fontSize: '64px',
          color: '#f1c40f',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 8,
          shadow: { blur: 10, color: '#f39c12', fill: true }
        }
      ).setOrigin(0.5).setScrollFactor(0).setDepth(10000)

      this.scene.tweens.add({
        targets: victoryText,
        scale: 1.3,
        y: victoryText.y - 50,
        duration: 500,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          this.scene.tweens.add({
            targets: victoryText,
            alpha: 0,
            duration: 1000,
            onComplete: () => victoryText.destroy()
          })
        }
      })
    } else {
      // Normal boss camera effects
      this.scene.cameras.main.shake(200, 0.005)
    }

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

  // Mega Boss ability: Summon minions
  private summonMinions() {
    // Emit event for GameScene to handle spawning minions
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bossSummonMinions', {
        detail: {
          x: this.x,
          y: this.y,
          count: 3 + Math.floor(Math.random() * 3) // 3-5 minions
        }
      }))
    }
  }
}

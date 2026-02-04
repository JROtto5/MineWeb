import * as Phaser from 'phaser'

/**
 * VisualEffects - Handles all visual feedback, particles, and screen effects
 * to make combat feel incredible and responsive
 */
export class VisualEffects {
  private scene: Phaser.Scene
  private damageNumbers: Phaser.GameObjects.Group
  private particles: Phaser.GameObjects.Group

  // Screen effect state
  private vignetteOverlay: Phaser.GameObjects.Graphics | null = null
  private screenFlashOverlay: Phaser.GameObjects.Rectangle | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.damageNumbers = scene.add.group()
    this.particles = scene.add.group()

    this.createVignetteOverlay()
    this.createScreenFlashOverlay()
  }

  // ==================== DAMAGE NUMBERS ====================

  /**
   * Show floating damage number at position
   */
  showDamageNumber(x: number, y: number, damage: number, isCrit: boolean = false) {
    const color = isCrit ? '#ff0000' : '#ffffff'
    const size = isCrit ? '28px' : '20px'
    const prefix = isCrit ? 'CRIT! ' : ''

    const text = this.scene.add.text(x, y, `${prefix}${damage}`, {
      fontSize: size,
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(6000)

    // Add slight random offset for variety
    text.x += Phaser.Math.Between(-20, 20)

    // Animate floating up and fading
    this.scene.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      scale: isCrit ? 1.5 : 1.2,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy()
    })

    if (isCrit) {
      // Extra punch for crits
      text.setScale(0.5)
      this.scene.tweens.add({
        targets: text,
        scale: 1.3,
        duration: 150,
        yoyo: true,
        ease: 'Bounce.easeOut'
      })
    }
  }

  /**
   * Show XP gain popup
   */
  showXPGain(x: number, y: number, amount: number) {
    const text = this.scene.add.text(x, y - 30, `+${amount} XP`, {
      fontSize: '16px',
      color: '#3498db',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(6000)

    this.scene.tweens.add({
      targets: text,
      y: y - 80,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy()
    })
  }

  /**
   * Show money gain popup
   */
  showMoneyGain(x: number, y: number, amount: number) {
    const text = this.scene.add.text(x, y - 40, `+$${amount}`, {
      fontSize: '18px',
      color: '#2ecc71',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(6000)

    this.scene.tweens.add({
      targets: text,
      y: y - 90,
      alpha: 0,
      duration: 1200,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy()
    })
  }

  // ==================== HIT EFFECTS ====================

  /**
   * Create hit spark particles when bullet hits enemy
   */
  createHitSparks(x: number, y: number, color: number = 0xffff00, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.3, 0.3)
      const speed = Phaser.Math.Between(50, 150)
      const size = Phaser.Math.Between(2, 5)

      const spark = this.scene.add.circle(x, y, size, color)
        .setDepth(5500)

      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(200, 400),
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy()
      })
    }
  }

  /**
   * Create blood splatter effect
   */
  createBloodSplatter(x: number, y: number, intensity: number = 1) {
    const count = Math.floor(6 * intensity)
    const colors = [0xff0000, 0xcc0000, 0x990000, 0x660000]

    for (let i = 0; i < count; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
      const speed = Phaser.Math.Between(30, 100) * intensity
      const size = Phaser.Math.Between(3, 8)
      const color = Phaser.Math.RND.pick(colors)

      const droplet = this.scene.add.circle(x, y, size, color)
        .setDepth(500)
        .setAlpha(0.8)

      this.scene.tweens.add({
        targets: droplet,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0.3,
        scale: 0.5,
        duration: Phaser.Math.Between(400, 800),
        ease: 'Quad.easeOut',
        onComplete: () => {
          // Leave some blood on ground briefly
          this.scene.time.delayedCall(2000, () => {
            this.scene.tweens.add({
              targets: droplet,
              alpha: 0,
              duration: 500,
              onComplete: () => droplet.destroy()
            })
          })
        }
      })
    }
  }

  // ==================== DEATH EFFECTS ====================

  /**
   * Create explosion effect when enemy dies
   */
  createDeathExplosion(x: number, y: number, color: number, size: number = 1) {
    // Central flash
    const flash = this.scene.add.circle(x, y, 10 * size, 0xffffff)
      .setDepth(5500)
      .setAlpha(0.9)

    this.scene.tweens.add({
      targets: flash,
      scale: 3,
      alpha: 0,
      duration: 200,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy()
    })

    // Expanding ring
    const ring = this.scene.add.circle(x, y, 15 * size, color, 0)
      .setStrokeStyle(4 * size, color)
      .setDepth(5500)

    this.scene.tweens.add({
      targets: ring,
      scale: 2.5,
      alpha: 0,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    })

    // Particle burst
    const particleCount = Math.floor(12 * size)
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const speed = Phaser.Math.Between(80, 180) * size
      const particleSize = Phaser.Math.Between(3, 7) * size

      const particle = this.scene.add.circle(x, y, particleSize, color)
        .setDepth(5500)

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(300, 600),
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      })
    }
  }

  /**
   * Create boss death explosion (epic!)
   */
  createBossDeathExplosion(x: number, y: number, color: number) {
    // Multiple waves of explosions
    for (let wave = 0; wave < 3; wave++) {
      this.scene.time.delayedCall(wave * 200, () => {
        this.createDeathExplosion(
          x + Phaser.Math.Between(-30, 30),
          y + Phaser.Math.Between(-30, 30),
          color,
          2
        )
        this.scene.cameras.main.shake(100, 0.01)
      })
    }

    // Final big explosion
    this.scene.time.delayedCall(600, () => {
      this.createDeathExplosion(x, y, 0xffffff, 3)
      this.screenFlash(0xffffff, 0.5, 300)
      this.scene.cameras.main.shake(200, 0.02)
    })
  }

  // ==================== SCREEN EFFECTS ====================

  private createVignetteOverlay() {
    const width = this.scene.scale.width
    const height = this.scene.scale.height

    this.vignetteOverlay = this.scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(9999)
      .setAlpha(0)
  }

  private createScreenFlashOverlay() {
    this.screenFlashOverlay = this.scene.add.rectangle(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2,
      this.scene.scale.width * 2,
      this.scene.scale.height * 2,
      0xffffff,
      0
    ).setScrollFactor(0).setDepth(9998)
  }

  /**
   * Flash the screen a color
   */
  screenFlash(color: number = 0xffffff, intensity: number = 0.3, duration: number = 100) {
    if (!this.screenFlashOverlay) return

    this.screenFlashOverlay.setFillStyle(color, intensity)
    this.screenFlashOverlay.setAlpha(1)

    this.scene.tweens.add({
      targets: this.screenFlashOverlay,
      alpha: 0,
      duration: duration,
      ease: 'Cubic.easeOut'
    })
  }

  /**
   * Low health vignette effect (red edges)
   */
  updateLowHealthVignette(healthPercent: number) {
    if (!this.vignetteOverlay) return

    if (healthPercent < 0.3) {
      const intensity = (0.3 - healthPercent) / 0.3 // 0-1 based on how low health is
      const pulseIntensity = 0.3 + Math.sin(this.scene.time.now / 200) * 0.1

      this.vignetteOverlay.clear()

      const width = this.scene.scale.width
      const height = this.scene.scale.height

      // Simple red vignette border effect
      const borderSize = 100
      const alpha = intensity * pulseIntensity * 0.4

      // Draw red border around edges
      this.vignetteOverlay.fillStyle(0xff0000, alpha)
      this.vignetteOverlay.fillRect(0, 0, width, borderSize) // top
      this.vignetteOverlay.fillRect(0, height - borderSize, width, borderSize) // bottom
      this.vignetteOverlay.fillRect(0, 0, borderSize, height) // left
      this.vignetteOverlay.fillRect(width - borderSize, 0, borderSize, height) // right

      this.vignetteOverlay.setAlpha(1)
    } else {
      this.vignetteOverlay.setAlpha(0)
    }
  }

  /**
   * Screen shake with various intensities
   */
  shakeScreen(intensity: 'light' | 'medium' | 'heavy' | 'extreme') {
    const shakeConfig = {
      light: { duration: 50, intensity: 0.002 },
      medium: { duration: 100, intensity: 0.005 },
      heavy: { duration: 150, intensity: 0.01 },
      extreme: { duration: 300, intensity: 0.02 }
    }

    const config = shakeConfig[intensity]
    this.scene.cameras.main.shake(config.duration, config.intensity)
  }

  // ==================== COMBO EFFECTS ====================

  /**
   * Show combo milestone celebration
   */
  showComboMilestone(combo: number) {
    const milestones = [10, 25, 50, 100, 200, 500]
    if (!milestones.includes(combo)) return

    const screenWidth = this.scene.scale.width
    const screenHeight = this.scene.scale.height

    let message = ''
    let color = '#f39c12'

    if (combo >= 500) { message = 'GODLIKE!'; color = '#ff0000' }
    else if (combo >= 200) { message = 'UNSTOPPABLE!'; color = '#ff6b00' }
    else if (combo >= 100) { message = 'RAMPAGE!'; color = '#e74c3c' }
    else if (combo >= 50) { message = 'DOMINATING!'; color = '#9b59b6' }
    else if (combo >= 25) { message = 'KILLING SPREE!'; color = '#3498db' }
    else if (combo >= 10) { message = 'COMBO x10!'; color = '#2ecc71' }

    const text = this.scene.add.text(
      screenWidth / 2,
      screenHeight / 3,
      message,
      {
        fontSize: '64px',
        color: color,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 8
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(8000).setScale(0)

    // Epic entrance animation
    this.scene.tweens.add({
      targets: text,
      scale: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: text,
          scale: 1,
          alpha: 0,
          y: text.y - 50,
          duration: 1500,
          ease: 'Cubic.easeOut',
          onComplete: () => text.destroy()
        })
      }
    })

    // Screen effects
    this.screenFlash(parseInt(color.replace('#', '0x')), 0.3, 200)
    this.shakeScreen('medium')
  }

  // ==================== LEVEL UP EFFECTS ====================

  /**
   * Show epic level up effect
   */
  showLevelUp(x: number, y: number, newLevel: number) {
    // Golden ring burst
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.circle(x, y, 20, 0xf1c40f, 0)
        .setStrokeStyle(4, 0xf1c40f)
        .setDepth(5500)

      this.scene.time.delayedCall(i * 100, () => {
        this.scene.tweens.add({
          targets: ring,
          scale: 4 + i,
          alpha: 0,
          duration: 600,
          ease: 'Cubic.easeOut',
          onComplete: () => ring.destroy()
        })
      })
    }

    // Level text
    const levelText = this.scene.add.text(x, y - 50, `LEVEL ${newLevel}!`, {
      fontSize: '36px',
      color: '#f1c40f',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(6000).setScale(0)

    this.scene.tweens.add({
      targets: levelText,
      scale: 1.5,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: levelText,
          y: y - 100,
          alpha: 0,
          duration: 1500,
          ease: 'Cubic.easeOut',
          onComplete: () => levelText.destroy()
        })
      }
    })

    // Particle fountain
    for (let i = 0; i < 30; i++) {
      const angle = Phaser.Math.FloatBetween(-Math.PI * 0.75, -Math.PI * 0.25) // Upward arc
      const speed = Phaser.Math.Between(100, 250)
      const size = Phaser.Math.Between(3, 8)
      const colors = [0xf1c40f, 0xf39c12, 0xffffff]

      const particle = this.scene.add.star(x, y, 5, size / 2, size, Phaser.Math.RND.pick(colors))
        .setDepth(5500)

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed + 50, // Add gravity
        alpha: 0,
        rotation: Phaser.Math.FloatBetween(-3, 3),
        duration: Phaser.Math.Between(600, 1000),
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      })
    }

    this.screenFlash(0xf1c40f, 0.4, 300)
    this.shakeScreen('medium')
  }

  // ==================== MUZZLE FLASH ====================

  /**
   * Create muzzle flash effect at player position
   */
  createMuzzleFlash(x: number, y: number, angle: number) {
    // Main flash
    const flash = this.scene.add.ellipse(
      x + Math.cos(angle) * 25,
      y + Math.sin(angle) * 25,
      20, 8, 0xffff00
    ).setDepth(5500).setRotation(angle)

    this.scene.tweens.add({
      targets: flash,
      scale: 0,
      alpha: 0,
      duration: 80,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    })

    // Small sparks
    for (let i = 0; i < 3; i++) {
      const sparkAngle = angle + Phaser.Math.FloatBetween(-0.3, 0.3)
      const spark = this.scene.add.circle(
        x + Math.cos(angle) * 25,
        y + Math.sin(angle) * 25,
        Phaser.Math.Between(1, 3),
        0xffffff
      ).setDepth(5500)

      this.scene.tweens.add({
        targets: spark,
        x: spark.x + Math.cos(sparkAngle) * 30,
        y: spark.y + Math.sin(sparkAngle) * 30,
        alpha: 0,
        duration: 100,
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy()
      })
    }
  }

  // ==================== BULLET TRAIL ====================

  /**
   * Create bullet trail effect
   */
  createBulletTrail(x: number, y: number, color: number = 0xf1c40f) {
    const trail = this.scene.add.circle(x, y, 3, color)
      .setDepth(500)
      .setAlpha(0.6)

    this.scene.tweens.add({
      targets: trail,
      scale: 0,
      alpha: 0,
      duration: 150,
      ease: 'Quad.easeOut',
      onComplete: () => trail.destroy()
    })
  }

  // ==================== STATUS EFFECT VISUALS ====================

  /**
   * Create poison cloud effect
   */
  createPoisonEffect(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      const bubble = this.scene.add.circle(
        x + Phaser.Math.Between(-15, 15),
        y + Phaser.Math.Between(-15, 15),
        Phaser.Math.Between(3, 8),
        0x9b59b6,
        0.6
      ).setDepth(500)

      this.scene.tweens.add({
        targets: bubble,
        y: bubble.y - 30,
        alpha: 0,
        duration: Phaser.Math.Between(400, 800),
        ease: 'Quad.easeOut',
        onComplete: () => bubble.destroy()
      })
    }
  }

  /**
   * Create freeze effect
   */
  createFreezeEffect(x: number, y: number) {
    // Ice crystals
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const crystal = this.scene.add.star(
        x + Math.cos(angle) * 15,
        y + Math.sin(angle) * 15,
        6, 3, 8, 0x3498db
      ).setDepth(500).setAlpha(0.8)

      this.scene.tweens.add({
        targets: crystal,
        scale: 0,
        alpha: 0,
        rotation: Math.PI,
        duration: 600,
        ease: 'Quad.easeOut',
        onComplete: () => crystal.destroy()
      })
    }
  }

  /**
   * Create burn effect
   */
  createBurnEffect(x: number, y: number) {
    for (let i = 0; i < 4; i++) {
      const flame = this.scene.add.ellipse(
        x + Phaser.Math.Between(-10, 10),
        y,
        6, 12,
        Phaser.Math.RND.pick([0xff6600, 0xff9900, 0xffcc00])
      ).setDepth(500)

      this.scene.tweens.add({
        targets: flame,
        y: flame.y - 25,
        scale: 0,
        alpha: 0,
        duration: Phaser.Math.Between(300, 500),
        ease: 'Quad.easeOut',
        onComplete: () => flame.destroy()
      })
    }
  }

  /**
   * Create electric/stun effect
   */
  createStunEffect(x: number, y: number) {
    // Lightning bolts
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.random()
      const length = Phaser.Math.Between(15, 25)

      const line = this.scene.add.line(
        0, 0,
        x, y,
        x + Math.cos(angle) * length,
        y + Math.sin(angle) * length,
        0xf1c40f
      ).setDepth(5500).setLineWidth(2)

      this.scene.tweens.add({
        targets: line,
        alpha: 0,
        duration: 150,
        yoyo: true,
        repeat: 2,
        onComplete: () => line.destroy()
      })
    }
  }

  // ==================== FLOOR TRANSITION ====================

  /**
   * Epic floor transition effect
   */
  createFloorTransition(floorNumber: number) {
    const screenWidth = this.scene.scale.width
    const screenHeight = this.scene.scale.height

    // Fade overlay
    const overlay = this.scene.add.rectangle(
      screenWidth / 2,
      screenHeight / 2,
      screenWidth * 2,
      screenHeight * 2,
      0x000000,
      0
    ).setScrollFactor(0).setDepth(9990)

    // Floor text
    const floorText = this.scene.add.text(
      screenWidth / 2,
      screenHeight / 2,
      `FLOOR ${floorNumber}`,
      {
        fontSize: '72px',
        color: '#00d9ff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 8
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(9991).setAlpha(0)

    // Animate
    this.scene.tweens.add({
      targets: overlay,
      fillAlpha: 0.7,
      duration: 300,
      yoyo: true,
      hold: 800,
      ease: 'Cubic.easeInOut',
      onComplete: () => overlay.destroy()
    })

    this.scene.tweens.add({
      targets: floorText,
      alpha: 1,
      scale: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(500, () => {
          this.scene.tweens.add({
            targets: floorText,
            alpha: 0,
            scale: 1.5,
            duration: 400,
            ease: 'Cubic.easeIn',
            onComplete: () => floorText.destroy()
          })
        })
      }
    })
  }

  // ==================== ITEM PICKUP ====================

  /**
   * Create item pickup sparkle effect
   */
  createItemPickupEffect(x: number, y: number, rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary') {
    const colors: Record<string, number> = {
      common: 0xbdc3c7,
      uncommon: 0x2ecc71,
      rare: 0x3498db,
      epic: 0x9b59b6,
      legendary: 0xf1c40f
    }

    const color = colors[rarity] || 0xffffff
    const particleCount = rarity === 'legendary' ? 20 : rarity === 'epic' ? 15 : 10

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const speed = Phaser.Math.Between(40, 100)

      const star = this.scene.add.star(x, y, 5, 2, 5, color)
        .setDepth(5500)

      this.scene.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        rotation: Phaser.Math.FloatBetween(-2, 2),
        duration: Phaser.Math.Between(400, 700),
        ease: 'Cubic.easeOut',
        onComplete: () => star.destroy()
      })
    }

    if (rarity === 'legendary') {
      this.screenFlash(color, 0.3, 200)
      this.shakeScreen('light')
    }
  }

  destroy() {
    this.damageNumbers.destroy(true)
    this.particles.destroy(true)
    this.vignetteOverlay?.destroy()
    this.screenFlashOverlay?.destroy()
  }
}
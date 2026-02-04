import * as Phaser from 'phaser'

/**
 * FloorThemes - Handles visual variety for different floor ranges
 * Each theme has unique colors, particles, and atmosphere
 */

export interface FloorTheme {
  name: string
  bgColor: number
  gridColor: number
  gridAlpha: number
  accentColor: number
  particleColors: number[]
  ambientParticles: boolean
  fogIntensity: number
  enemyTint?: number
  specialEffect?: 'rain' | 'snow' | 'fire' | 'electric' | 'void'
  music?: string
}

export const FLOOR_THEMES: Record<string, FloorTheme> = {
  // Floors 1-10: Training Grounds (Tutorial vibes)
  training: {
    name: 'Training Grounds',
    bgColor: 0x0a1929,
    gridColor: 0x05878a,
    gridAlpha: 0.15,
    accentColor: 0x00d9ff,
    particleColors: [0x00d9ff, 0x05878a],
    ambientParticles: false,
    fogIntensity: 0
  },

  // Floors 11-20: Underground Bunker
  bunker: {
    name: 'Underground Bunker',
    bgColor: 0x1a1a2e,
    gridColor: 0x3498db,
    gridAlpha: 0.12,
    accentColor: 0x3498db,
    particleColors: [0x3498db, 0x2980b9, 0x1abc9c],
    ambientParticles: true,
    fogIntensity: 0.1
  },

  // Floors 21-30: Toxic Wasteland
  toxic: {
    name: 'Toxic Wasteland',
    bgColor: 0x0d1f0d,
    gridColor: 0x2ecc71,
    gridAlpha: 0.2,
    accentColor: 0x27ae60,
    particleColors: [0x2ecc71, 0x27ae60, 0x9b59b6],
    ambientParticles: true,
    fogIntensity: 0.2,
    enemyTint: 0x88ff88,
    specialEffect: 'rain'
  },

  // Floors 31-40: Inferno
  inferno: {
    name: 'Inferno',
    bgColor: 0x2d0a0a,
    gridColor: 0xe74c3c,
    gridAlpha: 0.18,
    accentColor: 0xff6b00,
    particleColors: [0xff6b00, 0xe74c3c, 0xf39c12],
    ambientParticles: true,
    fogIntensity: 0.15,
    enemyTint: 0xff8888,
    specialEffect: 'fire'
  },

  // Floors 41-50: Frozen Labs
  frozen: {
    name: 'Frozen Labs',
    bgColor: 0x0a1929,
    gridColor: 0x3498db,
    gridAlpha: 0.25,
    accentColor: 0x74b9ff,
    particleColors: [0xffffff, 0x74b9ff, 0x3498db],
    ambientParticles: true,
    fogIntensity: 0.25,
    enemyTint: 0x88ccff,
    specialEffect: 'snow'
  },

  // Floors 51-60: Cyber Core
  cyber: {
    name: 'Cyber Core',
    bgColor: 0x0f0f23,
    gridColor: 0x00ff00,
    gridAlpha: 0.15,
    accentColor: 0x00ff00,
    particleColors: [0x00ff00, 0x00d9ff, 0xff00ff],
    ambientParticles: true,
    fogIntensity: 0.1,
    specialEffect: 'electric'
  },

  // Floors 61-70: Blood Arena
  arena: {
    name: 'Blood Arena',
    bgColor: 0x1a0a0a,
    gridColor: 0xc0392b,
    gridAlpha: 0.2,
    accentColor: 0xe74c3c,
    particleColors: [0xff0000, 0xcc0000, 0x990000],
    ambientParticles: true,
    fogIntensity: 0.15,
    enemyTint: 0xff6666
  },

  // Floors 71-80: Shadow Realm
  shadow: {
    name: 'Shadow Realm',
    bgColor: 0x0a0a0f,
    gridColor: 0x8e44ad,
    gridAlpha: 0.1,
    accentColor: 0x9b59b6,
    particleColors: [0x9b59b6, 0x8e44ad, 0x6c3483],
    ambientParticles: true,
    fogIntensity: 0.3,
    specialEffect: 'void'
  },

  // Floors 81-90: Golden Palace
  palace: {
    name: 'Golden Palace',
    bgColor: 0x1a1506,
    gridColor: 0xf1c40f,
    gridAlpha: 0.2,
    accentColor: 0xf39c12,
    particleColors: [0xf1c40f, 0xf39c12, 0xffffff],
    ambientParticles: true,
    fogIntensity: 0.1
  },

  // Floors 91-100: Final Ascent
  ascent: {
    name: 'Final Ascent',
    bgColor: 0x000000,
    gridColor: 0xff0000,
    gridAlpha: 0.25,
    accentColor: 0xff0000,
    particleColors: [0xff0000, 0xff6600, 0xf1c40f, 0xffffff],
    ambientParticles: true,
    fogIntensity: 0.2,
    enemyTint: 0xffaaaa,
    specialEffect: 'fire'
  }
}

/**
 * Get theme for a specific floor
 */
export function getThemeForFloor(floorNumber: number): FloorTheme {
  if (floorNumber <= 10) return FLOOR_THEMES.training
  if (floorNumber <= 20) return FLOOR_THEMES.bunker
  if (floorNumber <= 30) return FLOOR_THEMES.toxic
  if (floorNumber <= 40) return FLOOR_THEMES.inferno
  if (floorNumber <= 50) return FLOOR_THEMES.frozen
  if (floorNumber <= 60) return FLOOR_THEMES.cyber
  if (floorNumber <= 70) return FLOOR_THEMES.arena
  if (floorNumber <= 80) return FLOOR_THEMES.shadow
  if (floorNumber <= 90) return FLOOR_THEMES.palace
  return FLOOR_THEMES.ascent
}

/**
 * FloorThemeRenderer - Handles rendering theme-specific visuals
 */
export class FloorThemeRenderer {
  private scene: Phaser.Scene
  private currentTheme: FloorTheme | null = null
  private ambientParticleEmitters: Phaser.GameObjects.Container | null = null
  private bgGraphics: Phaser.GameObjects.Graphics | null = null
  private fogOverlay: Phaser.GameObjects.Rectangle | null = null
  private specialEffects: any[] = []

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /**
   * Apply a theme to the current scene
   */
  applyTheme(floorNumber: number, worldWidth: number, worldHeight: number) {
    const theme = getThemeForFloor(floorNumber)
    this.currentTheme = theme

    // Clear previous effects
    this.clearEffects()

    // Create background
    this.createBackground(theme, worldWidth, worldHeight)

    // Create grid
    this.createGrid(theme, worldWidth, worldHeight)

    // Create fog overlay
    this.createFog(theme)

    // Start ambient particles
    if (theme.ambientParticles) {
      this.startAmbientParticles(theme, worldWidth, worldHeight)
    }

    // Start special effects
    if (theme.specialEffect) {
      this.startSpecialEffect(theme.specialEffect, worldWidth, worldHeight)
    }

    return theme
  }

  private createBackground(theme: FloorTheme, width: number, height: number) {
    this.bgGraphics = this.scene.add.graphics()
    this.bgGraphics.fillStyle(theme.bgColor, 1)
    this.bgGraphics.fillRect(0, 0, width, height)
    this.bgGraphics.setDepth(-1000)
  }

  private createGrid(theme: FloorTheme, width: number, height: number) {
    const gridGraphics = this.scene.add.graphics()
    gridGraphics.lineStyle(1, theme.gridColor, theme.gridAlpha)

    const gridSize = 50

    // Vertical lines
    for (let x = 0; x < width; x += gridSize) {
      gridGraphics.lineBetween(x, 0, x, height)
    }

    // Horizontal lines
    for (let y = 0; y < height; y += gridSize) {
      gridGraphics.lineBetween(0, y, width, y)
    }

    gridGraphics.setDepth(-999)
    this.specialEffects.push(gridGraphics)
  }

  private createFog(theme: FloorTheme) {
    if (theme.fogIntensity > 0) {
      const width = this.scene.scale.width
      const height = this.scene.scale.height

      this.fogOverlay = this.scene.add.rectangle(
        width / 2, height / 2,
        width * 3, height * 3,
        theme.bgColor,
        theme.fogIntensity
      ).setScrollFactor(0).setDepth(4500)

      // IMPORTANT: Disable input on fog so it doesn't block clicks
      this.fogOverlay.disableInteractive()

      // Pulsing fog effect
      this.scene.tweens.add({
        targets: this.fogOverlay,
        alpha: theme.fogIntensity * 0.6,
        duration: 3000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }
  }

  private startAmbientParticles(theme: FloorTheme, worldWidth: number, worldHeight: number) {
    this.ambientParticleEmitters = this.scene.add.container(0, 0).setDepth(100)

    // Spawn particles periodically
    this.scene.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        if (!this.currentTheme) return

        const x = Phaser.Math.Between(0, worldWidth)
        const y = Phaser.Math.Between(0, worldHeight)
        const color = Phaser.Math.RND.pick(theme.particleColors)
        const size = Phaser.Math.Between(2, 5)

        const particle = this.scene.add.circle(x, y, size, color, 0.5)
        particle.setDepth(100)

        this.scene.tweens.add({
          targets: particle,
          y: y - 50,
          alpha: 0,
          duration: Phaser.Math.Between(2000, 4000),
          ease: 'Quad.easeOut',
          onComplete: () => particle.destroy()
        })
      }
    })
  }

  private startSpecialEffect(effect: string, worldWidth: number, worldHeight: number) {
    switch (effect) {
      case 'rain':
        this.createRainEffect(worldWidth, worldHeight)
        break
      case 'snow':
        this.createSnowEffect(worldWidth, worldHeight)
        break
      case 'fire':
        this.createFireEmbers(worldWidth, worldHeight)
        break
      case 'electric':
        this.createElectricEffect()
        break
      case 'void':
        this.createVoidEffect()
        break
    }
  }

  private createRainEffect(worldWidth: number, worldHeight: number) {
    this.scene.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        // Spawn rain relative to camera
        const camera = this.scene.cameras.main
        const x = camera.scrollX + Phaser.Math.Between(0, this.scene.scale.width)
        const y = camera.scrollY

        const drop = this.scene.add.line(0, 0, x, y, x - 5, y + 30, 0x3498db, 0.5)
        drop.setDepth(4000)

        this.scene.tweens.add({
          targets: drop,
          y: y + this.scene.scale.height + 50,
          duration: 500,
          ease: 'Linear',
          onComplete: () => drop.destroy()
        })
      }
    })
  }

  private createSnowEffect(worldWidth: number, worldHeight: number) {
    this.scene.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        const camera = this.scene.cameras.main
        const x = camera.scrollX + Phaser.Math.Between(0, this.scene.scale.width)
        const y = camera.scrollY

        const snowflake = this.scene.add.circle(x, y, Phaser.Math.Between(2, 5), 0xffffff, 0.8)
        snowflake.setDepth(4000)

        this.scene.tweens.add({
          targets: snowflake,
          x: x + Phaser.Math.Between(-100, 100),
          y: y + this.scene.scale.height + 50,
          alpha: 0,
          duration: Phaser.Math.Between(3000, 5000),
          ease: 'Linear',
          onComplete: () => snowflake.destroy()
        })
      }
    })
  }

  private createFireEmbers(worldWidth: number, worldHeight: number) {
    this.scene.time.addEvent({
      delay: 150,
      loop: true,
      callback: () => {
        const camera = this.scene.cameras.main
        const x = camera.scrollX + Phaser.Math.Between(0, this.scene.scale.width)
        const y = camera.scrollY + this.scene.scale.height

        const colors = [0xff6600, 0xff9900, 0xffcc00, 0xff3300]
        const ember = this.scene.add.circle(
          x, y,
          Phaser.Math.Between(2, 6),
          Phaser.Math.RND.pick(colors),
          0.8
        )
        ember.setDepth(4000)

        this.scene.tweens.add({
          targets: ember,
          x: x + Phaser.Math.Between(-50, 50),
          y: y - this.scene.scale.height - 100,
          alpha: 0,
          scale: 0,
          duration: Phaser.Math.Between(2000, 4000),
          ease: 'Quad.easeOut',
          onComplete: () => ember.destroy()
        })
      }
    })
  }

  private createElectricEffect() {
    this.scene.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        const camera = this.scene.cameras.main
        const x = camera.scrollX + Phaser.Math.Between(0, this.scene.scale.width)
        const y = camera.scrollY + Phaser.Math.Between(0, this.scene.scale.height)

        // Create lightning bolt effect
        const points: number[] = []
        let px = x
        let py = y

        for (let i = 0; i < 5; i++) {
          points.push(px, py)
          px += Phaser.Math.Between(-30, 30)
          py += 40
        }

        const bolt = this.scene.add.polygon(0, 0, points, 0x00ff00, 0)
        bolt.setStrokeStyle(2, 0x00ff00, 0.8)
        bolt.setDepth(4000)

        // Quick flash
        this.scene.tweens.add({
          targets: bolt,
          alpha: 0,
          duration: 150,
          onComplete: () => bolt.destroy()
        })
      }
    })
  }

  private createVoidEffect() {
    this.scene.time.addEvent({
      delay: 300,
      loop: true,
      callback: () => {
        const camera = this.scene.cameras.main
        const x = camera.scrollX + Phaser.Math.Between(0, this.scene.scale.width)
        const y = camera.scrollY + Phaser.Math.Between(0, this.scene.scale.height)

        const voidParticle = this.scene.add.circle(x, y, Phaser.Math.Between(5, 15), 0x9b59b6, 0)
        voidParticle.setStrokeStyle(2, 0x9b59b6, 0.6)
        voidParticle.setDepth(4000)

        this.scene.tweens.add({
          targets: voidParticle,
          scale: 0,
          alpha: 0.8,
          duration: 1500,
          ease: 'Cubic.easeIn',
          onComplete: () => voidParticle.destroy()
        })
      }
    })
  }

  /**
   * Get the current theme's enemy tint (if any)
   */
  getEnemyTint(): number | undefined {
    return this.currentTheme?.enemyTint
  }

  /**
   * Get the current theme's accent color
   */
  getAccentColor(): number {
    return this.currentTheme?.accentColor || 0x00d9ff
  }

  clearEffects() {
    this.bgGraphics?.destroy()
    this.fogOverlay?.destroy()
    this.ambientParticleEmitters?.destroy()
    this.specialEffects.forEach(e => e.destroy())
    this.specialEffects = []
  }

  destroy() {
    this.clearEffects()
  }
}

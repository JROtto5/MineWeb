import Phaser from 'phaser'

/**
 * Minimap - A real-time minimap showing player, enemies, and items
 */

export interface MinimapConfig {
  x: number
  y: number
  width: number
  height: number
  worldWidth: number
  worldHeight: number
  scale: number
  borderColor: number
  backgroundColor: number
  playerColor: number
  enemyColor: number
  bossColor: number
  itemColor: number
  npcColor: number
}

const DEFAULT_CONFIG: MinimapConfig = {
  x: -1,  // -1 means auto-position to top-right
  y: 20,
  width: 180,
  height: 120,
  worldWidth: 3000,
  worldHeight: 2000,
  scale: 1,
  borderColor: 0x00d9ff,
  backgroundColor: 0x0a1929,  // Darker blue instead of pure black for better visibility
  playerColor: 0x00ff00,      // Bright green for player (easier to see)
  enemyColor: 0xff4444,       // Bright red for enemies
  bossColor: 0xff00ff,
  itemColor: 0xf1c40f,
  npcColor: 0x2ecc71
}

export class Minimap {
  private scene: Phaser.Scene
  private config: MinimapConfig
  private container: Phaser.GameObjects.Container
  private background: Phaser.GameObjects.Rectangle
  private border: Phaser.GameObjects.Rectangle
  private mapGraphics: Phaser.GameObjects.Graphics
  private playerDot: Phaser.GameObjects.Arc
  private viewportRect: Phaser.GameObjects.Rectangle
  private enemyDots: Phaser.GameObjects.Arc[] = []
  private itemDots: Phaser.GameObjects.Arc[] = []
  private isExpanded: boolean = false
  private expandedScale: number = 2

  // References for updating
  private player: any = null
  private enemies: Phaser.GameObjects.Group | null = null
  private bosses: Phaser.GameObjects.Group | null = null
  private items: Phaser.GameObjects.Group | null = null

  constructor(scene: Phaser.Scene, config: Partial<MinimapConfig> = {}) {
    this.scene = scene
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Auto-position to top-right if x is -1
    let posX = this.config.x
    if (posX === -1) {
      posX = scene.scale.width - this.config.width - 20
    }

    // Create container in top-right corner
    this.container = scene.add.container(posX, this.config.y)
      .setScrollFactor(0)
      .setDepth(8000)

    // Background - more visible with higher alpha
    this.background = scene.add.rectangle(
      0, 0,
      this.config.width, this.config.height,
      this.config.backgroundColor, 0.9
    ).setOrigin(0, 0)

    // Border - thicker and brighter
    this.border = scene.add.rectangle(
      0, 0,
      this.config.width, this.config.height
    ).setOrigin(0, 0)
      .setStrokeStyle(3, this.config.borderColor, 1)
      .setFillStyle(0x000000, 0)

    // Map graphics for dynamic elements
    this.mapGraphics = scene.add.graphics()

    // Player dot (always visible, pulsing) - larger for visibility
    this.playerDot = scene.add.arc(0, 0, 8, 0, 360, false, this.config.playerColor)
      .setStrokeStyle(3, 0xffffff)

    // Viewport rectangle (shows camera bounds)
    this.viewportRect = scene.add.rectangle(0, 0, 50, 40)
      .setStrokeStyle(1, 0xffffff, 0.5)
      .setFillStyle(0x000000, 0)
      .setOrigin(0, 0)

    // Add all to container
    this.container.add([
      this.background,
      this.border,
      this.mapGraphics,
      this.viewportRect,
      this.playerDot
    ])

    // Add pulsing animation to player dot
    scene.tweens.add({
      targets: this.playerDot,
      scale: { from: 0.8, to: 1.2 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Floor text
    const floorText = scene.add.text(
      this.config.width / 2, -15,
      'FLOOR 1',
      {
        fontSize: '14px',
        color: '#00d9ff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5, 0.5)
    this.container.add(floorText)

    // Legend
    this.createLegend()

    // Make interactive for expand/collapse
    this.background.setInteractive()
    this.background.on('pointerdown', () => this.toggleExpand())
  }

  private createLegend() {
    const legendY = this.config.height + 10

    const legendItems = [
      { color: this.config.playerColor, label: 'You' },
      { color: this.config.enemyColor, label: 'Enemy' },
      { color: this.config.bossColor, label: 'Boss' },
      { color: this.config.itemColor, label: 'Item' }
    ]

    legendItems.forEach((item, index) => {
      const x = index * 50
      const dot = this.scene.add.arc(x + 5, legendY + 6, 4, 0, 360, false, item.color)
      const label = this.scene.add.text(x + 12, legendY, item.label, {
        fontSize: '10px',
        color: '#888888'
      })
      this.container.add([dot, label])
    })
  }

  /**
   * Set references to game objects for tracking
   */
  setTrackables(player: any, enemies: Phaser.GameObjects.Group, bosses: Phaser.GameObjects.Group, items?: Phaser.GameObjects.Group) {
    this.player = player
    this.enemies = enemies
    this.bosses = bosses
    this.items = items || null
  }

  /**
   * Update the minimap (call every frame)
   */
  update() {
    if (!this.player) return

    this.mapGraphics.clear()

    // Calculate scale factors
    const scaleX = this.config.width / this.config.worldWidth
    const scaleY = this.config.height / this.config.worldHeight

    // Update player position
    const playerMapX = this.player.x * scaleX
    const playerMapY = this.player.y * scaleY
    this.playerDot.setPosition(playerMapX, playerMapY)

    // Update viewport rectangle
    const camera = this.scene.cameras.main
    const viewX = camera.scrollX * scaleX
    const viewY = camera.scrollY * scaleY
    const viewW = camera.width * scaleX
    const viewH = camera.height * scaleY
    this.viewportRect.setPosition(viewX, viewY)
    this.viewportRect.setSize(viewW, viewH)

    // Draw enemies
    if (this.enemies) {
      this.enemies.children.entries.forEach((enemy: any) => {
        if (enemy.active) {
          const ex = enemy.x * scaleX
          const ey = enemy.y * scaleY
          this.mapGraphics.fillStyle(this.config.enemyColor, 0.8)
          this.mapGraphics.fillCircle(ex, ey, 3)
        }
      })
    }

    // Draw bosses (larger, pulsing)
    if (this.bosses) {
      this.bosses.children.entries.forEach((boss: any) => {
        if (boss.active) {
          const bx = boss.x * scaleX
          const by = boss.y * scaleY
          const pulse = 4 + Math.sin(this.scene.time.now / 200) * 2

          // Glow effect
          this.mapGraphics.fillStyle(this.config.bossColor, 0.3)
          this.mapGraphics.fillCircle(bx, by, pulse + 4)

          // Main dot
          this.mapGraphics.fillStyle(this.config.bossColor, 1)
          this.mapGraphics.fillCircle(bx, by, pulse)
        }
      })
    }

    // Draw items
    if (this.items) {
      this.items.children.entries.forEach((item: any) => {
        if (item.active) {
          const ix = item.x * scaleX
          const iy = item.y * scaleY

          // Diamond shape for items
          this.mapGraphics.fillStyle(this.config.itemColor, 0.9)
          this.mapGraphics.fillPoints([
            { x: ix, y: iy - 3 },
            { x: ix + 3, y: iy },
            { x: ix, y: iy + 3 },
            { x: ix - 3, y: iy }
          ], true)
        }
      })
    }

    // Draw cardinal directions
    this.drawCompass(scaleX, scaleY)
  }

  private drawCompass(scaleX: number, scaleY: number) {
    const cx = this.config.width - 20
    const cy = 20

    // N indicator
    this.mapGraphics.fillStyle(0xffffff, 0.6)
    this.mapGraphics.fillTriangle(
      cx, cy - 8,
      cx - 4, cy,
      cx + 4, cy
    )
  }

  /**
   * Toggle between normal and expanded view
   */
  toggleExpand() {
    this.isExpanded = !this.isExpanded

    if (this.isExpanded) {
      this.scene.tweens.add({
        targets: this.container,
        scaleX: this.expandedScale,
        scaleY: this.expandedScale,
        duration: 200,
        ease: 'Back.easeOut'
      })
    } else {
      this.scene.tweens.add({
        targets: this.container,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Back.easeIn'
      })
    }
  }

  /**
   * Update floor display
   */
  setFloor(floorNumber: number) {
    const floorText = this.container.getAt(6) as Phaser.GameObjects.Text
    if (floorText) {
      floorText.setText(`FLOOR ${floorNumber}`)

      // Color based on floor range
      if (floorNumber >= 91) floorText.setColor('#ff0000')
      else if (floorNumber >= 71) floorText.setColor('#9b59b6')
      else if (floorNumber >= 51) floorText.setColor('#00ff00')
      else if (floorNumber >= 31) floorText.setColor('#ff6600')
      else floorText.setColor('#00d9ff')
    }
  }

  /**
   * Update world dimensions (for different floor sizes)
   */
  setWorldSize(width: number, height: number) {
    this.config.worldWidth = width
    this.config.worldHeight = height
  }

  /**
   * Show/hide minimap
   */
  setVisible(visible: boolean) {
    this.container.setVisible(visible)
  }

  /**
   * Flash a location on minimap (for important events)
   */
  flashLocation(worldX: number, worldY: number, color: number = 0xffffff) {
    const scaleX = this.config.width / this.config.worldWidth
    const scaleY = this.config.height / this.config.worldHeight

    const mapX = worldX * scaleX
    const mapY = worldY * scaleY

    const flash = this.scene.add.circle(mapX, mapY, 15, color, 0.8)
    this.container.add(flash)

    this.scene.tweens.add({
      targets: flash,
      scale: 0,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    })
  }

  /**
   * Add a ping to the minimap
   */
  ping(worldX: number, worldY: number, text?: string) {
    const scaleX = this.config.width / this.config.worldWidth
    const scaleY = this.config.height / this.config.worldHeight

    const mapX = worldX * scaleX
    const mapY = worldY * scaleY

    // Expanding ring
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.circle(mapX, mapY, 5, 0xffffff, 0)
        .setStrokeStyle(2, 0xffffff)
      this.container.add(ring)

      this.scene.tweens.add({
        targets: ring,
        scale: 3,
        alpha: 0,
        duration: 800,
        delay: i * 200,
        ease: 'Quad.easeOut',
        onComplete: () => ring.destroy()
      })
    }

    // Optional text label
    if (text) {
      const label = this.scene.add.text(mapX, mapY - 15, text, {
        fontSize: '10px',
        color: '#ffffff',
        backgroundColor: '#000000'
      }).setOrigin(0.5)
      this.container.add(label)

      this.scene.tweens.add({
        targets: label,
        y: mapY - 25,
        alpha: 0,
        duration: 2000,
        onComplete: () => label.destroy()
      })
    }
  }

  destroy() {
    this.container.destroy()
  }
}

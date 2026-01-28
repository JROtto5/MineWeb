import Phaser from 'phaser'

export interface WeaponType {
  name: string
  damage: number
  fireRate: number
  ammo: number
  maxAmmo: number
}

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  public damage: number

  constructor(scene: Phaser.Scene, x: number, y: number, damage: number) {
    super(scene, x, y, '')

    this.damage = damage

    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Create bullet visual
    const graphics = scene.make.graphics({ x: 0, y: 0 }, false)
    graphics.fillStyle(0xffff00, 1)
    graphics.fillCircle(4, 4, 4)
    graphics.generateTexture('bullet', 8, 8)
    graphics.destroy()

    this.setTexture('bullet')
    this.setSize(8, 8)

    // Add glow effect
    this.setTint(0xffff00)
  }

  fire(angle: number) {
    const speed = 600

    this.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    )

    this.setRotation(angle)

    // Destroy after 2 seconds
    this.scene.time.delayedCall(2000, () => {
      if (this.active) {
        this.destroy()
      }
    })
  }
}

export class WeaponSystem {
  public bullets: Phaser.GameObjects.Group

  constructor(private scene: Phaser.Scene) {
    this.bullets = scene.add.group({
      classType: Bullet,
      maxSize: 100,
      runChildUpdate: false,
    })
  }

  fireBullet(x: number, y: number, angle: number, damage: number) {
    const bullet = this.bullets.get(x, y, '', undefined, true) as Bullet

    if (bullet) {
      bullet.damage = damage
      bullet.fire(angle)

      // Muzzle flash
      this.createMuzzleFlash(x, y, angle)
    }
  }

  private createMuzzleFlash(x: number, y: number, angle: number) {
    const flash = this.scene.add.circle(
      x + Math.cos(angle) * 20,
      y + Math.sin(angle) * 20,
      8,
      0xffff00,
      0.8
    )

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 100,
      onComplete: () => flash.destroy(),
    })
  }

  update(time: number, delta: number) {
    // Clean up off-screen bullets
    this.bullets.children.entries.forEach((bullet: any) => {
      if (bullet.active) {
        const cam = this.scene.cameras.main
        const worldView = cam.worldView

        if (
          bullet.x < worldView.x - 100 ||
          bullet.x > worldView.x + worldView.width + 100 ||
          bullet.y < worldView.y - 100 ||
          bullet.y > worldView.y + worldView.height + 100
        ) {
          bullet.destroy()
        }
      }
    })
  }
}

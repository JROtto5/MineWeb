import Phaser from 'phaser'
import Player from './Player'

export enum PowerUpType {
  HEALTH = 'health',
  AMMO = 'ammo',
  DAMAGE_BOOST = 'damage_boost',
  SPEED_BOOST = 'speed_boost',
  INVINCIBILITY = 'invincibility',
  MULTI_SHOT = 'multi_shot',
  RAPID_FIRE = 'rapid_fire',
}

interface PowerUpConfig {
  color: number
  icon: string
  duration?: number
  value?: number
}

const POWERUP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  [PowerUpType.HEALTH]: { color: 0x2ecc71, icon: '❤️', value: 50 },
  [PowerUpType.AMMO]: { color: 0xf39c12, icon: '📦', value: 100 },
  [PowerUpType.DAMAGE_BOOST]: { color: 0xe74c3c, icon: '💥', duration: 10000 },
  [PowerUpType.SPEED_BOOST]: { color: 0x3498db, icon: '⚡', duration: 8000 },
  [PowerUpType.INVINCIBILITY]: { color: 0xf1c40f, icon: '🛡️', duration: 5000 },
  [PowerUpType.MULTI_SHOT]: { color: 0x9b59b6, icon: '🎯', duration: 12000 },
  [PowerUpType.RAPID_FIRE]: { color: 0xe67e22, icon: '🔫', duration: 10000 },
}

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  private powerUpType: PowerUpType
  private icon: Phaser.GameObjects.Text

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: PowerUpType
  ) {
    super(scene, x, y, '')

    this.powerUpType = type
    const config = POWERUP_CONFIGS[type]

    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Create visual
    this.createVisual(config.color)

    // Icon
    this.icon = scene.add.text(x, y, config.icon, {
      fontSize: '24px',
    }).setOrigin(0.5)

    // Floating animation
    scene.tweens.add({
      targets: this,
      y: y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    scene.tweens.add({
      targets: this.icon,
      y: y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // Pulse effect
    scene.tweens.add({
      targets: this,
      scale: 1.2,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // Auto-despawn after 20 seconds
    scene.time.delayedCall(20000, () => {
      if (this.active) {
        this.fadeAndDestroy()
      }
    })
  }

  private createVisual(color: number) {
    const graphics = this.scene.make.graphics({ x: 0, y: 0 }, false)

    // Glowing circle
    graphics.fillStyle(color, 0.8)
    graphics.fillCircle(16, 16, 16)

    // Outline glow
    graphics.lineStyle(3, color, 0.5)
    graphics.strokeCircle(16, 16, 18)

    graphics.generateTexture(`powerup_${this.powerUpType}`, 32, 32)
    graphics.destroy()

    this.setTexture(`powerup_${this.powerUpType}`)
  }

  collect(player: Player): void {
    const config = POWERUP_CONFIGS[this.powerUpType]

    switch (this.powerUpType) {
      case PowerUpType.HEALTH:
        player.heal(config.value!)
        this.emitMessage(`+${config.value} Health!`, 'success')
        break
      case PowerUpType.AMMO:
        player.addAmmo(config.value!)
        this.emitMessage(`+${config.value} Ammo!`, 'success')
        break
      case PowerUpType.DAMAGE_BOOST:
        player.activateDamageBoost(config.duration!)
        this.emitMessage('Damage Boost Activated!', 'success')
        break
      case PowerUpType.SPEED_BOOST:
        player.activateSpeedBoost(config.duration!)
        this.emitMessage('Speed Boost Activated!', 'success')
        break
      case PowerUpType.INVINCIBILITY:
        player.activateInvincibility(config.duration!)
        this.emitMessage('Invincibility Activated!', 'success')
        break
      case PowerUpType.MULTI_SHOT:
        player.activateMultiShot(config.duration!)
        this.emitMessage('Multi-Shot Activated!', 'success')
        break
      case PowerUpType.RAPID_FIRE:
        player.activateRapidFire(config.duration!)
        this.emitMessage('Rapid Fire Activated!', 'success')
        break
    }

    // Collect effect
    this.scene.tweens.add({
      targets: [this, this.icon],
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.icon.destroy()
        this.destroy()
      },
    })

    // Particle burst
    this.createCollectEffect()
  }

  private createCollectEffect() {
    const config = POWERUP_CONFIGS[this.powerUpType]

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const particle = this.scene.add.circle(
        this.x,
        this.y,
        4,
        config.color
      )

      this.scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(angle) * 50,
        y: this.y + Math.sin(angle) * 50,
        alpha: 0,
        duration: 500,
        onComplete: () => particle.destroy(),
      })
    }
  }

  private fadeAndDestroy() {
    this.scene.tweens.add({
      targets: [this, this.icon],
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        this.icon.destroy()
        this.destroy()
      },
    })
  }

  private emitMessage(text: string, type: string) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gameEvent', {
        detail: {
          type: 'message',
          data: { text, type }
        }
      }))
    }
  }
}

export class PowerUpManager {
  private scene: Phaser.Scene
  public powerUps: Phaser.GameObjects.Group

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.powerUps = scene.add.group()
  }

  spawnRandomPowerUp(x: number, y: number) {
    const types = Object.values(PowerUpType)
    const randomType = Phaser.Math.RND.pick(types)
    const powerUp = new PowerUp(this.scene, x, y, randomType)
    this.powerUps.add(powerUp)
  }

  spawnPowerUp(x: number, y: number, type: PowerUpType) {
    const powerUp = new PowerUp(this.scene, x, y, type)
    this.powerUps.add(powerUp)
  }

  // Chance to drop power-up from enemy
  tryDropPowerUp(x: number, y: number): void {
    // 30% chance to drop
    if (Math.random() < 0.3) {
      this.spawnRandomPowerUp(x, y)
    }
  }
}

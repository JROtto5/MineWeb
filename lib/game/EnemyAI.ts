import * as Phaser from 'phaser'

/**
 * EnemyAI - Advanced AI behaviors for enemies
 * Includes flanking, formations, and tactical movement
 */

export enum AIBehavior {
  CHASE = 'chase',           // Direct chase
  FLANK = 'flank',           // Circle around player
  KITE = 'kite',             // Keep distance, shoot
  SWARM = 'swarm',           // Move in groups
  AMBUSH = 'ambush',         // Wait then burst
  PATROL = 'patrol',         // Move between points
  RETREAT = 'retreat',       // Run away when low health
  CIRCLE_STRAFE = 'circle',  // Orbit player
}

export enum AIState {
  IDLE = 'idle',
  PURSUING = 'pursuing',
  ATTACKING = 'attacking',
  RETREATING = 'retreating',
  FLANKING = 'flanking',
  WAITING = 'waiting'
}

export interface AIConfig {
  behavior: AIBehavior
  aggroRange: number
  attackRange: number
  optimalRange: number
  retreatHealthPercent: number
  flankingSpeed: number
  reactionTime: number // ms before reacting to player movement
  accuracy: number // 0-1, affects shooting prediction
  groupId?: number // For swarm behavior
}

export const AI_PRESETS: Record<string, AIConfig> = {
  grunt: {
    behavior: AIBehavior.CHASE,
    aggroRange: 500,
    attackRange: 100,
    optimalRange: 80,
    retreatHealthPercent: 0,
    flankingSpeed: 1,
    reactionTime: 200,
    accuracy: 0.5
  },
  scout: {
    behavior: AIBehavior.CIRCLE_STRAFE,
    aggroRange: 400,
    attackRange: 150,
    optimalRange: 120,
    retreatHealthPercent: 0.2,
    flankingSpeed: 1.5,
    reactionTime: 100,
    accuracy: 0.6
  },
  tank: {
    behavior: AIBehavior.CHASE,
    aggroRange: 600,
    attackRange: 80,
    optimalRange: 50,
    retreatHealthPercent: 0,
    flankingSpeed: 0.5,
    reactionTime: 400,
    accuracy: 0.3
  },
  sniper: {
    behavior: AIBehavior.KITE,
    aggroRange: 800,
    attackRange: 600,
    optimalRange: 450,
    retreatHealthPercent: 0.3,
    flankingSpeed: 0.8,
    reactionTime: 150,
    accuracy: 0.9
  },
  berserker: {
    behavior: AIBehavior.CHASE,
    aggroRange: 700,
    attackRange: 120,
    optimalRange: 30,
    retreatHealthPercent: 0, // Never retreats, goes berserk instead
    flankingSpeed: 2,
    reactionTime: 50,
    accuracy: 0.4
  },
  elite: {
    behavior: AIBehavior.FLANK,
    aggroRange: 600,
    attackRange: 200,
    optimalRange: 150,
    retreatHealthPercent: 0.15,
    flankingSpeed: 1.3,
    reactionTime: 80,
    accuracy: 0.8
  }
}

export class EnemyAIController {
  private enemy: any
  private config: AIConfig
  private state: AIState = AIState.IDLE
  private target: any = null
  private lastDecisionTime: number = 0
  private decisionInterval: number = 500 // ms between AI decisions
  private flankDirection: number = 1 // 1 or -1 for clockwise/counterclockwise
  private patrolPoints: Phaser.Math.Vector2[] = []
  private currentPatrolIndex: number = 0
  private ambushTriggered: boolean = false
  private lastPlayerPosition: Phaser.Math.Vector2 | null = null
  private predictedPosition: Phaser.Math.Vector2 | null = null

  constructor(enemy: any, configName: string = 'grunt') {
    this.enemy = enemy
    this.config = { ...(AI_PRESETS[configName] || AI_PRESETS.grunt) }

    // Randomize flank direction
    this.flankDirection = Math.random() > 0.5 ? 1 : -1
  }

  setConfig(config: Partial<AIConfig>) {
    this.config = { ...this.config, ...config }
  }

  setTarget(target: any) {
    this.target = target
  }

  setPatrolPoints(points: Phaser.Math.Vector2[]) {
    this.patrolPoints = points
  }

  /**
   * Main AI update - call every frame
   */
  update(time: number, delta: number): { velocityX: number; velocityY: number; shouldAttack: boolean; targetAngle: number } {
    if (!this.target || !this.target.active) {
      return { velocityX: 0, velocityY: 0, shouldAttack: false, targetAngle: 0 }
    }

    // Make decisions at intervals to prevent jittery movement
    if (time - this.lastDecisionTime > this.decisionInterval) {
      this.makeDecision(time)
      this.lastDecisionTime = time
    }

    // Update predicted position for aiming
    this.updatePredictedPosition(delta)

    // Execute current state
    return this.executeState(time, delta)
  }

  private makeDecision(time: number) {
    const distanceToTarget = this.getDistanceToTarget()
    const healthPercent = this.enemy.health / this.enemy.maxHealth

    // Check for state transitions
    if (healthPercent <= this.config.retreatHealthPercent && this.config.retreatHealthPercent > 0) {
      this.state = AIState.RETREATING
      return
    }

    if (distanceToTarget > this.config.aggroRange) {
      this.state = AIState.IDLE
      return
    }

    // Behavior-specific state selection
    switch (this.config.behavior) {
      case AIBehavior.CHASE:
        this.state = distanceToTarget <= this.config.attackRange ? AIState.ATTACKING : AIState.PURSUING
        break

      case AIBehavior.FLANK:
        if (distanceToTarget <= this.config.optimalRange) {
          this.state = AIState.ATTACKING
        } else if (distanceToTarget <= this.config.aggroRange * 0.6) {
          this.state = AIState.FLANKING
        } else {
          this.state = AIState.PURSUING
        }
        break

      case AIBehavior.KITE:
        if (distanceToTarget < this.config.optimalRange * 0.7) {
          this.state = AIState.RETREATING
        } else if (distanceToTarget <= this.config.attackRange) {
          this.state = AIState.ATTACKING
        } else {
          this.state = AIState.PURSUING
        }
        break

      case AIBehavior.CIRCLE_STRAFE:
        if (distanceToTarget <= this.config.attackRange) {
          this.state = AIState.FLANKING
        } else {
          this.state = AIState.PURSUING
        }
        break

      case AIBehavior.AMBUSH:
        if (!this.ambushTriggered && distanceToTarget <= this.config.aggroRange * 0.5) {
          this.ambushTriggered = true
          this.state = AIState.PURSUING
        } else if (this.ambushTriggered) {
          this.state = distanceToTarget <= this.config.attackRange ? AIState.ATTACKING : AIState.PURSUING
        } else {
          this.state = AIState.WAITING
        }
        break

      default:
        this.state = AIState.PURSUING
    }
  }

  private executeState(time: number, delta: number): { velocityX: number; velocityY: number; shouldAttack: boolean; targetAngle: number } {
    let velocityX = 0
    let velocityY = 0
    let shouldAttack = false
    let targetAngle = this.getAngleToTarget()

    switch (this.state) {
      case AIState.IDLE:
        // No movement
        break

      case AIState.PURSUING:
        const pursueResult = this.pursueTarget()
        velocityX = pursueResult.x
        velocityY = pursueResult.y
        break

      case AIState.ATTACKING:
        // Stay mostly still while attacking (with slight movement variance)
        const attackResult = this.attackingMovement()
        velocityX = attackResult.x
        velocityY = attackResult.y
        shouldAttack = true

        // Aim at predicted position for better accuracy
        if (this.predictedPosition) {
          targetAngle = Phaser.Math.Angle.Between(
            this.enemy.x, this.enemy.y,
            this.predictedPosition.x, this.predictedPosition.y
          )
        }
        break

      case AIState.RETREATING:
        const retreatResult = this.retreatFromTarget()
        velocityX = retreatResult.x
        velocityY = retreatResult.y
        // Can still attack while retreating
        shouldAttack = this.getDistanceToTarget() <= this.config.attackRange
        break

      case AIState.FLANKING:
        const flankResult = this.flankTarget()
        velocityX = flankResult.x
        velocityY = flankResult.y
        shouldAttack = this.getDistanceToTarget() <= this.config.attackRange
        break

      case AIState.WAITING:
        // Ambush waiting - don't move
        break
    }

    return { velocityX, velocityY, shouldAttack, targetAngle }
  }

  private pursueTarget(): Phaser.Math.Vector2 {
    const angle = this.getAngleToTarget()
    const speed = this.enemy.speed || 100

    return new Phaser.Math.Vector2(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    )
  }

  private retreatFromTarget(): Phaser.Math.Vector2 {
    const angle = this.getAngleToTarget() + Math.PI // Opposite direction
    const speed = (this.enemy.speed || 100) * 0.8 // Slightly slower when retreating

    return new Phaser.Math.Vector2(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    )
  }

  private flankTarget(): Phaser.Math.Vector2 {
    const angleToTarget = this.getAngleToTarget()
    const distance = this.getDistanceToTarget()

    // Calculate perpendicular angle for strafing
    const strafeAngle = angleToTarget + (Math.PI / 2) * this.flankDirection
    const speed = (this.enemy.speed || 100) * this.config.flankingSpeed

    // Mix of approach and strafe based on distance
    const approachFactor = Math.max(0, (distance - this.config.optimalRange) / this.config.optimalRange)
    const strafeFactor = 1 - approachFactor

    const vx = Math.cos(angleToTarget) * speed * approachFactor + Math.cos(strafeAngle) * speed * strafeFactor
    const vy = Math.sin(angleToTarget) * speed * approachFactor + Math.sin(strafeAngle) * speed * strafeFactor

    // Occasionally switch flanking direction
    if (Math.random() < 0.01) {
      this.flankDirection *= -1
    }

    return new Phaser.Math.Vector2(vx, vy)
  }

  private attackingMovement(): Phaser.Math.Vector2 {
    // Small random movement while attacking to be less predictable
    const speed = (this.enemy.speed || 100) * 0.2
    const randomAngle = Math.random() * Math.PI * 2

    return new Phaser.Math.Vector2(
      Math.cos(randomAngle) * speed * 0.5,
      Math.sin(randomAngle) * speed * 0.5
    )
  }

  private updatePredictedPosition(delta: number) {
    if (!this.target) return

    const currentPos = new Phaser.Math.Vector2(this.target.x, this.target.y)

    if (this.lastPlayerPosition) {
      // Calculate player velocity
      const velocityX = (currentPos.x - this.lastPlayerPosition.x) / (delta / 1000)
      const velocityY = (currentPos.y - this.lastPlayerPosition.y) / (delta / 1000)

      // Predict where player will be based on accuracy
      const predictionTime = this.config.reactionTime / 1000 * this.config.accuracy
      this.predictedPosition = new Phaser.Math.Vector2(
        currentPos.x + velocityX * predictionTime,
        currentPos.y + velocityY * predictionTime
      )
    } else {
      this.predictedPosition = currentPos.clone()
    }

    this.lastPlayerPosition = currentPos.clone()
  }

  private getDistanceToTarget(): number {
    if (!this.target) return Infinity
    return Phaser.Math.Distance.Between(
      this.enemy.x, this.enemy.y,
      this.target.x, this.target.y
    )
  }

  private getAngleToTarget(): number {
    if (!this.target) return 0
    return Phaser.Math.Angle.Between(
      this.enemy.x, this.enemy.y,
      this.target.x, this.target.y
    )
  }

  getState(): AIState {
    return this.state
  }

  getPredictedPosition(): Phaser.Math.Vector2 | null {
    return this.predictedPosition
  }
}

/**
 * FormationManager - Coordinates group movement for swarm-type enemies
 */
export class FormationManager {
  private members: any[] = []
  private formationType: 'circle' | 'line' | 'wedge' = 'circle'
  private formationRadius: number = 100
  private targetPosition: Phaser.Math.Vector2 | null = null

  addMember(enemy: any) {
    this.members.push(enemy)
  }

  removeMember(enemy: any) {
    this.members = this.members.filter(m => m !== enemy)
  }

  setFormation(type: 'circle' | 'line' | 'wedge', radius: number = 100) {
    this.formationType = type
    this.formationRadius = radius
  }

  setTarget(x: number, y: number) {
    this.targetPosition = new Phaser.Math.Vector2(x, y)
  }

  /**
   * Get formation position for a specific member
   */
  getPositionForMember(memberIndex: number): Phaser.Math.Vector2 | null {
    if (!this.targetPosition) return null

    const memberCount = this.members.length
    if (memberCount === 0) return null

    switch (this.formationType) {
      case 'circle':
        const angle = (memberIndex / memberCount) * Math.PI * 2
        return new Phaser.Math.Vector2(
          this.targetPosition.x + Math.cos(angle) * this.formationRadius,
          this.targetPosition.y + Math.sin(angle) * this.formationRadius
        )

      case 'line':
        const lineSpacing = this.formationRadius / memberCount
        return new Phaser.Math.Vector2(
          this.targetPosition.x + (memberIndex - memberCount / 2) * lineSpacing,
          this.targetPosition.y
        )

      case 'wedge':
        const row = Math.floor(memberIndex / 3)
        const col = memberIndex % 3
        return new Phaser.Math.Vector2(
          this.targetPosition.x + (col - 1) * 40 + row * 20,
          this.targetPosition.y + row * 50
        )

      default:
        return this.targetPosition.clone()
    }
  }

  update() {
    // Could add dynamic formation adjustments here
  }
}

/**
 * ThreatAssessment - Helps AI make tactical decisions
 */
export class ThreatAssessment {
  static assessThreat(enemy: any, player: any): number {
    let threat = 0

    // Distance factor (closer = more threat)
    const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y)
    threat += Math.max(0, 100 - distance) * 0.5

    // Player health factor
    const playerHealthPercent = player.health / player.maxHealth
    if (playerHealthPercent > 0.7) threat += 20
    if (playerHealthPercent > 0.9) threat += 20

    // Player weapon damage (if accessible)
    // threat += player.getCurrentDamage() * 0.1

    return threat
  }

  static shouldRetreat(enemy: any, threat: number): boolean {
    const healthPercent = enemy.health / enemy.maxHealth
    return healthPercent < 0.3 && threat > 50
  }

  static shouldGroupUp(enemies: any[], minGroupSize: number = 3): boolean {
    // Check if enemies are too spread out
    if (enemies.length < minGroupSize) return false

    let totalDist = 0
    let count = 0

    for (let i = 0; i < enemies.length; i++) {
      for (let j = i + 1; j < enemies.length; j++) {
        totalDist += Phaser.Math.Distance.Between(
          enemies[i].x, enemies[i].y,
          enemies[j].x, enemies[j].y
        )
        count++
      }
    }

    const avgDist = totalDist / count
    return avgDist > 300 // Group up if too spread out
  }
}

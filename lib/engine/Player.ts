import * as THREE from 'three'
import { InputManager } from './InputManager'
import { World } from './World'

export class Player {
  public camera: THREE.PerspectiveCamera
  public position: THREE.Vector3
  public velocity: THREE.Vector3
  private direction: THREE.Vector3
  private rotation: THREE.Euler

  // Movement settings
  private walkSpeed = 4.3
  private sprintSpeed = 5.6
  private jumpForce = 8.0
  private gravity = -20.0

  // Camera settings
  private mouseSensitivity = 0.002

  // Physics
  private onGround = false
  private readonly playerHeight = 1.8
  private readonly playerWidth = 0.6

  constructor(canvas: HTMLCanvasElement) {
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV
      window.innerWidth / window.innerHeight,
      0.1, // Near
      1000 // Far
    )

    // Initialize position and velocity
    this.position = new THREE.Vector3(0, 40, 0) // Start at y=40
    this.velocity = new THREE.Vector3(0, 0, 0)
    this.direction = new THREE.Vector3(0, 0, 0)
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ')

    // Set camera position
    this.camera.position.copy(this.position)
    this.camera.rotation.copy(this.rotation)
  }

  update(deltaTime: number, input: InputManager, world: World) {
    // Update camera rotation from mouse
    this.updateRotation(input)

    // Handle movement
    this.updateMovement(deltaTime, input)

    // Apply physics
    this.applyPhysics(deltaTime, world)

    // Handle block interaction
    this.handleBlockInteraction(input, world)

    // Update camera position
    this.camera.position.copy(this.position)
    this.camera.rotation.copy(this.rotation)
  }

  private handleBlockInteraction(input: InputManager, world: World) {
    const mouseButtons = input.getMouseButtons()

    // Break block (left click)
    if (mouseButtons.left) {
      const raycast = this.getRaycastBlock(world)
      if (raycast) {
        world.setBlock(raycast.position.x, raycast.position.y, raycast.position.z, 0)
        console.log(`Broke block at (${raycast.position.x}, ${raycast.position.y}, ${raycast.position.z})`)
      }
      input.resetMouseButtons()
    }

    // Place block (right click)
    if (mouseButtons.right) {
      const raycast = this.getRaycastBlock(world)
      if (raycast) {
        // Place block adjacent to hit face
        const placePos = raycast.position.clone().add(raycast.normal)
        world.setBlock(placePos.x, placePos.y, placePos.z, 1) // Place grass block
        console.log(`Placed block at (${placePos.x}, ${placePos.y}, ${placePos.z})`)
      }
      input.resetMouseButtons()
    }
  }

  private updateRotation(input: InputManager) {
    const mouseDelta = input.getMouseDelta()

    // Horizontal rotation (yaw)
    this.rotation.y -= mouseDelta.x * this.mouseSensitivity

    // Vertical rotation (pitch)
    this.rotation.x -= mouseDelta.y * this.mouseSensitivity

    // Clamp vertical rotation
    this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x))
  }

  private updateMovement(deltaTime: number, input: InputManager) {
    const keys = input.getKeys()

    // Determine movement speed
    const speed = keys.shift ? this.sprintSpeed : this.walkSpeed

    // Calculate movement direction
    this.direction.set(0, 0, 0)

    if (keys.forward) this.direction.z -= 1
    if (keys.backward) this.direction.z += 1
    if (keys.left) this.direction.x -= 1
    if (keys.right) this.direction.x += 1

    // Normalize diagonal movement
    if (this.direction.length() > 0) {
      this.direction.normalize()
    }

    // Rotate direction based on camera yaw
    const yaw = this.rotation.y
    const moveX = this.direction.x * Math.cos(yaw) - this.direction.z * Math.sin(yaw)
    const moveZ = this.direction.x * Math.sin(yaw) + this.direction.z * Math.cos(yaw)

    // Apply horizontal velocity
    this.velocity.x = moveX * speed
    this.velocity.z = moveZ * speed

    // Jumping
    if (keys.jump && this.onGround) {
      this.velocity.y = this.jumpForce
      this.onGround = false
    }
  }

  private applyPhysics(deltaTime: number, world: World) {
    // Apply gravity
    if (!this.onGround) {
      this.velocity.y += this.gravity * deltaTime
    }

    // Apply velocity
    const newPosition = this.position.clone()
    newPosition.add(this.velocity.clone().multiplyScalar(deltaTime))

    // Simple collision detection
    this.onGround = this.checkCollision(newPosition, world)

    // Update position
    this.position.copy(newPosition)

    // Stop vertical velocity when on ground
    if (this.onGround && this.velocity.y < 0) {
      this.velocity.y = 0
    }
  }

  private checkCollision(newPosition: THREE.Vector3, world: World): boolean {
    // Check block below player feet
    const feetY = Math.floor(newPosition.y - this.playerHeight / 2)
    const blockBelow = world.getBlock(
      Math.floor(newPosition.x),
      feetY,
      Math.floor(newPosition.z)
    )

    // If solid block below, we're on ground
    if (blockBelow !== 0) {
      // Snap to top of block
      newPosition.y = feetY + 1 + this.playerHeight / 2
      return true
    }

    return false
  }

  // Get the block the player is looking at
  getRaycastBlock(world: World, maxDistance = 5): { position: THREE.Vector3; normal: THREE.Vector3 } | null {
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera)

    // Step along ray
    const step = 0.1
    const direction = raycaster.ray.direction.clone()
    const position = raycaster.ray.origin.clone()

    for (let distance = 0; distance < maxDistance; distance += step) {
      position.add(direction.clone().multiplyScalar(step))

      const blockPos = new THREE.Vector3(
        Math.floor(position.x),
        Math.floor(position.y),
        Math.floor(position.z)
      )

      const block = world.getBlock(blockPos.x, blockPos.y, blockPos.z)
      if (block !== 0) {
        // Calculate face normal
        const fractional = new THREE.Vector3(
          position.x - blockPos.x,
          position.y - blockPos.y,
          position.z - blockPos.z
        )

        let normal = new THREE.Vector3(0, 0, 0)
        const threshold = 0.1

        if (fractional.x < threshold) normal.x = -1
        else if (fractional.x > 1 - threshold) normal.x = 1
        else if (fractional.y < threshold) normal.y = -1
        else if (fractional.y > 1 - threshold) normal.y = 1
        else if (fractional.z < threshold) normal.z = -1
        else if (fractional.z > 1 - threshold) normal.z = 1

        return { position: blockPos, normal }
      }
    }

    return null
  }
}

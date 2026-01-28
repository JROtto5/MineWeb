import * as THREE from 'three'
import { World } from './World'
import { Player } from './Player'
import { InputManager } from './InputManager'

export class Game {
  private canvas: HTMLCanvasElement
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private world: World
  private player: Player
  private inputManager: InputManager

  public isRunning: boolean = false
  private lastTime: number = 0
  private frameCount: number = 0
  private fps: number = 0
  private fpsTime: number = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false, // Disable for performance
    })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setClearColor(0x87CEEB) // Sky blue

    // Create scene
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog(0x87CEEB, 20, 100) // Distance fog

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4)
    directionalLight.position.set(1, 1, 0.5)
    this.scene.add(directionalLight)

    // Create player (with camera)
    this.player = new Player(this.canvas)
    this.scene.add(this.player.camera)

    // Create world
    this.world = new World(this.scene)

    // Create input manager
    this.inputManager = new InputManager(this.canvas)

    // Handle window resize
    window.addEventListener('resize', this.handleResize)

    console.log('Game created!')
  }

  async init() {
    console.log('Initializing game...')

    // Generate initial world chunks around player spawn
    await this.world.generateInitialChunks(this.player.position)

    console.log('Game initialized!')
  }

  start() {
    if (this.isRunning) return

    console.log('Starting game loop...')
    this.isRunning = true
    this.lastTime = performance.now()
    this.gameLoop()
  }

  private gameLoop = () => {
    if (!this.isRunning) return

    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastTime) / 1000 // Convert to seconds
    this.lastTime = currentTime

    // Update FPS counter
    this.frameCount++
    this.fpsTime += deltaTime
    if (this.fpsTime >= 1.0) {
      this.fps = Math.round(this.frameCount / this.fpsTime)
      this.frameCount = 0
      this.fpsTime = 0
    }

    // Update game
    this.update(deltaTime)

    // Render
    this.render()

    // Continue loop
    requestAnimationFrame(this.gameLoop)
  }

  private update(deltaTime: number) {
    // Cap delta time to prevent huge jumps
    deltaTime = Math.min(deltaTime, 0.1)

    // Update player (movement, physics, etc.)
    this.player.update(deltaTime, this.inputManager, this.world)

    // Update world (chunk loading/unloading)
    this.world.update(this.player.position)
  }

  private render() {
    this.renderer.render(this.scene, this.player.camera)
  }

  private handleResize = () => {
    const width = window.innerWidth
    const height = window.innerHeight

    this.renderer.setSize(width, height)
    this.player.camera.aspect = width / height
    this.player.camera.updateProjectionMatrix()
  }

  // Public getters for UI
  getFPS(): number {
    return this.fps
  }

  getPlayerPosition() {
    return {
      x: this.player.position.x,
      y: this.player.position.y,
      z: this.player.position.z,
    }
  }

  getChunksLoaded(): number {
    return this.world.getChunkCount()
  }

  dispose() {
    console.log('Disposing game...')
    this.isRunning = false
    window.removeEventListener('resize', this.handleResize)
    this.inputManager.dispose()
    this.world.dispose()
    this.renderer.dispose()
  }
}

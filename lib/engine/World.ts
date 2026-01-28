import * as THREE from 'three'
import { Chunk } from './Chunk'
import { TerrainGenerator } from '../terrain/TerrainGenerator'

export class World {
  private scene: THREE.Scene
  private chunks: Map<string, Chunk>
  private terrainGenerator: TerrainGenerator

  private readonly CHUNK_SIZE = 16
  private readonly CHUNK_HEIGHT = 64
  private readonly RENDER_DISTANCE = 2 // chunks (optimized for performance!)

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.chunks = new Map()
    this.terrainGenerator = new TerrainGenerator()
  }

  async generateInitialChunks(playerPosition: THREE.Vector3) {
    console.log('Generating initial chunks...')

    const playerChunkX = Math.floor(playerPosition.x / this.CHUNK_SIZE)
    const playerChunkZ = Math.floor(playerPosition.z / this.CHUNK_SIZE)

    // Generate 3x3 grid of chunks around player
    const promises: Promise<void>[] = []
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const chunkX = playerChunkX + x
        const chunkZ = playerChunkZ + z
        promises.push(this.generateChunk(chunkX, chunkZ))
      }
    }

    await Promise.all(promises)
    console.log(`Initial chunks generated: ${this.chunks.size}`)
  }

  async generateChunk(chunkX: number, chunkZ: number): Promise<void> {
    const key = `${chunkX},${chunkZ}`

    if (this.chunks.has(key)) {
      return // Already exists
    }

    // Generate terrain data
    const data = this.terrainGenerator.generateChunkData(
      chunkX,
      chunkZ,
      this.CHUNK_SIZE,
      this.CHUNK_HEIGHT
    )

    // Create chunk
    const chunk = new Chunk(chunkX, chunkZ, data, this.CHUNK_SIZE, this.CHUNK_HEIGHT)

    // Generate mesh
    chunk.generateMesh()

    // Add to scene
    this.scene.add(chunk.mesh!)

    // Store chunk
    this.chunks.set(key, chunk)
  }

  update(playerPosition: THREE.Vector3) {
    const playerChunkX = Math.floor(playerPosition.x / this.CHUNK_SIZE)
    const playerChunkZ = Math.floor(playerPosition.z / this.CHUNK_SIZE)

    // Load chunks in range
    for (let x = -this.RENDER_DISTANCE; x <= this.RENDER_DISTANCE; x++) {
      for (let z = -this.RENDER_DISTANCE; z <= this.RENDER_DISTANCE; z++) {
        const chunkX = playerChunkX + x
        const chunkZ = playerChunkZ + z
        const key = `${chunkX},${chunkZ}`

        if (!this.chunks.has(key)) {
          this.generateChunk(chunkX, chunkZ)
        }
      }
    }

    // Unload chunks out of range
    const chunksToRemove: string[] = []
    this.chunks.forEach((chunk, key) => {
      const dx = Math.abs(chunk.chunkX - playerChunkX)
      const dz = Math.abs(chunk.chunkZ - playerChunkZ)

      if (dx > this.RENDER_DISTANCE + 1 || dz > this.RENDER_DISTANCE + 1) {
        chunksToRemove.push(key)
      }
    })

    chunksToRemove.forEach(key => {
      const chunk = this.chunks.get(key)!
      this.scene.remove(chunk.mesh!)
      chunk.dispose()
      this.chunks.delete(key)
    })
  }

  getBlock(x: number, y: number, z: number): number {
    if (y < 0 || y >= this.CHUNK_HEIGHT) {
      return 0 // Air
    }

    const chunkX = Math.floor(x / this.CHUNK_SIZE)
    const chunkZ = Math.floor(z / this.CHUNK_SIZE)
    const key = `${chunkX},${chunkZ}`

    const chunk = this.chunks.get(key)
    if (!chunk) {
      return 0 // Chunk not loaded
    }

    const localX = x - chunkX * this.CHUNK_SIZE
    const localZ = z - chunkZ * this.CHUNK_SIZE

    return chunk.getBlock(localX, y, localZ)
  }

  setBlock(x: number, y: number, z: number, blockType: number) {
    if (y < 0 || y >= this.CHUNK_HEIGHT) {
      return
    }

    const chunkX = Math.floor(x / this.CHUNK_SIZE)
    const chunkZ = Math.floor(z / this.CHUNK_SIZE)
    const key = `${chunkX},${chunkZ}`

    const chunk = this.chunks.get(key)
    if (!chunk) {
      return // Chunk not loaded
    }

    const localX = x - chunkX * this.CHUNK_SIZE
    const localZ = z - chunkZ * this.CHUNK_SIZE

    chunk.setBlock(localX, y, localZ, blockType)

    // Regenerate mesh
    this.scene.remove(chunk.mesh!)
    chunk.generateMesh()
    this.scene.add(chunk.mesh!)
  }

  getChunkCount(): number {
    return this.chunks.size
  }

  dispose() {
    this.chunks.forEach(chunk => {
      this.scene.remove(chunk.mesh!)
      chunk.dispose()
    })
    this.chunks.clear()
  }
}

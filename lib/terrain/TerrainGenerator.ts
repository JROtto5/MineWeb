import { createNoise2D } from 'simplex-noise'
import { BlockType } from '../engine/Chunk'

export class TerrainGenerator {
  private noise2D: ReturnType<typeof createNoise2D>
  private readonly SEA_LEVEL = 32

  constructor() {
    this.noise2D = createNoise2D()
  }

  generateChunkData(chunkX: number, chunkZ: number, size: number, height: number): Uint8Array {
    const data = new Uint8Array(size * height * size)

    for (let localX = 0; localX < size; localX++) {
      for (let localZ = 0; localZ < size; localZ++) {
        const worldX = chunkX * size + localX
        const worldZ = chunkZ * size + localZ

        // Multi-octave noise for terrain height
        const terrainHeight = this.getTerrainHeight(worldX, worldZ)

        // Generate vertical column
        for (let y = 0; y < height; y++) {
          const index = localX + y * size + localZ * size * height

          if (y > terrainHeight) {
            // Air
            data[index] = BlockType.AIR
          } else if (y === terrainHeight) {
            // Surface block
            if (terrainHeight < this.SEA_LEVEL - 2) {
              data[index] = BlockType.SAND
            } else {
              data[index] = BlockType.GRASS
            }
          } else if (y > terrainHeight - 3) {
            // Subsurface (dirt)
            data[index] = BlockType.DIRT
          } else {
            // Deep underground (stone)
            data[index] = BlockType.STONE
          }
        }

        // Add water at sea level
        for (let y = terrainHeight + 1; y <= this.SEA_LEVEL && y < height; y++) {
          const index = localX + y * size + localZ * size * height
          if (data[index] === BlockType.AIR) {
            data[index] = BlockType.WATER
          }
        }
      }
    }

    return data
  }

  private getTerrainHeight(x: number, z: number): number {
    // Multi-octave noise
    let height = 0
    let amplitude = 1
    let frequency = 1
    const scale = 0.01

    // Large features (mountains/valleys)
    height += this.noise2D(x * scale * 0.3, z * scale * 0.3) * 20 * amplitude

    // Medium features (hills)
    amplitude = 0.5
    frequency = 2
    height += this.noise2D(x * scale * frequency, z * scale * frequency) * 10 * amplitude

    // Small features (details)
    amplitude = 0.25
    frequency = 4
    height += this.noise2D(x * scale * frequency, z * scale * frequency) * 5 * amplitude

    // Offset to sea level and ensure positive
    return Math.floor(this.SEA_LEVEL + height)
  }
}

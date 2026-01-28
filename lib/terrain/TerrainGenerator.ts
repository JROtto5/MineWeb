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

    // First pass: Generate terrain
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

    // Second pass: Add trees (but avoid edges to prevent cross-chunk issues)
    for (let localX = 2; localX < size - 2; localX++) {
      for (let localZ = 2; localZ < size - 2; localZ++) {
        const worldX = chunkX * size + localX
        const worldZ = chunkZ * size + localZ

        // Use noise for tree placement (10% chance)
        const treeNoise = Math.abs(this.noise2D(worldX * 0.1, worldZ * 0.1))
        if (treeNoise > 0.85) {
          // Find ground level
          let groundY = -1
          for (let y = height - 1; y >= 0; y--) {
            const index = localX + y * size + localZ * size * height
            if (data[index] === BlockType.GRASS) {
              groundY = y
              break
            }
          }

          // Place tree if on grass
          if (groundY > this.SEA_LEVEL && groundY < height - 8) {
            this.placeTree(data, localX, groundY + 1, localZ, size, height)
          }
        }
      }
    }

    return data
  }

  private placeTree(data: Uint8Array, x: number, baseY: number, z: number, size: number, height: number) {
    const treeHeight = 5 + Math.floor(Math.random() * 2) // 5-6 blocks tall

    // Place trunk
    for (let y = 0; y < treeHeight; y++) {
      const trunkY = baseY + y
      if (trunkY < height) {
        const index = x + trunkY * size + z * size * height
        data[index] = BlockType.WOOD
      }
    }

    // Place leaves (simple sphere)
    const leafY = baseY + treeHeight - 1
    const leafRadius = 2

    for (let dx = -leafRadius; dx <= leafRadius; dx++) {
      for (let dy = -1; dy <= 2; dy++) {
        for (let dz = -leafRadius; dz <= leafRadius; dz++) {
          const dist = dx * dx + dz * dz
          if (dist <= leafRadius * leafRadius + 1) {
            const leafX = x + dx
            const leafZ = z + dz
            const leafYPos = leafY + dy

            if (leafX >= 0 && leafX < size && leafZ >= 0 && leafZ < size && leafYPos < height) {
              const index = leafX + leafYPos * size + leafZ * size * height
              if (data[index] === BlockType.AIR) {
                data[index] = BlockType.LEAVES
              }
            }
          }
        }
      }
    }
  }

  private getTerrainHeight(x: number, z: number): number {
    // Multi-octave noise for varied terrain
    let height = 0
    const scale = 0.01

    // Large features (mountains/valleys)
    height += this.noise2D(x * scale * 0.3, z * scale * 0.3) * 25

    // Medium features (hills)
    height += this.noise2D(x * scale, z * scale) * 12

    // Small features (details)
    height += this.noise2D(x * scale * 3, z * scale * 3) * 4

    // Offset to sea level and ensure varied terrain
    const finalHeight = Math.floor(this.SEA_LEVEL + height)

    // Ensure terrain is mostly above sea level for better gameplay
    return Math.max(this.SEA_LEVEL + 2, finalHeight)
  }
}

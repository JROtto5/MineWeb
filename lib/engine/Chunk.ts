import * as THREE from 'three'

// Block types
export const BlockType = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  WATER: 5,
}

// Block colors
const BLOCK_COLORS: { [key: number]: THREE.Color } = {
  [BlockType.GRASS]: new THREE.Color(0x32DC46), // Bright green
  [BlockType.DIRT]: new THREE.Color(0xA06432),  // Rich brown
  [BlockType.STONE]: new THREE.Color(0x8C8C91), // Blue-grey
  [BlockType.SAND]: new THREE.Color(0xFAE6B4),  // Warm sand
  [BlockType.WATER]: new THREE.Color(0x1E90FF), // Dodger blue
}

export class Chunk {
  public chunkX: number
  public chunkZ: number
  private data: Uint8Array
  private size: number
  private height: number
  public mesh: THREE.Mesh | null = null

  constructor(chunkX: number, chunkZ: number, data: Uint8Array, size: number, height: number) {
    this.chunkX = chunkX
    this.chunkZ = chunkZ
    this.data = data
    this.size = size
    this.height = height
  }

  getBlock(x: number, y: number, z: number): number {
    if (x < 0 || x >= this.size || y < 0 || y >= this.height || z < 0 || z >= this.size) {
      return BlockType.AIR
    }
    const index = x + y * this.size + z * this.size * this.height
    return this.data[index]
  }

  setBlock(x: number, y: number, z: number, blockType: number) {
    if (x < 0 || x >= this.size || y < 0 || y >= this.height || z < 0 || z >= this.size) {
      return
    }
    const index = x + y * this.size + z * this.size * this.height
    this.data[index] = blockType
  }

  generateMesh() {
    const geometry = new THREE.BufferGeometry()
    const vertices: number[] = []
    const colors: number[] = []
    const normals: number[] = []
    const indices: number[] = []

    let vertexCount = 0

    // Iterate through all blocks
    for (let y = 0; y < this.height; y++) {
      for (let z = 0; z < this.size; z++) {
        for (let x = 0; x < this.size; x++) {
          const blockType = this.getBlock(x, y, z)
          if (blockType === BlockType.AIR) continue

          const color = BLOCK_COLORS[blockType] || new THREE.Color(0xffffff)

          // Check each face
          // Top face (Y+)
          if (this.isTransparent(x, y + 1, z)) {
            this.addFace(vertices, colors, normals, indices, vertexCount,
              x, y + 1, z, 1, 0, 0, 0, 1, color, 1.0)
            vertexCount += 4
          }

          // Bottom face (Y-)
          if (this.isTransparent(x, y - 1, z)) {
            this.addFace(vertices, colors, normals, indices, vertexCount,
              x, y, z, 1, 0, 0, 0, -1, color, 0.5)
            vertexCount += 4
          }

          // North face (Z+)
          if (this.isTransparent(x, y, z + 1)) {
            this.addFace(vertices, colors, normals, indices, vertexCount,
              x, y, z + 1, 1, 1, 0, 0, 0, color, 0.8)
            vertexCount += 4
          }

          // South face (Z-)
          if (this.isTransparent(x, y, z - 1)) {
            this.addFace(vertices, colors, normals, indices, vertexCount,
              x, y, z, 1, 1, 0, 0, 0, color, 0.8)
            vertexCount += 4
          }

          // East face (X+)
          if (this.isTransparent(x + 1, y, z)) {
            this.addFace(vertices, colors, normals, indices, vertexCount,
              x + 1, y, z, 0, 1, 1, 0, 0, color, 0.65)
            vertexCount += 4
          }

          // West face (X-)
          if (this.isTransparent(x - 1, y, z)) {
            this.addFace(vertices, colors, normals, indices, vertexCount,
              x, y, z, 0, 1, 1, 0, 0, color, 0.65)
            vertexCount += 4
          }
        }
      }
    }

    if (vertices.length === 0) {
      return // Empty chunk
    }

    // Set geometry attributes
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geometry.setIndex(indices)

    // Create material
    const material = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
    })

    // Create mesh
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.set(
      this.chunkX * this.size,
      0,
      this.chunkZ * this.size
    )

    console.log(`Chunk (${this.chunkX}, ${this.chunkZ}): ${vertices.length / 3} vertices`)
  }

  private addFace(
    vertices: number[],
    colors: number[],
    normals: number[],
    indices: number[],
    vertexCount: number,
    x: number, y: number, z: number,
    width: number, height: number, depth: number,
    normalX: number, normalY: number,
    color: THREE.Color,
    brightness: number
  ) {
    // Determine face orientation and vertices
    let v0, v1, v2, v3

    if (normalY === 1) {
      // Top face
      v0 = [x, y, z]
      v1 = [x + width, y, z]
      v2 = [x + width, y, z + depth]
      v3 = [x, y, z + depth]
    } else if (normalY === -1) {
      // Bottom face
      v0 = [x, y, z + depth]
      v1 = [x + width, y, z + depth]
      v2 = [x + width, y, z]
      v3 = [x, y, z]
    } else if (depth === 1) {
      // Z-aligned face
      v0 = [x, y, z]
      v1 = [x + width, y, z]
      v2 = [x + width, y + height, z]
      v3 = [x, y + height, z]
    } else {
      // X-aligned face
      v0 = [x, y, z]
      v1 = [x, y, z + depth]
      v2 = [x, y + height, z + depth]
      v3 = [x, y + height, z]
    }

    // Add vertices
    vertices.push(...v0, ...v1, ...v2, ...v3)

    // Add colors (with brightness)
    const r = color.r * brightness
    const g = color.g * brightness
    const b = color.b * brightness
    colors.push(r, g, b, r, g, b, r, g, b, r, g, b)

    // Calculate normal
    const normal = this.calculateNormal(v0, v1, v2)
    normals.push(...normal, ...normal, ...normal, ...normal)

    // Add indices (two triangles)
    indices.push(
      vertexCount, vertexCount + 1, vertexCount + 2,
      vertexCount, vertexCount + 2, vertexCount + 3
    )
  }

  private calculateNormal(v0: number[], v1: number[], v2: number[]): number[] {
    const ax = v1[0] - v0[0], ay = v1[1] - v0[1], az = v1[2] - v0[2]
    const bx = v2[0] - v0[0], by = v2[1] - v0[1], bz = v2[2] - v0[2]

    const nx = ay * bz - az * by
    const ny = az * bx - ax * bz
    const nz = ax * by - ay * bx

    const length = Math.sqrt(nx * nx + ny * ny + nz * nz)
    return [nx / length, ny / length, nz / length]
  }

  private isTransparent(x: number, y: number, z: number): boolean {
    const block = this.getBlock(x, y, z)
    return block === BlockType.AIR || block === BlockType.WATER
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose()
      ;(this.mesh.material as THREE.Material).dispose()
    }
  }
}

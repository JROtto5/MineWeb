import * as Phaser from 'phaser'

export interface Room {
  x: number
  y: number
  width: number
  height: number
  type: 'combat' | 'treasure' | 'shop' | 'boss' | 'spawn'
  connections: number[] // Indices of connected rooms
}

export interface FloorLayout {
  floorNumber: number
  rooms: Room[]
  seed: number
}

interface Space {
  x: number
  y: number
  width: number
  height: number
}

export class FloorGenerator {
  private seed: number
  private rng: () => number

  constructor(seed?: number) {
    this.seed = seed || Date.now()
    this.rng = this.seededRandom(this.seed)
  }

  generate(floorNumber: number): FloorLayout {
    // Reset RNG for consistent generation per floor
    this.rng = this.seededRandom(this.seed + floorNumber)

    // Generate 3-6 rooms per floor (smaller, tighter maps for faster action)
    const roomCount = 3 + Math.floor(this.rng() * 4)
    const rooms: Room[] = []

    // SMALLER world for faster, more intense gameplay
    // Start small, expand slightly as floors progress
    const baseWidth = 1200
    const baseHeight = 800
    const expansionPerFloor = 15  // Grows slightly each floor
    const maxExpansion = 1000     // Cap the expansion

    const expansion = Math.min(floorNumber * expansionPerFloor, maxExpansion)
    const worldWidth = baseWidth + expansion
    const worldHeight = baseHeight + Math.floor(expansion * 0.67)

    // Use BSP (Binary Space Partitioning) algorithm
    const spaces = this.generateSpaces(worldWidth, worldHeight, roomCount)

    // Create rooms within spaces - SMALLER rooms for intense combat!
    spaces.forEach((space, index) => {
      // Rooms start SMALL and grow slightly with floor progression
      const floorScale = 1 + Math.min(floorNumber * 0.02, 0.5) // Up to 50% larger by floor 25
      const minRoomSize = Math.floor(250 * floorScale)
      const maxRoomSize = Math.floor(400 * floorScale)

      const roomWidth = Math.min(
        space.width - 50,
        minRoomSize + Math.floor(this.rng() * (maxRoomSize - minRoomSize))
      )
      const roomHeight = Math.min(
        space.height - 50,
        minRoomSize + Math.floor(this.rng() * (maxRoomSize - minRoomSize))
      )

      const roomX = space.x + Math.floor(this.rng() * (space.width - roomWidth))
      const roomY = space.y + Math.floor(this.rng() * (space.height - roomHeight))

      rooms.push({
        x: roomX,
        y: roomY,
        width: roomWidth,
        height: roomHeight,
        type: this.getRoomType(index, floorNumber, roomCount),
        connections: []
      })
    })

    // Connect rooms
    this.connectRooms(rooms)

    return {
      floorNumber,
      rooms,
      seed: this.seed + floorNumber
    }
  }

  private generateSpaces(width: number, height: number, targetCount: number): Space[] {
    const spaces: Space[] = [{ x: 0, y: 0, width, height }]

    // Split spaces until we have enough
    while (spaces.length < targetCount) {
      // Find largest space
      spaces.sort((a, b) => (b.width * b.height) - (a.width * a.height))
      const space = spaces.shift()
      if (!space) break

      // Check if space is large enough to split
      if (space.width < 600 && space.height < 600) {
        spaces.push(space)
        break
      }

      const split = this.splitSpace(space)
      spaces.push(...split)
    }

    return spaces.slice(0, targetCount)
  }

  private splitSpace(space: Space): Space[] {
    // Determine split direction (horizontal or vertical)
    const horizontal = this.rng() > 0.5

    if (horizontal && space.height >= 600) {
      // Split horizontally
      const splitRatio = 0.4 + this.rng() * 0.2 // 40-60%
      const splitY = space.y + Math.floor(space.height * splitRatio)

      return [
        { x: space.x, y: space.y, width: space.width, height: splitY - space.y },
        { x: space.x, y: splitY, width: space.width, height: space.y + space.height - splitY }
      ]
    } else if (!horizontal && space.width >= 600) {
      // Split vertically
      const splitRatio = 0.4 + this.rng() * 0.2 // 40-60%
      const splitX = space.x + Math.floor(space.width * splitRatio)

      return [
        { x: space.x, y: space.y, width: splitX - space.x, height: space.height },
        { x: splitX, y: space.y, width: space.x + space.width - splitX, height: space.height }
      ]
    }

    // Can't split, return original
    return [space]
  }

  private getRoomType(index: number, floorNumber: number, totalRooms: number): Room['type'] {
    // First room is always spawn
    if (index === 0) return 'spawn'

    // Boss room every 10 floors (last room)
    if (floorNumber % 10 === 0 && index === totalRooms - 1) return 'boss'

    // Random room types
    const roll = this.rng()
    if (roll < 0.65) return 'combat'  // 65% combat
    if (roll < 0.85) return 'treasure' // 20% treasure
    return 'shop'                       // 15% shop
  }

  private connectRooms(rooms: Room[]) {
    // Connect each room to its nearest neighbor
    for (let i = 0; i < rooms.length; i++) {
      if (i < rooms.length - 1) {
        // Connect to next room (sequential)
        rooms[i].connections.push(i + 1)
        rooms[i + 1].connections.push(i)
      }

      // Also connect to one random nearby room for variety
      if (i > 0 && i < rooms.length - 1 && this.rng() > 0.5) {
        const nearbyIndex = this.findNearestRoom(rooms, i, rooms[i].connections)
        if (nearbyIndex !== -1) {
          rooms[i].connections.push(nearbyIndex)
          rooms[nearbyIndex].connections.push(i)
        }
      }
    }
  }

  private findNearestRoom(rooms: Room[], currentIndex: number, exclude: number[]): number {
    const current = rooms[currentIndex]
    const centerX = current.x + current.width / 2
    const centerY = current.y + current.height / 2

    let nearestIndex = -1
    let nearestDist = Infinity

    for (let i = 0; i < rooms.length; i++) {
      if (i === currentIndex || exclude.includes(i)) continue

      const room = rooms[i]
      const roomCenterX = room.x + room.width / 2
      const roomCenterY = room.y + room.height / 2

      const dist = Math.hypot(roomCenterX - centerX, roomCenterY - centerY)
      if (dist < nearestDist) {
        nearestDist = dist
        nearestIndex = i
      }
    }

    return nearestIndex
  }

  private seededRandom(seed: number): () => number {
    // Linear Congruential Generator
    let current = seed
    return () => {
      current = (current * 1664525 + 1013904223) % 4294967296
      return current / 4294967296
    }
  }
}

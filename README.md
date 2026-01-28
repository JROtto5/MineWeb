# 🎮 Minecraft Web - Browser Voxel Game

A fully-featured Minecraft-like voxel game running in your browser using Three.js and Next.js!

## ✨ Features

- **🏔️ Procedural Terrain Generation** - Infinite world with Perlin noise
- **⚡ Optimized Rendering** - Face culling and efficient mesh generation
- **🎮 First-Person Controls** - WASD movement, mouse look, jumping
- **🔨 Block Interaction** - Break and place blocks
- **🌊 Multiple Block Types** - Grass, dirt, stone, sand, water
- **🌫️ Atmospheric Fog** - Distance-based fog for depth perception
- **💡 Dynamic Lighting** - Directional lighting for 3D depth

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## 🎮 Controls

- **WASD** - Move
- **Mouse** - Look around
- **Space** - Jump
- **Shift** - Sprint
- **Left Click** - Break block
- **Right Click** - Place block
- **ESC** - Release mouse

## 🔧 Performance Optimizations

- **Render Distance**: 3 chunks (configurable in `World.ts`)
- **Face Culling**: Only renders exposed block faces
- **Efficient Mesh Generation**: Minimal vertex count
- **Fog System**: Distance-based rendering optimization

## 📦 Deployment to Vercel

### Option 1: Deploy via CLI

```bash
npm install -g vercel
vercel
```

### Option 2: Deploy via GitHub

1. Push code to GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Vercel will auto-detect Next.js and deploy!

### Environment Variables

No environment variables needed! The game runs entirely client-side.

## 🏗️ Project Structure

```
MinecraftWeb/
├── app/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Main game page
│   └── globals.css      # Global styles
├── lib/
│   ├── engine/
│   │   ├── Game.ts          # Main game loop
│   │   ├── Player.ts        # Player controller
│   │   ├── World.ts         # World manager
│   │   ├── Chunk.ts         # Chunk mesh generation
│   │   └── InputManager.ts  # Input handling
│   └── terrain/
│       └── TerrainGenerator.ts  # Perlin noise terrain
├── public/              # Static assets
├── package.json
└── next.config.js
```

## 🎨 Customization

### Change Render Distance

Edit `lib/engine/World.ts`:

```typescript
private readonly RENDER_DISTANCE = 3 // Increase for more chunks
```

### Change World Height

Edit `lib/engine/World.ts`:

```typescript
private readonly CHUNK_HEIGHT = 64 // Increase for taller mountains
```

### Add New Block Types

Edit `lib/engine/Chunk.ts`:

```typescript
export const BlockType = {
  // ... existing blocks
  WOOD: 6,
  LEAVES: 7,
  // Add your blocks here
}

const BLOCK_COLORS = {
  // ... existing colors
  [BlockType.WOOD]: new THREE.Color(0x966428),
  [BlockType.LEAVES]: new THREE.Color(0x28B428),
}
```

## 🐛 Troubleshooting

### Low FPS?

1. Reduce `RENDER_DISTANCE` in `World.ts`
2. Lower `CHUNK_HEIGHT` for fewer blocks
3. Disable fog in `Game.ts` for slight performance boost

### Mouse not capturing?

Make sure you click "CLICK TO START" and allow pointer lock in your browser.

### Blocks not appearing?

Check browser console for errors. Make sure you're running on a modern browser with WebGL support.

## 📝 License

MIT

## 🙏 Credits

Built with:
- [Next.js](https://nextjs.org/)
- [Three.js](https://threejs.org/)
- [simplex-noise](https://www.npmjs.com/package/simplex-noise)

---

**Enjoy building in your browser! 🎉**

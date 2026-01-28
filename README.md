# 🎮 Crime City: Underground Empire

A browser-based top-down action game with shooting combat, enemies, and casino gambling mechanics.

![Crime City](https://img.shields.io/badge/Status-Playable-success)
![Tech](https://img.shields.io/badge/Tech-Phaser.js%20%7C%20Next.js-blue)

## 🚀 Features

### ✅ Currently Implemented

#### Combat System
- **Three Weapons**:
  - Pistol: Balanced damage and fire rate (20 dmg, 300ms)
  - SMG: Fast fire rate, lower damage (15 dmg, 100ms)
  - Shotgun: High damage, spread shot (40 dmg, 600ms)
- **Weapon Switching**: Press 1-3 to switch weapons
- **Bullet Physics**: Projectiles with proper collision detection
- **Enemy AI**: Enemies chase and attack the player
- **Health System**: Player and enemy health bars
- **Damage Feedback**: Screen shake, red tint, visual effects

#### Player System
- **WASD Movement**: Smooth 8-directional movement
- **Mouse Aiming**: Aim with mouse, auto-rotate to face cursor
- **Stats**: Health, ammo, XP, level, money
- **Leveling**: Gain XP from kills, level up increases max health
- **Money System**: Earn money from enemy kills

#### Mission System
- **Enemy Waves**: Complete waves to progress
- **Kill Objectives**: Eliminate all enemies to advance
- **Progressive Difficulty**: Each wave adds more enemies
- **Rewards**: Money and XP for completing missions

#### Visual Polish
- **Grid Background**: Cyberpunk-style grid world
- **Health Bars**: Enemy health indicators
- **Aim Line**: Visual aiming guide
- **Muzzle Flash**: Weapon fire effects
- **Camera Shake**: Impact feedback
- **Smooth Animations**: Tweened effects

#### UI/HUD
- **Stats Display**: Real-time health, ammo, XP, level
- **Money Counter**: Live money tracking
- **Mission Tracker**: Current objective and progress
- **Weapon Info**: Current weapon and ammo count
- **Controls Guide**: On-screen control reference
- **Message System**: Pop-up notifications for events

### 🎰 Casino System (Implemented, Not Yet Wired to UI)

The game includes a fully functional casino system ready to be activated:

- **Slot Machine**: Spin 3 reels, match symbols for payouts (2x - 50x)
- **Blackjack**: Play against the dealer (simplified rules)
- **Roulette**: Bet on red/black for 2x payout
- **Loot Boxes**: Random rewards with rarity tiers
  - Common (50%): 0.5x return
  - Uncommon (30%): 2x return
  - Rare (15%): 5x return
  - Epic (4%): 20x return
  - Legendary (1%): 100x return

### 🎯 Coming Soon

- Casino UI overlays (press E at casino zones)
- More enemy types with different behaviors
- Boss fights
- Weapon upgrades and customization
- More missions and story
- Save/load progress
- Sound effects and music
- Power-ups and pickups

## 🎮 Controls

| Key | Action |
|-----|--------|
| W/A/S/D | Move |
| Mouse | Aim |
| Left Click | Shoot |
| 1/2/3 | Switch Weapon |
| R | Reload |
| E | Interact (Casino zones) |

## 🛠️ Tech Stack

- **Phaser 3**: 2D game framework with physics
- **Next.js 14**: React framework for deployment
- **TypeScript**: Type-safe development
- **Vercel**: Serverless hosting (recommended)

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/JROtto5/MineWeb.git
cd MineWeb

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🌐 Deployment to Vercel

### Option 1: Automatic (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel auto-detects Next.js - just click "Deploy"
6. Done! Your game is live

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Option 3: Manual GitHub Integration

1. Connect Vercel to your GitHub account
2. Every push to `main` branch auto-deploys
3. Pull requests get preview deployments

## 🎯 Game Design

### Combat Loop
1. Spawn in safe area
2. Enemies spawn around the map
3. Chase and eliminate enemies
4. Earn money and XP
5. Level up for health boost
6. New wave spawns with more enemies
7. Repeat

### Progression System
- **Kills → XP → Levels**: Every 100 XP = level up
- **Kills → Money**: $10-50 per enemy
- **Levels → Health**: +20 max health per level
- **Money → Gambling**: Use at casino zones (future)

### Casino Integration
- Find casino zones marked with 🎰
- Press E to gamble
- Slots, Blackjack, Roulette available
- Win big or lose it all
- Rewards fund weapon upgrades (future)

## 📁 Project Structure

```
MinecraftWeb/
├── app/
│   ├── page.tsx          # Main React component with HUD
│   ├── layout.tsx        # App layout
│   └── globals.css       # Styling
├── lib/
│   └── game/
│       ├── GameWrapper.tsx    # Phaser initialization
│       ├── GameScene.ts       # Main game scene
│       ├── Player.ts          # Player class
│       ├── Enemy.ts           # Enemy AI
│       ├── Weapon.ts          # Weapon & bullet system
│       └── Casino.ts          # Gambling mechanics
├── public/
│   └── assets/               # Game assets (textures, sounds)
├── package.json
├── next.config.js
└── tsconfig.json
```

## 🎨 Art Style

Currently using **procedural graphics** (no external assets):
- Simple colored circles for player/enemies
- Geometric shapes for UI
- Grid-based cyberpunk background
- Particle effects for combat

Future plans:
- Custom sprite sheets
- Animated characters
- Environmental tiles
- Casino visuals

## 🐛 Known Issues

- Phaser import warnings during build (harmless)
- Casino zones exist but UI not yet implemented
- No sound/music yet
- Enemies can stack on each other

## 🔮 Roadmap

### Phase 1: Core Polish (Current)
- ✅ Player movement and shooting
- ✅ Enemy AI and combat
- ✅ Basic progression
- ✅ HUD system

### Phase 2: Casino Integration
- Add casino UI overlays
- Wire up gambling systems
- Add win/loss animations
- Integrate with economy

### Phase 3: Content Expansion
- More enemy types
- Boss encounters
- Weapon variety
- Map variety

### Phase 4: Meta Systems
- Save/load
- Achievements
- Daily challenges
- Leaderboards

## 📝 License

MIT License - Feel free to use and modify

## 🤝 Contributing

This is a personal project but feedback is welcome!

## 🎮 Play Now

Once deployed to Vercel, share your link and start playing!

---

**Built with Phaser.js and Next.js** | **Deployed on Vercel**

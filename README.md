# Dot Universe

A multi-game browser gaming platform featuring **DotSlayer** (roguelike shooter) and **Dot Clicker** (idle incremental game) with cross-game synergy bonuses.

[![Live Demo](https://img.shields.io/badge/Play%20Now-dotslayer.vercel.app-blue?style=for-the-badge)](https://dotslayer.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Phaser](https://img.shields.io/badge/Phaser-3.60-purple?style=flat-square)](https://phaser.io/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

---

## Games

### DotSlayer - 100 Floors Challenge

A fast-paced roguelike shooter where you descend through 100 procedurally generated floors, fighting enemies, collecting loot, and defeating bosses.

**Features:**
- 5 unique player classes (Warrior, Rogue, Mage, Tank, Vampire)
- 6+ weapon types with unique behaviors
- Procedural floor generation with themed environments
- Boss fights every 10 floors
- Skill tree with 15+ upgrades
- Shop system with persistent upgrades
- Achievement system (40+ achievements)
- Daily challenges with streak bonuses
- Cloud saves with Supabase
- Global leaderboards

### Dot Clicker - Idle Incremental

Build your dot empire with buildings, upgrades, and prestige mechanics.

**Features:**
- 20+ buildings to purchase
- 7 prestige tiers with unique upgrades
- Ascension system for meta-progression
- Offline progress calculation
- Cross-game synergy with DotSlayer

---

## Cross-Game Synergy

Progress in one game boosts the other:
- **DotSlayer floors cleared** = Damage bonus in Dot Clicker
- **Dot Clicker prestiges** = Starting gold bonus in DotSlayer

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) |
| Game Engine | Phaser 3.60 |
| Backend | Supabase (Auth, Database, Realtime) |
| Language | TypeScript |
| Styling | CSS Modules |
| Hosting | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for backend features)

### Installation

```bash
# Clone the repository
git clone https://github.com/JROtto5/MineWeb.git
cd MineWeb

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials to .env.local

# Run development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

Run the SQL migrations in your Supabase SQL Editor:
1. `supabase_schema.sql` - Core tables
2. `supabase_migration_tracking.sql` - Tracking system tables

---

## Project Structure

```
dot-universe/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Root layout with SEO
│   ├── slayer/            # DotSlayer game
│   ├── clicker/           # Dot Clicker game
│   ├── hub/               # Game hub
│   └── login/             # Authentication
├── lib/
│   ├── game/              # Phaser game code
│   │   ├── GameSceneV3.ts # Main game scene
│   │   ├── Player.ts      # Player class
│   │   ├── EnemyTypes.ts  # Enemy definitions
│   │   ├── Boss.ts        # Boss system
│   │   ├── Weapon.ts      # Weapon system
│   │   ├── SkillTree.ts   # Skill upgrades
│   │   ├── ShopSystem.ts  # Shop mechanics
│   │   ├── FloorSystem.ts # Floor generation
│   │   ├── AchievementSystem.ts
│   │   └── DailyChallenges.ts
│   ├── supabase/          # Backend services
│   │   ├── client.ts      # Supabase client
│   │   ├── SaveManager.ts
│   │   ├── LeaderboardService.ts
│   │   └── ...
│   └── context/           # React contexts
├── public/                # Static assets
└── supabase_*.sql        # Database migrations
```

---

## Controls

### DotSlayer

| Input | Action |
|-------|--------|
| WASD | Move |
| Mouse | Aim |
| Left Click | Shoot |
| 1-6 | Switch Weapon |
| E | Open Shop |
| Tab | Skill Tree |

### Dot Clicker

| Input | Action |
|-------|--------|
| Click | Generate dots |
| Keyboard shortcuts | Quick buy buildings |

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

```bash
# Or use Vercel CLI
npm i -g vercel
vercel --prod
```

---

## Contributing

Contributions welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [Phaser.js](https://phaser.io/) - Game framework
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend services
- [Vercel](https://vercel.com/) - Hosting

---

**Made with love by the Dot Universe team**

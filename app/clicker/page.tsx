'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/context/AuthContext'
import Link from 'next/link'

// ============= GAME DATA =============

interface Building {
  id: string
  name: string
  description: string
  baseCost: number
  baseDps: number
  owned: number
  icon: string
  color: string
  unlockAt: number
}

interface Upgrade {
  id: string
  name: string
  description: string
  cost: number
  multiplier: number
  type: 'click' | 'building' | 'global' | 'crit' | 'golden'
  targetBuilding?: string
  purchased: boolean
  icon: string
  unlockAt: number
}

interface Achievement {
  id: string
  name: string
  description: string
  condition: (state: GameState) => boolean
  reward: number
  unlocked: boolean
  icon: string
}

interface GameState {
  dots: number
  totalDots: number
  totalClicks: number
  dotsPerClick: number
  dotsPerSecond: number
  critChance: number
  critMultiplier: number
  goldenDotChance: number
  globalMultiplier: number
  prestigePoints: number
  prestigeMultiplier: number
  buildings: Building[]
  upgrades: Upgrade[]
  achievements: Achievement[]
  lastSave: number
  startTime: number
  combo: number
  maxCombo: number
  comboTimer: number
}

const INITIAL_BUILDINGS: Building[] = [
  { id: 'cursor', name: 'Auto Cursor', description: 'Clicks the dot for you', baseCost: 15, baseDps: 0.1, owned: 0, icon: '👆', color: '#3498db', unlockAt: 0 },
  { id: 'farm', name: 'Dot Farm', description: 'Grows organic dots', baseCost: 100, baseDps: 1, owned: 0, icon: '🌱', color: '#2ecc71', unlockAt: 50 },
  { id: 'factory', name: 'Dot Factory', description: 'Mass produces dots', baseCost: 1100, baseDps: 8, owned: 0, icon: '🏭', color: '#95a5a6', unlockAt: 500 },
  { id: 'mine', name: 'Dot Mine', description: 'Extracts rare dots', baseCost: 12000, baseDps: 47, owned: 0, icon: '⛏️', color: '#f39c12', unlockAt: 5000 },
  { id: 'lab', name: 'Dot Lab', description: 'Researches dot science', baseCost: 130000, baseDps: 260, owned: 0, icon: '🔬', color: '#9b59b6', unlockAt: 50000 },
  { id: 'temple', name: 'Dot Temple', description: 'Worships the ancient dot', baseCost: 1400000, baseDps: 1400, owned: 0, icon: '🏛️', color: '#e74c3c', unlockAt: 500000 },
  { id: 'portal', name: 'Dot Portal', description: 'Imports dots from other dimensions', baseCost: 20000000, baseDps: 7800, owned: 0, icon: '🌀', color: '#1abc9c', unlockAt: 5000000 },
  { id: 'singularity', name: 'Dot Singularity', description: 'Creates dots from nothing', baseCost: 330000000, baseDps: 44000, owned: 0, icon: '🕳️', color: '#2c3e50', unlockAt: 50000000 },
  { id: 'quantum', name: 'Quantum Generator', description: 'Infinite dot potential', baseCost: 5100000000, baseDps: 260000, owned: 0, icon: '⚛️', color: '#00d9ff', unlockAt: 500000000 },
]

const INITIAL_UPGRADES: Upgrade[] = [
  // Click upgrades
  { id: 'click1', name: 'Reinforced Finger', description: '+1 dot per click', cost: 100, multiplier: 1, type: 'click', purchased: false, icon: '👆', unlockAt: 0 },
  { id: 'click2', name: 'Iron Finger', description: 'Double click power', cost: 500, multiplier: 2, type: 'click', purchased: false, icon: '🦾', unlockAt: 100 },
  { id: 'click3', name: 'Golden Touch', description: 'Triple click power', cost: 5000, multiplier: 3, type: 'click', purchased: false, icon: '✨', unlockAt: 1000 },
  { id: 'click4', name: 'Diamond Hands', description: '5x click power', cost: 50000, multiplier: 5, type: 'click', purchased: false, icon: '💎', unlockAt: 10000 },

  // Crit upgrades
  { id: 'crit1', name: 'Lucky Finger', description: '+5% crit chance', cost: 1000, multiplier: 0.05, type: 'crit', purchased: false, icon: '🍀', unlockAt: 200 },
  { id: 'crit2', name: 'Super Lucky', description: '+10% crit chance', cost: 10000, multiplier: 0.10, type: 'crit', purchased: false, icon: '🎰', unlockAt: 2000 },
  { id: 'crit3', name: 'Critical Master', description: '+15% crit chance', cost: 100000, multiplier: 0.15, type: 'crit', purchased: false, icon: '💥', unlockAt: 20000 },

  // Golden dot upgrades
  { id: 'golden1', name: 'Golden Vision', description: '+2% golden dot chance', cost: 5000, multiplier: 0.02, type: 'golden', purchased: false, icon: '👁️', unlockAt: 1000 },
  { id: 'golden2', name: 'Midas Touch', description: '+5% golden dot chance', cost: 50000, multiplier: 0.05, type: 'golden', purchased: false, icon: '🏆', unlockAt: 10000 },

  // Building upgrades
  { id: 'cursor_up', name: 'Faster Cursors', description: 'Cursors are 2x effective', cost: 200, multiplier: 2, type: 'building', targetBuilding: 'cursor', purchased: false, icon: '⚡', unlockAt: 50 },
  { id: 'farm_up', name: 'Fertilizer', description: 'Farms are 2x effective', cost: 1000, multiplier: 2, type: 'building', targetBuilding: 'farm', purchased: false, icon: '💧', unlockAt: 500 },
  { id: 'factory_up', name: 'Automation', description: 'Factories are 2x effective', cost: 10000, multiplier: 2, type: 'building', targetBuilding: 'factory', purchased: false, icon: '🤖', unlockAt: 5000 },

  // Global upgrades
  { id: 'global1', name: 'Efficiency I', description: '+10% all production', cost: 10000, multiplier: 1.1, type: 'global', purchased: false, icon: '📈', unlockAt: 5000 },
  { id: 'global2', name: 'Efficiency II', description: '+25% all production', cost: 100000, multiplier: 1.25, type: 'global', purchased: false, icon: '📊', unlockAt: 50000 },
  { id: 'global3', name: 'Efficiency III', description: '+50% all production', cost: 1000000, multiplier: 1.5, type: 'global', purchased: false, icon: '🚀', unlockAt: 500000 },
]

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_click', name: 'Baby Steps', description: 'Click the dot', condition: (s) => s.totalClicks >= 1, reward: 1, unlocked: false, icon: '👶' },
  { id: 'clicks_100', name: 'Dedicated Clicker', description: 'Click 100 times', condition: (s) => s.totalClicks >= 100, reward: 5, unlocked: false, icon: '👆' },
  { id: 'clicks_1000', name: 'Click Master', description: 'Click 1,000 times', condition: (s) => s.totalClicks >= 1000, reward: 10, unlocked: false, icon: '🖱️' },
  { id: 'clicks_10000', name: 'Click Legend', description: 'Click 10,000 times', condition: (s) => s.totalClicks >= 10000, reward: 25, unlocked: false, icon: '⚡' },
  { id: 'dots_100', name: 'Dot Collector', description: 'Earn 100 dots', condition: (s) => s.totalDots >= 100, reward: 2, unlocked: false, icon: '●' },
  { id: 'dots_1000', name: 'Dot Hoarder', description: 'Earn 1,000 dots', condition: (s) => s.totalDots >= 1000, reward: 5, unlocked: false, icon: '◉' },
  { id: 'dots_1m', name: 'Dot Millionaire', description: 'Earn 1 million dots', condition: (s) => s.totalDots >= 1000000, reward: 20, unlocked: false, icon: '💰' },
  { id: 'dots_1b', name: 'Dot Billionaire', description: 'Earn 1 billion dots', condition: (s) => s.totalDots >= 1000000000, reward: 50, unlocked: false, icon: '🏦' },
  { id: 'building_10', name: 'Entrepreneur', description: 'Own 10 buildings', condition: (s) => s.buildings.reduce((a, b) => a + b.owned, 0) >= 10, reward: 5, unlocked: false, icon: '🏢' },
  { id: 'building_50', name: 'Tycoon', description: 'Own 50 buildings', condition: (s) => s.buildings.reduce((a, b) => a + b.owned, 0) >= 50, reward: 15, unlocked: false, icon: '🏙️' },
  { id: 'combo_10', name: 'Combo Starter', description: 'Reach 10 combo', condition: (s) => s.maxCombo >= 10, reward: 3, unlocked: false, icon: '🔥' },
  { id: 'combo_50', name: 'Combo King', description: 'Reach 50 combo', condition: (s) => s.maxCombo >= 50, reward: 10, unlocked: false, icon: '👑' },
  { id: 'prestige_1', name: 'Ascended', description: 'Prestige once', condition: (s) => s.prestigePoints >= 1, reward: 0, unlocked: false, icon: '🌟' },
]

// ============= HELPER FUNCTIONS =============

function formatNumber(n: number): string {
  if (n < 1000) return Math.floor(n).toString()
  if (n < 1000000) return (n / 1000).toFixed(1) + 'K'
  if (n < 1000000000) return (n / 1000000).toFixed(2) + 'M'
  if (n < 1000000000000) return (n / 1000000000).toFixed(2) + 'B'
  if (n < 1000000000000000) return (n / 1000000000000).toFixed(2) + 'T'
  return (n / 1000000000000000).toFixed(2) + 'Q'
}

function getBuildingCost(building: Building): number {
  return Math.floor(building.baseCost * Math.pow(1.15, building.owned))
}

function calculateDps(state: GameState): number {
  let dps = 0
  for (const building of state.buildings) {
    let buildingDps = building.baseDps * building.owned
    // Apply building-specific upgrades
    for (const upgrade of state.upgrades) {
      if (upgrade.purchased && upgrade.type === 'building' && upgrade.targetBuilding === building.id) {
        buildingDps *= upgrade.multiplier
      }
    }
    dps += buildingDps
  }
  // Apply global multipliers
  dps *= state.globalMultiplier
  dps *= state.prestigeMultiplier
  return dps
}

function calculateClickPower(state: GameState): number {
  let power = state.dotsPerClick
  for (const upgrade of state.upgrades) {
    if (upgrade.purchased && upgrade.type === 'click') {
      power += upgrade.multiplier
    }
  }
  // Add combo bonus
  power *= (1 + state.combo * 0.01)
  power *= state.prestigeMultiplier
  return power
}

function calculatePrestigePoints(totalDots: number): number {
  return Math.floor(Math.pow(totalDots / 1000000, 0.5))
}

// ============= MAIN COMPONENT =============

export default function DotClicker() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [clickEffects, setClickEffects] = useState<Array<{id: number, x: number, y: number, value: string, color: string}>>([])
  const [showPrestige, setShowPrestige] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [goldenDot, setGoldenDot] = useState<{x: number, y: number, expires: number} | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const comboTimerRef = useRef<NodeJS.Timeout | null>(null)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize game
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    // Load saved game or create new
    const saved = localStorage.getItem('dotclicker_save')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Merge with initial data to handle new upgrades/buildings
        setGameState({
          ...parsed,
          buildings: INITIAL_BUILDINGS.map(b => {
            const saved = parsed.buildings?.find((sb: Building) => sb.id === b.id)
            return saved ? { ...b, owned: saved.owned } : b
          }),
          upgrades: INITIAL_UPGRADES.map(u => {
            const saved = parsed.upgrades?.find((su: Upgrade) => su.id === u.id)
            return saved ? { ...u, purchased: saved.purchased } : u
          }),
          achievements: INITIAL_ACHIEVEMENTS.map(a => {
            const saved = parsed.achievements?.find((sa: Achievement) => sa.id === a.id)
            return saved ? { ...a, unlocked: saved.unlocked } : a
          }),
        })

        // Calculate offline earnings
        const offlineTime = (Date.now() - parsed.lastSave) / 1000
        if (offlineTime > 10) {
          const offlineDps = calculateDps(parsed)
          const offlineEarnings = offlineDps * offlineTime * 0.5 // 50% efficiency offline
          if (offlineEarnings > 0) {
            setNotification(`Welcome back! You earned ${formatNumber(offlineEarnings)} dots while away!`)
            setTimeout(() => setNotification(null), 5000)
          }
        }
      } catch {
        initNewGame()
      }
    } else {
      initNewGame()
    }
  }, [user, loading, router])

  function initNewGame() {
    setGameState({
      dots: 0,
      totalDots: 0,
      totalClicks: 0,
      dotsPerClick: 1,
      dotsPerSecond: 0,
      critChance: 0.05,
      critMultiplier: 5,
      goldenDotChance: 0.01,
      globalMultiplier: 1,
      prestigePoints: 0,
      prestigeMultiplier: 1,
      buildings: [...INITIAL_BUILDINGS],
      upgrades: [...INITIAL_UPGRADES],
      achievements: [...INITIAL_ACHIEVEMENTS],
      lastSave: Date.now(),
      startTime: Date.now(),
      combo: 0,
      maxCombo: 0,
      comboTimer: 0,
    })
  }

  // Game loop
  useEffect(() => {
    if (!gameState) return

    gameLoopRef.current = setInterval(() => {
      setGameState(prev => {
        if (!prev) return prev
        const dps = calculateDps(prev)
        const newDots = prev.dots + dps / 20 // 20 ticks per second
        const newTotalDots = prev.totalDots + dps / 20

        // Check achievements
        const newAchievements = prev.achievements.map(a => {
          if (!a.unlocked && a.condition({ ...prev, totalDots: newTotalDots })) {
            setNotification(`Achievement unlocked: ${a.name}! (+${a.reward}% bonus)`)
            setTimeout(() => setNotification(null), 3000)
            return { ...a, unlocked: true }
          }
          return a
        })

        // Calculate achievement bonus
        const achievementBonus = 1 + newAchievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.reward, 0) / 100

        return {
          ...prev,
          dots: newDots,
          totalDots: newTotalDots,
          dotsPerSecond: dps * achievementBonus,
          achievements: newAchievements,
          globalMultiplier: prev.globalMultiplier * achievementBonus / (1 + prev.achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.reward, 0) / 100),
        }
      })
    }, 50)

    // Auto-save every 30 seconds
    saveTimerRef.current = setInterval(() => {
      saveGame()
    }, 30000)

    // Spawn golden dots randomly
    const goldenInterval = setInterval(() => {
      if (Math.random() < 0.02) { // 2% chance every 5 seconds
        setGoldenDot({
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 60,
          expires: Date.now() + 10000
        })
        setTimeout(() => setGoldenDot(null), 10000)
      }
    }, 5000)

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
      if (saveTimerRef.current) clearInterval(saveTimerRef.current)
      clearInterval(goldenInterval)
    }
  }, [gameState !== null])

  // Save game
  const saveGame = useCallback(() => {
    if (gameState) {
      localStorage.setItem('dotclicker_save', JSON.stringify({
        ...gameState,
        lastSave: Date.now()
      }))
    }
  }, [gameState])

  // Handle main dot click
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!gameState) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    let clickPower = calculateClickPower(gameState)
    let isCrit = Math.random() < gameState.critChance
    let color = '#00d9ff'

    if (isCrit) {
      clickPower *= gameState.critMultiplier
      color = '#f39c12'
    }

    // Add click effect
    const effectId = Date.now() + Math.random()
    setClickEffects(prev => [...prev, {
      id: effectId,
      x,
      y,
      value: (isCrit ? 'CRIT! ' : '+') + formatNumber(clickPower),
      color
    }])
    setTimeout(() => {
      setClickEffects(prev => prev.filter(e => e.id !== effectId))
    }, 1000)

    // Reset combo timer
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current)
    comboTimerRef.current = setTimeout(() => {
      setGameState(prev => prev ? { ...prev, combo: 0 } : prev)
    }, 2000)

    setGameState(prev => {
      if (!prev) return prev
      const newCombo = prev.combo + 1
      return {
        ...prev,
        dots: prev.dots + clickPower,
        totalDots: prev.totalDots + clickPower,
        totalClicks: prev.totalClicks + 1,
        combo: newCombo,
        maxCombo: Math.max(prev.maxCombo, newCombo)
      }
    })
  }, [gameState])

  // Handle golden dot click
  const handleGoldenClick = useCallback(() => {
    if (!gameState || !goldenDot) return

    const bonus = gameState.dotsPerSecond * 60 // 1 minute of production
    setGameState(prev => prev ? {
      ...prev,
      dots: prev.dots + bonus,
      totalDots: prev.totalDots + bonus
    } : prev)

    setNotification(`Golden Dot! +${formatNumber(bonus)} dots!`)
    setTimeout(() => setNotification(null), 3000)
    setGoldenDot(null)
  }, [gameState, goldenDot])

  // Buy building
  const buyBuilding = useCallback((buildingId: string) => {
    if (!gameState) return

    const building = gameState.buildings.find(b => b.id === buildingId)
    if (!building) return

    const cost = getBuildingCost(building)
    if (gameState.dots < cost) return

    setGameState(prev => {
      if (!prev) return prev
      return {
        ...prev,
        dots: prev.dots - cost,
        buildings: prev.buildings.map(b =>
          b.id === buildingId ? { ...b, owned: b.owned + 1 } : b
        )
      }
    })
  }, [gameState])

  // Buy upgrade
  const buyUpgrade = useCallback((upgradeId: string) => {
    if (!gameState) return

    const upgrade = gameState.upgrades.find(u => u.id === upgradeId)
    if (!upgrade || upgrade.purchased || gameState.dots < upgrade.cost) return

    setGameState(prev => {
      if (!prev) return prev
      let newState = {
        ...prev,
        dots: prev.dots - upgrade.cost,
        upgrades: prev.upgrades.map(u =>
          u.id === upgradeId ? { ...u, purchased: true } : u
        )
      }

      // Apply upgrade effects
      if (upgrade.type === 'crit') {
        newState.critChance += upgrade.multiplier
      } else if (upgrade.type === 'golden') {
        newState.goldenDotChance += upgrade.multiplier
      } else if (upgrade.type === 'global') {
        newState.globalMultiplier *= upgrade.multiplier
      }

      return newState
    })
  }, [gameState])

  // Prestige
  const handlePrestige = useCallback(() => {
    if (!gameState) return

    const newPrestigePoints = calculatePrestigePoints(gameState.totalDots)
    if (newPrestigePoints < 1) return

    const totalPrestige = gameState.prestigePoints + newPrestigePoints

    setGameState({
      dots: 0,
      totalDots: 0,
      totalClicks: 0,
      dotsPerClick: 1,
      dotsPerSecond: 0,
      critChance: 0.05,
      critMultiplier: 5,
      goldenDotChance: 0.01,
      globalMultiplier: 1,
      prestigePoints: totalPrestige,
      prestigeMultiplier: 1 + totalPrestige * 0.1, // +10% per prestige point
      buildings: INITIAL_BUILDINGS.map(b => ({ ...b, owned: 0 })),
      upgrades: INITIAL_UPGRADES.map(u => ({ ...u, purchased: false })),
      achievements: gameState.achievements, // Keep achievements
      lastSave: Date.now(),
      startTime: Date.now(),
      combo: 0,
      maxCombo: gameState.maxCombo, // Keep max combo
      comboTimer: 0,
    })

    setShowPrestige(false)
    setNotification(`Prestiged! Gained ${newPrestigePoints} prestige points. New multiplier: ${((1 + totalPrestige * 0.1) * 100).toFixed(0)}%`)
    setTimeout(() => setNotification(null), 5000)
  }, [gameState])

  if (loading || !gameState) {
    return (
      <div className="loading-screen">
        <div className="loading-dot"></div>
        <p>Loading Dot Clicker...</p>
        <style jsx>{`
          .loading-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: linear-gradient(135deg, #0a1929 0%, #1a0a2e 100%);
            color: #00d9ff;
          }
          .loading-dot {
            width: 80px;
            height: 80px;
            background: #00d9ff;
            border-radius: 50%;
            animation: pulse 1s ease-in-out infinite;
            margin-bottom: 20px;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
          }
        `}</style>
      </div>
    )
  }

  const potentialPrestige = calculatePrestigePoints(gameState.totalDots)

  return (
    <div className="clicker-container">
      {/* Header */}
      <header className="header">
        <Link href="/hub" className="back-btn">← Hub</Link>
        <div className="title">
          <span className="dot-icon">●</span> DOT CLICKER
        </div>
        <div className="header-stats">
          <span className="prestige-display">⭐ {gameState.prestigePoints} ({((gameState.prestigeMultiplier - 1) * 100).toFixed(0)}% bonus)</span>
        </div>
      </header>

      {/* Main Stats */}
      <div className="main-stats">
        <div className="dots-display">
          <span className="dots-value">{formatNumber(gameState.dots)}</span>
          <span className="dots-label">DOTS</span>
        </div>
        <div className="dps-display">
          {formatNumber(gameState.dotsPerSecond)} dots/sec
        </div>
        {gameState.combo > 0 && (
          <div className="combo-display">
            🔥 {gameState.combo}x COMBO
          </div>
        )}
      </div>

      {/* Click Area */}
      <div className="click-area" onClick={handleClick}>
        <div className="main-dot">
          <span className="dot-face">●</span>
        </div>
        {clickEffects.map(effect => (
          <div
            key={effect.id}
            className="click-effect"
            style={{ left: effect.x, top: effect.y, color: effect.color }}
          >
            {effect.value}
          </div>
        ))}
        {goldenDot && (
          <div
            className="golden-dot"
            style={{ left: `${goldenDot.x}%`, top: `${goldenDot.y}%` }}
            onClick={(e) => { e.stopPropagation(); handleGoldenClick(); }}
          >
            🌟
          </div>
        )}
      </div>

      {/* Click Power Info */}
      <div className="click-info">
        +{formatNumber(calculateClickPower(gameState))} per click | {(gameState.critChance * 100).toFixed(0)}% crit
      </div>

      {/* Buildings */}
      <div className="buildings-section">
        <h3>Buildings</h3>
        <div className="buildings-list">
          {gameState.buildings.filter(b => gameState.totalDots >= b.unlockAt || b.owned > 0).map(building => {
            const cost = getBuildingCost(building)
            const canAfford = gameState.dots >= cost
            return (
              <div
                key={building.id}
                className={`building-item ${canAfford ? 'affordable' : ''}`}
                onClick={() => buyBuilding(building.id)}
                style={{ borderColor: building.color }}
              >
                <span className="building-icon">{building.icon}</span>
                <div className="building-info">
                  <span className="building-name">{building.name}</span>
                  <span className="building-owned">Owned: {building.owned}</span>
                </div>
                <div className="building-cost">
                  <span className="cost-value">{formatNumber(cost)}</span>
                  <span className="building-dps">+{formatNumber(building.baseDps)}/s</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upgrades */}
      <div className="upgrades-section">
        <h3>Upgrades</h3>
        <div className="upgrades-list">
          {gameState.upgrades
            .filter(u => !u.purchased && (gameState.totalDots >= u.unlockAt))
            .slice(0, 6)
            .map(upgrade => {
              const canAfford = gameState.dots >= upgrade.cost
              return (
                <div
                  key={upgrade.id}
                  className={`upgrade-item ${canAfford ? 'affordable' : ''}`}
                  onClick={() => buyUpgrade(upgrade.id)}
                  title={upgrade.description}
                >
                  <span className="upgrade-icon">{upgrade.icon}</span>
                  <span className="upgrade-name">{upgrade.name}</span>
                  <span className="upgrade-cost">{formatNumber(upgrade.cost)}</span>
                </div>
              )
            })}
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="bottom-buttons">
        <button className="btn achievements-btn" onClick={() => setShowAchievements(true)}>
          🏆 Achievements ({gameState.achievements.filter(a => a.unlocked).length}/{gameState.achievements.length})
        </button>
        <button
          className={`btn prestige-btn ${potentialPrestige > 0 ? 'available' : ''}`}
          onClick={() => setShowPrestige(true)}
        >
          ⭐ Prestige {potentialPrestige > 0 && `(+${potentialPrestige})`}
        </button>
        <button className="btn save-btn" onClick={saveGame}>
          💾 Save
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className="notification">{notification}</div>
      )}

      {/* Prestige Modal */}
      {showPrestige && (
        <div className="modal-overlay" onClick={() => setShowPrestige(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>⭐ Prestige</h2>
            <p>Reset your progress for permanent bonuses!</p>
            <div className="prestige-info">
              <p>Current prestige points: <strong>{gameState.prestigePoints}</strong></p>
              <p>Points to gain: <strong className="gain">{potentialPrestige}</strong></p>
              <p>New multiplier: <strong>{(((gameState.prestigePoints + potentialPrestige) * 0.1 + 1) * 100).toFixed(0)}%</strong></p>
            </div>
            {potentialPrestige > 0 ? (
              <button className="btn prestige-confirm" onClick={handlePrestige}>
                Prestige Now!
              </button>
            ) : (
              <p className="prestige-warning">Earn more dots to prestige! (Need 1M total)</p>
            )}
            <button className="btn close-btn" onClick={() => setShowPrestige(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Achievements Modal */}
      {showAchievements && (
        <div className="modal-overlay" onClick={() => setShowAchievements(false)}>
          <div className="modal achievements-modal" onClick={e => e.stopPropagation()}>
            <h2>🏆 Achievements</h2>
            <div className="achievements-list">
              {gameState.achievements.map(achievement => (
                <div key={achievement.id} className={`achievement-item ${achievement.unlocked ? 'unlocked' : ''}`}>
                  <span className="achievement-icon">{achievement.icon}</span>
                  <div className="achievement-info">
                    <span className="achievement-name">{achievement.name}</span>
                    <span className="achievement-desc">{achievement.description}</span>
                  </div>
                  <span className="achievement-reward">+{achievement.reward}%</span>
                </div>
              ))}
            </div>
            <button className="btn close-btn" onClick={() => setShowAchievements(false)}>Close</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .clicker-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a1929 0%, #0d2137 50%, #0a1929 100%);
          color: white;
          font-family: 'Segoe UI', system-ui, sans-serif;
          padding-bottom: 100px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(0, 217, 255, 0.2);
        }

        .back-btn {
          color: #888;
          text-decoration: none;
          padding: 8px 15px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.1);
          transition: all 0.3s;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #00d9ff;
        }

        .dot-icon {
          animation: pulse 1s ease-in-out infinite;
        }

        .prestige-display {
          color: #f39c12;
          font-weight: bold;
        }

        .main-stats {
          text-align: center;
          padding: 30px 20px;
        }

        .dots-display {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .dots-value {
          font-size: 4rem;
          font-weight: 900;
          color: #00d9ff;
          text-shadow: 0 0 30px rgba(0, 217, 255, 0.5);
        }

        .dots-label {
          font-size: 1.2rem;
          color: #888;
          letter-spacing: 4px;
        }

        .dps-display {
          color: #2ecc71;
          font-size: 1.2rem;
          margin-top: 10px;
        }

        .combo-display {
          color: #ff6b00;
          font-size: 1.5rem;
          font-weight: bold;
          margin-top: 10px;
          animation: pulse 0.5s ease-in-out infinite;
        }

        .click-area {
          position: relative;
          width: 250px;
          height: 250px;
          margin: 20px auto;
          cursor: pointer;
          user-select: none;
        }

        .main-dot {
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 30% 30%, #00d9ff 0%, #0066aa 50%, #003366 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 60px rgba(0, 217, 255, 0.5), inset 0 0 60px rgba(255, 255, 255, 0.1);
          transition: transform 0.1s;
        }

        .main-dot:active {
          transform: scale(0.95);
        }

        .dot-face {
          font-size: 80px;
          color: white;
          text-shadow: 0 0 20px white;
        }

        .click-effect {
          position: absolute;
          font-weight: bold;
          font-size: 1.5rem;
          pointer-events: none;
          animation: floatUp 1s ease-out forwards;
          text-shadow: 0 0 10px currentColor;
        }

        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(1.5); }
        }

        .golden-dot {
          position: absolute;
          font-size: 3rem;
          cursor: pointer;
          animation: goldenPulse 0.5s ease-in-out infinite, goldenFloat 2s ease-in-out infinite;
          z-index: 10;
          filter: drop-shadow(0 0 20px gold);
        }

        @keyframes goldenPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        @keyframes goldenFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .click-info {
          text-align: center;
          color: #888;
          margin-bottom: 20px;
        }

        .buildings-section, .upgrades-section {
          padding: 0 20px;
          margin-bottom: 20px;
        }

        h3 {
          color: #00d9ff;
          margin-bottom: 15px;
          font-size: 1.2rem;
        }

        .buildings-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .building-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          border-left: 4px solid;
          cursor: pointer;
          transition: all 0.2s;
          opacity: 0.5;
        }

        .building-item.affordable {
          opacity: 1;
        }

        .building-item.affordable:hover {
          background: rgba(0, 217, 255, 0.1);
          transform: translateX(5px);
        }

        .building-icon {
          font-size: 2rem;
        }

        .building-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .building-name {
          font-weight: bold;
        }

        .building-owned {
          font-size: 0.85rem;
          color: #888;
        }

        .building-cost {
          text-align: right;
        }

        .cost-value {
          display: block;
          font-weight: bold;
          color: #00d9ff;
        }

        .building-dps {
          font-size: 0.85rem;
          color: #2ecc71;
        }

        .upgrades-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 10px;
        }

        .upgrade-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 15px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          opacity: 0.5;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .upgrade-item.affordable {
          opacity: 1;
          border-color: #00d9ff;
        }

        .upgrade-item.affordable:hover {
          background: rgba(0, 217, 255, 0.1);
          transform: scale(1.05);
        }

        .upgrade-icon {
          font-size: 2rem;
          margin-bottom: 5px;
        }

        .upgrade-name {
          font-size: 0.9rem;
          text-align: center;
          margin-bottom: 5px;
        }

        .upgrade-cost {
          color: #00d9ff;
          font-weight: bold;
        }

        .bottom-buttons {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          gap: 10px;
          padding: 15px 20px;
          background: rgba(0, 0, 0, 0.9);
          border-top: 1px solid rgba(0, 217, 255, 0.2);
        }

        .btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 10px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }

        .achievements-btn {
          background: rgba(243, 156, 18, 0.2);
          color: #f39c12;
        }

        .prestige-btn {
          background: rgba(155, 89, 182, 0.2);
          color: #9b59b6;
        }

        .prestige-btn.available {
          background: rgba(155, 89, 182, 0.4);
          animation: pulse 1s ease-in-out infinite;
        }

        .save-btn {
          background: rgba(46, 204, 113, 0.2);
          color: #2ecc71;
        }

        .btn:hover {
          filter: brightness(1.2);
          transform: translateY(-2px);
        }

        .notification {
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.9);
          color: #f39c12;
          padding: 15px 30px;
          border-radius: 10px;
          border: 1px solid #f39c12;
          z-index: 100;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
        }

        .modal {
          background: #1a2332;
          padding: 30px;
          border-radius: 20px;
          max-width: 400px;
          width: 90%;
          text-align: center;
          border: 1px solid rgba(0, 217, 255, 0.3);
        }

        .achievements-modal {
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal h2 {
          color: #00d9ff;
          margin-bottom: 20px;
        }

        .prestige-info {
          background: rgba(0, 0, 0, 0.3);
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
        }

        .prestige-info p {
          margin: 10px 0;
        }

        .prestige-info .gain {
          color: #2ecc71;
          font-size: 1.5rem;
        }

        .prestige-confirm {
          background: linear-gradient(135deg, #9b59b6, #8e44ad);
          color: white;
          padding: 15px 30px;
          font-size: 1.1rem;
          margin: 15px 0;
        }

        .prestige-warning {
          color: #e74c3c;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.1);
          color: #888;
          margin-top: 10px;
        }

        .achievements-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-align: left;
          margin: 20px 0;
        }

        .achievement-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 10px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          opacity: 0.4;
        }

        .achievement-item.unlocked {
          opacity: 1;
          border: 1px solid #f39c12;
        }

        .achievement-icon {
          font-size: 1.5rem;
        }

        .achievement-info {
          flex: 1;
        }

        .achievement-name {
          display: block;
          font-weight: bold;
        }

        .achievement-desc {
          font-size: 0.85rem;
          color: #888;
        }

        .achievement-reward {
          color: #2ecc71;
          font-weight: bold;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}

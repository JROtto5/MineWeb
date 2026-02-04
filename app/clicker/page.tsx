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
  type: 'click' | 'building' | 'global' | 'crit' | 'golden' | 'combo' | 'offline'
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
  comboMultiplier: number
  offlineMultiplier: number
  // Statistics
  totalGoldenClicks: number
  totalCrits: number
  totalPrestiges: number
  highestDps: number
  // Cross-game synergy
  slayerFloorsCleared: number
  synergyBonus: number
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
  { id: 'timemachine', name: 'Time Machine', description: 'Harvests dots from the future', baseCost: 75000000000, baseDps: 1600000, owned: 0, icon: '⏰', color: '#e056fd', unlockAt: 5000000000 },
  { id: 'antimatter', name: 'Antimatter Condenser', description: 'Condenses antimatter into dots', baseCost: 1000000000000, baseDps: 10000000, owned: 0, icon: '💫', color: '#ff6b6b', unlockAt: 50000000000 },
  { id: 'prism', name: 'Prism', description: 'Converts light into dots', baseCost: 14000000000000, baseDps: 65000000, owned: 0, icon: '🔮', color: '#a29bfe', unlockAt: 500000000000 },
]

const INITIAL_UPGRADES: Upgrade[] = [
  // Click upgrades
  { id: 'click1', name: 'Reinforced Finger', description: '+1 dot per click', cost: 100, multiplier: 1, type: 'click', purchased: false, icon: '👆', unlockAt: 0 },
  { id: 'click2', name: 'Iron Finger', description: 'Double click power', cost: 500, multiplier: 2, type: 'click', purchased: false, icon: '🦾', unlockAt: 100 },
  { id: 'click3', name: 'Golden Touch', description: 'Triple click power', cost: 5000, multiplier: 3, type: 'click', purchased: false, icon: '✨', unlockAt: 1000 },
  { id: 'click4', name: 'Diamond Hands', description: '5x click power', cost: 50000, multiplier: 5, type: 'click', purchased: false, icon: '💎', unlockAt: 10000 },
  { id: 'click5', name: 'Quantum Fingers', description: '10x click power', cost: 500000, multiplier: 10, type: 'click', purchased: false, icon: '🌌', unlockAt: 100000 },
  { id: 'click6', name: 'Cosmic Touch', description: '25x click power', cost: 5000000, multiplier: 25, type: 'click', purchased: false, icon: '🪐', unlockAt: 1000000 },

  // Crit upgrades
  { id: 'crit1', name: 'Lucky Finger', description: '+5% crit chance', cost: 1000, multiplier: 0.05, type: 'crit', purchased: false, icon: '🍀', unlockAt: 200 },
  { id: 'crit2', name: 'Super Lucky', description: '+10% crit chance', cost: 10000, multiplier: 0.10, type: 'crit', purchased: false, icon: '🎰', unlockAt: 2000 },
  { id: 'crit3', name: 'Critical Master', description: '+15% crit chance', cost: 100000, multiplier: 0.15, type: 'crit', purchased: false, icon: '💥', unlockAt: 20000 },
  { id: 'crit4', name: 'Crit Lord', description: '+20% crit chance', cost: 1000000, multiplier: 0.20, type: 'crit', purchased: false, icon: '⚡', unlockAt: 200000 },

  // Golden dot upgrades
  { id: 'golden1', name: 'Golden Vision', description: '+2% golden dot chance', cost: 5000, multiplier: 0.02, type: 'golden', purchased: false, icon: '👁️', unlockAt: 1000 },
  { id: 'golden2', name: 'Midas Touch', description: '+5% golden dot chance', cost: 50000, multiplier: 0.05, type: 'golden', purchased: false, icon: '🏆', unlockAt: 10000 },
  { id: 'golden3', name: 'Golden Aura', description: '+10% golden dot chance', cost: 500000, multiplier: 0.10, type: 'golden', purchased: false, icon: '👑', unlockAt: 100000 },

  // Combo upgrades
  { id: 'combo1', name: 'Combo Starter', description: '+50% combo bonus', cost: 2000, multiplier: 0.5, type: 'combo', purchased: false, icon: '🔥', unlockAt: 500 },
  { id: 'combo2', name: 'Combo Master', description: '+100% combo bonus', cost: 20000, multiplier: 1.0, type: 'combo', purchased: false, icon: '💪', unlockAt: 5000 },
  { id: 'combo3', name: 'Combo God', description: '+200% combo bonus', cost: 200000, multiplier: 2.0, type: 'combo', purchased: false, icon: '🌟', unlockAt: 50000 },

  // Offline upgrades
  { id: 'offline1', name: 'Dream Dots', description: '+25% offline earnings', cost: 10000, multiplier: 0.25, type: 'offline', purchased: false, icon: '😴', unlockAt: 5000 },
  { id: 'offline2', name: 'Sleep Worker', description: '+50% offline earnings', cost: 100000, multiplier: 0.50, type: 'offline', purchased: false, icon: '🛏️', unlockAt: 50000 },
  { id: 'offline3', name: 'Passive Master', description: '+100% offline earnings', cost: 1000000, multiplier: 1.0, type: 'offline', purchased: false, icon: '🧘', unlockAt: 500000 },

  // Building upgrades - Cursors
  { id: 'cursor_up1', name: 'Faster Cursors', description: 'Cursors 2x effective', cost: 200, multiplier: 2, type: 'building', targetBuilding: 'cursor', purchased: false, icon: '⚡', unlockAt: 50 },
  { id: 'cursor_up2', name: 'Ambidextrous', description: 'Cursors 2x effective', cost: 5000, multiplier: 2, type: 'building', targetBuilding: 'cursor', purchased: false, icon: '🤲', unlockAt: 1000 },
  { id: 'cursor_up3', name: 'Thousand Hands', description: 'Cursors 2x effective', cost: 500000, multiplier: 2, type: 'building', targetBuilding: 'cursor', purchased: false, icon: '🙌', unlockAt: 100000 },

  // Building upgrades - Farms
  { id: 'farm_up1', name: 'Fertilizer', description: 'Farms 2x effective', cost: 1000, multiplier: 2, type: 'building', targetBuilding: 'farm', purchased: false, icon: '💧', unlockAt: 500 },
  { id: 'farm_up2', name: 'Irrigation', description: 'Farms 2x effective', cost: 50000, multiplier: 2, type: 'building', targetBuilding: 'farm', purchased: false, icon: '🚿', unlockAt: 10000 },
  { id: 'farm_up3', name: 'GMO Dots', description: 'Farms 2x effective', cost: 5000000, multiplier: 2, type: 'building', targetBuilding: 'farm', purchased: false, icon: '🧬', unlockAt: 1000000 },

  // Building upgrades - Factories
  { id: 'factory_up1', name: 'Automation', description: 'Factories 2x effective', cost: 10000, multiplier: 2, type: 'building', targetBuilding: 'factory', purchased: false, icon: '🤖', unlockAt: 5000 },
  { id: 'factory_up2', name: 'Assembly Line', description: 'Factories 2x effective', cost: 500000, multiplier: 2, type: 'building', targetBuilding: 'factory', purchased: false, icon: '�icing', unlockAt: 100000 },

  // Building upgrades - Mines
  { id: 'mine_up1', name: 'Deeper Shafts', description: 'Mines 2x effective', cost: 100000, multiplier: 2, type: 'building', targetBuilding: 'mine', purchased: false, icon: '🕳️', unlockAt: 50000 },
  { id: 'mine_up2', name: 'Diamond Drills', description: 'Mines 2x effective', cost: 10000000, multiplier: 2, type: 'building', targetBuilding: 'mine', purchased: false, icon: '💎', unlockAt: 5000000 },

  // Building upgrades - Labs
  { id: 'lab_up1', name: 'Better Beakers', description: 'Labs 2x effective', cost: 1000000, multiplier: 2, type: 'building', targetBuilding: 'lab', purchased: false, icon: '🧪', unlockAt: 500000 },

  // Building upgrades - Temples
  { id: 'temple_up1', name: 'Holy Dots', description: 'Temples 2x effective', cost: 10000000, multiplier: 2, type: 'building', targetBuilding: 'temple', purchased: false, icon: '✝️', unlockAt: 5000000 },

  // Global upgrades
  { id: 'global1', name: 'Efficiency I', description: '+10% all production', cost: 10000, multiplier: 1.1, type: 'global', purchased: false, icon: '📈', unlockAt: 5000 },
  { id: 'global2', name: 'Efficiency II', description: '+25% all production', cost: 100000, multiplier: 1.25, type: 'global', purchased: false, icon: '📊', unlockAt: 50000 },
  { id: 'global3', name: 'Efficiency III', description: '+50% all production', cost: 1000000, multiplier: 1.5, type: 'global', purchased: false, icon: '🚀', unlockAt: 500000 },
  { id: 'global4', name: 'Efficiency IV', description: '+100% all production', cost: 10000000, multiplier: 2.0, type: 'global', purchased: false, icon: '🌠', unlockAt: 5000000 },
  { id: 'global5', name: 'Efficiency V', description: '+200% all production', cost: 100000000, multiplier: 3.0, type: 'global', purchased: false, icon: '🎇', unlockAt: 50000000 },
]

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  // Clicking achievements
  { id: 'first_click', name: 'Baby Steps', description: 'Click the dot', condition: (s) => s.totalClicks >= 1, reward: 1, unlocked: false, icon: '👶' },
  { id: 'clicks_100', name: 'Dedicated Clicker', description: 'Click 100 times', condition: (s) => s.totalClicks >= 100, reward: 5, unlocked: false, icon: '👆' },
  { id: 'clicks_1000', name: 'Click Master', description: 'Click 1,000 times', condition: (s) => s.totalClicks >= 1000, reward: 10, unlocked: false, icon: '🖱️' },
  { id: 'clicks_10000', name: 'Click Legend', description: 'Click 10,000 times', condition: (s) => s.totalClicks >= 10000, reward: 25, unlocked: false, icon: '⚡' },
  { id: 'clicks_100000', name: 'Click God', description: 'Click 100,000 times', condition: (s) => s.totalClicks >= 100000, reward: 50, unlocked: false, icon: '🌟' },

  // Dot earning achievements
  { id: 'dots_100', name: 'Dot Collector', description: 'Earn 100 dots', condition: (s) => s.totalDots >= 100, reward: 2, unlocked: false, icon: '●' },
  { id: 'dots_1000', name: 'Dot Hoarder', description: 'Earn 1,000 dots', condition: (s) => s.totalDots >= 1000, reward: 5, unlocked: false, icon: '◉' },
  { id: 'dots_10000', name: 'Dot Enthusiast', description: 'Earn 10,000 dots', condition: (s) => s.totalDots >= 10000, reward: 10, unlocked: false, icon: '⬤' },
  { id: 'dots_1m', name: 'Dot Millionaire', description: 'Earn 1 million dots', condition: (s) => s.totalDots >= 1000000, reward: 20, unlocked: false, icon: '💰' },
  { id: 'dots_1b', name: 'Dot Billionaire', description: 'Earn 1 billion dots', condition: (s) => s.totalDots >= 1000000000, reward: 50, unlocked: false, icon: '🏦' },
  { id: 'dots_1t', name: 'Dot Trillionaire', description: 'Earn 1 trillion dots', condition: (s) => s.totalDots >= 1000000000000, reward: 100, unlocked: false, icon: '🌍' },

  // Building achievements
  { id: 'building_10', name: 'Entrepreneur', description: 'Own 10 buildings', condition: (s) => s.buildings.reduce((a, b) => a + b.owned, 0) >= 10, reward: 5, unlocked: false, icon: '🏢' },
  { id: 'building_50', name: 'Tycoon', description: 'Own 50 buildings', condition: (s) => s.buildings.reduce((a, b) => a + b.owned, 0) >= 50, reward: 15, unlocked: false, icon: '🏙️' },
  { id: 'building_100', name: 'Mogul', description: 'Own 100 buildings', condition: (s) => s.buildings.reduce((a, b) => a + b.owned, 0) >= 100, reward: 30, unlocked: false, icon: '🌆' },
  { id: 'building_200', name: 'Empire Builder', description: 'Own 200 buildings', condition: (s) => s.buildings.reduce((a, b) => a + b.owned, 0) >= 200, reward: 50, unlocked: false, icon: '👑' },

  // Combo achievements
  { id: 'combo_10', name: 'Combo Starter', description: 'Reach 10 combo', condition: (s) => s.maxCombo >= 10, reward: 3, unlocked: false, icon: '🔥' },
  { id: 'combo_50', name: 'Combo King', description: 'Reach 50 combo', condition: (s) => s.maxCombo >= 50, reward: 10, unlocked: false, icon: '👑' },
  { id: 'combo_100', name: 'Combo Legend', description: 'Reach 100 combo', condition: (s) => s.maxCombo >= 100, reward: 25, unlocked: false, icon: '🏆' },

  // Crit achievements
  { id: 'crits_10', name: 'Lucky Strike', description: 'Land 10 crits', condition: (s) => s.totalCrits >= 10, reward: 5, unlocked: false, icon: '💥' },
  { id: 'crits_100', name: 'Crit Machine', description: 'Land 100 crits', condition: (s) => s.totalCrits >= 100, reward: 15, unlocked: false, icon: '⚡' },
  { id: 'crits_1000', name: 'Crit Lord', description: 'Land 1000 crits', condition: (s) => s.totalCrits >= 1000, reward: 30, unlocked: false, icon: '🌩️' },

  // Golden dot achievements
  { id: 'golden_1', name: 'Golden Finder', description: 'Click 1 golden dot', condition: (s) => s.totalGoldenClicks >= 1, reward: 5, unlocked: false, icon: '⭐' },
  { id: 'golden_10', name: 'Golden Hunter', description: 'Click 10 golden dots', condition: (s) => s.totalGoldenClicks >= 10, reward: 15, unlocked: false, icon: '🌟' },
  { id: 'golden_50', name: 'Golden Master', description: 'Click 50 golden dots', condition: (s) => s.totalGoldenClicks >= 50, reward: 30, unlocked: false, icon: '✨' },

  // Prestige achievements
  { id: 'prestige_1', name: 'Ascended', description: 'Prestige once', condition: (s) => s.totalPrestiges >= 1, reward: 0, unlocked: false, icon: '🌟' },
  { id: 'prestige_5', name: 'Transcendent', description: 'Prestige 5 times', condition: (s) => s.totalPrestiges >= 5, reward: 10, unlocked: false, icon: '💫' },
  { id: 'prestige_10', name: 'Eternal', description: 'Prestige 10 times', condition: (s) => s.totalPrestiges >= 10, reward: 25, unlocked: false, icon: '🌌' },

  // DPS achievements
  { id: 'dps_100', name: 'Passive Income', description: 'Reach 100 dots/sec', condition: (s) => s.highestDps >= 100, reward: 5, unlocked: false, icon: '📈' },
  { id: 'dps_10000', name: 'Dot Machine', description: 'Reach 10K dots/sec', condition: (s) => s.highestDps >= 10000, reward: 15, unlocked: false, icon: '🚀' },
  { id: 'dps_1m', name: 'Dot Factory', description: 'Reach 1M dots/sec', condition: (s) => s.highestDps >= 1000000, reward: 30, unlocked: false, icon: '🏭' },

  // Cross-game achievements
  { id: 'synergy_1', name: 'Cross-Game Newbie', description: 'Clear 1 DotSlayer floor', condition: (s) => s.slayerFloorsCleared >= 1, reward: 10, unlocked: false, icon: '🔗' },
  { id: 'synergy_10', name: 'Synergy Seeker', description: 'Clear 10 DotSlayer floors', condition: (s) => s.slayerFloorsCleared >= 10, reward: 25, unlocked: false, icon: '⚔️' },
  { id: 'synergy_50', name: 'Dual Master', description: 'Clear 50 DotSlayer floors', condition: (s) => s.slayerFloorsCleared >= 50, reward: 50, unlocked: false, icon: '🎮' },
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

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  if (hours > 0) return `${hours}h ${mins}m`
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}

function getBuildingCost(building: Building): number {
  return Math.floor(building.baseCost * Math.pow(1.15, building.owned))
}

function calculateDps(state: GameState): number {
  let dps = 0
  for (const building of state.buildings) {
    let buildingDps = building.baseDps * building.owned
    for (const upgrade of state.upgrades) {
      if (upgrade.purchased && upgrade.type === 'building' && upgrade.targetBuilding === building.id) {
        buildingDps *= upgrade.multiplier
      }
    }
    dps += buildingDps
  }
  dps *= state.globalMultiplier
  dps *= state.prestigeMultiplier
  dps *= (1 + state.synergyBonus)
  return dps
}

function calculateClickPower(state: GameState): number {
  let power = state.dotsPerClick
  for (const upgrade of state.upgrades) {
    if (upgrade.purchased && upgrade.type === 'click') {
      power += upgrade.multiplier
    }
  }
  power *= (1 + state.combo * 0.01 * state.comboMultiplier)
  power *= state.prestigeMultiplier
  power *= (1 + state.synergyBonus)
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
  const [activeTab, setActiveTab] = useState<'buildings' | 'upgrades' | 'stats' | 'achievements'>('buildings')
  const [showPrestige, setShowPrestige] = useState(false)
  const [goldenDot, setGoldenDot] = useState<{x: number, y: number, expires: number} | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [frenzyMode, setFrenzyMode] = useState(false)
  const [frenzyTimer, setFrenzyTimer] = useState(0)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const comboTimerRef = useRef<NodeJS.Timeout | null>(null)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize game
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    const saved = localStorage.getItem('dotclicker_save')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const mergedState = {
          ...getInitialState(),
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
        }
        setGameState(mergedState)

        // Calculate offline earnings
        const offlineTime = (Date.now() - parsed.lastSave) / 1000
        if (offlineTime > 10) {
          const offlineDps = calculateDps(mergedState)
          const offlineEarnings = offlineDps * offlineTime * (0.5 + mergedState.offlineMultiplier)
          if (offlineEarnings > 0) {
            setGameState(prev => prev ? {
              ...prev,
              dots: prev.dots + offlineEarnings,
              totalDots: prev.totalDots + offlineEarnings
            } : prev)
            setNotification(`Welcome back! You earned ${formatNumber(offlineEarnings)} dots while away! (${formatTime(offlineTime)})`)
            setTimeout(() => setNotification(null), 5000)
          }
        }

        // Load cross-game synergy from localStorage
        const slayerProgress = localStorage.getItem('dotslayer_progress')
        if (slayerProgress) {
          const progress = JSON.parse(slayerProgress)
          setGameState(prev => prev ? {
            ...prev,
            slayerFloorsCleared: progress.floorsCleared || 0,
            synergyBonus: (progress.floorsCleared || 0) * 0.01 // 1% per floor
          } : prev)
        }
      } catch {
        setGameState(getInitialState())
      }
    } else {
      setGameState(getInitialState())
    }
  }, [user, loading, router])

  function getInitialState(): GameState {
    return {
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
      comboMultiplier: 1,
      offlineMultiplier: 0,
      totalGoldenClicks: 0,
      totalCrits: 0,
      totalPrestiges: 0,
      highestDps: 0,
      slayerFloorsCleared: 0,
      synergyBonus: 0,
    }
  }

  // Game loop
  useEffect(() => {
    if (!gameState) return

    gameLoopRef.current = setInterval(() => {
      setGameState(prev => {
        if (!prev) return prev
        const dps = calculateDps(prev) * (frenzyMode ? 7 : 1)
        const newDots = prev.dots + dps / 20
        const newTotalDots = prev.totalDots + dps / 20

        // Check achievements
        const newAchievements = prev.achievements.map(a => {
          if (!a.unlocked && a.condition({ ...prev, totalDots: newTotalDots, highestDps: Math.max(prev.highestDps, dps) })) {
            setNotification(`Achievement: ${a.name}! (+${a.reward}% bonus)`)
            setTimeout(() => setNotification(null), 3000)
            return { ...a, unlocked: true }
          }
          return a
        })

        const achievementBonus = 1 + newAchievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.reward, 0) / 100

        return {
          ...prev,
          dots: newDots,
          totalDots: newTotalDots,
          dotsPerSecond: dps * achievementBonus,
          highestDps: Math.max(prev.highestDps, dps * achievementBonus),
          achievements: newAchievements,
        }
      })
    }, 50)

    saveTimerRef.current = setInterval(() => saveGame(), 30000)

    const goldenInterval = setInterval(() => {
      if (gameState && Math.random() < (0.02 + gameState.goldenDotChance)) {
        setGoldenDot({
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 60,
          expires: Date.now() + 10000
        })
        setTimeout(() => setGoldenDot(null), 10000)
      }
    }, 5000)

    // Random frenzy mode (7x production for 30 seconds)
    const frenzyInterval = setInterval(() => {
      if (!frenzyMode && Math.random() < 0.01) { // 1% chance every 10 seconds
        setFrenzyMode(true)
        setFrenzyTimer(30)
        setNotification('🔥 FRENZY MODE! 7x production for 30 seconds!')
        setTimeout(() => setNotification(null), 3000)

        const countdownInterval = setInterval(() => {
          setFrenzyTimer(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval)
              setFrenzyMode(false)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    }, 10000)

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
      if (saveTimerRef.current) clearInterval(saveTimerRef.current)
      clearInterval(goldenInterval)
      clearInterval(frenzyInterval)
    }
  }, [gameState !== null, frenzyMode])

  const saveGame = useCallback(() => {
    if (gameState) {
      localStorage.setItem('dotclicker_save', JSON.stringify({
        ...gameState,
        lastSave: Date.now()
      }))
    }
  }, [gameState])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!gameState) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    let clickPower = calculateClickPower(gameState) * (frenzyMode ? 7 : 1)
    let isCrit = Math.random() < gameState.critChance
    let color = '#00d9ff'

    if (isCrit) {
      clickPower *= gameState.critMultiplier
      color = '#f39c12'
    }

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
        totalCrits: isCrit ? prev.totalCrits + 1 : prev.totalCrits,
        combo: newCombo,
        maxCombo: Math.max(prev.maxCombo, newCombo)
      }
    })
  }, [gameState, frenzyMode])

  const handleGoldenClick = useCallback(() => {
    if (!gameState || !goldenDot) return

    const bonus = gameState.dotsPerSecond * 120 // 2 minutes of production
    setGameState(prev => prev ? {
      ...prev,
      dots: prev.dots + bonus,
      totalDots: prev.totalDots + bonus,
      totalGoldenClicks: prev.totalGoldenClicks + 1
    } : prev)

    setNotification(`🌟 Golden Dot! +${formatNumber(bonus)} dots!`)
    setTimeout(() => setNotification(null), 3000)
    setGoldenDot(null)
  }, [gameState, goldenDot])

  const buyBuilding = useCallback((buildingId: string, amount: number = 1) => {
    if (!gameState) return

    const building = gameState.buildings.find(b => b.id === buildingId)
    if (!building) return

    let totalCost = 0
    let tempOwned = building.owned
    for (let i = 0; i < amount; i++) {
      totalCost += Math.floor(building.baseCost * Math.pow(1.15, tempOwned))
      tempOwned++
    }

    if (gameState.dots < totalCost) return

    setGameState(prev => {
      if (!prev) return prev
      return {
        ...prev,
        dots: prev.dots - totalCost,
        buildings: prev.buildings.map(b =>
          b.id === buildingId ? { ...b, owned: b.owned + amount } : b
        )
      }
    })
  }, [gameState])

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

      if (upgrade.type === 'crit') {
        newState.critChance += upgrade.multiplier
      } else if (upgrade.type === 'golden') {
        newState.goldenDotChance += upgrade.multiplier
      } else if (upgrade.type === 'global') {
        newState.globalMultiplier *= upgrade.multiplier
      } else if (upgrade.type === 'combo') {
        newState.comboMultiplier += upgrade.multiplier
      } else if (upgrade.type === 'offline') {
        newState.offlineMultiplier += upgrade.multiplier
      }

      return newState
    })
  }, [gameState])

  const handlePrestige = useCallback(() => {
    if (!gameState) return

    const newPrestigePoints = calculatePrestigePoints(gameState.totalDots)
    if (newPrestigePoints < 1) return

    const totalPrestige = gameState.prestigePoints + newPrestigePoints

    setGameState({
      ...getInitialState(),
      prestigePoints: totalPrestige,
      prestigeMultiplier: 1 + totalPrestige * 0.1,
      achievements: gameState.achievements,
      maxCombo: gameState.maxCombo,
      totalPrestiges: gameState.totalPrestiges + 1,
      totalGoldenClicks: gameState.totalGoldenClicks,
      totalCrits: gameState.totalCrits,
      highestDps: gameState.highestDps,
      slayerFloorsCleared: gameState.slayerFloorsCleared,
      synergyBonus: gameState.synergyBonus,
    })

    setShowPrestige(false)
    setNotification(`⭐ Prestiged! +${newPrestigePoints} points. New bonus: ${((1 + totalPrestige * 0.1) * 100).toFixed(0)}%`)
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
  const playTime = Math.floor((Date.now() - gameState.startTime) / 1000)

  return (
    <div className={`clicker-container ${frenzyMode ? 'frenzy' : ''}`}>
      {/* Header */}
      <header className="header">
        <Link href="/hub" className="back-btn">← Hub</Link>
        <div className="title">
          <span className="dot-icon">●</span> DOT CLICKER
          {frenzyMode && <span className="frenzy-badge">🔥 FRENZY {frenzyTimer}s</span>}
        </div>
        <div className="header-stats">
          <span className="prestige-display">⭐ {gameState.prestigePoints}</span>
        </div>
      </header>

      {/* Main Stats */}
      <div className="main-stats">
        <div className="dots-display">
          <span className="dots-value">{formatNumber(gameState.dots)}</span>
          <span className="dots-label">DOTS</span>
        </div>
        <div className="dps-display">
          {formatNumber(gameState.dotsPerSecond)}/sec | +{formatNumber(calculateClickPower(gameState))}/click
        </div>
        {gameState.combo > 0 && (
          <div className="combo-display">
            🔥 {gameState.combo}x COMBO (+{(gameState.combo * gameState.comboMultiplier).toFixed(0)}%)
          </div>
        )}
        {gameState.synergyBonus > 0 && (
          <div className="synergy-display">
            🔗 Slayer Synergy: +{(gameState.synergyBonus * 100).toFixed(0)}%
          </div>
        )}
      </div>

      {/* Click Area */}
      <div className="click-area" onClick={handleClick}>
        <div className={`main-dot ${frenzyMode ? 'frenzy-dot' : ''}`}>
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

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'buildings' ? 'active' : ''}`} onClick={() => setActiveTab('buildings')}>
          🏭 Buildings
        </button>
        <button className={`tab ${activeTab === 'upgrades' ? 'active' : ''}`} onClick={() => setActiveTab('upgrades')}>
          ⬆️ Upgrades
        </button>
        <button className={`tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
          📊 Stats
        </button>
        <button className={`tab ${activeTab === 'achievements' ? 'active' : ''}`} onClick={() => setActiveTab('achievements')}>
          🏆 {gameState.achievements.filter(a => a.unlocked).length}/{gameState.achievements.length}
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'buildings' && (
          <div className="buildings-list">
            {gameState.buildings.filter(b => gameState.totalDots >= b.unlockAt * 0.5 || b.owned > 0).map(building => {
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
                    <span className="building-desc">{building.description}</span>
                    <span className="building-owned">Owned: {building.owned}</span>
                  </div>
                  <div className="building-cost">
                    <span className="cost-value">{formatNumber(cost)}</span>
                    <span className="building-dps">+{formatNumber(building.baseDps)}/s each</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'upgrades' && (
          <div className="upgrades-scroll">
            <div className="upgrades-section">
              <h4>Available Upgrades</h4>
              <div className="upgrades-grid">
                {gameState.upgrades
                  .filter(u => !u.purchased && gameState.totalDots >= u.unlockAt * 0.5)
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
                        <span className="upgrade-desc">{upgrade.description}</span>
                        <span className="upgrade-cost">{formatNumber(upgrade.cost)}</span>
                      </div>
                    )
                  })}
              </div>
            </div>
            <div className="upgrades-section purchased">
              <h4>Purchased ({gameState.upgrades.filter(u => u.purchased).length})</h4>
              <div className="upgrades-grid">
                {gameState.upgrades
                  .filter(u => u.purchased)
                  .map(upgrade => (
                    <div key={upgrade.id} className="upgrade-item owned">
                      <span className="upgrade-icon">{upgrade.icon}</span>
                      <span className="upgrade-name">{upgrade.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-panel">
            <div className="stat-group">
              <h4>Production</h4>
              <div className="stat-row"><span>Dots per second:</span><span>{formatNumber(gameState.dotsPerSecond)}</span></div>
              <div className="stat-row"><span>Dots per click:</span><span>{formatNumber(calculateClickPower(gameState))}</span></div>
              <div className="stat-row"><span>Highest DPS:</span><span>{formatNumber(gameState.highestDps)}</span></div>
              <div className="stat-row"><span>Global multiplier:</span><span>{(gameState.globalMultiplier * 100).toFixed(0)}%</span></div>
              <div className="stat-row"><span>Prestige multiplier:</span><span>{(gameState.prestigeMultiplier * 100).toFixed(0)}%</span></div>
            </div>
            <div className="stat-group">
              <h4>Clicking</h4>
              <div className="stat-row"><span>Total clicks:</span><span>{formatNumber(gameState.totalClicks)}</span></div>
              <div className="stat-row"><span>Total crits:</span><span>{formatNumber(gameState.totalCrits)}</span></div>
              <div className="stat-row"><span>Crit chance:</span><span>{(gameState.critChance * 100).toFixed(0)}%</span></div>
              <div className="stat-row"><span>Max combo:</span><span>{gameState.maxCombo}x</span></div>
              <div className="stat-row"><span>Combo multiplier:</span><span>{gameState.comboMultiplier}x</span></div>
            </div>
            <div className="stat-group">
              <h4>Progress</h4>
              <div className="stat-row"><span>Total dots earned:</span><span>{formatNumber(gameState.totalDots)}</span></div>
              <div className="stat-row"><span>Golden dots clicked:</span><span>{gameState.totalGoldenClicks}</span></div>
              <div className="stat-row"><span>Total buildings:</span><span>{gameState.buildings.reduce((a, b) => a + b.owned, 0)}</span></div>
              <div className="stat-row"><span>Upgrades bought:</span><span>{gameState.upgrades.filter(u => u.purchased).length}</span></div>
              <div className="stat-row"><span>Total prestiges:</span><span>{gameState.totalPrestiges}</span></div>
              <div className="stat-row"><span>Play time:</span><span>{formatTime(playTime)}</span></div>
            </div>
            <div className="stat-group synergy-group">
              <h4>🔗 Cross-Game Synergy</h4>
              <div className="stat-row"><span>DotSlayer floors:</span><span>{gameState.slayerFloorsCleared}</span></div>
              <div className="stat-row"><span>Synergy bonus:</span><span>+{(gameState.synergyBonus * 100).toFixed(0)}%</span></div>
              <div className="stat-row hint"><span>Play DotSlayer to earn +1% bonus per floor cleared!</span></div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
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
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="bottom-buttons">
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
            <p>Reset progress for permanent bonuses!</p>
            <div className="prestige-info">
              <p>Current points: <strong>{gameState.prestigePoints}</strong></p>
              <p>Points to gain: <strong className="gain">{potentialPrestige}</strong></p>
              <p>New bonus: <strong>{(((gameState.prestigePoints + potentialPrestige) * 0.1 + 1) * 100).toFixed(0)}%</strong></p>
            </div>
            {potentialPrestige > 0 ? (
              <button className="btn prestige-confirm" onClick={handlePrestige}>
                Prestige Now!
              </button>
            ) : (
              <p className="prestige-warning">Need 1M total dots to prestige!</p>
            )}
            <button className="btn close-btn" onClick={() => setShowPrestige(false)}>Close</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .clicker-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a1929 0%, #0d2137 50%, #0a1929 100%);
          color: white;
          font-family: 'Segoe UI', system-ui, sans-serif;
          padding-bottom: 80px;
          transition: all 0.3s;
        }

        .clicker-container.frenzy {
          background: linear-gradient(135deg, #1a0a29 0%, #2d0a37 50%, #1a0a29 100%);
          animation: frenzyPulse 0.5s ease-in-out infinite;
        }

        @keyframes frenzyPulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.1); }
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 15px;
          background: rgba(0, 0, 0, 0.4);
          border-bottom: 1px solid rgba(0, 217, 255, 0.2);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .back-btn {
          color: #888;
          text-decoration: none;
          padding: 6px 12px;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.1);
          font-size: 0.9rem;
        }

        .title {
          font-size: 1.2rem;
          font-weight: bold;
          color: #00d9ff;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .frenzy-badge {
          background: linear-gradient(135deg, #ff6b00, #ff0000);
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 0.8rem;
          animation: pulse 0.3s ease-in-out infinite;
        }

        .dot-icon { animation: pulse 1s ease-in-out infinite; }

        .prestige-display { color: #f39c12; font-weight: bold; }

        .main-stats {
          text-align: center;
          padding: 20px 15px;
        }

        .dots-display { display: flex; flex-direction: column; align-items: center; }

        .dots-value {
          font-size: 3rem;
          font-weight: 900;
          background: linear-gradient(135deg, #00d9ff, #00ffff, #00d9ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 30px rgba(0, 217, 255, 0.5);
          filter: drop-shadow(0 0 10px rgba(0, 217, 255, 0.4));
        }

        .dots-label { font-size: 1rem; color: #888; letter-spacing: 3px; }

        .dps-display { color: #2ecc71; font-size: 1rem; margin-top: 8px; }

        .combo-display {
          color: #ff6b00;
          font-size: 1.2rem;
          font-weight: bold;
          margin-top: 8px;
        }

        .synergy-display {
          color: #9b59b6;
          font-size: 0.9rem;
          margin-top: 5px;
        }

        .click-area {
          position: relative;
          width: 200px;
          height: 200px;
          margin: 15px auto;
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
          box-shadow: 0 0 40px rgba(0, 217, 255, 0.4), 0 0 80px rgba(0, 217, 255, 0.2), inset 0 0 30px rgba(255, 255, 255, 0.1);
          transition: transform 0.1s, box-shadow 0.2s;
          animation: dotGlow 2s ease-in-out infinite;
        }

        @keyframes dotGlow {
          0%, 100% { box-shadow: 0 0 40px rgba(0, 217, 255, 0.4), 0 0 80px rgba(0, 217, 255, 0.2), inset 0 0 30px rgba(255, 255, 255, 0.1); }
          50% { box-shadow: 0 0 60px rgba(0, 217, 255, 0.6), 0 0 100px rgba(0, 217, 255, 0.3), inset 0 0 40px rgba(255, 255, 255, 0.15); }
        }

        .main-dot:active { transform: scale(0.95); }
        .main-dot:hover { box-shadow: 0 0 60px rgba(0, 217, 255, 0.6), 0 0 100px rgba(0, 217, 255, 0.4), inset 0 0 40px rgba(255, 255, 255, 0.2); }

        .main-dot.frenzy-dot {
          background: radial-gradient(circle at 30% 30%, #ff6b00 0%, #ff0000 50%, #990000 100%);
          box-shadow: 0 0 60px rgba(255, 107, 0, 0.6), 0 0 120px rgba(255, 0, 0, 0.4);
          animation: frenzyDotGlow 0.3s ease-in-out infinite;
        }

        @keyframes frenzyDotGlow {
          0%, 100% { box-shadow: 0 0 60px rgba(255, 107, 0, 0.6), 0 0 120px rgba(255, 0, 0, 0.4); }
          50% { box-shadow: 0 0 80px rgba(255, 107, 0, 0.8), 0 0 150px rgba(255, 0, 0, 0.6); }
        }

        .dot-face { font-size: 60px; color: white; text-shadow: 0 0 20px white; }

        .click-effect {
          position: absolute;
          font-weight: bold;
          font-size: 1.3rem;
          pointer-events: none;
          animation: floatUp 1s ease-out forwards;
        }

        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-50px) scale(1.3); }
        }

        .golden-dot {
          position: absolute;
          font-size: 2.5rem;
          cursor: pointer;
          animation: goldenPulse 0.5s ease-in-out infinite;
          z-index: 10;
          filter: drop-shadow(0 0 15px gold);
        }

        @keyframes goldenPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .tabs {
          display: flex;
          gap: 5px;
          padding: 10px 15px;
          background: rgba(0, 0, 0, 0.3);
          overflow-x: auto;
        }

        .tab {
          flex: 1;
          min-width: 80px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          border-radius: 10px;
          color: #888;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .tab:hover { background: rgba(255, 255, 255, 0.1); color: #aaa; }

        .tab.active {
          background: linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(0, 150, 200, 0.3));
          color: #00d9ff;
          border-bottom: 2px solid #00d9ff;
          box-shadow: 0 2px 10px rgba(0, 217, 255, 0.2);
        }

        .tab-content {
          padding: 15px;
          max-height: calc(100vh - 500px);
          overflow-y: auto;
        }

        .buildings-list, .achievements-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .building-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 15px;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(20, 30, 50, 0.4));
          border-radius: 12px;
          border-left: 4px solid;
          cursor: pointer;
          transition: all 0.2s ease;
          opacity: 0.5;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .building-item.affordable {
          opacity: 1;
          box-shadow: 0 2px 12px rgba(0, 217, 255, 0.15);
        }
        .building-item.affordable:hover {
          background: linear-gradient(135deg, rgba(0, 217, 255, 0.1), rgba(0, 100, 150, 0.2));
          transform: translateX(5px);
          box-shadow: 0 4px 20px rgba(0, 217, 255, 0.25);
        }

        .building-icon { font-size: 1.8rem; }

        .building-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .building-name { font-weight: bold; font-size: 0.95rem; }
        .building-desc { font-size: 0.75rem; color: #666; }
        .building-owned { font-size: 0.8rem; color: #888; }

        .building-cost { text-align: right; }
        .cost-value { display: block; font-weight: bold; color: #00d9ff; }
        .building-dps { font-size: 0.75rem; color: #2ecc71; }

        .upgrades-scroll { max-height: 100%; overflow-y: auto; }

        .upgrades-section { margin-bottom: 20px; }
        .upgrades-section h4 { color: #00d9ff; margin-bottom: 10px; font-size: 0.95rem; }
        .upgrades-section.purchased h4 { color: #2ecc71; }

        .upgrades-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 10px;
        }

        .upgrade-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 8px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          opacity: 0.5;
          border: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }

        .upgrade-item.affordable { opacity: 1; border-color: #00d9ff; }
        .upgrade-item.affordable:hover { background: rgba(0, 217, 255, 0.1); transform: scale(1.02); }
        .upgrade-item.owned { opacity: 0.6; border-color: #2ecc71; cursor: default; }

        .upgrade-icon { font-size: 1.5rem; margin-bottom: 5px; }
        .upgrade-name { font-size: 0.8rem; font-weight: bold; margin-bottom: 3px; }
        .upgrade-desc { font-size: 0.7rem; color: #888; margin-bottom: 5px; }
        .upgrade-cost { color: #00d9ff; font-weight: bold; font-size: 0.85rem; }

        .stats-panel { display: flex; flex-direction: column; gap: 15px; }

        .stat-group {
          background: rgba(0, 0, 0, 0.3);
          padding: 15px;
          border-radius: 10px;
        }

        .stat-group h4 { color: #00d9ff; margin: 0 0 10px 0; font-size: 0.95rem; }
        .stat-group.synergy-group { border: 1px solid rgba(155, 89, 182, 0.3); }
        .stat-group.synergy-group h4 { color: #9b59b6; }

        .stat-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          font-size: 0.9rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .stat-row:last-child { border-bottom: none; }
        .stat-row span:first-child { color: #888; }
        .stat-row span:last-child { color: #fff; font-weight: bold; }
        .stat-row.hint { color: #666; font-size: 0.8rem; font-style: italic; }

        .achievement-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          opacity: 0.4;
        }

        .achievement-item.unlocked { opacity: 1; border: 1px solid #f39c12; }
        .achievement-icon { font-size: 1.5rem; }
        .achievement-info { flex: 1; }
        .achievement-name { display: block; font-weight: bold; font-size: 0.9rem; }
        .achievement-desc { font-size: 0.75rem; color: #888; }
        .achievement-reward { color: #2ecc71; font-weight: bold; }

        .bottom-buttons {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          gap: 10px;
          padding: 12px 15px;
          background: rgba(0, 0, 0, 0.95);
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
          font-size: 0.95rem;
        }

        .prestige-btn { background: rgba(155, 89, 182, 0.2); color: #9b59b6; }
        .prestige-btn.available { background: rgba(155, 89, 182, 0.4); animation: pulse 1s ease-in-out infinite; }
        .save-btn { background: rgba(46, 204, 113, 0.2); color: #2ecc71; }

        .notification {
          position: fixed;
          top: 70px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.95);
          color: #f39c12;
          padding: 12px 25px;
          border-radius: 10px;
          border: 1px solid #f39c12;
          z-index: 100;
          animation: slideDown 0.3s ease-out;
          text-align: center;
          max-width: 90%;
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
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
        }

        .modal {
          background: #1a2332;
          padding: 25px;
          border-radius: 15px;
          max-width: 350px;
          width: 90%;
          text-align: center;
          border: 1px solid rgba(0, 217, 255, 0.3);
        }

        .modal h2 { color: #00d9ff; margin-bottom: 15px; }

        .prestige-info {
          background: rgba(0, 0, 0, 0.3);
          padding: 15px;
          border-radius: 10px;
          margin: 15px 0;
        }

        .prestige-info p { margin: 8px 0; }
        .prestige-info .gain { color: #2ecc71; font-size: 1.3rem; }

        .prestige-confirm {
          background: linear-gradient(135deg, #9b59b6, #8e44ad);
          color: white;
          width: 100%;
          padding: 15px;
          font-size: 1rem;
          margin: 10px 0;
        }

        .prestige-warning { color: #e74c3c; font-size: 0.9rem; }
        .close-btn { background: rgba(255, 255, 255, 0.1); color: #888; width: 100%; }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}

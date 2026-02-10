'use client'

import { useEffect, useState, CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/context/AuthContext'
import { supabase } from '../../lib/supabase/client'
import { SocialShare } from '../../lib/components/SocialShare'

interface PlayerStats {
  // DotSlayer stats
  slayer: {
    highestFloor: number
    totalKills: number
    totalDamage: number
    bossesDefeated: number
    gamesPlayed: number
    gamesWon: number
    bestCombo: number
    totalGoldEarned: number
    perfectFloors: number
    totalPlaytime: number
  }
  // Dot Clicker stats
  clicker: {
    totalDots: number
    totalPrestiges: number
    highestDps: number
    buildingsPurchased: number
    totalPlaytime: number
  }
  // Cross-game
  synergyLevel: number
  achievementsUnlocked: number
  totalAchievements: number
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
  game: 'slayer' | 'clicker' | 'synergy'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

const ACHIEVEMENT_LIST: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  // DotSlayer achievements
  { id: 'first_kill', name: 'First Blood', description: 'Kill your first enemy', icon: '🗡️', game: 'slayer', rarity: 'common' },
  { id: 'floor_10', name: 'Getting Started', description: 'Reach floor 10', icon: '🏃', game: 'slayer', rarity: 'common' },
  { id: 'floor_50', name: 'Halfway There', description: 'Reach floor 50', icon: '🏔️', game: 'slayer', rarity: 'uncommon' },
  { id: 'floor_100', name: 'Tower Conqueror', description: 'Complete all 100 floors', icon: '🏆', game: 'slayer', rarity: 'legendary' },
  { id: 'boss_10', name: 'Boss Hunter', description: 'Defeat 10 bosses', icon: '👹', game: 'slayer', rarity: 'uncommon' },
  { id: 'boss_50', name: 'Boss Slayer', description: 'Defeat 50 bosses', icon: '☠️', game: 'slayer', rarity: 'rare' },
  { id: 'combo_50', name: 'Combo Starter', description: 'Reach 50x combo', icon: '🔥', game: 'slayer', rarity: 'common' },
  { id: 'combo_100', name: 'Combo Master', description: 'Reach 100x combo', icon: '⚡', game: 'slayer', rarity: 'rare' },
  { id: 'combo_200', name: 'Combo God', description: 'Reach 200x combo', icon: '🌟', game: 'slayer', rarity: 'epic' },
  { id: 'kills_1000', name: 'Mass Slayer', description: 'Kill 1,000 enemies', icon: '💀', game: 'slayer', rarity: 'uncommon' },
  { id: 'kills_10000', name: 'Extinction', description: 'Kill 10,000 enemies', icon: '🌋', game: 'slayer', rarity: 'epic' },
  { id: 'perfect_floor', name: 'Untouchable', description: 'Complete a floor without taking damage', icon: '🛡️', game: 'slayer', rarity: 'uncommon' },
  { id: 'perfect_10', name: 'Ghost', description: 'Complete 10 floors without taking damage', icon: '👻', game: 'slayer', rarity: 'rare' },

  // Dot Clicker achievements
  { id: 'first_click', name: 'Click!', description: 'Click your first dot', icon: '👆', game: 'clicker', rarity: 'common' },
  { id: 'dots_million', name: 'Millionaire', description: 'Earn 1 million dots', icon: '💰', game: 'clicker', rarity: 'common' },
  { id: 'dots_billion', name: 'Billionaire', description: 'Earn 1 billion dots', icon: '🏦', game: 'clicker', rarity: 'uncommon' },
  { id: 'dots_trillion', name: 'Trillionaire', description: 'Earn 1 trillion dots', icon: '💎', game: 'clicker', rarity: 'rare' },
  { id: 'prestige_1', name: 'Rebirth', description: 'Prestige for the first time', icon: '🔄', game: 'clicker', rarity: 'common' },
  { id: 'prestige_5', name: 'Reborn', description: 'Prestige 5 times', icon: '⭐', game: 'clicker', rarity: 'uncommon' },
  { id: 'prestige_10', name: 'Transcendence', description: 'Prestige 10 times', icon: '✨', game: 'clicker', rarity: 'rare' },
  { id: 'buildings_50', name: 'Empire Builder', description: 'Own 50 buildings', icon: '🏭', game: 'clicker', rarity: 'uncommon' },
  { id: 'dps_million', name: 'Automation King', description: 'Reach 1 million DPS', icon: '⚙️', game: 'clicker', rarity: 'rare' },

  // Cross-game achievements
  { id: 'synergy_5', name: 'Connected', description: 'Reach synergy level 5', icon: '🔗', game: 'synergy', rarity: 'uncommon' },
  { id: 'synergy_10', name: 'Intertwined', description: 'Reach synergy level 10', icon: '🌐', game: 'synergy', rarity: 'rare' },
  { id: 'synergy_20', name: 'Universal', description: 'Reach synergy level 20', icon: '🌌', game: 'synergy', rarity: 'epic' },
  { id: 'both_games', name: 'Universe Explorer', description: 'Play both games', icon: '🚀', game: 'synergy', rarity: 'common' },
  { id: 'dedicated', name: 'Dedicated Player', description: 'Play for 10 total hours', icon: '⏰', game: 'synergy', rarity: 'rare' },
]

function formatNumber(n: number): string {
  if (n < 1000) return Math.floor(n).toString()
  if (n < 1000000) return (n / 1000).toFixed(1) + 'K'
  if (n < 1000000000) return (n / 1000000).toFixed(2) + 'M'
  if (n < 1000000000000) return (n / 1000000000).toFixed(2) + 'B'
  if (n < 1000000000000000) return (n / 1000000000000).toFixed(2) + 'T'
  return (n / 1000000000000000).toFixed(2) + 'Q'
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${Math.floor(minutes)}m`
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  if (hours < 24) return `${hours}h ${mins}m`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

// Styles
const styles: { [key: string]: CSSProperties } = {
  profileContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #050510 0%, #0a0a20 25%, #150a25 50%, #0a1520 75%, #050510 100%)',
    color: 'white',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    paddingBottom: '40px',
  },
  loading: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #050510 0%, #0a0a20 25%, #150a25 50%, #0a1520 75%, #050510 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#00d9ff',
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(0, 217, 255, 0.2)',
    borderTopColor: '#00d9ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  profileHeader: {
    padding: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  backBtn: {
    display: 'inline-block',
    color: '#00d9ff',
    background: 'none',
    border: 'none',
    marginBottom: '20px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    padding: 0,
    fontFamily: 'inherit',
  },
  profileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap' as const,
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #00d9ff, #ff6b00)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.5rem',
    fontWeight: 'bold',
    boxShadow: '0 0 30px rgba(0, 217, 255, 0.3)',
  },
  infoText: {
    flex: 1,
  },
  infoTextH1: {
    fontSize: '2rem',
    margin: '0 0 8px 0',
  },
  synergyBadge: {
    display: 'inline-block',
    padding: '5px 15px',
    background: 'linear-gradient(135deg, rgba(243, 156, 18, 0.2), rgba(241, 196, 15, 0.1))',
    border: '1px solid rgba(243, 156, 18, 0.3)',
    borderRadius: '20px',
    color: '#f1c40f',
    fontSize: '0.9rem',
  },
  shareProfileBtn: {
    background: 'linear-gradient(135deg, #00d9ff, #0099cc)',
    border: 'none',
    padding: '12px 25px',
    borderRadius: '25px',
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    fontSize: '1rem',
  },
  tabs: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    padding: '20px',
    flexWrap: 'wrap' as const,
  },
  tab: {
    padding: '12px 30px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '25px',
    color: '#888',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  tabActive: {
    padding: '12px 30px',
    background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(0, 150, 255, 0.1))',
    border: '1px solid rgba(0, 217, 255, 0.4)',
    borderRadius: '25px',
    color: '#00d9ff',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  profileContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '30px',
  },
  statsSection: {
    background: 'linear-gradient(145deg, rgba(20, 25, 40, 0.8), rgba(15, 20, 35, 0.9))',
    borderRadius: '20px',
    padding: '25px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  statsSectionH2: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '0 0 20px 0',
    fontSize: '1.3rem',
  },
  slayerH2: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '0 0 20px 0',
    fontSize: '1.3rem',
    color: '#ff6b00',
  },
  clickerH2: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '0 0 20px 0',
    fontSize: '1.3rem',
    color: '#00d9ff',
  },
  gameIcon: {
    fontSize: '1.5rem',
  },
  statsCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '15px',
  },
  statCard: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    padding: '15px',
    textAlign: 'center' as const,
  },
  statCardHighlightSlayer: {
    background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.15), rgba(255, 50, 0, 0.1))',
    border: '1px solid rgba(255, 107, 0, 0.2)',
    borderRadius: '12px',
    padding: '15px',
    textAlign: 'center' as const,
  },
  statCardHighlightClicker: {
    background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.15), rgba(0, 150, 255, 0.1))',
    border: '1px solid rgba(0, 217, 255, 0.2)',
    borderRadius: '12px',
    padding: '15px',
    textAlign: 'center' as const,
  },
  statValue: {
    display: 'block',
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#fff',
  },
  statValueSlayer: {
    display: 'block',
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#ff6b00',
  },
  statValueClicker: {
    display: 'block',
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#00d9ff',
  },
  statLabel: {
    display: 'block',
    fontSize: '0.8rem',
    color: '#888',
    marginTop: '5px',
  },
  achievementsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '15px',
  },
  achievementCard: {
    display: 'flex',
    gap: '15px',
    padding: '15px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'all 0.2s',
  },
  achievementCardLocked: {
    display: 'flex',
    gap: '15px',
    padding: '15px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'all 0.2s',
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: '2rem',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '10px',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementInfoH3: {
    margin: '0 0 5px 0',
    fontSize: '1rem',
  },
  achievementInfoP: {
    margin: '0 0 8px 0',
    fontSize: '0.85rem',
    color: '#888',
  },
  rarityBadgeBase: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '10px',
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  rarityCommon: {
    background: '#9e9e9e',
    color: '#fff',
  },
  rarityUncommon: {
    background: '#4caf50',
    color: '#fff',
  },
  rarityRare: {
    background: '#2196f3',
    color: '#fff',
  },
  rarityEpic: {
    background: '#9c27b0',
    color: '#fff',
  },
  rarityLegendary: {
    background: '#ff9800',
    color: '#000',
  },
  milestonesContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '30px',
  },
  milestoneSection: {
    background: 'linear-gradient(145deg, rgba(20, 25, 40, 0.8), rgba(15, 20, 35, 0.9))',
    borderRadius: '20px',
    padding: '25px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  milestoneSectionH2Slayer: {
    margin: '0 0 20px 0',
    fontSize: '1.3rem',
    color: '#ff6b00',
  },
  milestoneSectionH2Clicker: {
    margin: '0 0 20px 0',
    fontSize: '1.3rem',
    color: '#00d9ff',
  },
  milestoneSectionH2Synergy: {
    margin: '0 0 20px 0',
    fontSize: '1.3rem',
    color: '#f1c40f',
  },
  milestoneSectionH2Recent: {
    margin: '0 0 20px 0',
    fontSize: '1.3rem',
    color: '#00d9ff',
  },
  milestoneTrack: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    overflowX: 'auto' as const,
    padding: '10px 0',
  },
  milestoneNode: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    minWidth: '80px',
  },
  nodeIcon: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: 'rgba(100, 100, 100, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    border: '3px solid #555',
    transition: 'all 0.3s',
  },
  nodeIconCompleted: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    border: '3px solid #2ecc71',
    boxShadow: '0 0 20px rgba(46, 204, 113, 0.4)',
    transition: 'all 0.3s',
  },
  nodeIconLegendary: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f39c12, #f1c40f)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    border: '3px solid #f1c40f',
    transition: 'all 0.3s',
  },
  nodeIconLegendaryCompleted: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f39c12, #f1c40f)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    border: '3px solid #f1c40f',
    boxShadow: '0 0 30px rgba(241, 196, 15, 0.6)',
    animation: 'legendaryPulse 2s ease-in-out infinite',
    transition: 'all 0.3s',
  },
  nodeLabel: {
    fontSize: '0.75rem',
    color: '#888',
  },
  nodeLabelCompleted: {
    fontSize: '0.75rem',
    color: '#2ecc71',
  },
  milestoneLine: {
    flex: 1,
    height: '4px',
    background: '#333',
    minWidth: '20px',
  },
  milestoneProgress: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  progressBar: {
    flex: 1,
    height: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden' as const,
  },
  progressFillSlayer: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
    background: 'linear-gradient(90deg, #ff6b00, #ff4400)',
  },
  progressText: {
    fontSize: '0.9rem',
    color: '#888',
    minWidth: '100px',
  },
  prestigeTrack: {
    marginTop: '20px',
  },
  prestigeTrackH3: {
    fontSize: '1rem',
    color: '#00d9ff',
    margin: '0 0 15px 0',
  },
  prestigeBadges: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  prestigeBadge: {
    padding: '8px 16px',
    background: 'rgba(100, 100, 100, 0.2)',
    border: '2px solid #555',
    borderRadius: '20px',
    fontSize: '0.9rem',
    color: '#666',
  },
  prestigeBadgeUnlocked: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, rgba(243, 156, 18, 0.2), rgba(241, 196, 15, 0.1))',
    border: '2px solid #f1c40f',
    borderRadius: '20px',
    fontSize: '0.9rem',
    color: '#f1c40f',
  },
  synergyMeter: {
    display: 'flex',
    alignItems: 'center',
    gap: '40px',
    flexWrap: 'wrap' as const,
  },
  synergyLevelDisplay: {
    textAlign: 'center' as const,
  },
  levelNumber: {
    display: 'block',
    fontSize: '4rem',
    fontWeight: 900,
    background: 'linear-gradient(135deg, #f39c12, #f1c40f)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  levelLabel: {
    display: 'block',
    color: '#888',
    fontSize: '0.9rem',
  },
  synergyBonuses: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  bonusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 20px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '10px',
  },
  bonusIcon: {
    fontSize: '1.2rem',
  },
  bonusText: {
    color: '#2ecc71',
    fontWeight: 600,
  },
  recentRuns: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  runCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '15px 20px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  runCardVictory: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '15px 20px',
    background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.1), rgba(39, 174, 96, 0.05))',
    borderRadius: '12px',
    border: '1px solid rgba(46, 204, 113, 0.3)',
  },
  runFloor: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#ff6b00',
    minWidth: '100px',
  },
  runStats: {
    display: 'flex',
    gap: '20px',
    flex: 1,
    color: '#888',
    fontSize: '0.9rem',
  },
  victoryBadge: {
    color: '#2ecc71',
    fontWeight: 700,
    fontSize: '0.9rem',
  },
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'milestones'>('stats')
  const [showShare, setShowShare] = useState(false)
  const [recentRuns, setRecentRuns] = useState<any[]>([])
  const [hoveredBackBtn, setHoveredBackBtn] = useState(false)
  const [hoveredShareBtn, setHoveredShareBtn] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Load profile data
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return

      try {
        // Load display name
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('display_name')
          .eq('id', user.id)
          .single()

        setDisplayName(profile?.display_name || user.email?.split('@')[0] || 'Player')

        // Load slayer stats
        const { data: slayerProgress } = await supabase
          .from('slayer_progress')
          .select('*')
          .eq('user_id', user.id)
          .single()

        // Load clicker stats
        const { data: clickerSave } = await supabase
          .from('clicker_saves')
          .select('*')
          .eq('user_id', user.id)
          .single()

        // Load achievements
        const { data: achievementsData } = await supabase
          .from('achievements')
          .select('*')
          .eq('user_id', user.id)

        // Calculate synergy level
        const slayerFloors = slayerProgress?.highest_floor || 0
        const clickerPrestiges = clickerSave?.total_prestiges || 0
        const synergyLevel = Math.floor(Math.sqrt((slayerFloors + clickerPrestiges * 5) / 10))

        setStats({
          slayer: {
            highestFloor: slayerProgress?.highest_floor || 0,
            totalKills: slayerProgress?.total_kills || 0,
            totalDamage: slayerProgress?.total_damage || 0,
            bossesDefeated: slayerProgress?.bosses_defeated || 0,
            gamesPlayed: slayerProgress?.games_played || 0,
            gamesWon: slayerProgress?.games_won || 0,
            bestCombo: slayerProgress?.best_combo || 0,
            totalGoldEarned: slayerProgress?.total_gold || 0,
            perfectFloors: slayerProgress?.perfect_floors || 0,
            totalPlaytime: slayerProgress?.total_playtime || 0,
          },
          clicker: {
            totalDots: clickerSave?.total_dots || 0,
            totalPrestiges: clickerSave?.total_prestiges || 0,
            highestDps: clickerSave?.stats?.highestDps || 0,
            buildingsPurchased: clickerSave?.stats?.buildingsPurchased || 0,
            totalPlaytime: clickerSave?.stats?.totalPlaytime || 0,
          },
          synergyLevel,
          achievementsUnlocked: achievementsData?.length || 0,
          totalAchievements: ACHIEVEMENT_LIST.length,
        })

        // Map achievements
        const unlockedIds = new Set(achievementsData?.map(a => a.achievement_id) || [])
        const mappedAchievements = ACHIEVEMENT_LIST.map(a => ({
          ...a,
          unlocked: unlockedIds.has(a.id),
          unlockedAt: achievementsData?.find(ua => ua.achievement_id === a.id)?.unlocked_at,
        }))
        setAchievements(mappedAchievements)

        // Load recent runs from leaderboard
        const { data: recentRunsData } = await supabase
          .from('leaderboard')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)

        setRecentRuns(recentRunsData || [])

      } catch (error) {
        console.error('Failed to load profile:', error)
      }
    }

    loadProfileData()
  }, [user])

  if (loading) {
    return (
      <div style={styles.loading}>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes legendaryPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `}</style>
        <div style={styles.loadingSpinner}></div>
        <p>Loading profile...</p>
      </div>
    )
  }

  if (!user) return null

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9e9e9e'
      case 'uncommon': return '#4caf50'
      case 'rare': return '#2196f3'
      case 'epic': return '#9c27b0'
      case 'legendary': return '#ff9800'
      default: return '#9e9e9e'
    }
  }

  const getRarityStyle = (rarity: string): CSSProperties => {
    const base = styles.rarityBadgeBase
    switch (rarity) {
      case 'common': return { ...base, ...styles.rarityCommon }
      case 'uncommon': return { ...base, ...styles.rarityUncommon }
      case 'rare': return { ...base, ...styles.rarityRare }
      case 'epic': return { ...base, ...styles.rarityEpic }
      case 'legendary': return { ...base, ...styles.rarityLegendary }
      default: return { ...base, ...styles.rarityCommon }
    }
  }

  return (
    <div style={styles.profileContainer}>
      {/* Keyframe animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes legendaryPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>

      {/* Header */}
      <header style={styles.profileHeader}>
        <button
          style={{
            ...styles.backBtn,
            color: hoveredBackBtn ? '#fff' : '#00d9ff',
          }}
          onClick={() => router.push('/hub')}
          onMouseEnter={() => setHoveredBackBtn(true)}
          onMouseLeave={() => setHoveredBackBtn(false)}
        >
          ← Back to Hub
        </button>
        <div style={styles.profileInfo}>
          <div style={styles.avatar}>
            <span>{displayName.charAt(0).toUpperCase()}</span>
          </div>
          <div style={styles.infoText}>
            <h1 style={styles.infoTextH1}>{displayName}</h1>
            <p style={{ margin: 0 }}>
              <span style={styles.synergyBadge}>🔗 Synergy Level {stats?.synergyLevel || 0}</span>
            </p>
          </div>
          <button
            style={{
              ...styles.shareProfileBtn,
              transform: hoveredShareBtn ? 'translateY(-2px)' : 'none',
              boxShadow: hoveredShareBtn ? '0 5px 20px rgba(0, 217, 255, 0.3)' : 'none',
            }}
            onClick={() => setShowShare(true)}
            onMouseEnter={() => setHoveredShareBtn(true)}
            onMouseLeave={() => setHoveredShareBtn(false)}
          >
            📤 Share
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={activeTab === 'stats' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
        <button
          style={activeTab === 'achievements' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('achievements')}
        >
          🏆 Achievements ({stats?.achievementsUnlocked || 0}/{stats?.totalAchievements || 0})
        </button>
        <button
          style={activeTab === 'milestones' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('milestones')}
        >
          🎯 Milestones
        </button>
      </div>

      {/* Content */}
      <main style={styles.profileContent}>
        {activeTab === 'stats' && stats && (
          <div style={styles.statsGrid}>
            {/* DotSlayer Stats */}
            <div style={styles.statsSection}>
              <h2 style={styles.slayerH2}><span style={styles.gameIcon}>⚔️</span> DotSlayer</h2>
              <div style={styles.statsCards}>
                <div style={styles.statCardHighlightSlayer}>
                  <span style={styles.statValueSlayer}>{stats.slayer.highestFloor}</span>
                  <span style={styles.statLabel}>Highest Floor</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statValue}>{formatNumber(stats.slayer.totalKills)}</span>
                  <span style={styles.statLabel}>Total Kills</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statValue}>{stats.slayer.bossesDefeated}</span>
                  <span style={styles.statLabel}>Bosses Defeated</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statValue}>{stats.slayer.bestCombo}x</span>
                  <span style={styles.statLabel}>Best Combo</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statValue}>{stats.slayer.gamesWon}/{stats.slayer.gamesPlayed}</span>
                  <span style={styles.statLabel}>Games Won</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statValue}>{formatNumber(stats.slayer.totalDamage)}</span>
                  <span style={styles.statLabel}>Total Damage</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statValue}>{formatNumber(stats.slayer.totalGoldEarned)}</span>
                  <span style={styles.statLabel}>Gold Earned</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statValue}>{stats.slayer.perfectFloors}</span>
                  <span style={styles.statLabel}>Perfect Floors</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statValue}>{formatTime(stats.slayer.totalPlaytime)}</span>
                  <span style={styles.statLabel}>Playtime</span>
                </div>
              </div>
            </div>

            {/* Dot Clicker Stats */}
            <div style={styles.statsSection}>
              <h2 style={styles.clickerH2}><span style={styles.gameIcon}>●</span> Dot Clicker</h2>
              <div style={styles.statsCards}>
                <div style={styles.statCardHighlightClicker}>
                  <span style={styles.statValueClicker}>{formatNumber(stats.clicker.totalDots)}</span>
                  <span style={styles.statLabel}>Total Dots</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statValue}>{stats.clicker.totalPrestiges}</span>
                  <span style={styles.statLabel}>Prestiges</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statValue}>{formatNumber(stats.clicker.highestDps)}</span>
                  <span style={styles.statLabel}>Peak DPS</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statValue}>{stats.clicker.buildingsPurchased}</span>
                  <span style={styles.statLabel}>Buildings</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statValue}>{formatTime(stats.clicker.totalPlaytime)}</span>
                  <span style={styles.statLabel}>Playtime</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                style={{
                  ...(achievement.unlocked ? {
                    ...styles.achievementCard,
                    background: `rgba(${getRarityColor(achievement.rarity).replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ')}, 0.1)`,
                    borderColor: getRarityColor(achievement.rarity),
                  } : styles.achievementCardLocked),
                }}
              >
                <div style={styles.achievementIcon}>{achievement.unlocked ? achievement.icon : '🔒'}</div>
                <div style={styles.achievementInfo}>
                  <h3 style={styles.achievementInfoH3}>{achievement.unlocked ? achievement.name : '???'}</h3>
                  <p style={styles.achievementInfoP}>{achievement.unlocked ? achievement.description : 'Keep playing to unlock'}</p>
                  <span style={getRarityStyle(achievement.rarity)}>{achievement.rarity}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'milestones' && stats && (
          <div style={styles.milestonesContent}>
            {/* DotSlayer Milestones */}
            <div style={styles.milestoneSection}>
              <h2 style={styles.milestoneSectionH2Slayer}>⚔️ DotSlayer Journey</h2>
              <div style={styles.milestoneTrack}>
                <div style={styles.milestoneNode}>
                  <span style={stats.slayer.highestFloor >= 1 ? styles.nodeIconCompleted : styles.nodeIcon}>🏃</span>
                  <span style={stats.slayer.highestFloor >= 1 ? styles.nodeLabelCompleted : styles.nodeLabel}>Floor 1</span>
                </div>
                <div style={styles.milestoneLine}></div>
                <div style={styles.milestoneNode}>
                  <span style={stats.slayer.highestFloor >= 10 ? styles.nodeIconCompleted : styles.nodeIcon}>⚡</span>
                  <span style={stats.slayer.highestFloor >= 10 ? styles.nodeLabelCompleted : styles.nodeLabel}>Floor 10</span>
                </div>
                <div style={styles.milestoneLine}></div>
                <div style={styles.milestoneNode}>
                  <span style={stats.slayer.highestFloor >= 25 ? styles.nodeIconCompleted : styles.nodeIcon}>🔥</span>
                  <span style={stats.slayer.highestFloor >= 25 ? styles.nodeLabelCompleted : styles.nodeLabel}>Floor 25</span>
                </div>
                <div style={styles.milestoneLine}></div>
                <div style={styles.milestoneNode}>
                  <span style={stats.slayer.highestFloor >= 50 ? styles.nodeIconCompleted : styles.nodeIcon}>💀</span>
                  <span style={stats.slayer.highestFloor >= 50 ? styles.nodeLabelCompleted : styles.nodeLabel}>Floor 50</span>
                </div>
                <div style={styles.milestoneLine}></div>
                <div style={styles.milestoneNode}>
                  <span style={stats.slayer.highestFloor >= 75 ? styles.nodeIconCompleted : styles.nodeIcon}>👹</span>
                  <span style={stats.slayer.highestFloor >= 75 ? styles.nodeLabelCompleted : styles.nodeLabel}>Floor 75</span>
                </div>
                <div style={styles.milestoneLine}></div>
                <div style={styles.milestoneNode}>
                  <span style={stats.slayer.highestFloor >= 100 ? styles.nodeIconLegendaryCompleted : styles.nodeIconLegendary}>🏆</span>
                  <span style={stats.slayer.highestFloor >= 100 ? styles.nodeLabelCompleted : styles.nodeLabel}>Floor 100</span>
                </div>
              </div>
              <div style={styles.milestoneProgress}>
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFillSlayer, width: `${Math.min(stats.slayer.highestFloor, 100)}%` }}></div>
                </div>
                <span style={styles.progressText}>{stats.slayer.highestFloor}/100 Floors</span>
              </div>
            </div>

            {/* Dot Clicker Milestones */}
            <div style={styles.milestoneSection}>
              <h2 style={styles.milestoneSectionH2Clicker}>● Dot Clicker Empire</h2>
              <div style={styles.milestoneTrack}>
                <div style={styles.milestoneNode}>
                  <span style={stats.clicker.totalDots >= 1000 ? styles.nodeIconCompleted : styles.nodeIcon}>👆</span>
                  <span style={stats.clicker.totalDots >= 1000 ? styles.nodeLabelCompleted : styles.nodeLabel}>1K Dots</span>
                </div>
                <div style={styles.milestoneLine}></div>
                <div style={styles.milestoneNode}>
                  <span style={stats.clicker.totalDots >= 1000000 ? styles.nodeIconCompleted : styles.nodeIcon}>💰</span>
                  <span style={stats.clicker.totalDots >= 1000000 ? styles.nodeLabelCompleted : styles.nodeLabel}>1M Dots</span>
                </div>
                <div style={styles.milestoneLine}></div>
                <div style={styles.milestoneNode}>
                  <span style={stats.clicker.totalDots >= 1000000000 ? styles.nodeIconCompleted : styles.nodeIcon}>🏦</span>
                  <span style={stats.clicker.totalDots >= 1000000000 ? styles.nodeLabelCompleted : styles.nodeLabel}>1B Dots</span>
                </div>
                <div style={styles.milestoneLine}></div>
                <div style={styles.milestoneNode}>
                  <span style={stats.clicker.totalDots >= 1000000000000 ? styles.nodeIconLegendaryCompleted : styles.nodeIconLegendary}>💎</span>
                  <span style={stats.clicker.totalDots >= 1000000000000 ? styles.nodeLabelCompleted : styles.nodeLabel}>1T Dots</span>
                </div>
              </div>
              <div style={styles.prestigeTrack}>
                <h3 style={styles.prestigeTrackH3}>Prestige Journey</h3>
                <div style={styles.prestigeBadges}>
                  {[1, 5, 10, 25, 50, 100].map(p => (
                    <div key={p} style={stats.clicker.totalPrestiges >= p ? styles.prestigeBadgeUnlocked : styles.prestigeBadge}>
                      ⭐ {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Synergy Milestones */}
            <div style={styles.milestoneSection}>
              <h2 style={styles.milestoneSectionH2Synergy}>🔗 Cross-Game Synergy</h2>
              <div style={styles.synergyMeter}>
                <div style={styles.synergyLevelDisplay}>
                  <span style={styles.levelNumber}>{stats.synergyLevel}</span>
                  <span style={styles.levelLabel}>Synergy Level</span>
                </div>
                <div style={styles.synergyBonuses}>
                  <div style={styles.bonusItem}>
                    <span style={styles.bonusIcon}>⚔️</span>
                    <span style={styles.bonusText}>+{stats.slayer.highestFloor}% Clicker Bonus</span>
                  </div>
                  <div style={styles.bonusItem}>
                    <span style={styles.bonusIcon}>●</span>
                    <span style={styles.bonusText}>+{stats.clicker.totalPrestiges * 5}% Slayer Bonus</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Runs */}
            {recentRuns.length > 0 && (
              <div style={styles.milestoneSection}>
                <h2 style={styles.milestoneSectionH2Recent}>📜 Recent DotSlayer Runs</h2>
                <div style={styles.recentRuns}>
                  {recentRuns.map((run, i) => (
                    <div key={run.id || i} style={run.was_victory ? styles.runCardVictory : styles.runCard}>
                      <div style={styles.runFloor}>Floor {run.floor_reached}</div>
                      <div style={styles.runStats}>
                        <span>💰 {formatNumber(run.score)}</span>
                        <span>💀 {run.kills} kills</span>
                        <span>⏱️ {formatTime(run.time_played / 60)}</span>
                      </div>
                      {run.was_victory && <span style={styles.victoryBadge}>🏆 VICTORY</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Share Modal */}
      {showShare && stats && (
        <SocialShare
          data={{
            title: `${displayName}'s Dot Universe Profile`,
            text: `Check out my stats!`,
            score: stats.slayer.highestFloor,
            floor: stats.slayer.highestFloor,
            game: 'slayer'
          }}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}

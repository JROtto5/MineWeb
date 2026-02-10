'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/context/AuthContext'
import { supabase } from '../../lib/supabase/client'
import Link from 'next/link'
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

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'milestones'>('stats')
  const [showShare, setShowShare] = useState(false)
  const [recentRuns, setRecentRuns] = useState<any[]>([])

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
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
        <style jsx>{`
          .loading {
            min-height: 100vh;
            background: linear-gradient(135deg, #050510 0%, #0a0a20 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #00d9ff;
          }
          .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(0, 217, 255, 0.2);
            border-top-color: #00d9ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
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

  return (
    <div className="profile-container">
      {/* Header */}
      <header className="profile-header">
        <Link href="/hub" className="back-btn">← Back to Hub</Link>
        <div className="profile-info">
          <div className="avatar">
            <span>{displayName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="info-text">
            <h1>{displayName}</h1>
            <p className="synergy-level">
              <span className="synergy-badge">🔗 Synergy Level {stats?.synergyLevel || 0}</span>
            </p>
          </div>
          <button className="share-profile-btn" onClick={() => setShowShare(true)}>
            📤 Share
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
        <button
          className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          🏆 Achievements ({stats?.achievementsUnlocked || 0}/{stats?.totalAchievements || 0})
        </button>
        <button
          className={`tab ${activeTab === 'milestones' ? 'active' : ''}`}
          onClick={() => setActiveTab('milestones')}
        >
          🎯 Milestones
        </button>
      </div>

      {/* Content */}
      <main className="profile-content">
        {activeTab === 'stats' && stats && (
          <div className="stats-grid">
            {/* DotSlayer Stats */}
            <div className="stats-section slayer-stats">
              <h2><span className="game-icon">⚔️</span> DotSlayer</h2>
              <div className="stats-cards">
                <div className="stat-card highlight">
                  <span className="stat-value">{stats.slayer.highestFloor}</span>
                  <span className="stat-label">Highest Floor</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{formatNumber(stats.slayer.totalKills)}</span>
                  <span className="stat-label">Total Kills</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{stats.slayer.bossesDefeated}</span>
                  <span className="stat-label">Bosses Defeated</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{stats.slayer.bestCombo}x</span>
                  <span className="stat-label">Best Combo</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{stats.slayer.gamesWon}/{stats.slayer.gamesPlayed}</span>
                  <span className="stat-label">Games Won</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{formatNumber(stats.slayer.totalDamage)}</span>
                  <span className="stat-label">Total Damage</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{formatNumber(stats.slayer.totalGoldEarned)}</span>
                  <span className="stat-label">Gold Earned</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{stats.slayer.perfectFloors}</span>
                  <span className="stat-label">Perfect Floors</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{formatTime(stats.slayer.totalPlaytime)}</span>
                  <span className="stat-label">Playtime</span>
                </div>
              </div>
            </div>

            {/* Dot Clicker Stats */}
            <div className="stats-section clicker-stats">
              <h2><span className="game-icon">●</span> Dot Clicker</h2>
              <div className="stats-cards">
                <div className="stat-card highlight">
                  <span className="stat-value">{formatNumber(stats.clicker.totalDots)}</span>
                  <span className="stat-label">Total Dots</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{stats.clicker.totalPrestiges}</span>
                  <span className="stat-label">Prestiges</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{formatNumber(stats.clicker.highestDps)}</span>
                  <span className="stat-label">Peak DPS</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{stats.clicker.buildingsPurchased}</span>
                  <span className="stat-label">Buildings</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{formatTime(stats.clicker.totalPlaytime)}</span>
                  <span className="stat-label">Playtime</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="achievements-grid">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                style={{ '--rarity-color': getRarityColor(achievement.rarity) } as React.CSSProperties}
              >
                <div className="achievement-icon">{achievement.unlocked ? achievement.icon : '🔒'}</div>
                <div className="achievement-info">
                  <h3>{achievement.unlocked ? achievement.name : '???'}</h3>
                  <p>{achievement.unlocked ? achievement.description : 'Keep playing to unlock'}</p>
                  <span className={`rarity-badge ${achievement.rarity}`}>{achievement.rarity}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'milestones' && stats && (
          <div className="milestones-content">
            {/* DotSlayer Milestones */}
            <div className="milestone-section">
              <h2>⚔️ DotSlayer Journey</h2>
              <div className="milestone-track">
                <div className={`milestone-node ${stats.slayer.highestFloor >= 1 ? 'completed' : ''}`}>
                  <span className="node-icon">🏃</span>
                  <span className="node-label">Floor 1</span>
                </div>
                <div className="milestone-line"></div>
                <div className={`milestone-node ${stats.slayer.highestFloor >= 10 ? 'completed' : ''}`}>
                  <span className="node-icon">⚡</span>
                  <span className="node-label">Floor 10</span>
                </div>
                <div className="milestone-line"></div>
                <div className={`milestone-node ${stats.slayer.highestFloor >= 25 ? 'completed' : ''}`}>
                  <span className="node-icon">🔥</span>
                  <span className="node-label">Floor 25</span>
                </div>
                <div className="milestone-line"></div>
                <div className={`milestone-node ${stats.slayer.highestFloor >= 50 ? 'completed' : ''}`}>
                  <span className="node-icon">💀</span>
                  <span className="node-label">Floor 50</span>
                </div>
                <div className="milestone-line"></div>
                <div className={`milestone-node ${stats.slayer.highestFloor >= 75 ? 'completed' : ''}`}>
                  <span className="node-icon">👹</span>
                  <span className="node-label">Floor 75</span>
                </div>
                <div className="milestone-line"></div>
                <div className={`milestone-node ${stats.slayer.highestFloor >= 100 ? 'completed' : ''} legendary`}>
                  <span className="node-icon">🏆</span>
                  <span className="node-label">Floor 100</span>
                </div>
              </div>
              <div className="milestone-progress">
                <div className="progress-bar">
                  <div className="progress-fill slayer" style={{ width: `${Math.min(stats.slayer.highestFloor, 100)}%` }}></div>
                </div>
                <span className="progress-text">{stats.slayer.highestFloor}/100 Floors</span>
              </div>
            </div>

            {/* Dot Clicker Milestones */}
            <div className="milestone-section">
              <h2>● Dot Clicker Empire</h2>
              <div className="milestone-track">
                <div className={`milestone-node ${stats.clicker.totalDots >= 1000 ? 'completed' : ''}`}>
                  <span className="node-icon">👆</span>
                  <span className="node-label">1K Dots</span>
                </div>
                <div className="milestone-line"></div>
                <div className={`milestone-node ${stats.clicker.totalDots >= 1000000 ? 'completed' : ''}`}>
                  <span className="node-icon">💰</span>
                  <span className="node-label">1M Dots</span>
                </div>
                <div className="milestone-line"></div>
                <div className={`milestone-node ${stats.clicker.totalDots >= 1000000000 ? 'completed' : ''}`}>
                  <span className="node-icon">🏦</span>
                  <span className="node-label">1B Dots</span>
                </div>
                <div className="milestone-line"></div>
                <div className={`milestone-node ${stats.clicker.totalDots >= 1000000000000 ? 'completed' : ''} legendary`}>
                  <span className="node-icon">💎</span>
                  <span className="node-label">1T Dots</span>
                </div>
              </div>
              <div className="prestige-track">
                <h3>Prestige Journey</h3>
                <div className="prestige-badges">
                  {[1, 5, 10, 25, 50, 100].map(p => (
                    <div key={p} className={`prestige-badge ${stats.clicker.totalPrestiges >= p ? 'unlocked' : ''}`}>
                      ⭐ {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Synergy Milestones */}
            <div className="milestone-section synergy">
              <h2>🔗 Cross-Game Synergy</h2>
              <div className="synergy-meter">
                <div className="synergy-level-display">
                  <span className="level-number">{stats.synergyLevel}</span>
                  <span className="level-label">Synergy Level</span>
                </div>
                <div className="synergy-bonuses">
                  <div className="bonus-item">
                    <span className="bonus-icon">⚔️</span>
                    <span className="bonus-text">+{stats.slayer.highestFloor}% Clicker Bonus</span>
                  </div>
                  <div className="bonus-item">
                    <span className="bonus-icon">●</span>
                    <span className="bonus-text">+{stats.clicker.totalPrestiges * 5}% Slayer Bonus</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Runs */}
            {recentRuns.length > 0 && (
              <div className="milestone-section recent">
                <h2>📜 Recent DotSlayer Runs</h2>
                <div className="recent-runs">
                  {recentRuns.map((run, i) => (
                    <div key={run.id || i} className={`run-card ${run.was_victory ? 'victory' : ''}`}>
                      <div className="run-floor">Floor {run.floor_reached}</div>
                      <div className="run-stats">
                        <span>💰 {formatNumber(run.score)}</span>
                        <span>💀 {run.kills} kills</span>
                        <span>⏱️ {formatTime(run.time_played / 60)}</span>
                      </div>
                      {run.was_victory && <span className="victory-badge">🏆 VICTORY</span>}
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

      <style jsx>{`
        .profile-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #050510 0%, #0a0a20 50%, #0a1520 100%);
          color: white;
          font-family: 'Segoe UI', system-ui, sans-serif;
          padding-bottom: 40px;
        }

        .profile-header {
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .back-btn {
          display: inline-block;
          color: #00d9ff;
          text-decoration: none;
          margin-bottom: 20px;
          font-size: 0.9rem;
          transition: color 0.2s;
        }
        .back-btn:hover {
          color: #fff;
        }

        .profile-info {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00d9ff, #ff6b00);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          font-weight: bold;
          box-shadow: 0 0 30px rgba(0, 217, 255, 0.3);
        }

        .info-text {
          flex: 1;
        }

        .info-text h1 {
          font-size: 2rem;
          margin: 0 0 8px 0;
        }

        .synergy-badge {
          display: inline-block;
          padding: 5px 15px;
          background: linear-gradient(135deg, rgba(243, 156, 18, 0.2), rgba(241, 196, 15, 0.1));
          border: 1px solid rgba(243, 156, 18, 0.3);
          border-radius: 20px;
          color: #f1c40f;
          font-size: 0.9rem;
        }

        .share-profile-btn {
          background: linear-gradient(135deg, #00d9ff, #0099cc);
          border: none;
          padding: 12px 25px;
          border-radius: 25px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .share-profile-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(0, 217, 255, 0.3);
        }

        .tabs {
          display: flex;
          justify-content: center;
          gap: 15px;
          padding: 20px;
        }

        .tab {
          padding: 12px 30px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 25px;
          color: #888;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .tab.active {
          background: linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(0, 150, 255, 0.1));
          border-color: rgba(0, 217, 255, 0.4);
          color: #00d9ff;
        }

        .profile-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 30px;
        }

        .stats-section {
          background: linear-gradient(145deg, rgba(20, 25, 40, 0.8), rgba(15, 20, 35, 0.9));
          border-radius: 20px;
          padding: 25px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .stats-section h2 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 20px 0;
          font-size: 1.3rem;
        }

        .slayer-stats h2 { color: #ff6b00; }
        .clicker-stats h2 { color: #00d9ff; }

        .game-icon {
          font-size: 1.5rem;
        }

        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 15px;
        }

        .stat-card {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          padding: 15px;
          text-align: center;
        }
        .stat-card.highlight {
          background: linear-gradient(135deg, rgba(0, 217, 255, 0.15), rgba(0, 150, 255, 0.1));
          border: 1px solid rgba(0, 217, 255, 0.2);
        }
        .slayer-stats .stat-card.highlight {
          background: linear-gradient(135deg, rgba(255, 107, 0, 0.15), rgba(255, 50, 0, 0.1));
          border: 1px solid rgba(255, 107, 0, 0.2);
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
        }
        .slayer-stats .highlight .stat-value { color: #ff6b00; }
        .clicker-stats .highlight .stat-value { color: #00d9ff; }

        .stat-label {
          display: block;
          font-size: 0.8rem;
          color: #888;
          margin-top: 5px;
        }

        .achievements-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 15px;
        }

        .achievement-card {
          display: flex;
          gap: 15px;
          padding: 15px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.2s;
        }
        .achievement-card.unlocked {
          background: rgba(var(--rarity-color), 0.1);
          border-color: var(--rarity-color);
        }
        .achievement-card.locked {
          opacity: 0.5;
        }

        .achievement-icon {
          font-size: 2rem;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
        }

        .achievement-info {
          flex: 1;
        }
        .achievement-info h3 {
          margin: 0 0 5px 0;
          font-size: 1rem;
        }
        .achievement-info p {
          margin: 0 0 8px 0;
          font-size: 0.85rem;
          color: #888;
        }

        .rarity-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .rarity-badge.common { background: #9e9e9e; color: #fff; }
        .rarity-badge.uncommon { background: #4caf50; color: #fff; }
        .rarity-badge.rare { background: #2196f3; color: #fff; }
        .rarity-badge.epic { background: #9c27b0; color: #fff; }
        .rarity-badge.legendary { background: #ff9800; color: #000; }

        /* Milestones Section */
        .milestones-content {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .milestone-section {
          background: linear-gradient(145deg, rgba(20, 25, 40, 0.8), rgba(15, 20, 35, 0.9));
          border-radius: 20px;
          padding: 25px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .milestone-section h2 {
          margin: 0 0 20px 0;
          font-size: 1.3rem;
          color: #ff6b00;
        }

        .milestone-section h2:first-child {
          color: #ff6b00;
        }

        .milestone-section.synergy h2 {
          color: #f1c40f;
        }

        .milestone-section.recent h2 {
          color: #00d9ff;
        }

        .milestone-track {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          overflow-x: auto;
          padding: 10px 0;
        }

        .milestone-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          min-width: 80px;
        }

        .node-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(100, 100, 100, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          border: 3px solid #555;
          transition: all 0.3s;
        }

        .milestone-node.completed .node-icon {
          background: linear-gradient(135deg, #27ae60, #2ecc71);
          border-color: #2ecc71;
          box-shadow: 0 0 20px rgba(46, 204, 113, 0.4);
        }

        .milestone-node.legendary .node-icon {
          background: linear-gradient(135deg, #f39c12, #f1c40f);
          border-color: #f1c40f;
        }

        .milestone-node.legendary.completed .node-icon {
          box-shadow: 0 0 30px rgba(241, 196, 15, 0.6);
          animation: legendaryPulse 2s ease-in-out infinite;
        }

        @keyframes legendaryPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .node-label {
          font-size: 0.75rem;
          color: #888;
        }

        .milestone-node.completed .node-label {
          color: #2ecc71;
        }

        .milestone-line {
          flex: 1;
          height: 4px;
          background: #333;
          min-width: 20px;
        }

        .milestone-progress {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .progress-fill.slayer {
          background: linear-gradient(90deg, #ff6b00, #ff4400);
        }

        .progress-text {
          font-size: 0.9rem;
          color: #888;
          min-width: 100px;
        }

        .prestige-track {
          margin-top: 20px;
        }

        .prestige-track h3 {
          font-size: 1rem;
          color: #00d9ff;
          margin: 0 0 15px 0;
        }

        .prestige-badges {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .prestige-badge {
          padding: 8px 16px;
          background: rgba(100, 100, 100, 0.2);
          border: 2px solid #555;
          border-radius: 20px;
          font-size: 0.9rem;
          color: #666;
        }

        .prestige-badge.unlocked {
          background: linear-gradient(135deg, rgba(243, 156, 18, 0.2), rgba(241, 196, 15, 0.1));
          border-color: #f1c40f;
          color: #f1c40f;
        }

        .synergy-meter {
          display: flex;
          align-items: center;
          gap: 40px;
          flex-wrap: wrap;
        }

        .synergy-level-display {
          text-align: center;
        }

        .level-number {
          display: block;
          font-size: 4rem;
          font-weight: 900;
          background: linear-gradient(135deg, #f39c12, #f1c40f);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .level-label {
          display: block;
          color: #888;
          font-size: 0.9rem;
        }

        .synergy-bonuses {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .bonus-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }

        .bonus-icon {
          font-size: 1.2rem;
        }

        .bonus-text {
          color: #2ecc71;
          font-weight: 600;
        }

        .recent-runs {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .run-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 15px 20px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .run-card.victory {
          background: linear-gradient(135deg, rgba(46, 204, 113, 0.1), rgba(39, 174, 96, 0.05));
          border-color: rgba(46, 204, 113, 0.3);
        }

        .run-floor {
          font-size: 1.2rem;
          font-weight: 700;
          color: #ff6b00;
          min-width: 100px;
        }

        .run-stats {
          display: flex;
          gap: 20px;
          flex: 1;
          color: #888;
          font-size: 0.9rem;
        }

        .victory-badge {
          color: #2ecc71;
          font-weight: 700;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .profile-info {
            flex-wrap: wrap;
          }
          .share-profile-btn {
            width: 100%;
          }
          .tabs {
            flex-direction: column;
            gap: 10px;
          }
          .tab {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

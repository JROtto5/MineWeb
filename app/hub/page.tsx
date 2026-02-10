'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/context/AuthContext'
import { leaderboardService, LeaderboardEntry } from '../../lib/supabase'
import { supabase } from '../../lib/supabase/client'

interface ClickerLeaderboardEntry {
  user_id: string
  display_name: string
  total_dots: number
  total_prestiges: number
  highest_dps: number
}

function formatNumber(n: number): string {
  if (n < 1000) return Math.floor(n).toString()
  if (n < 1000000) return (n / 1000).toFixed(1) + 'K'
  if (n < 1000000000) return (n / 1000000).toFixed(2) + 'M'
  if (n < 1000000000000) return (n / 1000000000).toFixed(2) + 'B'
  if (n < 1000000000000000) return (n / 1000000000000).toFixed(2) + 'T'
  return (n / 1000000000000000).toFixed(2) + 'Q'
}

interface SynergyStats {
  slayerFloorsCleared: number
  slayerHighestFloor: number
  slayerGamesWon: number
  clickerPrestiges: number
  clickerTotalDots: number
  synergyBonus: number
}

export default function GameHub() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [hoveredGame, setHoveredGame] = useState<string | null>(null)
  const [synergyStats, setSynergyStats] = useState<SynergyStats>({
    slayerFloorsCleared: 0,
    slayerHighestFloor: 0,
    slayerGamesWon: 0,
    clickerPrestiges: 0,
    clickerTotalDots: 0,
    synergyBonus: 0
  })
  const [slayerLeaderboard, setSlayerLeaderboard] = useState<LeaderboardEntry[]>([])
  const [clickerLeaderboard, setClickerLeaderboard] = useState<ClickerLeaderboardEntry[]>([])
  const [activeLeaderboard, setActiveLeaderboard] = useState<'slayer' | 'clicker'>('slayer')
  const [showNameModal, setShowNameModal] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [nameUpdateStatus, setNameUpdateStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState('')
  const [resetStatus, setResetStatus] = useState<'idle' | 'resetting' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Load leaderboards from Supabase
  useEffect(() => {
    const loadLeaderboards = async () => {
      try {
        const slayerScores = await leaderboardService.getTopScores(10)
        setSlayerLeaderboard(slayerScores)

        const { data: clickerData } = await supabase
          .from('clicker_saves')
          .select('user_id, total_dots, total_prestiges, stats')
          .order('total_dots', { ascending: false })
          .limit(10)

        if (clickerData) {
          const userIds = clickerData.map(c => c.user_id)
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, display_name')
            .in('id', userIds)

          const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || [])

          const clickerEntries: ClickerLeaderboardEntry[] = clickerData.map(c => ({
            user_id: c.user_id,
            display_name: profileMap.get(c.user_id) || 'Anonymous',
            total_dots: c.total_dots || 0,
            total_prestiges: c.total_prestiges || 0,
            highest_dps: c.stats?.highestDps || 0
          }))
          setClickerLeaderboard(clickerEntries)
        }
      } catch (error) {
        console.error('Failed to load leaderboards:', error)
      }
    }

    if (user) {
      loadLeaderboards()
    }
  }, [user])

  // Load current display name
  useEffect(() => {
    const loadDisplayName = async () => {
      if (!user) return
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('display_name')
          .eq('id', user.id)
          .single()

        if (data?.display_name) {
          setDisplayName(data.display_name)
          setNewDisplayName(data.display_name)
        } else {
          const fallbackName = user.email?.split('@')[0] || 'Player'
          setDisplayName(fallbackName)
          setNewDisplayName(fallbackName)
        }
      } catch {
        const fallbackName = user.email?.split('@')[0] || 'Player'
        setDisplayName(fallbackName)
        setNewDisplayName(fallbackName)
      }
    }
    loadDisplayName()
  }, [user])

  const updateDisplayName = async () => {
    if (!user || !newDisplayName.trim()) return
    const trimmedName = newDisplayName.trim().slice(0, 20)
    setNameUpdateStatus('saving')
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({ id: user.id, display_name: trimmedName, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      if (error) throw error
      setDisplayName(trimmedName)
      setNameUpdateStatus('success')
      setTimeout(() => { setShowNameModal(false); setNameUpdateStatus('idle') }, 1500)
    } catch (error) {
      console.error('Failed to update display name:', error)
      setNameUpdateStatus('error')
    }
  }

  const resetAllProgress = async () => {
    if (resetConfirmText !== 'DELETE' || !user) return
    setResetStatus('resetting')
    try {
      // Clear localStorage
      const keysToRemove = ['dotslayer_progress', 'dotslayer_daily_challenges', 'dotslayer_weekly_challenges', 'dotslayer_event_progress', 'dotslayer_synergy', 'dotslayer_synergy_stats', 'dotslayer_save', 'dotslayer_achievements', 'dotclicker_save', 'dotclicker_synergy', 'dotclicker_synergy_stats', 'dotclicker_achievements', 'clicker_save', 'crossGameSynergy', 'dot_universe_level', 'cross_game_bonuses']
      keysToRemove.forEach(key => localStorage.removeItem(key))
      const substrings = ['slayer', 'clicker', 'dot', 'synergy', 'game', 'save', 'progress']
      Object.keys(localStorage).forEach(key => {
        if (substrings.some(sub => key.toLowerCase().includes(sub))) localStorage.removeItem(key)
      })

      // Clear Supabase data
      await Promise.allSettled([
        supabase.from('slayer_progress').delete().eq('user_id', user.id),
        supabase.from('slayer_saves').delete().eq('user_id', user.id),
        supabase.from('slayer_stats').delete().eq('user_id', user.id),
        supabase.from('clicker_saves').delete().eq('user_id', user.id),
        supabase.from('achievements').delete().eq('user_id', user.id),
        supabase.from('daily_challenges').delete().eq('user_id', user.id),
        supabase.from('leaderboard').delete().eq('user_id', user.id),
        supabase.from('user_profiles').update({ slayer_highest_floor: 0, slayer_games_won: 0, clicker_total_prestiges: 0, clicker_total_dots: 0, synergy_bonus: 0, updated_at: new Date().toISOString() }).eq('id', user.id),
      ])

      setResetStatus('success')
      setSynergyStats({ slayerFloorsCleared: 0, slayerHighestFloor: 0, slayerGamesWon: 0, clickerPrestiges: 0, clickerTotalDots: 0, synergyBonus: 0 })
      setTimeout(() => { setShowResetModal(false); setResetConfirmText(''); setResetStatus('idle'); window.location.reload() }, 1500)
    } catch (error) {
      console.error('Failed to reset progress:', error)
      setResetStatus('error')
    }
  }

  // Load synergy stats
  useEffect(() => {
    const loadSynergyStats = () => {
      try {
        const slayerProgress = localStorage.getItem('dotslayer_progress')
        const clickerSave = localStorage.getItem('dotclicker_save')
        let slayerFloors = 0, slayerHighest = 0, slayerWins = 0, clickerPrestiges = 0, clickerDots = 0
        if (slayerProgress) {
          const progress = JSON.parse(slayerProgress)
          slayerFloors = progress.floorsCleared || 0
          slayerHighest = progress.highestFloor || 0
          slayerWins = progress.gamesWon || 0
        }
        if (clickerSave) {
          const save = JSON.parse(clickerSave)
          clickerPrestiges = save.totalPrestiges || 0
          clickerDots = save.totalDots || 0
        }
        setSynergyStats({ slayerFloorsCleared: slayerFloors, slayerHighestFloor: slayerHighest, slayerGamesWon: slayerWins, clickerPrestiges, clickerTotalDots: clickerDots, synergyBonus: (slayerFloors * 1) + (clickerPrestiges * 5) })
      } catch (e) { console.warn('Failed to load synergy stats:', e) }
    }
    loadSynergyStats()
    const interval = setInterval(loadSynergyStats, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleNav = (path: string) => router.push(path)

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #050510 0%, #0a0a20 50%, #050510 100%)',
        color: '#00d9ff',
      }}>
        <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '30px' }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '40px',
            height: '40px',
            background: 'radial-gradient(circle at 30% 30%, #00ffff, #00d9ff, #0088aa)',
            borderRadius: '50%',
            boxShadow: '0 0 30px rgba(0, 217, 255, 0.6)',
          }} />
        </div>
        <p style={{ fontSize: '1.2rem', letterSpacing: '3px' }}>Loading Dot Universe...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #050510 0%, #0a0a20 25%, #150a25 50%, #0a1520 75%, #050510 100%)',
      color: 'white',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      position: 'relative',
      overflowX: 'hidden',
      paddingBottom: '50px',
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(circle at 20% 50%, rgba(0, 217, 255, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 107, 0, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(46, 204, 113, 0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Header */}
      <header style={{ textAlign: 'center', padding: '50px 20px 30px', position: 'relative', zIndex: 100 }}>
        <h1 style={{
          fontSize: 'clamp(2rem, 6vw, 3.5rem)',
          fontWeight: 900,
          marginBottom: '15px',
          letterSpacing: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '15px',
        }}>
          <span style={{ color: '#00d9ff', textShadow: '0 0 20px rgba(0, 217, 255, 0.8)', fontSize: '2rem' }}>●</span>
          <span style={{
            background: 'linear-gradient(135deg, #00d9ff 0%, #ffffff 25%, #ff6b00 50%, #ffffff 75%, #2ecc71 100%)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>DOT UNIVERSE</span>
          <span style={{ color: '#ff6b00', textShadow: '0 0 20px rgba(255, 107, 0, 0.8)', fontSize: '2rem' }}>●</span>
        </h1>

        <p style={{ fontSize: '1.1rem', color: '#8892a0', marginBottom: '10px' }}>
          Welcome back, <span
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              background: 'linear-gradient(90deg, #00d9ff, #2ecc71)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >{displayName || 'Player'}</span>
          <span onClick={() => setShowUserMenu(!showUserMenu)} style={{ cursor: 'pointer', fontSize: '0.7rem', color: '#00d9ff', opacity: 0.6, marginLeft: '4px' }}>▼</span>
        </p>

        {/* User Menu */}
        {showUserMenu && (
          <>
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} onClick={() => setShowUserMenu(false)} />
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(145deg, rgba(20, 25, 40, 0.98), rgba(10, 15, 30, 0.98))',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              borderRadius: '12px',
              padding: '8px 0',
              minWidth: '200px',
              zIndex: 100,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            }}>
              {[
                { icon: '✏️', label: 'Change Name', action: () => { setShowNameModal(true); setShowUserMenu(false) } },
                { icon: '👤', label: 'My Profile', action: () => { handleNav('/profile'); setShowUserMenu(false) } },
                { icon: '📰', label: 'News & Updates', action: () => { handleNav('/news'); setShowUserMenu(false) } },
                { divider: true },
                { icon: '🔄', label: 'Reset Progress', action: () => { setShowResetModal(true); setShowUserMenu(false) }, danger: true },
                { icon: '🚪', label: 'Sign Out', action: async () => { await signOut(); router.push('/login') }, danger: true },
              ].map((item, i) => item.divider ? (
                <div key={i} style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '8px 0' }} />
              ) : (
                <button key={i} onClick={item.action} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '12px 20px',
                  background: 'transparent',
                  border: 'none',
                  color: item.danger ? '#e74c3c' : '#ccc',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}>{item.icon} {item.label}</button>
              ))}
            </div>
          </>
        )}

        <div style={{
          width: '200px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #00d9ff, #ff6b00, #2ecc71, transparent)',
          margin: '20px auto 0',
          borderRadius: '2px',
        }} />
      </header>

      {/* Game Cards */}
      <main style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '30px',
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px 30px',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* DotSlayer Card */}
        <div
          onClick={() => handleNav('/slayer')}
          onMouseEnter={() => setHoveredGame('slayer')}
          onMouseLeave={() => setHoveredGame(null)}
          style={{
            position: 'relative',
            borderRadius: '24px',
            padding: '35px 25px',
            cursor: 'pointer',
            transition: 'all 0.4s ease',
            transform: hoveredGame === 'slayer' ? 'translateY(-12px) scale(1.02)' : 'none',
            background: 'linear-gradient(145deg, rgba(20, 25, 40, 0.9), rgba(10, 15, 30, 0.95))',
            border: hoveredGame === 'slayer' ? '1px solid rgba(255, 107, 0, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: hoveredGame === 'slayer' ? '0 0 60px rgba(255, 107, 0, 0.2)' : 'none',
          }}
        >
          <span style={{
            display: 'inline-block',
            padding: '8px 20px',
            borderRadius: '25px',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '3px',
            marginBottom: '15px',
            background: 'linear-gradient(135deg, #ff6b00, #ff4500)',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(255, 107, 0, 0.4)',
          }}>ACTION ROGUELIKE</span>

          <div style={{
            width: '90px',
            height: '90px',
            margin: '0 auto 20px',
            background: 'radial-gradient(circle at 30% 30%, #ff8844, #ff6b00, #cc4400)',
            borderRadius: '50%',
            boxShadow: '0 0 40px rgba(255, 107, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            <span style={{ fontSize: '3.5rem', color: 'white', textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>●</span>
            <span style={{ position: 'absolute', fontSize: '1.8rem', color: 'white', fontWeight: 'bold' }}>⚔</span>
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '3px', color: '#ff6b00', textAlign: 'center' }}>DOT SLAYER</h2>
          <p style={{ fontSize: '0.95rem', color: '#667', marginBottom: '20px', textAlign: 'center' }}>100 Floors of Chaos</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '25px' }}>
            {['🎮 Roguelike Action', '🏆 Leaderboards', '⚡ Skill Trees', '👹 Epic Bosses'].map(f => (
              <span key={f} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#99a',
              }}>{f}</span>
            ))}
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 35px',
            borderRadius: '30px',
            fontWeight: 700,
            fontSize: '1rem',
            letterSpacing: '2px',
            background: 'linear-gradient(135deg, #ff6b00, #ff4400)',
            color: 'white',
            boxShadow: hoveredGame === 'slayer' ? '0 6px 30px rgba(255, 107, 0, 0.5)' : '0 4px 20px rgba(255, 107, 0, 0.3)',
            transform: hoveredGame === 'slayer' ? 'scale(1.05)' : 'none',
            transition: 'all 0.3s',
            width: '100%',
            justifyContent: 'center',
          }}>
            PLAY NOW <span style={{ transform: hoveredGame === 'slayer' ? 'translateX(5px)' : 'none', transition: 'transform 0.3s' }}>→</span>
          </div>
        </div>

        {/* Dot Clicker Card */}
        <div
          onClick={() => handleNav('/clicker')}
          onMouseEnter={() => setHoveredGame('clicker')}
          onMouseLeave={() => setHoveredGame(null)}
          style={{
            position: 'relative',
            borderRadius: '24px',
            padding: '35px 25px',
            cursor: 'pointer',
            transition: 'all 0.4s ease',
            transform: hoveredGame === 'clicker' ? 'translateY(-12px) scale(1.02)' : 'none',
            background: 'linear-gradient(145deg, rgba(20, 25, 40, 0.9), rgba(10, 15, 30, 0.95))',
            border: hoveredGame === 'clicker' ? '1px solid rgba(0, 217, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: hoveredGame === 'clicker' ? '0 0 60px rgba(0, 217, 255, 0.2)' : 'none',
          }}
        >
          <span style={{
            display: 'inline-block',
            padding: '8px 20px',
            borderRadius: '25px',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '3px',
            marginBottom: '15px',
            background: 'linear-gradient(135deg, #00d9ff, #0099ff)',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(0, 217, 255, 0.4)',
          }}>IDLE INCREMENTAL</span>

          <div style={{
            width: '90px',
            height: '90px',
            margin: '0 auto 20px',
            background: 'radial-gradient(circle at 30% 30%, #00ffff, #00d9ff, #0088cc)',
            borderRadius: '50%',
            boxShadow: '0 0 40px rgba(0, 217, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            <span style={{ fontSize: '3.5rem', color: 'white', textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>●</span>
            <span style={{ position: 'absolute', fontSize: '1.2rem', color: '#2ecc71', fontWeight: 'bold', top: '10px', right: '10px' }}>+1</span>
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '3px', color: '#00d9ff', textAlign: 'center' }}>DOT CLICKER</h2>
          <p style={{ fontSize: '0.95rem', color: '#667', marginBottom: '20px', textAlign: 'center' }}>Infinite Dot Empire</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '25px' }}>
            {['👆 Addictive Clicking', '🏭 Build Empire', '🌟 Prestige System', '🔗 Cross-Game Sync'].map(f => (
              <span key={f} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#99a',
              }}>{f}</span>
            ))}
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 35px',
            borderRadius: '30px',
            fontWeight: 700,
            fontSize: '1rem',
            letterSpacing: '2px',
            background: 'linear-gradient(135deg, #00d9ff, #0099cc)',
            color: 'white',
            boxShadow: hoveredGame === 'clicker' ? '0 6px 30px rgba(0, 217, 255, 0.5)' : '0 4px 20px rgba(0, 217, 255, 0.3)',
            transform: hoveredGame === 'clicker' ? 'scale(1.05)' : 'none',
            transition: 'all 0.3s',
            width: '100%',
            justifyContent: 'center',
          }}>
            PLAY NOW <span style={{ transform: hoveredGame === 'clicker' ? 'translateX(5px)' : 'none', transition: 'transform 0.3s' }}>→</span>
          </div>
        </div>
      </main>

      {/* Synergy Section */}
      <section style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        <div style={{
          background: 'linear-gradient(145deg, rgba(20, 25, 40, 0.8), rgba(15, 20, 35, 0.9))',
          borderRadius: '20px',
          padding: '30px',
          border: '1px solid rgba(243, 156, 18, 0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '15px' }}>
            <span style={{ fontSize: '1.5rem' }}>🔗</span>
            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: 700,
              letterSpacing: '3px',
              background: 'linear-gradient(90deg, #f39c12, #f1c40f)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>CROSS-GAME SYNERGY</h3>
          </div>

          <p style={{ color: '#889', fontSize: '0.9rem', lineHeight: 1.6, textAlign: 'center', marginBottom: '25px' }}>
            Play both games to unlock exclusive bonuses! DotSlayer floors boost Clicker <span style={{ color: '#ff6b00', fontWeight: 600 }}>(+1% per floor)</span>,
            Clicker prestiges power up Slayer <span style={{ color: '#00d9ff', fontWeight: 600 }}>(+5% per prestige)</span>!
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { icon: '⚔', label: 'Slayer Best Floor', value: synergyStats.slayerHighestFloor, color: '#ff6b00', fill: Math.min(synergyStats.slayerHighestFloor, 100) },
              { icon: '●', label: 'Clicker Prestiges', value: synergyStats.clickerPrestiges, color: '#00d9ff', fill: Math.min(synergyStats.clickerPrestiges * 10, 100) },
              { icon: '✨', label: 'Total Synergy Bonus', value: `+${synergyStats.synergyBonus}%`, color: '#2ecc71', isTotal: true },
            ].map((stat) => (
              <div key={stat.label} style={{
                textAlign: 'center',
                padding: '15px',
                background: stat.isTotal ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.1), rgba(39, 174, 96, 0.05))' : 'rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                border: stat.isTotal ? '1px solid rgba(46, 204, 113, 0.2)' : 'none',
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  fontSize: '1rem',
                  background: `linear-gradient(135deg, ${stat.color}33, ${stat.color}22)`,
                  color: stat.color,
                  border: `1px solid ${stat.color}55`,
                }}>{stat.icon}</div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#667', marginBottom: '5px' }}>{stat.label}</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: stat.color }}>{stat.value}</span>
                {stat.fill !== undefined && (
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${stat.fill}%`, background: `linear-gradient(90deg, ${stat.color}, ${stat.color}aa)`, borderRadius: '2px', transition: 'width 0.5s ease' }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {synergyStats.slayerGamesWon > 0 && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '20px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, rgba(243, 156, 18, 0.15), rgba(241, 196, 15, 0.1))',
              border: '1px solid rgba(243, 156, 18, 0.3)',
              borderRadius: '30px',
              color: '#f1c40f',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}>
              <span>🏆</span> DotSlayer Champion x{synergyStats.slayerGamesWon}
            </div>
          )}
        </div>
      </section>

      {/* Leaderboards */}
      <section style={{ maxWidth: '700px', margin: '30px auto 40px', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '3px', color: '#f39c12', marginBottom: '15px' }}>🏆 LEADERBOARDS</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            {['slayer', 'clicker'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveLeaderboard(tab as 'slayer' | 'clicker')}
                style={{
                  padding: '10px 25px',
                  background: activeLeaderboard === tab
                    ? tab === 'slayer'
                      ? 'linear-gradient(135deg, rgba(255, 107, 0, 0.2), rgba(255, 50, 0, 0.2))'
                      : 'linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(0, 150, 255, 0.2))'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: activeLeaderboard === tab
                    ? `1px solid ${tab === 'slayer' ? 'rgba(255, 107, 0, 0.4)' : 'rgba(0, 217, 255, 0.4)'}`
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  color: activeLeaderboard === tab ? (tab === 'slayer' ? '#ff6b00' : '#00d9ff') : '#778',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                {tab === 'slayer' ? '⚔️ DotSlayer' : '● DotClicker'}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(145deg, rgba(20, 25, 40, 0.8), rgba(15, 20, 35, 0.9))',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          {(activeLeaderboard === 'slayer' ? slayerLeaderboard : clickerLeaderboard).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(activeLeaderboard === 'slayer' ? slayerLeaderboard : clickerLeaderboard).map((entry, index) => (
                <div key={activeLeaderboard === 'slayer' ? (entry as LeaderboardEntry).id : (entry as ClickerLeaderboardEntry).user_id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 15px',
                  background: index === 0
                    ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 200, 0, 0.1))'
                    : index === 1
                    ? 'linear-gradient(135deg, rgba(192, 192, 192, 0.15), rgba(169, 169, 169, 0.1))'
                    : index === 2
                    ? 'linear-gradient(135deg, rgba(205, 127, 50, 0.15), rgba(180, 100, 50, 0.1))'
                    : 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '10px',
                  border: index < 3 ? `1px solid ${index === 0 ? 'rgba(255, 215, 0, 0.2)' : index === 1 ? 'rgba(192, 192, 192, 0.2)' : 'rgba(205, 127, 50, 0.2)'}` : 'none',
                }}>
                  <span style={{ fontSize: '1.1rem', width: '35px', textAlign: 'center' }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </span>
                  <span style={{ flex: 1, fontWeight: 600, color: '#ddd' }}>
                    {activeLeaderboard === 'slayer' ? (entry as LeaderboardEntry).display_name : (entry as ClickerLeaderboardEntry).display_name}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    {activeLeaderboard === 'slayer' ? (
                      <>
                        <span style={{ color: '#ff6b00', fontWeight: 700, fontSize: '0.9rem' }}>Floor {(entry as LeaderboardEntry).floor_reached}</span>
                        <span style={{ color: '#888', fontSize: '0.8rem' }}>{formatNumber((entry as LeaderboardEntry).score)} pts</span>
                      </>
                    ) : (
                      <>
                        <span style={{ color: '#00d9ff', fontWeight: 700, fontSize: '0.9rem' }}>{formatNumber((entry as ClickerLeaderboardEntry).total_dots)} dots</span>
                        <span style={{ color: '#f39c12', fontSize: '0.8rem' }}>⭐ {(entry as ClickerLeaderboardEntry).total_prestiges}</span>
                      </>
                    )}
                  </div>
                  {activeLeaderboard === 'slayer' && (entry as LeaderboardEntry).was_victory && <span style={{ fontSize: '1rem', marginLeft: '5px' }}>👑</span>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#556' }}>
              <span style={{ display: 'block' }}>No scores yet!</span>
              <span style={{ fontSize: '0.85rem', color: '#445', marginTop: '8px', display: 'block' }}>
                {activeLeaderboard === 'slayer' ? 'Be the first to conquer the tower' : 'Start clicking to claim your spot'}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Quick Links */}
      <section style={{ display: 'flex', justifyContent: 'center', gap: '20px', padding: '20px', position: 'relative', zIndex: 10, flexWrap: 'wrap' }}>
        {[
          { icon: '👤', label: 'My Profile', path: '/profile', gradient: 'linear-gradient(135deg, #00d9ff, #0099ff)', shadow: 'rgba(0, 217, 255, 0.4)' },
          { icon: '📰', label: 'News & Updates', path: '/news', gradient: 'linear-gradient(135deg, #2ecc71, #27ae60)', shadow: 'rgba(46, 204, 113, 0.4)' },
          { icon: '🔄', label: 'Reset Progress', action: () => setShowResetModal(true), gradient: 'linear-gradient(135deg, #e74c3c, #c0392b)', shadow: 'rgba(231, 76, 60, 0.4)' },
        ].map((link) => (
          <button
            key={link.label}
            onClick={link.action || (() => handleNav(link.path!))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 32px',
              borderRadius: '20px',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.95rem',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              border: 'none',
              background: link.gradient,
              boxShadow: `0 4px 15px ${link.shadow}, 0 0 30px ${link.shadow.replace('0.4', '0.2')}`,
              transition: 'all 0.3s ease',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>{link.icon}</span>
            {link.label}
          </button>
        ))}
      </section>

      {/* Name Change Modal */}
      {showNameModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }} onClick={() => nameUpdateStatus !== 'saving' && setShowNameModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'linear-gradient(145deg, rgba(20, 25, 40, 0.98), rgba(10, 15, 30, 0.98))',
            border: '1px solid rgba(0, 217, 255, 0.3)',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
          }}>
            <h2 style={{ color: '#00d9ff', marginBottom: '10px' }}>✏️ Change Display Name</h2>
            <p style={{ color: '#889', fontSize: '0.9rem', marginBottom: '20px' }}>This name will appear on leaderboards</p>
            <input
              type="text"
              value={newDisplayName}
              onChange={e => setNewDisplayName(e.target.value)}
              placeholder="Enter display name"
              maxLength={20}
              disabled={nameUpdateStatus === 'saving'}
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '2px solid rgba(0, 217, 255, 0.3)',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'white',
                fontSize: '1.1rem',
                outline: 'none',
              }}
            />
            <span style={{ display: 'block', textAlign: 'right', color: '#667', fontSize: '0.8rem', marginTop: '5px' }}>{newDisplayName.length}/20</span>
            {nameUpdateStatus === 'error' && <p style={{ color: '#e74c3c', margin: '10px 0', fontSize: '0.9rem' }}>Failed to update name. Try again.</p>}
            {nameUpdateStatus === 'success' && <p style={{ color: '#2ecc71', margin: '10px 0', fontSize: '0.9rem' }}>Name updated successfully!</p>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={updateDisplayName} disabled={nameUpdateStatus === 'saving' || !newDisplayName.trim()} style={{
                flex: 1,
                padding: '12px',
                background: 'linear-gradient(135deg, #00d9ff, #0099cc)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontWeight: 600,
                cursor: nameUpdateStatus === 'saving' || !newDisplayName.trim() ? 'not-allowed' : 'pointer',
                opacity: nameUpdateStatus === 'saving' || !newDisplayName.trim() ? 0.5 : 1,
              }}>{nameUpdateStatus === 'saving' ? 'Saving...' : 'Save'}</button>
              <button onClick={() => setShowNameModal(false)} disabled={nameUpdateStatus === 'saving'} style={{
                flex: 1,
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: '#aab',
                cursor: 'pointer',
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Progress Modal */}
      {showResetModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }} onClick={() => setShowResetModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'linear-gradient(145deg, rgba(20, 25, 40, 0.98), rgba(10, 15, 30, 0.98))',
            border: '1px solid rgba(231, 76, 60, 0.3)',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '450px',
            width: '90%',
            textAlign: 'center',
          }}>
            <h3 style={{ color: '#e74c3c', marginBottom: '15px' }}>⚠️ Reset All Progress</h3>
            <p style={{ color: '#e74c3c', fontWeight: 600, marginBottom: '15px' }}>This will permanently delete ALL your game data including:</p>
            <ul style={{
              listStyle: 'none',
              padding: '15px 20px',
              margin: '0 0 20px 0',
              background: 'rgba(231, 76, 60, 0.1)',
              border: '1px solid rgba(231, 76, 60, 0.2)',
              borderRadius: '10px',
              textAlign: 'left',
            }}>
              {['DotSlayer progress, saves, and stats', 'Dot Clicker saves and prestiges', 'All achievements', 'Daily & weekly challenge progress', 'Leaderboard entries', 'Cross-game synergy bonuses'].map(item => (
                <li key={item} style={{ color: '#ccc', padding: '5px 0', fontSize: '0.9rem' }}>✗ {item}</li>
              ))}
            </ul>
            <p style={{ color: '#f39c12', fontSize: '0.95rem', marginBottom: '10px' }}>Type <strong style={{ color: '#e74c3c', fontSize: '1.1rem' }}>DELETE</strong> to confirm:</p>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value.toUpperCase())}
              placeholder="Type DELETE here"
              disabled={resetStatus === 'resetting'}
              style={{
                width: '100%',
                padding: '12px 15px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '2px solid rgba(231, 76, 60, 0.3)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: 700,
                textAlign: 'center',
                letterSpacing: '3px',
                marginBottom: '15px',
                outline: 'none',
              }}
            />
            {resetStatus === 'error' && <p style={{ color: '#e74c3c', marginBottom: '10px', fontSize: '0.9rem' }}>Failed to reset. Please try again.</p>}
            {resetStatus === 'success' && <p style={{ color: '#2ecc71', marginBottom: '10px', fontSize: '0.9rem' }}>Progress reset successfully! Refreshing...</p>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={resetAllProgress} disabled={resetConfirmText !== 'DELETE' || resetStatus === 'resetting'} style={{
                flex: 1,
                background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                color: 'white',
                border: 'none',
                padding: '12px 25px',
                borderRadius: '10px',
                fontWeight: 600,
                cursor: resetConfirmText !== 'DELETE' || resetStatus === 'resetting' ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                opacity: resetConfirmText !== 'DELETE' || resetStatus === 'resetting' ? 0.5 : 1,
              }}>🗑️ {resetStatus === 'resetting' ? 'Resetting...' : 'Reset Everything'}</button>
              <button onClick={() => { setShowResetModal(false); setResetConfirmText('') }} disabled={resetStatus === 'resetting'} style={{
                flex: 1,
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: '#aab',
                cursor: 'pointer',
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ padding: '30px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: '#445' }}>v2.0</span>
          <div style={{ display: 'flex', gap: '15px' }}>
            {[{ label: 'Profile', path: '/profile' }, { label: 'News', path: '/news' }].map(link => (
              <button key={link.path} onClick={() => handleNav(link.path)} style={{
                background: 'transparent',
                border: 'none',
                color: '#556',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}>{link.label}</button>
            ))}
          </div>
          <button onClick={async () => { await signOut(); router.push('/login') }} style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#778',
            padding: '10px 25px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}>Sign Out</button>
        </div>
      </footer>
    </div>
  )
}

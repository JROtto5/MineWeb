'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/context/AuthContext'
import { leaderboardService, LeaderboardEntry } from '../../lib/supabase'
import { supabase } from '../../lib/supabase/client'
import Link from 'next/link'

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

// Hub Music Player - Ambient Synthwave/Chillwave style
class HubMusicPlayer {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private isPlaying = false
  private isMuted = false
  private musicLoop: ReturnType<typeof setInterval> | null = null
  private activeOscillators: Set<OscillatorNode> = new Set()
  private chordIndex = 0

  // Dreamy chord progression (C major 7 - A minor 7 - F major 7 - G major 7)
  private chords = [
    [261.63, 329.63, 392.00, 493.88], // Cmaj7
    [220.00, 261.63, 329.63, 392.00], // Am7
    [174.61, 220.00, 261.63, 329.63], // Fmaj7
    [196.00, 246.94, 293.66, 369.99], // Gmaj7
  ]

  init() {
    if (this.audioContext) return

    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = 0.12 // Quiet ambient level
      this.masterGain.connect(this.audioContext.destination)
    } catch (e) {
      console.warn('Failed to initialize hub audio:', e)
    }
  }

  private playPad(frequencies: number[], duration: number) {
    if (!this.audioContext || !this.masterGain || this.isMuted) return

    const now = this.audioContext.currentTime

    frequencies.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()
      const filter = this.audioContext!.createBiquadFilter()

      // Soft sine/triangle mix for dreamy sound
      osc.type = i % 2 === 0 ? 'sine' : 'triangle'
      osc.frequency.value = freq

      // Low-pass filter for warmth
      filter.type = 'lowpass'
      filter.frequency.value = 800
      filter.Q.value = 1

      // Slow attack, long release for pad sound
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.08, now + 0.8) // Slow fade in
      gain.gain.setValueAtTime(0.08, now + duration - 1.5)
      gain.gain.linearRampToValueAtTime(0, now + duration) // Slow fade out

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.masterGain!)

      this.activeOscillators.add(osc)
      osc.onended = () => this.activeOscillators.delete(osc)

      osc.start(now + i * 0.1) // Slight stagger for richness
      osc.stop(now + duration)
    })
  }

  private playArpeggio() {
    if (!this.audioContext || !this.masterGain || this.isMuted) return

    const now = this.audioContext.currentTime
    const chord = this.chords[this.chordIndex]
    const noteDelay = 0.4

    chord.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()

      osc.type = 'sine'
      osc.frequency.value = freq * 2 // One octave up

      const startTime = now + i * noteDelay
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.04, startTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2)

      osc.connect(gain)
      gain.connect(this.masterGain!)

      this.activeOscillators.add(osc)
      osc.onended = () => this.activeOscillators.delete(osc)

      osc.start(startTime)
      osc.stop(startTime + 1.5)
    })
  }

  private playBeat() {
    if (!this.isPlaying || this.isMuted) return

    // Play ambient pad chord
    this.playPad(this.chords[this.chordIndex], 4)

    // Play gentle arpeggio
    setTimeout(() => this.playArpeggio(), 500)

    // Move to next chord
    this.chordIndex = (this.chordIndex + 1) % this.chords.length
  }

  start() {
    if (this.isPlaying) return

    this.init()
    if (!this.audioContext || !this.masterGain) return

    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    this.isPlaying = true
    this.playBeat()
    // Play a new chord every 4 seconds
    this.musicLoop = setInterval(() => this.playBeat(), 4000)
  }

  stop() {
    this.isPlaying = false

    if (this.musicLoop) {
      clearInterval(this.musicLoop)
      this.musicLoop = null
    }

    // Stop all oscillators
    this.activeOscillators.forEach(osc => {
      try { osc.stop() } catch {}
    })
    this.activeOscillators.clear()
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 0.12
    }
    return this.isMuted
  }

  isMutedState(): boolean {
    return this.isMuted
  }

  cleanup() {
    this.stop()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.masterGain = null
  }
}

// Singleton instance
let hubMusicPlayer: HubMusicPlayer | null = null
function getHubMusicPlayer(): HubMusicPlayer {
  if (!hubMusicPlayer) {
    hubMusicPlayer = new HubMusicPlayer()
  }
  return hubMusicPlayer
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
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hoveredGame, setHoveredGame] = useState<string | null>(null)
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number, speed: number, color: string, delay: number}>>([])
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
  const [musicMuted, setMusicMuted] = useState(false)
  const [musicStarted, setMusicStarted] = useState(false)
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
        // Load Slayer leaderboard
        const slayerScores = await leaderboardService.getTopScores(10)
        setSlayerLeaderboard(slayerScores)

        // Load Clicker leaderboard from clicker_saves table
        const { data: clickerData } = await supabase
          .from('clicker_saves')
          .select('user_id, total_dots, total_prestiges, stats')
          .order('total_dots', { ascending: false })
          .limit(10)

        if (clickerData) {
          // Get user profiles for display names
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

  // Load current display name from user_profiles
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
          // Fallback to email username
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

  // Update display name function
  const updateDisplayName = async () => {
    if (!user || !newDisplayName.trim()) return

    const trimmedName = newDisplayName.trim().slice(0, 20) // Max 20 chars

    setNameUpdateStatus('saving')

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          display_name: trimmedName,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })

      if (error) throw error

      setDisplayName(trimmedName)
      setNameUpdateStatus('success')

      // Close modal after success
      setTimeout(() => {
        setShowNameModal(false)
        setNameUpdateStatus('idle')
      }, 1500)
    } catch (error) {
      console.error('Failed to update display name:', error)
      setNameUpdateStatus('error')
    }
  }

  // Reset all progress function
  const resetAllProgress = async () => {
    if (resetConfirmText !== 'DELETE' || !user) return

    setResetStatus('resetting')

    try {
      // Clear localStorage - ALL game-related keys
      const keysToRemove = [
        // DotSlayer keys
        'dotslayer_progress',
        'dotslayer_daily_challenges',
        'dotslayer_weekly_challenges',
        'dotslayer_event_progress',
        'dotslayer_synergy',
        'dotslayer_synergy_stats',
        'dotslayer_save',
        'dotslayer_achievements',
        // Dot Clicker keys
        'dotclicker_save',
        'dotclicker_synergy',
        'dotclicker_synergy_stats',
        'dotclicker_achievements',
        // Cross-game synergy keys
        'crossGameSynergy',
        'dot_universe_level',
        'cross_game_bonuses'
      ]
      keysToRemove.forEach(key => localStorage.removeItem(key))

      // Also clear any keys that start with these prefixes (catch-all)
      const prefixes = ['dotslayer_', 'dotclicker_', 'dot_universe_', 'cross_game_']
      Object.keys(localStorage).forEach(key => {
        if (prefixes.some(prefix => key.startsWith(prefix))) {
          localStorage.removeItem(key)
        }
      })

      // Clear Supabase data
      await Promise.all([
        supabase.from('slayer_progress').delete().eq('user_id', user.id),
        supabase.from('slayer_saves').delete().eq('user_id', user.id),
        supabase.from('slayer_stats').delete().eq('user_id', user.id),
        supabase.from('clicker_saves').delete().eq('user_id', user.id),
        supabase.from('achievements').delete().eq('user_id', user.id),
        supabase.from('daily_challenges').delete().eq('user_id', user.id),
        supabase.from('leaderboards').delete().eq('user_id', user.id),
        // Reset synergy data in user_profiles (don't delete the profile itself)
        supabase.from('user_profiles').update({
          slayer_highest_floor: 0,
          slayer_games_won: 0,
          clicker_total_prestiges: 0,
          clicker_total_dots: 0,
          synergy_bonus: 0,
          updated_at: new Date().toISOString()
        }).eq('id', user.id),
      ])

      setResetStatus('success')

      // Reset local state
      setSynergyStats({
        slayerFloorsCleared: 0,
        slayerHighestFloor: 0,
        slayerGamesWon: 0,
        clickerPrestiges: 0,
        clickerTotalDots: 0,
        synergyBonus: 0
      })

      // Close modal and refresh after success
      setTimeout(() => {
        setShowResetModal(false)
        setResetConfirmText('')
        setResetStatus('idle')
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error('Failed to reset progress:', error)
      setResetStatus('error')
    }
  }

  // Load synergy stats from localStorage
  useEffect(() => {
    const loadSynergyStats = () => {
      try {
        const slayerProgress = localStorage.getItem('dotslayer_progress')
        const clickerSave = localStorage.getItem('dotclicker_save')

        let slayerFloors = 0
        let slayerHighest = 0
        let slayerWins = 0
        let clickerPrestiges = 0
        let clickerDots = 0

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

        const synergyBonus = (slayerFloors * 1) + (clickerPrestiges * 5)

        setSynergyStats({
          slayerFloorsCleared: slayerFloors,
          slayerHighestFloor: slayerHighest,
          slayerGamesWon: slayerWins,
          clickerPrestiges,
          clickerTotalDots: clickerDots,
          synergyBonus
        })
      } catch (e) {
        console.warn('Failed to load synergy stats:', e)
      }
    }

    loadSynergyStats()
    const interval = setInterval(loadSynergyStats, 5000)
    return () => clearInterval(interval)
  }, [])

  // Create floating particles with more variety
  useEffect(() => {
    const colors = ['#00d9ff', '#ff6b00', '#2ecc71', '#9b59b6', '#f39c12', '#e74c3c']
    const newParticles = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      speed: Math.random() * 25 + 15,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 5
    }))
    setParticles(newParticles)
  }, [])

  // Hub ambient music - start on first interaction
  useEffect(() => {
    const startMusic = () => {
      if (!musicStarted) {
        const player = getHubMusicPlayer()
        player.start()
        setMusicStarted(true)
      }
    }

    // Start music on any click/touch
    document.addEventListener('click', startMusic, { once: true })
    document.addEventListener('touchstart', startMusic, { once: true })

    // Cleanup on unmount
    return () => {
      document.removeEventListener('click', startMusic)
      document.removeEventListener('touchstart', startMusic)
      const player = getHubMusicPlayer()
      player.stop()
    }
  }, [musicStarted])

  const toggleMusic = () => {
    const player = getHubMusicPlayer()
    if (!musicStarted) {
      player.start()
      setMusicStarted(true)
    }
    const muted = player.toggleMute()
    setMusicMuted(muted)
  }

  if (loading) {
    return (
      <div className="hub-loading">
        <div className="loading-container">
          <div className="loading-dot"></div>
          <div className="loading-ring"></div>
          <div className="loading-ring ring-2"></div>
        </div>
        <p className="loading-text">Loading Dot Universe...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="hub-container">
      {/* Animated mesh background */}
      <div className="mesh-bg"></div>

      {/* Animated background particles */}
      <div className="particles-bg">
        {particles.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              animationDuration: `${p.speed}s`,
              animationDelay: `${p.delay}s`
            }}
          />
        ))}
      </div>

      {/* Decorative orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      {/* Music Toggle Button */}
      <button className="music-toggle" onClick={toggleMusic} title={musicMuted ? 'Unmute Music' : 'Mute Music'}>
        {musicMuted ? '🔇' : '🎵'}
      </button>

      {/* Header */}
      <header className="hub-header">
        <div className="logo-container">
          <div className="logo-glow"></div>
          <h1 className="hub-title">
            <span className="dot-icon dot-cyan">●</span>
            <span className="title-text">DOT UNIVERSE</span>
            <span className="dot-icon dot-orange">●</span>
          </h1>
        </div>
        <p className="hub-subtitle">
          Welcome back, <span className="player-name clickable" onClick={() => setShowNameModal(true)} title="Click to change display name">{displayName || 'Player'}</span> <span className="edit-icon" onClick={() => setShowNameModal(true)}>✏️</span>
        </p>
        <div className="header-decoration"></div>
      </header>

      {/* Game Selection */}
      <main className="games-grid">
        {/* Dot Slayer Card */}
        <Link href="/slayer" className="game-card slayer-card"
          onMouseEnter={() => setHoveredGame('slayer')}
          onMouseLeave={() => setHoveredGame(null)}>
          <div className="card-bg"></div>
          <div className="card-glow"></div>
          <div className="card-shine"></div>
          <div className="card-content">
            <div className="game-badge">ACTION</div>
            <div className="game-icon">
              <div className="icon-bg"></div>
              <span className="icon-main">●</span>
              <span className="icon-overlay">⚔</span>
              <div className="icon-particles">
                <span></span><span></span><span></span>
              </div>
            </div>
            <h2 className="game-title">DOT SLAYER</h2>
            <p className="game-tagline">100 Floors of Chaos</p>
            <div className="game-features">
              <span className="feature"><span className="feature-icon">🎮</span> Roguelike Action</span>
              <span className="feature"><span className="feature-icon">🏆</span> Leaderboards</span>
              <span className="feature"><span className="feature-icon">⚡</span> Skill Trees</span>
              <span className="feature"><span className="feature-icon">👹</span> Epic Bosses</span>
            </div>
            <div className={`play-button ${hoveredGame === 'slayer' ? 'active' : ''}`}>
              <span className="btn-text">PLAY NOW</span>
              <span className="btn-arrow">→</span>
            </div>
          </div>
        </Link>

        {/* Dot Clicker Card */}
        <Link href="/clicker" className="game-card clicker-card"
          onMouseEnter={() => setHoveredGame('clicker')}
          onMouseLeave={() => setHoveredGame(null)}>
          <div className="card-bg"></div>
          <div className="card-glow"></div>
          <div className="card-shine"></div>
          <div className="card-content">
            <div className="game-badge">IDLE</div>
            <div className="game-icon">
              <div className="icon-bg"></div>
              <span className="icon-main">●</span>
              <span className="icon-overlay click-plus">+1</span>
              <div className="icon-ring"></div>
            </div>
            <h2 className="game-title">DOT CLICKER</h2>
            <p className="game-tagline">Infinite Dot Empire</p>
            <div className="game-features">
              <span className="feature"><span className="feature-icon">👆</span> Addictive Clicking</span>
              <span className="feature"><span className="feature-icon">🏭</span> Build Empire</span>
              <span className="feature"><span className="feature-icon">🌟</span> Prestige System</span>
              <span className="feature"><span className="feature-icon">🔗</span> Cross-Game Sync</span>
            </div>
            <div className={`play-button ${hoveredGame === 'clicker' ? 'active' : ''}`}>
              <span className="btn-text">PLAY NOW</span>
              <span className="btn-arrow">→</span>
            </div>
          </div>
        </Link>
      </main>

      {/* Cross-game Synergy Section */}
      <section className="synergy-section">
        <div className="synergy-glow"></div>
        <div className="synergy-content">
          <div className="synergy-header">
            <span className="synergy-icon">🔗</span>
            <h3 className="synergy-title">CROSS-GAME SYNERGY</h3>
          </div>
          <p className="synergy-desc">
            Play both games to unlock exclusive bonuses! DotSlayer floors boost Clicker <span className="highlight-orange">(+1% per floor)</span>,
            Clicker prestiges power up Slayer <span className="highlight-cyan">(+5% per prestige)</span>!
          </p>
          <div className="synergy-stats">
            <div className="synergy-stat">
              <div className="stat-icon slayer-icon-mini">⚔</div>
              <span className="stat-label">Slayer Best Floor</span>
              <span className="stat-value slayer-value">{synergyStats.slayerHighestFloor}</span>
              <div className="stat-bar">
                <div className="stat-fill slayer-fill" style={{width: `${Math.min(synergyStats.slayerHighestFloor, 100)}%`}}></div>
              </div>
            </div>
            <div className="synergy-stat">
              <div className="stat-icon clicker-icon-mini">●</div>
              <span className="stat-label">Clicker Prestiges</span>
              <span className="stat-value clicker-value">{synergyStats.clickerPrestiges}</span>
              <div className="stat-bar">
                <div className="stat-fill clicker-fill" style={{width: `${Math.min(synergyStats.clickerPrestiges * 10, 100)}%`}}></div>
              </div>
            </div>
            <div className="synergy-stat total-stat">
              <div className="stat-icon bonus-icon">✨</div>
              <span className="stat-label">Total Synergy Bonus</span>
              <span className="stat-value bonus-value">+{synergyStats.synergyBonus}%</span>
            </div>
          </div>
          {synergyStats.slayerGamesWon > 0 && (
            <div className="synergy-achievement">
              <span className="achievement-icon">🏆</span>
              <span>DotSlayer Champion x{synergyStats.slayerGamesWon}</span>
            </div>
          )}
        </div>
      </section>

      {/* Leaderboards Section */}
      <section className="leaderboards-section">
        <div className="leaderboards-header">
          <h3 className="leaderboards-title">🏆 LEADERBOARDS</h3>
          <div className="leaderboard-tabs">
            <button
              className={`lb-tab ${activeLeaderboard === 'slayer' ? 'active slayer-active' : ''}`}
              onClick={() => setActiveLeaderboard('slayer')}
            >
              ⚔️ DotSlayer
            </button>
            <button
              className={`lb-tab ${activeLeaderboard === 'clicker' ? 'active clicker-active' : ''}`}
              onClick={() => setActiveLeaderboard('clicker')}
            >
              ● DotClicker
            </button>
          </div>
        </div>

        <div className="leaderboard-content">
          {activeLeaderboard === 'slayer' ? (
            <div className="leaderboard-list slayer-list">
              {slayerLeaderboard.length > 0 ? (
                slayerLeaderboard.map((entry, index) => (
                  <div key={entry.id || index} className={`lb-entry ${index < 3 ? `top-${index + 1}` : ''}`}>
                    <span className="lb-rank">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                    <span className="lb-name">{entry.display_name || 'Anonymous'}</span>
                    <div className="lb-stats">
                      <span className="lb-floor">Floor {entry.floor_reached}</span>
                      <span className="lb-score">{formatNumber(entry.score)} pts</span>
                    </div>
                    {entry.was_victory && <span className="lb-victory">👑</span>}
                  </div>
                ))
              ) : (
                <div className="lb-empty">
                  <span>No scores yet!</span>
                  <span className="lb-hint">Be the first to conquer the tower</span>
                </div>
              )}
            </div>
          ) : (
            <div className="leaderboard-list clicker-list">
              {clickerLeaderboard.length > 0 ? (
                clickerLeaderboard.map((entry, index) => (
                  <div key={entry.user_id} className={`lb-entry ${index < 3 ? `top-${index + 1}` : ''}`}>
                    <span className="lb-rank">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                    <span className="lb-name">{entry.display_name}</span>
                    <div className="lb-stats">
                      <span className="lb-dots">{formatNumber(entry.total_dots)} dots</span>
                      <span className="lb-prestiges">⭐ {entry.total_prestiges}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="lb-empty">
                  <span>No clickers yet!</span>
                  <span className="lb-hint">Start clicking to claim your spot</span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Display Name Change Modal */}
      {showNameModal && (
        <div className="modal-overlay" onClick={() => nameUpdateStatus !== 'saving' && setShowNameModal(false)}>
          <div className="name-modal" onClick={e => e.stopPropagation()}>
            <h2>✏️ Change Display Name</h2>
            <p className="modal-desc">This name will appear on leaderboards</p>
            <input
              type="text"
              value={newDisplayName}
              onChange={e => setNewDisplayName(e.target.value)}
              placeholder="Enter display name"
              maxLength={20}
              className="name-input"
              disabled={nameUpdateStatus === 'saving'}
            />
            <span className="char-count">{newDisplayName.length}/20</span>

            {nameUpdateStatus === 'error' && (
              <p className="error-text">Failed to update name. Try again.</p>
            )}
            {nameUpdateStatus === 'success' && (
              <p className="success-text">Name updated successfully!</p>
            )}

            <div className="modal-buttons">
              <button
                className="save-name-btn"
                onClick={updateDisplayName}
                disabled={nameUpdateStatus === 'saving' || !newDisplayName.trim()}
              >
                {nameUpdateStatus === 'saving' ? 'Saving...' : 'Save'}
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowNameModal(false)}
                disabled={nameUpdateStatus === 'saving'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <section className="quick-links">
        <Link href="/profile" className="quick-link profile-link">
          <span className="link-icon">👤</span>
          <span>My Profile</span>
        </Link>
        <Link href="/news" className="quick-link news-link">
          <span className="link-icon">📰</span>
          <span>News & Updates</span>
        </Link>
        <button className="quick-link reset-link" onClick={() => setShowResetModal(true)}>
          <span className="link-icon">🔄</span>
          <span>Reset Progress</span>
        </button>
      </section>

      {/* Reset Progress Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal-content reset-modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">⚠️ Reset All Progress</h3>
            <p className="reset-warning">
              This will permanently delete ALL your game data including:
            </p>
            <ul className="reset-list">
              <li>DotSlayer progress, saves, and stats</li>
              <li>Dot Clicker saves and prestiges</li>
              <li>All achievements</li>
              <li>Daily & weekly challenge progress</li>
              <li>Leaderboard entries</li>
              <li>Cross-game synergy bonuses</li>
            </ul>
            <p className="reset-confirm-text">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              className="reset-input"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value.toUpperCase())}
              placeholder="Type DELETE here"
              disabled={resetStatus === 'resetting'}
            />

            {resetStatus === 'error' && (
              <p className="error-text">Failed to reset. Please try again.</p>
            )}
            {resetStatus === 'success' && (
              <p className="success-text">Progress reset successfully! Refreshing...</p>
            )}

            <div className="modal-buttons">
              <button
                className="reset-confirm-btn"
                onClick={resetAllProgress}
                disabled={resetConfirmText !== 'DELETE' || resetStatus === 'resetting'}
              >
                {resetStatus === 'resetting' ? 'Resetting...' : '🗑️ Reset Everything'}
              </button>
              <button
                className="cancel-btn"
                onClick={() => { setShowResetModal(false); setResetConfirmText(''); }}
                disabled={resetStatus === 'resetting'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="hub-footer">
        <div className="footer-content">
          <span className="version">v2.0</span>
          <div className="footer-links">
            <Link href="/profile" className="footer-link">Profile</Link>
            <Link href="/news" className="footer-link">News</Link>
          </div>
          <button onClick={() => router.push('/login')} className="logout-btn">
            <span>Sign Out</span>
          </button>
        </div>
      </footer>

      <style jsx>{`
        .hub-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #050510 0%, #0a0a20 25%, #150a25 50%, #0a1520 75%, #050510 100%);
          color: white;
          font-family: 'Segoe UI', system-ui, sans-serif;
          position: relative;
          overflow-x: hidden;
          overflow-y: auto;
          padding-bottom: 50px;
        }

        .music-toggle {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(145deg, rgba(20, 25, 40, 0.9), rgba(10, 15, 30, 0.95));
          border: 2px solid rgba(0, 217, 255, 0.3);
          color: white;
          font-size: 24px;
          cursor: pointer;
          z-index: 1000;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .music-toggle:hover {
          transform: scale(1.1);
          border-color: rgba(0, 217, 255, 0.6);
          box-shadow: 0 0 20px rgba(0, 217, 255, 0.3);
        }

        .music-toggle:active {
          transform: scale(0.95);
        }

        .mesh-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image:
            radial-gradient(circle at 20% 50%, rgba(0, 217, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 107, 0, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(46, 204, 113, 0.03) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }

        .particles-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          opacity: 0.5;
          animation: floatParticle linear infinite;
          filter: blur(0.5px);
        }

        @keyframes floatParticle {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.5; }
          25% { transform: translateY(-30px) translateX(10px) scale(1.1); opacity: 0.7; }
          50% { transform: translateY(-15px) translateX(-10px) scale(0.9); opacity: 0.3; }
          75% { transform: translateY(-40px) translateX(5px) scale(1.05); opacity: 0.6; }
          100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.5; }
        }

        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        .orb-1 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(0, 217, 255, 0.15), transparent 70%);
          top: -100px;
          right: -100px;
          animation: orbFloat 20s ease-in-out infinite;
        }

        .orb-2 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(255, 107, 0, 0.12), transparent 70%);
          bottom: -50px;
          left: -50px;
          animation: orbFloat 25s ease-in-out infinite reverse;
        }

        .orb-3 {
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, rgba(46, 204, 113, 0.1), transparent 70%);
          top: 40%;
          left: 50%;
          animation: orbFloat 30s ease-in-out infinite;
        }

        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }

        /* Loading Screen */
        .hub-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: linear-gradient(135deg, #050510 0%, #0a0a20 50%, #050510 100%);
          color: #00d9ff;
        }

        .loading-container {
          position: relative;
          width: 100px;
          height: 100px;
          margin-bottom: 30px;
        }

        .loading-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          background: radial-gradient(circle at 30% 30%, #00ffff, #00d9ff, #0088aa);
          border-radius: 50%;
          animation: loadingPulse 1.5s ease-in-out infinite;
          box-shadow: 0 0 30px rgba(0, 217, 255, 0.6);
        }

        .loading-ring {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 3px solid transparent;
          border-top-color: #00d9ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .ring-2 {
          width: 80%;
          height: 80%;
          top: 10%;
          left: 10%;
          border-top-color: #ff6b00;
          animation-direction: reverse;
          animation-duration: 1.5s;
        }

        @keyframes loadingPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          font-size: 1.2rem;
          letter-spacing: 3px;
          animation: fadeInOut 2s ease-in-out infinite;
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        /* Header */
        .hub-header {
          text-align: center;
          padding: 50px 20px 30px;
          position: relative;
          z-index: 10;
        }

        .logo-container {
          position: relative;
          display: inline-block;
        }

        .logo-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 120%;
          height: 150%;
          background: radial-gradient(ellipse, rgba(0, 217, 255, 0.2) 0%, transparent 70%);
          filter: blur(20px);
          pointer-events: none;
        }

        .hub-title {
          font-size: 3.5rem;
          font-weight: 900;
          margin-bottom: 15px;
          letter-spacing: 6px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
        }

        .title-text {
          background: linear-gradient(135deg, #00d9ff 0%, #ffffff 25%, #ff6b00 50%, #ffffff 75%, #2ecc71 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 5s ease infinite;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .dot-icon {
          font-size: 2rem;
        }

        .dot-cyan {
          color: #00d9ff;
          text-shadow: 0 0 20px rgba(0, 217, 255, 0.8);
          animation: dotPulse 2s ease-in-out infinite;
        }

        .dot-orange {
          color: #ff6b00;
          text-shadow: 0 0 20px rgba(255, 107, 0, 0.8);
          animation: dotPulse 2s ease-in-out infinite 0.5s;
        }

        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.8; }
        }

        .hub-subtitle {
          font-size: 1.1rem;
          color: #8892a0;
          margin-bottom: 10px;
        }

        .player-name {
          background: linear-gradient(90deg, #00d9ff, #2ecc71);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 700;
        }

        .player-name.clickable {
          cursor: pointer;
          transition: all 0.2s;
        }

        .player-name.clickable:hover {
          filter: brightness(1.2);
        }

        .edit-icon {
          cursor: pointer;
          font-size: 0.8rem;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .edit-icon:hover {
          opacity: 1;
        }

        /* Modal Styles */
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
          z-index: 2000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .name-modal {
          background: linear-gradient(145deg, rgba(20, 25, 40, 0.98), rgba(10, 15, 30, 0.98));
          border: 1px solid rgba(0, 217, 255, 0.3);
          border-radius: 20px;
          padding: 30px;
          max-width: 400px;
          width: 90%;
          text-align: center;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .name-modal h2 {
          color: #00d9ff;
          margin-bottom: 10px;
        }

        .modal-desc {
          color: #889;
          font-size: 0.9rem;
          margin-bottom: 20px;
        }

        .name-input {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid rgba(0, 217, 255, 0.3);
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.3);
          color: white;
          font-size: 1.1rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .name-input:focus {
          border-color: #00d9ff;
        }

        .name-input:disabled {
          opacity: 0.5;
        }

        .char-count {
          display: block;
          text-align: right;
          color: #667;
          font-size: 0.8rem;
          margin-top: 5px;
        }

        .error-text {
          color: #e74c3c;
          margin: 10px 0;
          font-size: 0.9rem;
        }

        .success-text {
          color: #2ecc71;
          margin: 10px 0;
          font-size: 0.9rem;
        }

        .modal-buttons {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .save-name-btn {
          flex: 1;
          padding: 12px;
          background: linear-gradient(135deg, #00d9ff, #0099cc);
          border: none;
          border-radius: 10px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .save-name-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 217, 255, 0.3);
        }

        .save-name-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cancel-btn {
          flex: 1;
          padding: 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          color: #aab;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
        }

        .cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .header-decoration {
          width: 200px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00d9ff, #ff6b00, #2ecc71, transparent);
          margin: 20px auto 0;
          border-radius: 2px;
        }

        /* Game Cards Grid */
        .games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 30px;
          max-width: 900px;
          margin: 0 auto;
          padding: 20px 30px;
          position: relative;
          z-index: 10;
        }

        .game-card {
          position: relative;
          border-radius: 24px;
          padding: 35px 25px;
          text-decoration: none;
          color: white;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          overflow: hidden;
        }

        .card-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(145deg, rgba(20, 25, 40, 0.9), rgba(10, 15, 30, 0.95));
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .card-glow {
          position: absolute;
          inset: 0;
          border-radius: 24px;
          opacity: 0;
          transition: opacity 0.4s;
        }

        .slayer-card .card-glow {
          box-shadow: inset 0 0 60px rgba(255, 107, 0, 0.1), 0 0 40px rgba(255, 107, 0, 0.2);
        }

        .clicker-card .card-glow {
          box-shadow: inset 0 0 60px rgba(0, 217, 255, 0.1), 0 0 40px rgba(0, 217, 255, 0.2);
        }

        .card-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transition: left 0.6s;
        }

        .game-card:hover {
          transform: translateY(-12px) scale(1.02);
        }

        .game-card:hover .card-glow {
          opacity: 1;
        }

        .game-card:hover .card-shine {
          left: 100%;
        }

        .slayer-card:hover .card-bg {
          border-color: rgba(255, 107, 0, 0.3);
        }

        .clicker-card:hover .card-bg {
          border-color: rgba(0, 217, 255, 0.3);
        }

        .card-content {
          position: relative;
          z-index: 2;
          text-align: center;
        }

        .game-badge {
          display: inline-block;
          padding: 8px 20px;
          border-radius: 25px;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 3px;
          margin-bottom: 15px;
          text-transform: uppercase;
          position: relative;
          overflow: hidden;
          cursor: default;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .game-badge::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: badgeShine 3s infinite;
        }

        @keyframes badgeShine {
          0% { left: -100%; }
          50%, 100% { left: 100%; }
        }

        .slayer-card .game-badge {
          background: linear-gradient(135deg, #ff6b00, #ff4500, #ff6b00);
          background-size: 200% 200%;
          animation: badgeGradient 3s ease infinite, badgePulse 2s ease-in-out infinite;
          color: #fff;
          border: 2px solid rgba(255, 150, 50, 0.6);
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          box-shadow: 0 4px 20px rgba(255, 107, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .clicker-card .game-badge {
          background: linear-gradient(135deg, #00d9ff, #0099ff, #00d9ff);
          background-size: 200% 200%;
          animation: badgeGradient 3s ease infinite, badgePulse 2s ease-in-out infinite;
          color: #fff;
          border: 2px solid rgba(100, 200, 255, 0.6);
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          box-shadow: 0 4px 20px rgba(0, 217, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        @keyframes badgeGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .game-card:hover .game-badge {
          transform: scale(1.1) translateY(-2px);
          box-shadow: 0 6px 25px rgba(255, 107, 0, 0.5);
        }

        .clicker-card:hover .game-badge {
          box-shadow: 0 6px 25px rgba(0, 217, 255, 0.5);
        }

        .game-icon {
          position: relative;
          width: 90px;
          height: 90px;
          margin: 0 auto 20px;
        }

        .icon-bg {
          position: absolute;
          inset: 0;
          border-radius: 50%;
        }

        .slayer-card .icon-bg {
          background: radial-gradient(circle at 30% 30%, #ff8844 0%, #ff6b00 50%, #cc4400 100%);
          box-shadow: 0 0 40px rgba(255, 107, 0, 0.4);
        }

        .clicker-card .icon-bg {
          background: radial-gradient(circle at 30% 30%, #00ffff 0%, #00d9ff 50%, #0088cc 100%);
          box-shadow: 0 0 40px rgba(0, 217, 255, 0.4);
        }

        .icon-main {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 3.5rem;
          color: white;
          text-shadow: 0 0 20px rgba(255,255,255,0.5);
        }

        .icon-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.8rem;
          color: white;
          font-weight: bold;
        }

        .click-plus {
          font-size: 1.2rem;
          animation: clickFloat 1s ease-out infinite;
          color: #2ecc71;
        }

        @keyframes clickFloat {
          0% { transform: translate(-50%, -50%) translateY(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) translateY(-15px); opacity: 0; }
        }

        .icon-ring {
          position: absolute;
          inset: -5px;
          border: 2px solid rgba(0, 217, 255, 0.3);
          border-radius: 50%;
          animation: ringPulse 2s ease-out infinite;
        }

        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .icon-particles span {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #ff6b00;
          border-radius: 50%;
          animation: particleFly 1.5s ease-out infinite;
        }

        .icon-particles span:nth-child(1) { top: 10%; left: 50%; animation-delay: 0s; }
        .icon-particles span:nth-child(2) { top: 30%; right: 10%; animation-delay: 0.5s; }
        .icon-particles span:nth-child(3) { bottom: 20%; left: 15%; animation-delay: 1s; }

        @keyframes particleFly {
          0% { transform: scale(1) translate(0, 0); opacity: 1; }
          100% { transform: scale(0) translate(20px, -20px); opacity: 0; }
        }

        .game-title {
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 6px;
          letter-spacing: 3px;
        }

        .slayer-card .game-title { color: #ff6b00; }
        .clicker-card .game-title { color: #00d9ff; }

        .game-tagline {
          font-size: 0.95rem;
          color: #667;
          margin-bottom: 20px;
        }

        .game-features {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 25px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.03);
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 0.8rem;
          color: #99a;
        }

        .feature-icon {
          font-size: 0.9rem;
        }

        .play-button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 35px;
          border-radius: 30px;
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 2px;
          transition: all 0.3s;
        }

        .slayer-card .play-button {
          background: linear-gradient(135deg, #ff6b00, #ff4400);
          color: white;
          box-shadow: 0 4px 20px rgba(255, 107, 0, 0.3);
        }

        .clicker-card .play-button {
          background: linear-gradient(135deg, #00d9ff, #0099cc);
          color: white;
          box-shadow: 0 4px 20px rgba(0, 217, 255, 0.3);
        }

        .play-button.active {
          transform: scale(1.05);
        }

        .slayer-card .play-button.active {
          box-shadow: 0 6px 30px rgba(255, 107, 0, 0.5);
        }

        .clicker-card .play-button.active {
          box-shadow: 0 6px 30px rgba(0, 217, 255, 0.5);
        }

        .btn-arrow {
          transition: transform 0.3s;
        }

        .play-button.active .btn-arrow {
          transform: translateX(5px);
        }

        /* Synergy Section */
        .synergy-section {
          max-width: 700px;
          margin: 40px auto;
          padding: 0 20px;
          position: relative;
          z-index: 10;
        }

        .synergy-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 200%;
          background: radial-gradient(ellipse, rgba(243, 156, 18, 0.08) 0%, transparent 60%);
          pointer-events: none;
        }

        .synergy-content {
          position: relative;
          background: linear-gradient(145deg, rgba(20, 25, 40, 0.8), rgba(15, 20, 35, 0.9));
          border-radius: 20px;
          padding: 30px;
          border: 1px solid rgba(243, 156, 18, 0.15);
        }

        .synergy-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 15px;
        }

        .synergy-icon {
          font-size: 1.5rem;
        }

        .synergy-title {
          font-size: 1.3rem;
          font-weight: 700;
          letter-spacing: 3px;
          background: linear-gradient(90deg, #f39c12, #f1c40f);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .synergy-desc {
          color: #889;
          font-size: 0.9rem;
          line-height: 1.6;
          text-align: center;
          margin-bottom: 25px;
        }

        .highlight-orange { color: #ff6b00; font-weight: 600; }
        .highlight-cyan { color: #00d9ff; font-weight: 600; }

        .synergy-stats {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
        }

        .synergy-stat {
          text-align: center;
          padding: 15px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
        }

        .stat-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 10px;
          font-size: 1rem;
        }

        .slayer-icon-mini {
          background: linear-gradient(135deg, rgba(255, 107, 0, 0.2), rgba(255, 50, 0, 0.2));
          color: #ff6b00;
          border: 1px solid rgba(255, 107, 0, 0.3);
        }

        .clicker-icon-mini {
          background: linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(0, 150, 255, 0.2));
          color: #00d9ff;
          border: 1px solid rgba(0, 217, 255, 0.3);
        }

        .bonus-icon {
          background: linear-gradient(135deg, rgba(46, 204, 113, 0.2), rgba(39, 174, 96, 0.2));
          color: #2ecc71;
          border: 1px solid rgba(46, 204, 113, 0.3);
        }

        .stat-label {
          display: block;
          font-size: 0.75rem;
          color: #667;
          margin-bottom: 5px;
        }

        .stat-value {
          font-size: 1.6rem;
          font-weight: 800;
        }

        .stat-value.slayer-value { color: #ff6b00; }
        .stat-value.clicker-value { color: #00d9ff; }
        .stat-value.bonus-value { color: #2ecc71; }

        .stat-bar {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          margin-top: 8px;
          overflow: hidden;
        }

        .stat-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease;
        }

        .slayer-fill { background: linear-gradient(90deg, #ff6b00, #ff4400); }
        .clicker-fill { background: linear-gradient(90deg, #00d9ff, #0099cc); }

        .total-stat {
          background: linear-gradient(135deg, rgba(46, 204, 113, 0.1), rgba(39, 174, 96, 0.05));
          border: 1px solid rgba(46, 204, 113, 0.2);
        }

        .synergy-achievement {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
          padding: 12px 24px;
          background: linear-gradient(135deg, rgba(243, 156, 18, 0.15), rgba(241, 196, 15, 0.1));
          border: 1px solid rgba(243, 156, 18, 0.3);
          border-radius: 30px;
          color: #f1c40f;
          font-weight: 600;
          font-size: 0.9rem;
          animation: achievementGlow 2s ease-in-out infinite;
        }

        @keyframes achievementGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(243, 156, 18, 0.2); }
          50% { box-shadow: 0 0 25px rgba(243, 156, 18, 0.4); }
        }

        .achievement-icon {
          font-size: 1.1rem;
        }

        /* Quick Links */
        .quick-links {
          display: flex;
          justify-content: center;
          gap: 20px;
          padding: 20px;
          position: relative;
          z-index: 10;
          flex-wrap: wrap;
        }

        /* Use :global() for Link components */
        .quick-links :global(.quick-link) {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 32px;
          border-radius: 20px;
          color: #fff !important;
          text-decoration: none !important;
          font-weight: 700;
          font-size: 0.95rem;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          border: none;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .quick-links :global(.quick-link)::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
          animation: buttonShine 4s infinite;
        }

        @keyframes buttonShine {
          0% { left: -100%; }
          50%, 100% { left: 100%; }
        }

        .quick-links :global(.quick-link):hover {
          transform: translateY(-4px) scale(1.02);
        }

        .quick-links :global(.quick-link):active {
          transform: translateY(-2px) scale(0.98);
        }

        /* Profile Button - Cyan/Blue Theme */
        .quick-links :global(.profile-link) {
          background: linear-gradient(135deg, #00d9ff, #0099ff, #00d9ff) !important;
          background-size: 200% 200% !important;
          animation: btnGradient 4s ease infinite;
          border: 2px solid rgba(100, 220, 255, 0.5) !important;
          box-shadow:
            0 4px 15px rgba(0, 217, 255, 0.4),
            0 0 30px rgba(0, 217, 255, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .quick-links :global(.profile-link):hover {
          box-shadow:
            0 8px 30px rgba(0, 217, 255, 0.5),
            0 0 50px rgba(0, 217, 255, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          border-color: rgba(150, 240, 255, 0.7) !important;
        }

        /* News Button - Green Theme */
        .quick-links :global(.news-link) {
          background: linear-gradient(135deg, #2ecc71, #27ae60, #2ecc71) !important;
          background-size: 200% 200% !important;
          animation: btnGradient 4s ease infinite;
          animation-delay: 0.5s;
          border: 2px solid rgba(100, 220, 150, 0.5) !important;
          box-shadow:
            0 4px 15px rgba(46, 204, 113, 0.4),
            0 0 30px rgba(46, 204, 113, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .quick-links :global(.news-link):hover {
          box-shadow:
            0 8px 30px rgba(46, 204, 113, 0.5),
            0 0 50px rgba(46, 204, 113, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          border-color: rgba(150, 255, 180, 0.7) !important;
        }

        /* Reset Button - Red Theme */
        .quick-links :global(.reset-link) {
          background: linear-gradient(135deg, #e74c3c, #c0392b, #e74c3c) !important;
          background-size: 200% 200% !important;
          animation: btnGradient 4s ease infinite;
          animation-delay: 1s;
          border: 2px solid rgba(255, 120, 100, 0.5) !important;
          box-shadow:
            0 4px 15px rgba(231, 76, 60, 0.4),
            0 0 30px rgba(231, 76, 60, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .quick-links :global(.reset-link):hover {
          box-shadow:
            0 8px 30px rgba(231, 76, 60, 0.5),
            0 0 50px rgba(231, 76, 60, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 150, 140, 0.7) !important;
        }

        @keyframes btnGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .quick-links :global(.link-icon) {
          font-size: 1.3rem;
          filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3));
        }

        /* Reset Modal */
        .reset-modal {
          max-width: 450px;
        }

        .reset-warning {
          color: #e74c3c;
          font-weight: 600;
          margin-bottom: 15px;
        }

        .reset-list {
          list-style: none;
          padding: 0;
          margin: 0 0 20px 0;
          background: rgba(231, 76, 60, 0.1);
          border: 1px solid rgba(231, 76, 60, 0.2);
          border-radius: 10px;
          padding: 15px 20px;
        }

        .reset-list li {
          color: #ccc;
          padding: 5px 0;
          font-size: 0.9rem;
        }

        .reset-list li::before {
          content: '✗ ';
          color: #e74c3c;
        }

        .reset-confirm-text {
          color: #f39c12;
          font-size: 0.95rem;
          margin-bottom: 10px;
        }

        .reset-confirm-text strong {
          color: #e74c3c;
          font-size: 1.1rem;
        }

        .reset-input {
          width: 100%;
          padding: 12px 15px;
          background: rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(231, 76, 60, 0.3);
          border-radius: 10px;
          color: #fff;
          font-size: 1.1rem;
          font-weight: 700;
          text-align: center;
          letter-spacing: 3px;
          margin-bottom: 15px;
          transition: all 0.3s;
        }

        .reset-input:focus {
          outline: none;
          border-color: #e74c3c;
          box-shadow: 0 0 15px rgba(231, 76, 60, 0.3);
        }

        .reset-input::placeholder {
          color: #666;
          letter-spacing: 1px;
          font-weight: 400;
        }

        .reset-confirm-btn {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
          border: none;
          padding: 12px 25px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 1rem;
        }

        .reset-confirm-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #c0392b, #a93226);
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(231, 76, 60, 0.4);
        }

        .reset-confirm-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* Footer */
        .hub-footer {
          padding: 30px;
          position: relative;
          z-index: 10;
        }

        .footer-content {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
        }

        .footer-links {
          display: flex;
          gap: 15px;
        }

        .footer-link {
          color: #556;
          text-decoration: none;
          font-size: 0.85rem;
          transition: color 0.2s;
        }
        .footer-link:hover {
          color: #00d9ff;
        }

        .version {
          font-size: 0.8rem;
          color: #445;
        }

        .logout-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #778;
          padding: 10px 25px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 0.9rem;
        }

        .logout-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          color: #aab;
        }

        /* Leaderboards Section */
        .leaderboards-section {
          max-width: 700px;
          margin: 30px auto 40px;
          padding: 0 20px;
          position: relative;
          z-index: 10;
        }

        .leaderboards-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .leaderboards-title {
          font-size: 1.3rem;
          font-weight: 700;
          letter-spacing: 3px;
          color: #f39c12;
          margin-bottom: 15px;
        }

        .leaderboard-tabs {
          display: flex;
          justify-content: center;
          gap: 10px;
        }

        .lb-tab {
          padding: 10px 25px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          color: #778;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .lb-tab:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .lb-tab.active {
          color: white;
        }

        .lb-tab.slayer-active {
          background: linear-gradient(135deg, rgba(255, 107, 0, 0.2), rgba(255, 50, 0, 0.2));
          border-color: rgba(255, 107, 0, 0.4);
          color: #ff6b00;
        }

        .lb-tab.clicker-active {
          background: linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(0, 150, 255, 0.2));
          border-color: rgba(0, 217, 255, 0.4);
          color: #00d9ff;
        }

        .leaderboard-content {
          background: linear-gradient(145deg, rgba(20, 25, 40, 0.8), rgba(15, 20, 35, 0.9));
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .leaderboard-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .lb-entry {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 15px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
          transition: all 0.2s;
        }

        .lb-entry:hover {
          background: rgba(0, 0, 0, 0.3);
        }

        .lb-entry.top-1 {
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 200, 0, 0.1));
          border: 1px solid rgba(255, 215, 0, 0.2);
        }

        .lb-entry.top-2 {
          background: linear-gradient(135deg, rgba(192, 192, 192, 0.15), rgba(169, 169, 169, 0.1));
          border: 1px solid rgba(192, 192, 192, 0.2);
        }

        .lb-entry.top-3 {
          background: linear-gradient(135deg, rgba(205, 127, 50, 0.15), rgba(180, 100, 50, 0.1));
          border: 1px solid rgba(205, 127, 50, 0.2);
        }

        .lb-rank {
          font-size: 1.1rem;
          width: 35px;
          text-align: center;
        }

        .lb-name {
          flex: 1;
          font-weight: 600;
          color: #ddd;
        }

        .lb-stats {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .slayer-list .lb-floor {
          color: #ff6b00;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .slayer-list .lb-score {
          color: #888;
          font-size: 0.8rem;
        }

        .clicker-list .lb-dots {
          color: #00d9ff;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .clicker-list .lb-prestiges {
          color: #f39c12;
          font-size: 0.8rem;
        }

        .lb-victory {
          font-size: 1rem;
          margin-left: 5px;
        }

        .lb-empty {
          text-align: center;
          padding: 40px 20px;
          color: #556;
        }

        .lb-empty span {
          display: block;
        }

        .lb-hint {
          font-size: 0.85rem;
          color: #445;
          margin-top: 8px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hub-title { font-size: 2.2rem; }
          .title-text { letter-spacing: 3px; }
          .games-grid { padding: 15px; gap: 20px; }
          .game-card { padding: 25px 20px; }
          .game-icon { width: 70px; height: 70px; }
          .icon-main { font-size: 2.5rem; }
          .game-features { grid-template-columns: 1fr; }
          .synergy-stats { grid-template-columns: 1fr; gap: 15px; }
          .orb { display: none; }
          .leaderboard-tabs { flex-direction: column; gap: 8px; }
          .lb-tab { width: 100%; }
        }
      `}</style>
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/context/AuthContext'
import { clickerSyncService, ClickerGameState } from '../../lib/supabase'
import { crossGameSynergy } from '../../lib/game/CrossGameSynergy'
import Link from 'next/link'

// ============= DUBSTEP MUSIC SYSTEM =============
class DubstepMusicPlayer {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private isPlaying = false
  private isMuted = false
  private loopInterval: ReturnType<typeof setInterval> | null = null
  private wobbleOscillators: OscillatorNode[] = []
  private volume = 0.15

  initialize() {
    if (this.audioContext) return
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    this.masterGain = this.audioContext.createGain()
    this.masterGain.gain.value = this.volume
    this.masterGain.connect(this.audioContext.destination)
  }

  private createWobbleBass(startFreq: number, duration: number) {
    if (!this.audioContext || !this.masterGain || this.isMuted) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()

    // Sawtooth for that gritty dubstep sound
    osc.type = 'sawtooth'
    osc.frequency.value = startFreq

    // Low-pass filter for wobble
    filter.type = 'lowpass'
    filter.frequency.value = 200
    filter.Q.value = 15

    // Wobble the filter (the signature dubstep sound)
    const now = this.audioContext.currentTime
    const wobbleSpeed = 4 // Hz
    for (let i = 0; i < duration * wobbleSpeed; i++) {
      const time = now + i / wobbleSpeed
      filter.frequency.setValueAtTime(150 + Math.sin(i * Math.PI) * 400, time)
    }

    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + duration)
    this.wobbleOscillators.push(osc)
    osc.onended = () => {
      this.wobbleOscillators = this.wobbleOscillators.filter(o => o !== osc)
    }
  }

  private createKick() {
    if (!this.audioContext || !this.masterGain || this.isMuted) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sine'
    const now = this.audioContext.currentTime
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1)

    gain.gain.setValueAtTime(0.5, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 0.3)
  }

  private createSnare() {
    if (!this.audioContext || !this.masterGain || this.isMuted) return

    // White noise for snare
    const bufferSize = this.audioContext.sampleRate * 0.1
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 1000

    const gain = this.audioContext.createGain()
    const now = this.audioContext.currentTime
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    noise.start(now)
  }

  private createHiHat() {
    if (!this.audioContext || !this.masterGain || this.isMuted) return

    const bufferSize = this.audioContext.sampleRate * 0.05
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 5000

    const gain = this.audioContext.createGain()
    const now = this.audioContext.currentTime
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    noise.start(now)
  }

  private playBeat() {
    // Classic dubstep pattern: kick-snare with wobble bass
    const bassNotes = [55, 55, 65, 55] // Low bass notes (A1, A1, C2, A1)

    // Kick on 1
    this.createKick()
    this.createWobbleBass(bassNotes[Math.floor(Math.random() * bassNotes.length)], 0.5)

    // Hi-hat on off-beats
    setTimeout(() => this.createHiHat(), 125)
    setTimeout(() => this.createHiHat(), 375)

    // Snare on 2
    setTimeout(() => {
      this.createSnare()
      this.createWobbleBass(bassNotes[Math.floor(Math.random() * bassNotes.length)], 0.5)
    }, 250)

    // More hi-hats
    setTimeout(() => this.createHiHat(), 500 + 125)
    setTimeout(() => this.createHiHat(), 500 + 375)
  }

  play() {
    if (this.isPlaying) return
    this.initialize()

    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume()
    }

    this.isPlaying = true
    this.playBeat()

    // Loop the beat every 1 second (120 BPM half-time feel)
    this.loopInterval = setInterval(() => {
      if (!this.isMuted) this.playBeat()
    }, 1000)
  }

  stop() {
    this.isPlaying = false
    if (this.loopInterval) {
      clearInterval(this.loopInterval)
      this.loopInterval = null
    }
    this.wobbleOscillators.forEach(osc => {
      try { osc.stop() } catch {}
    })
    this.wobbleOscillators = []
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume
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
  }
}

const dubstepPlayer = new DubstepMusicPlayer()

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
  prestigeUpgrades: PrestigeUpgrade[]
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
  { id: 'wizard', name: 'Dot Wizard Tower', description: 'Magical dot conjuring', baseCost: 8000000, baseDps: 5500, owned: 0, icon: '🧙', color: '#8e44ad', unlockAt: 2000000 },
  { id: 'portal', name: 'Dot Portal', description: 'Imports dots from other dimensions', baseCost: 20000000, baseDps: 7800, owned: 0, icon: '🌀', color: '#1abc9c', unlockAt: 5000000 },
  { id: 'shipyard', name: 'Dot Shipyard', description: 'Builds ships to harvest space dots', baseCost: 100000000, baseDps: 25000, owned: 0, icon: '🚀', color: '#34495e', unlockAt: 20000000 },
  { id: 'singularity', name: 'Dot Singularity', description: 'Creates dots from nothing', baseCost: 330000000, baseDps: 44000, owned: 0, icon: '🕳️', color: '#2c3e50', unlockAt: 50000000 },
  { id: 'alchemy', name: 'Alchemy Chamber', description: 'Transmutes matter into dots', baseCost: 1500000000, baseDps: 150000, owned: 0, icon: '⚗️', color: '#d35400', unlockAt: 200000000 },
  { id: 'quantum', name: 'Quantum Generator', description: 'Infinite dot potential', baseCost: 5100000000, baseDps: 260000, owned: 0, icon: '⚛️', color: '#00d9ff', unlockAt: 500000000 },
  { id: 'ai', name: 'Dot AI Network', description: 'Self-improving dot production', baseCost: 25000000000, baseDps: 900000, owned: 0, icon: '🤖', color: '#16a085', unlockAt: 2000000000 },
  { id: 'timemachine', name: 'Time Machine', description: 'Harvests dots from the future', baseCost: 75000000000, baseDps: 1600000, owned: 0, icon: '⏰', color: '#e056fd', unlockAt: 5000000000 },
  { id: 'dyson', name: 'Dyson Sphere', description: 'Harnesses star energy for dots', baseCost: 400000000000, baseDps: 6000000, owned: 0, icon: '☀️', color: '#f1c40f', unlockAt: 25000000000 },
  { id: 'antimatter', name: 'Antimatter Condenser', description: 'Condenses antimatter into dots', baseCost: 1000000000000, baseDps: 10000000, owned: 0, icon: '💫', color: '#ff6b6b', unlockAt: 50000000000 },
  { id: 'dimension', name: 'Dimension Ripper', description: 'Tears holes in reality for dots', baseCost: 5000000000000, baseDps: 40000000, owned: 0, icon: '🌌', color: '#5b2c6f', unlockAt: 200000000000 },
  { id: 'prism', name: 'Prism', description: 'Converts light into dots', baseCost: 14000000000000, baseDps: 65000000, owned: 0, icon: '🔮', color: '#a29bfe', unlockAt: 500000000000 },
  { id: 'universe', name: 'Universe Factory', description: 'Creates pocket universes of dots', baseCost: 100000000000000, baseDps: 300000000, owned: 0, icon: '🌐', color: '#1e3799', unlockAt: 5000000000000 },
  { id: 'multiverse', name: 'Multiverse Engine', description: 'Infinite realities = infinite dots', baseCost: 1000000000000000, baseDps: 2000000000, owned: 0, icon: '♾️', color: '#6c3483', unlockAt: 50000000000000 },
  { id: 'godforge', name: 'God Forge', description: 'Divine dot creation', baseCost: 10000000000000000, baseDps: 15000000000, owned: 0, icon: '⚡', color: '#ffd700', unlockAt: 500000000000000 },
]

const INITIAL_UPGRADES: Upgrade[] = [
  // Click upgrades - MANY MORE!
  { id: 'click1', name: 'Reinforced Finger', description: '+1 dot per click', cost: 100, multiplier: 1, type: 'click', purchased: false, icon: '👆', unlockAt: 0 },
  { id: 'click2', name: 'Iron Finger', description: 'Double click power', cost: 500, multiplier: 2, type: 'click', purchased: false, icon: '🦾', unlockAt: 100 },
  { id: 'click3', name: 'Golden Touch', description: 'Triple click power', cost: 5000, multiplier: 3, type: 'click', purchased: false, icon: '✨', unlockAt: 1000 },
  { id: 'click4', name: 'Diamond Hands', description: '5x click power', cost: 50000, multiplier: 5, type: 'click', purchased: false, icon: '💎', unlockAt: 10000 },
  { id: 'click5', name: 'Quantum Fingers', description: '10x click power', cost: 500000, multiplier: 10, type: 'click', purchased: false, icon: '🌌', unlockAt: 100000 },
  { id: 'click6', name: 'Cosmic Touch', description: '25x click power', cost: 5000000, multiplier: 25, type: 'click', purchased: false, icon: '🪐', unlockAt: 1000000 },
  { id: 'click7', name: 'Stellar Poke', description: '50x click power', cost: 50000000, multiplier: 50, type: 'click', purchased: false, icon: '⭐', unlockAt: 10000000 },
  { id: 'click8', name: 'Galactic Tap', description: '100x click power', cost: 500000000, multiplier: 100, type: 'click', purchased: false, icon: '🌀', unlockAt: 100000000 },
  { id: 'click9', name: 'Universal Jab', description: '250x click power', cost: 5000000000, multiplier: 250, type: 'click', purchased: false, icon: '🔮', unlockAt: 1000000000 },
  { id: 'click10', name: 'Omnipotent Click', description: '500x click power', cost: 50000000000, multiplier: 500, type: 'click', purchased: false, icon: '👑', unlockAt: 10000000000 },

  // Crit upgrades - MORE!
  { id: 'crit1', name: 'Lucky Finger', description: '+5% crit chance', cost: 1000, multiplier: 0.05, type: 'crit', purchased: false, icon: '🍀', unlockAt: 200 },
  { id: 'crit2', name: 'Super Lucky', description: '+10% crit chance', cost: 10000, multiplier: 0.10, type: 'crit', purchased: false, icon: '🎰', unlockAt: 2000 },
  { id: 'crit3', name: 'Critical Master', description: '+15% crit chance', cost: 100000, multiplier: 0.15, type: 'crit', purchased: false, icon: '💥', unlockAt: 20000 },
  { id: 'crit4', name: 'Crit Lord', description: '+20% crit chance', cost: 1000000, multiplier: 0.20, type: 'crit', purchased: false, icon: '⚡', unlockAt: 200000 },
  { id: 'crit5', name: 'Crit Emperor', description: '+15% crit chance', cost: 10000000, multiplier: 0.15, type: 'crit', purchased: false, icon: '🎯', unlockAt: 2000000 },
  { id: 'crit6', name: 'Crit God', description: '+10% crit chance', cost: 100000000, multiplier: 0.10, type: 'crit', purchased: false, icon: '🌟', unlockAt: 20000000 },

  // Golden dot upgrades - MORE!
  { id: 'golden1', name: 'Golden Vision', description: '+2% golden dot chance', cost: 5000, multiplier: 0.02, type: 'golden', purchased: false, icon: '👁️', unlockAt: 1000 },
  { id: 'golden2', name: 'Midas Touch', description: '+5% golden dot chance', cost: 50000, multiplier: 0.05, type: 'golden', purchased: false, icon: '🏆', unlockAt: 10000 },
  { id: 'golden3', name: 'Golden Aura', description: '+10% golden dot chance', cost: 500000, multiplier: 0.10, type: 'golden', purchased: false, icon: '👑', unlockAt: 100000 },
  { id: 'golden4', name: 'Gold Magnet', description: '+8% golden dot chance', cost: 5000000, multiplier: 0.08, type: 'golden', purchased: false, icon: '🧲', unlockAt: 1000000 },
  { id: 'golden5', name: 'Golden Shower', description: '+12% golden dot chance', cost: 50000000, multiplier: 0.12, type: 'golden', purchased: false, icon: '🌧️', unlockAt: 10000000 },

  // Combo upgrades - MORE!
  { id: 'combo1', name: 'Combo Starter', description: '+50% combo bonus', cost: 2000, multiplier: 0.5, type: 'combo', purchased: false, icon: '🔥', unlockAt: 500 },
  { id: 'combo2', name: 'Combo Master', description: '+100% combo bonus', cost: 20000, multiplier: 1.0, type: 'combo', purchased: false, icon: '💪', unlockAt: 5000 },
  { id: 'combo3', name: 'Combo God', description: '+200% combo bonus', cost: 200000, multiplier: 2.0, type: 'combo', purchased: false, icon: '🌟', unlockAt: 50000 },
  { id: 'combo4', name: 'Combo Titan', description: '+300% combo bonus', cost: 2000000, multiplier: 3.0, type: 'combo', purchased: false, icon: '💫', unlockAt: 500000 },
  { id: 'combo5', name: 'Combo Overlord', description: '+500% combo bonus', cost: 20000000, multiplier: 5.0, type: 'combo', purchased: false, icon: '👊', unlockAt: 5000000 },

  // Offline upgrades - MORE!
  { id: 'offline1', name: 'Dream Dots', description: '+25% offline earnings', cost: 10000, multiplier: 0.25, type: 'offline', purchased: false, icon: '😴', unlockAt: 5000 },
  { id: 'offline2', name: 'Sleep Worker', description: '+50% offline earnings', cost: 100000, multiplier: 0.50, type: 'offline', purchased: false, icon: '🛏️', unlockAt: 50000 },
  { id: 'offline3', name: 'Passive Master', description: '+100% offline earnings', cost: 1000000, multiplier: 1.0, type: 'offline', purchased: false, icon: '🧘', unlockAt: 500000 },
  { id: 'offline4', name: 'Hibernate Pro', description: '+75% offline earnings', cost: 10000000, multiplier: 0.75, type: 'offline', purchased: false, icon: '🐻', unlockAt: 5000000 },
  { id: 'offline5', name: 'Eternal Sleep', description: '+100% offline earnings', cost: 100000000, multiplier: 1.0, type: 'offline', purchased: false, icon: '💤', unlockAt: 50000000 },

  // Building upgrades - Cursors (3 upgrades)
  { id: 'cursor_up1', name: 'Faster Cursors', description: 'Cursors 2x effective', cost: 200, multiplier: 2, type: 'building', targetBuilding: 'cursor', purchased: false, icon: '⚡', unlockAt: 50 },
  { id: 'cursor_up2', name: 'Ambidextrous', description: 'Cursors 2x effective', cost: 5000, multiplier: 2, type: 'building', targetBuilding: 'cursor', purchased: false, icon: '🤲', unlockAt: 1000 },
  { id: 'cursor_up3', name: 'Thousand Hands', description: 'Cursors 2x effective', cost: 500000, multiplier: 2, type: 'building', targetBuilding: 'cursor', purchased: false, icon: '🙌', unlockAt: 100000 },

  // Building upgrades - Farms (3 upgrades)
  { id: 'farm_up1', name: 'Fertilizer', description: 'Farms 2x effective', cost: 1000, multiplier: 2, type: 'building', targetBuilding: 'farm', purchased: false, icon: '💧', unlockAt: 500 },
  { id: 'farm_up2', name: 'Irrigation', description: 'Farms 2x effective', cost: 50000, multiplier: 2, type: 'building', targetBuilding: 'farm', purchased: false, icon: '🚿', unlockAt: 10000 },
  { id: 'farm_up3', name: 'GMO Dots', description: 'Farms 2x effective', cost: 5000000, multiplier: 2, type: 'building', targetBuilding: 'farm', purchased: false, icon: '🧬', unlockAt: 1000000 },

  // Building upgrades - Factories (3 upgrades)
  { id: 'factory_up1', name: 'Automation', description: 'Factories 2x effective', cost: 10000, multiplier: 2, type: 'building', targetBuilding: 'factory', purchased: false, icon: '🤖', unlockAt: 5000 },
  { id: 'factory_up2', name: 'Assembly Line', description: 'Factories 2x effective', cost: 500000, multiplier: 2, type: 'building', targetBuilding: 'factory', purchased: false, icon: '🔧', unlockAt: 100000 },
  { id: 'factory_up3', name: 'Nano Factories', description: 'Factories 2x effective', cost: 50000000, multiplier: 2, type: 'building', targetBuilding: 'factory', purchased: false, icon: '🔬', unlockAt: 10000000 },

  // Building upgrades - Mines (3 upgrades)
  { id: 'mine_up1', name: 'Deeper Shafts', description: 'Mines 2x effective', cost: 100000, multiplier: 2, type: 'building', targetBuilding: 'mine', purchased: false, icon: '🕳️', unlockAt: 50000 },
  { id: 'mine_up2', name: 'Diamond Drills', description: 'Mines 2x effective', cost: 10000000, multiplier: 2, type: 'building', targetBuilding: 'mine', purchased: false, icon: '💎', unlockAt: 5000000 },
  { id: 'mine_up3', name: 'Core Excavation', description: 'Mines 2x effective', cost: 1000000000, multiplier: 2, type: 'building', targetBuilding: 'mine', purchased: false, icon: '🌋', unlockAt: 500000000 },

  // Building upgrades - Labs (3 upgrades)
  { id: 'lab_up1', name: 'Better Beakers', description: 'Labs 2x effective', cost: 1000000, multiplier: 2, type: 'building', targetBuilding: 'lab', purchased: false, icon: '🧪', unlockAt: 500000 },
  { id: 'lab_up2', name: 'Gene Splicing', description: 'Labs 2x effective', cost: 100000000, multiplier: 2, type: 'building', targetBuilding: 'lab', purchased: false, icon: '🧬', unlockAt: 50000000 },
  { id: 'lab_up3', name: 'Quantum Research', description: 'Labs 2x effective', cost: 10000000000, multiplier: 2, type: 'building', targetBuilding: 'lab', purchased: false, icon: '⚛️', unlockAt: 5000000000 },

  // Building upgrades - Temples (3 upgrades)
  { id: 'temple_up1', name: 'Holy Dots', description: 'Temples 2x effective', cost: 10000000, multiplier: 2, type: 'building', targetBuilding: 'temple', purchased: false, icon: '✝️', unlockAt: 5000000 },
  { id: 'temple_up2', name: 'Divine Prayer', description: 'Temples 2x effective', cost: 1000000000, multiplier: 2, type: 'building', targetBuilding: 'temple', purchased: false, icon: '🙏', unlockAt: 500000000 },
  { id: 'temple_up3', name: 'Celestial Blessing', description: 'Temples 2x effective', cost: 100000000000, multiplier: 2, type: 'building', targetBuilding: 'temple', purchased: false, icon: '👼', unlockAt: 50000000000 },

  // Building upgrades - Wizard Tower (3 upgrades)
  { id: 'wizard_up1', name: 'Arcane Focus', description: 'Wizard Towers 2x effective', cost: 50000000, multiplier: 2, type: 'building', targetBuilding: 'wizard', purchased: false, icon: '🔮', unlockAt: 10000000 },
  { id: 'wizard_up2', name: 'Spell Mastery', description: 'Wizard Towers 2x effective', cost: 5000000000, multiplier: 2, type: 'building', targetBuilding: 'wizard', purchased: false, icon: '📜', unlockAt: 1000000000 },
  { id: 'wizard_up3', name: 'Reality Warp', description: 'Wizard Towers 2x effective', cost: 500000000000, multiplier: 2, type: 'building', targetBuilding: 'wizard', purchased: false, icon: '🌀', unlockAt: 100000000000 },

  // Building upgrades - Portals (3 upgrades)
  { id: 'portal_up1', name: 'Wider Gates', description: 'Portals 2x effective', cost: 100000000, multiplier: 2, type: 'building', targetBuilding: 'portal', purchased: false, icon: '🚪', unlockAt: 25000000 },
  { id: 'portal_up2', name: 'Dimensional Rift', description: 'Portals 2x effective', cost: 10000000000, multiplier: 2, type: 'building', targetBuilding: 'portal', purchased: false, icon: '🌌', unlockAt: 2500000000 },
  { id: 'portal_up3', name: 'Multiverse Access', description: 'Portals 2x effective', cost: 1000000000000, multiplier: 2, type: 'building', targetBuilding: 'portal', purchased: false, icon: '♾️', unlockAt: 250000000000 },

  // Building upgrades - Shipyard (3 upgrades)
  { id: 'shipyard_up1', name: 'Faster Ships', description: 'Shipyards 2x effective', cost: 500000000, multiplier: 2, type: 'building', targetBuilding: 'shipyard', purchased: false, icon: '🛸', unlockAt: 100000000 },
  { id: 'shipyard_up2', name: 'Warp Drive', description: 'Shipyards 2x effective', cost: 50000000000, multiplier: 2, type: 'building', targetBuilding: 'shipyard', purchased: false, icon: '💫', unlockAt: 10000000000 },
  { id: 'shipyard_up3', name: 'Galactic Fleet', description: 'Shipyards 2x effective', cost: 5000000000000, multiplier: 2, type: 'building', targetBuilding: 'shipyard', purchased: false, icon: '🌟', unlockAt: 1000000000000 },

  // Building upgrades - Singularity (2 upgrades)
  { id: 'singularity_up1', name: 'Denser Core', description: 'Singularities 2x effective', cost: 2000000000, multiplier: 2, type: 'building', targetBuilding: 'singularity', purchased: false, icon: '🌑', unlockAt: 500000000 },
  { id: 'singularity_up2', name: 'Hawking Radiation', description: 'Singularities 2x effective', cost: 200000000000, multiplier: 2, type: 'building', targetBuilding: 'singularity', purchased: false, icon: '☢️', unlockAt: 50000000000 },

  // Building upgrades - Quantum (2 upgrades)
  { id: 'quantum_up1', name: 'Superposition', description: 'Quantum Generators 2x effective', cost: 30000000000, multiplier: 2, type: 'building', targetBuilding: 'quantum', purchased: false, icon: '🔀', unlockAt: 5000000000 },
  { id: 'quantum_up2', name: 'Entanglement', description: 'Quantum Generators 2x effective', cost: 3000000000000, multiplier: 2, type: 'building', targetBuilding: 'quantum', purchased: false, icon: '🔗', unlockAt: 500000000000 },

  // Building upgrades - Time Machine (2 upgrades)
  { id: 'timemachine_up1', name: 'Paradox Engine', description: 'Time Machines 2x effective', cost: 500000000000, multiplier: 2, type: 'building', targetBuilding: 'timemachine', purchased: false, icon: '⏳', unlockAt: 50000000000 },
  { id: 'timemachine_up2', name: 'Temporal Loop', description: 'Time Machines 2x effective', cost: 50000000000000, multiplier: 2, type: 'building', targetBuilding: 'timemachine', purchased: false, icon: '🔄', unlockAt: 5000000000000 },

  // Building upgrades - AI Network (2 upgrades)
  { id: 'ai_up1', name: 'Neural Upgrade', description: 'AI Networks 2x effective', cost: 150000000000, multiplier: 2, type: 'building', targetBuilding: 'ai', purchased: false, icon: '🧠', unlockAt: 25000000000 },
  { id: 'ai_up2', name: 'Singularity Protocol', description: 'AI Networks 2x effective', cost: 15000000000000, multiplier: 2, type: 'building', targetBuilding: 'ai', purchased: false, icon: '🤯', unlockAt: 2500000000000 },

  // Global upgrades - MORE!
  { id: 'global1', name: 'Efficiency I', description: '+10% all production', cost: 10000, multiplier: 1.1, type: 'global', purchased: false, icon: '📈', unlockAt: 5000 },
  { id: 'global2', name: 'Efficiency II', description: '+25% all production', cost: 100000, multiplier: 1.25, type: 'global', purchased: false, icon: '📊', unlockAt: 50000 },
  { id: 'global3', name: 'Efficiency III', description: '+50% all production', cost: 1000000, multiplier: 1.5, type: 'global', purchased: false, icon: '🚀', unlockAt: 500000 },
  { id: 'global4', name: 'Efficiency IV', description: '+100% all production', cost: 10000000, multiplier: 2.0, type: 'global', purchased: false, icon: '🌠', unlockAt: 5000000 },
  { id: 'global5', name: 'Efficiency V', description: '+200% all production', cost: 100000000, multiplier: 3.0, type: 'global', purchased: false, icon: '🎇', unlockAt: 50000000 },
  { id: 'global6', name: 'Efficiency VI', description: '+300% all production', cost: 1000000000, multiplier: 4.0, type: 'global', purchased: false, icon: '💥', unlockAt: 500000000 },
  { id: 'global7', name: 'Efficiency VII', description: '+500% all production', cost: 10000000000, multiplier: 6.0, type: 'global', purchased: false, icon: '⚡', unlockAt: 5000000000 },
  { id: 'global8', name: 'Efficiency VIII', description: '+1000% all production', cost: 100000000000, multiplier: 11.0, type: 'global', purchased: false, icon: '🌈', unlockAt: 50000000000 },
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

// ============= PRESTIGE UPGRADES (Bought with Prestige Points) =============
interface PrestigeUpgrade {
  id: string
  name: string
  description: string
  cost: number
  effect: string
  purchased: boolean
  icon: string
  tier: number
}

const INITIAL_PRESTIGE_UPGRADES: PrestigeUpgrade[] = [
  // Tier 1 - Basic (1-5 points)
  { id: 'p_click_boost', name: 'Eternal Click', description: '+50% base click power', cost: 1, effect: 'clickBoost', purchased: false, icon: '👆', tier: 1 },
  { id: 'p_start_dots', name: 'Head Start', description: 'Start with 1000 dots after prestige', cost: 2, effect: 'startDots', purchased: false, icon: '🎁', tier: 1 },
  { id: 'p_combo_decay', name: 'Combo Keeper', description: 'Combo decays 50% slower', cost: 3, effect: 'comboDecay', purchased: false, icon: '⏰', tier: 1 },
  { id: 'p_golden_boost', name: 'Golden Aura', description: '+3% golden dot spawn rate', cost: 3, effect: 'goldenRate', purchased: false, icon: '✨', tier: 1 },
  { id: 'p_crit_boost', name: 'Critical Eye', description: '+10% crit chance permanently', cost: 5, effect: 'critBoost', purchased: false, icon: '🎯', tier: 1 },

  // Tier 2 - Intermediate (5-15 points)
  { id: 'p_building_cost', name: 'Bulk Discount', description: 'All buildings cost 10% less', cost: 7, effect: 'buildingDiscount', purchased: false, icon: '💰', tier: 2 },
  { id: 'p_offline_boost', name: 'Dream Factory', description: '+50% offline earnings', cost: 8, effect: 'offlineBoost', purchased: false, icon: '😴', tier: 2 },
  { id: 'p_dps_boost', name: 'Accelerated Growth', description: '+25% passive DPS', cost: 10, effect: 'dpsBoost', purchased: false, icon: '📈', tier: 2 },
  { id: 'p_frenzy_duration', name: 'Extended Frenzy', description: 'Frenzy mode lasts 50% longer', cost: 12, effect: 'frenzyDuration', purchased: false, icon: '⚡', tier: 2 },
  { id: 'p_prestige_bonus', name: 'Prestige Master', description: '+20% more prestige points earned', cost: 15, effect: 'prestigeBonus', purchased: false, icon: '⭐', tier: 2 },

  // Tier 3 - Advanced (15-30 points)
  { id: 'p_auto_clicker', name: 'Phantom Clicks', description: 'Auto-click once per second', cost: 18, effect: 'autoClick', purchased: false, icon: '👻', tier: 3 },
  { id: 'p_combo_power', name: 'Combo Amplifier', description: 'Combo bonus is 2x more effective', cost: 20, effect: 'comboPower', purchased: false, icon: '🔥', tier: 3 },
  { id: 'p_golden_value', name: 'Golden Fortune', description: 'Golden dots give 50% more', cost: 22, effect: 'goldenValue', purchased: false, icon: '🌟', tier: 3 },
  { id: 'p_crit_damage', name: 'Devastating Crits', description: '+50% crit multiplier', cost: 25, effect: 'critDamage', purchased: false, icon: '💥', tier: 3 },
  { id: 'p_synergy_boost', name: 'Synergy Amplifier', description: '2x cross-game synergy bonus', cost: 30, effect: 'synergyBoost', purchased: false, icon: '🔗', tier: 3 },

  // Tier 4 - Legendary (30+ points)
  { id: 'p_mega_click', name: 'Mega Click', description: '5% chance for 100x click', cost: 40, effect: 'megaClick', purchased: false, icon: '💎', tier: 4 },
  { id: 'p_double_prestige', name: 'Double Ascension', description: '2x prestige multiplier effect', cost: 50, effect: 'doublePrestige', purchased: false, icon: '🌈', tier: 4 },
  { id: 'p_permanent_frenzy', name: 'Perpetual Frenzy', description: '+10% permanent frenzy bonus always active', cost: 75, effect: 'permanentFrenzy', purchased: false, icon: '🔥', tier: 4 },
  { id: 'p_ultimate_power', name: 'Ultimate Dot Power', description: '+100% to ALL bonuses', cost: 100, effect: 'ultimatePower', purchased: false, icon: '👑', tier: 4 },
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

  // Apply synergy bonus (double if synergyBoost purchased)
  let synergyMult = 1 + state.synergyBonus
  if (state.prestigeUpgrades?.some(u => u.effect === 'synergyBoost' && u.purchased)) {
    synergyMult = 1 + state.synergyBonus * 2
  }
  dps *= synergyMult

  // Prestige upgrade: +25% DPS
  if (state.prestigeUpgrades?.some(u => u.effect === 'dpsBoost' && u.purchased)) {
    dps *= 1.25
  }

  // Prestige upgrade: +10% permanent frenzy bonus
  if (state.prestigeUpgrades?.some(u => u.effect === 'permanentFrenzy' && u.purchased)) {
    dps *= 1.1
  }

  // Prestige upgrade: +100% to all
  if (state.prestigeUpgrades?.some(u => u.effect === 'ultimatePower' && u.purchased)) {
    dps *= 2
  }

  return dps
}

function calculateClickPower(state: GameState): number {
  let power = state.dotsPerClick
  for (const upgrade of state.upgrades) {
    if (upgrade.purchased && upgrade.type === 'click') {
      power += upgrade.multiplier
    }
  }

  // Prestige upgrade: +50% base click power
  if (state.prestigeUpgrades?.some(u => u.effect === 'clickBoost' && u.purchased)) {
    power *= 1.5
  }

  // Combo calculation (with prestige combo power boost)
  let comboBonus = 1 + state.combo * 0.01 * state.comboMultiplier
  if (state.prestigeUpgrades?.some(u => u.effect === 'comboPower' && u.purchased)) {
    comboBonus = 1 + state.combo * 0.02 * state.comboMultiplier // 2x effective
  }
  power *= comboBonus

  power *= state.prestigeMultiplier

  // Synergy bonus (doubled if prestige upgrade)
  let synergyMult = 1 + state.synergyBonus
  if (state.prestigeUpgrades?.some(u => u.effect === 'synergyBoost' && u.purchased)) {
    synergyMult = 1 + state.synergyBonus * 2
  }
  power *= synergyMult

  // +10% permanent frenzy
  if (state.prestigeUpgrades?.some(u => u.effect === 'permanentFrenzy' && u.purchased)) {
    power *= 1.1
  }

  // Ultimate power: +100% to all
  if (state.prestigeUpgrades?.some(u => u.effect === 'ultimatePower' && u.purchased)) {
    power *= 2
  }

  return power
}

function calculatePrestigePoints(totalDots: number, state?: GameState): number {
  let points = Math.floor(Math.pow(totalDots / 1000000, 0.5))
  // Prestige upgrade: +20% more prestige points
  if (state?.prestigeUpgrades?.some(u => u.effect === 'prestigeBonus' && u.purchased)) {
    points = Math.floor(points * 1.2)
  }
  return points
}

// ============= MAIN COMPONENT =============

export default function DotClicker() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [clickEffects, setClickEffects] = useState<Array<{id: number, x: number, y: number, value: string, color: string}>>([])
  const [musicMuted, setMusicMuted] = useState(false)
  const [musicStarted, setMusicStarted] = useState(false)
  const [activeTab, setActiveTab] = useState<'buildings' | 'upgrades' | 'stats' | 'achievements' | 'prestige'>('buildings')
  const [showPrestige, setShowPrestige] = useState(false)
  const [goldenDot, setGoldenDot] = useState<{x: number, y: number, expires: number} | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [frenzyMode, setFrenzyMode] = useState(false)
  const [frenzyTimer, setFrenzyTimer] = useState(0)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [saveMessage, setSaveMessage] = useState('')
  const [lastCloudSave, setLastCloudSave] = useState<number | null>(null)
  const [offlineEarningsInfo, setOfflineEarningsInfo] = useState<{amount: number, time: number} | null>(null)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const comboTimerRef = useRef<NodeJS.Timeout | null>(null)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const cloudSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize game - Load from cloud first, then local
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (!user) return

    const initializeGame = async () => {
      // Try to load from cloud first
      const cloudResult = await clickerSyncService.loadFromCloud(user.id)

      let mergedState: GameState
      let lastSaveTime: number = Date.now()

      if (cloudResult.success && cloudResult.data) {
        // Use cloud save
        const cloudData = cloudResult.data
        lastSaveTime = cloudData.lastSave
        setLastCloudSave(lastSaveTime)

        mergedState = {
          ...getInitialState(),
          dots: cloudData.dots,
          totalDots: cloudData.totalDots,
          totalClicks: cloudData.totalClicks,
          dotsPerClick: cloudData.dotsPerClick,
          dotsPerSecond: cloudData.dotsPerSecond,
          critChance: cloudData.critChance,
          critMultiplier: cloudData.critMultiplier,
          goldenDotChance: cloudData.goldenDotChance,
          globalMultiplier: cloudData.globalMultiplier,
          prestigePoints: cloudData.prestigePoints,
          prestigeMultiplier: cloudData.prestigeMultiplier,
          comboMultiplier: cloudData.comboMultiplier,
          offlineMultiplier: cloudData.offlineMultiplier,
          totalGoldenClicks: cloudData.totalGoldenClicks,
          totalCrits: cloudData.totalCrits,
          totalPrestiges: cloudData.totalPrestiges,
          highestDps: cloudData.highestDps,
          maxCombo: cloudData.maxCombo,
          slayerFloorsCleared: cloudData.slayerFloorsCleared,
          synergyBonus: cloudData.synergyBonus,
          lastSave: lastSaveTime,
          startTime: cloudData.startTime,
          buildings: INITIAL_BUILDINGS.map(b => {
            const saved = cloudData.buildings?.find((sb) => sb.id === b.id)
            return saved ? { ...b, owned: saved.owned } : b
          }),
          upgrades: INITIAL_UPGRADES.map(u => {
            const saved = cloudData.upgrades?.find((su) => su.id === u.id)
            return saved ? { ...u, purchased: saved.purchased } : u
          }),
          achievements: INITIAL_ACHIEVEMENTS.map(a => {
            const saved = cloudData.achievements?.find((sa) => sa.id === a.id)
            return saved ? { ...a, unlocked: saved.unlocked } : a
          }),
          prestigeUpgrades: INITIAL_PRESTIGE_UPGRADES.map(u => {
            const saved = cloudData.prestigeUpgrades?.find((su: {id: string; purchased: boolean}) => su.id === u.id)
            return saved ? { ...u, purchased: saved.purchased } : u
          }),
        }
      } else {
        // Fall back to local save
        const saved = localStorage.getItem('dotclicker_save')
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            lastSaveTime = parsed.lastSave || Date.now()
            mergedState = {
              ...getInitialState(),
              ...parsed,
              buildings: INITIAL_BUILDINGS.map(b => {
                const savedB = parsed.buildings?.find((sb: Building) => sb.id === b.id)
                return savedB ? { ...b, owned: savedB.owned } : b
              }),
              upgrades: INITIAL_UPGRADES.map(u => {
                const savedU = parsed.upgrades?.find((su: Upgrade) => su.id === u.id)
                return savedU ? { ...u, purchased: savedU.purchased } : u
              }),
              achievements: INITIAL_ACHIEVEMENTS.map(a => {
                const savedA = parsed.achievements?.find((sa: Achievement) => sa.id === a.id)
                return savedA ? { ...a, unlocked: savedA.unlocked } : a
              }),
              prestigeUpgrades: INITIAL_PRESTIGE_UPGRADES.map(u => {
                const savedU = parsed.prestigeUpgrades?.find((su: {id: string; purchased: boolean}) => su.id === u.id)
                return savedU ? { ...u, purchased: savedU.purchased } : u
              }),
            }
          } catch {
            mergedState = getInitialState()
          }
        } else {
          mergedState = getInitialState()
        }
      }

      // Calculate offline earnings
      const offlineTime = (Date.now() - lastSaveTime) / 1000
      if (offlineTime > 10) {
        const offlineDps = calculateDps(mergedState)
        const offlineRate = 0.5 + mergedState.offlineMultiplier
        // Max 24 hours of offline earnings
        const effectiveTime = Math.min(offlineTime, 24 * 60 * 60)
        const offlineEarnings = offlineDps * effectiveTime * offlineRate

        if (offlineEarnings > 0) {
          mergedState = {
            ...mergedState,
            dots: mergedState.dots + offlineEarnings,
            totalDots: mergedState.totalDots + offlineEarnings
          }
          setOfflineEarningsInfo({ amount: offlineEarnings, time: effectiveTime })
        }
      }

      // Load cross-game synergy from unified service
      try {
        const synergy = await clickerSyncService.getSlayerSynergy(user.id)
        const bonuses = crossGameSynergy.calculateBonuses()

        // Combine cloud synergy with local synergy bonuses
        const totalSynergyBonus = synergy.synergyBonus + bonuses.clickerDPSBonus
        const goldenBonus = bonuses.clickerGoldenChance

        mergedState = {
          ...mergedState,
          slayerFloorsCleared: Math.max(synergy.floorsCleared, bonuses.crossGameLevel),
          synergyBonus: totalSynergyBonus,
          goldenDotChance: mergedState.goldenDotChance + goldenBonus,
          offlineMultiplier: mergedState.offlineMultiplier + bonuses.clickerOfflineBonus
        }
      } catch {
        // Also try localStorage synergy via unified service
        const bonuses = crossGameSynergy.calculateBonuses()
        const slayerStats = crossGameSynergy.getSlayerStats()

        mergedState = {
          ...mergedState,
          slayerFloorsCleared: slayerStats.highestFloor || 0,
          synergyBonus: bonuses.clickerDPSBonus,
          goldenDotChance: mergedState.goldenDotChance + bonuses.clickerGoldenChance,
          offlineMultiplier: mergedState.offlineMultiplier + bonuses.clickerOfflineBonus
        }
      }

      setGameState(mergedState)
    }

    initializeGame()
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
      prestigeUpgrades: [...INITIAL_PRESTIGE_UPGRADES],
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

  // Helper to check if a prestige upgrade is purchased
  function hasPrestigeUpgrade(state: GameState, effectId: string): boolean {
    return state.prestigeUpgrades.some(u => u.effect === effectId && u.purchased)
  }

  // Local save (quick, every 30 seconds)
  const saveGameLocal = useCallback(() => {
    if (gameState) {
      localStorage.setItem('dotclicker_save', JSON.stringify({
        ...gameState,
        lastSave: Date.now()
      }))

      // Update cross-game synergy stats
      crossGameSynergy.saveClickerStats({
        totalPrestiges: gameState.totalPrestiges,
        totalDots: gameState.totalDots,
        highestDPS: gameState.highestDps,
        totalClicks: gameState.totalClicks,
        totalPlaytime: Date.now() - gameState.startTime
      })
    }
  }, [gameState])

  // Cloud save (every 60 seconds and manual)
  const saveGameCloud = useCallback(async (showModal = false) => {
    if (!gameState || !user) return

    if (showModal) {
      setShowSaveModal(true)
      setSaveStatus('saving')
      setSaveMessage('Saving to cloud...')
    }

    try {
      // Save locally first
      const saveTime = Date.now()
      localStorage.setItem('dotclicker_save', JSON.stringify({
        ...gameState,
        lastSave: saveTime
      }))

      // Then save to cloud
      const cloudState: ClickerGameState = {
        dots: gameState.dots,
        totalDots: gameState.totalDots,
        totalClicks: gameState.totalClicks,
        dotsPerClick: gameState.dotsPerClick,
        dotsPerSecond: gameState.dotsPerSecond,
        critChance: gameState.critChance,
        critMultiplier: gameState.critMultiplier,
        goldenDotChance: gameState.goldenDotChance,
        globalMultiplier: gameState.globalMultiplier,
        prestigePoints: gameState.prestigePoints,
        prestigeMultiplier: gameState.prestigeMultiplier,
        buildings: gameState.buildings.map(b => ({ id: b.id, owned: b.owned })),
        upgrades: gameState.upgrades.map(u => ({ id: u.id, purchased: u.purchased })),
        achievements: gameState.achievements.map(a => ({ id: a.id, unlocked: a.unlocked })),
        prestigeUpgrades: gameState.prestigeUpgrades.map(u => ({ id: u.id, purchased: u.purchased })),
        lastSave: saveTime,
        startTime: gameState.startTime,
        combo: gameState.combo,
        maxCombo: gameState.maxCombo,
        comboTimer: gameState.comboTimer,
        comboMultiplier: gameState.comboMultiplier,
        offlineMultiplier: gameState.offlineMultiplier,
        totalGoldenClicks: gameState.totalGoldenClicks,
        totalCrits: gameState.totalCrits,
        totalPrestiges: gameState.totalPrestiges,
        highestDps: gameState.highestDps,
        slayerFloorsCleared: gameState.slayerFloorsCleared,
        synergyBonus: gameState.synergyBonus
      }

      const result = await clickerSyncService.saveToCloud(user.id, cloudState)

      if (result.success) {
        setLastCloudSave(saveTime)
        if (showModal) {
          setSaveStatus('success')
          setSaveMessage('Game saved to cloud!')
        }
      } else {
        if (showModal) {
          setSaveStatus('error')
          setSaveMessage(result.message)
        }
      }
    } catch (error: any) {
      if (showModal) {
        setSaveStatus('error')
        setSaveMessage(`Save failed: ${error.message}`)
      }
    }
  }, [gameState, user])

  // Handle manual save button click
  const handleManualSave = useCallback(() => {
    saveGameCloud(true)
  }, [saveGameCloud])

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

    // Local save every 30 seconds
    saveTimerRef.current = setInterval(() => saveGameLocal(), 30000)

    // Cloud save every 60 seconds (auto, no modal)
    cloudSaveTimerRef.current = setInterval(() => saveGameCloud(false), 60000)

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
      if (cloudSaveTimerRef.current) clearInterval(cloudSaveTimerRef.current)
      clearInterval(goldenInterval)
      clearInterval(frenzyInterval)
      dubstepPlayer.cleanup()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState !== null, frenzyMode])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!gameState) return

    // Start music on first click
    if (!musicStarted) {
      dubstepPlayer.play()
      setMusicStarted(true)
    }

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
  }, [gameState, frenzyMode, musicStarted])

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

    const newPrestigePoints = calculatePrestigePoints(gameState.totalDots, gameState)
    if (newPrestigePoints < 1) return

    const totalPrestige = gameState.prestigePoints + newPrestigePoints

    // Calculate prestige multiplier (double if prestige upgrade purchased)
    const hasDoublePrestige = gameState.prestigeUpgrades?.some(u => u.effect === 'doublePrestige' && u.purchased)
    const prestigeMultiplier = hasDoublePrestige
      ? 1 + totalPrestige * 0.2 // 20% per point
      : 1 + totalPrestige * 0.1 // 10% per point

    // Check for start dots bonus
    const hasStartDots = gameState.prestigeUpgrades?.some(u => u.effect === 'startDots' && u.purchased)
    const startingDots = hasStartDots ? 1000 : 0

    // Get crit boost from prestige upgrades
    const hasCritBoost = gameState.prestigeUpgrades?.some(u => u.effect === 'critBoost' && u.purchased)
    const baseCritChance = hasCritBoost ? 0.15 : 0.05 // 15% vs 5%

    // Get golden rate boost
    const hasGoldenRate = gameState.prestigeUpgrades?.some(u => u.effect === 'goldenRate' && u.purchased)
    const goldenChance = hasGoldenRate ? 0.04 : 0.01 // 4% vs 1%

    setGameState({
      ...getInitialState(),
      dots: startingDots,
      totalDots: startingDots,
      prestigePoints: totalPrestige,
      prestigeMultiplier: prestigeMultiplier,
      critChance: baseCritChance,
      goldenDotChance: goldenChance,
      achievements: gameState.achievements,
      prestigeUpgrades: gameState.prestigeUpgrades, // PRESERVE prestige upgrades!
      maxCombo: gameState.maxCombo,
      totalPrestiges: gameState.totalPrestiges + 1,
      totalGoldenClicks: gameState.totalGoldenClicks,
      totalCrits: gameState.totalCrits,
      highestDps: gameState.highestDps,
      slayerFloorsCleared: gameState.slayerFloorsCleared,
      synergyBonus: gameState.synergyBonus,
    })

    setShowPrestige(false)
    setNotification(`⭐ Prestiged! +${newPrestigePoints} points. New bonus: ${(prestigeMultiplier * 100).toFixed(0)}%`)
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

  const potentialPrestige = calculatePrestigePoints(gameState.totalDots, gameState)
  const playTime = Math.floor((Date.now() - gameState.startTime) / 1000)

  return (
    <div className={`clicker-container ${frenzyMode ? 'frenzy' : ''}`}>
      {/* Header */}
      <header className="header">
        <button
          className="back-btn"
          onClick={async () => {
            // Auto-save to cloud before navigating
            if (gameState && user) {
              saveGameLocal()
              await saveGameCloud(false)
            }
            router.push('/hub')
          }}
        >← Hub</button>
        <div className="title">
          <span className="dot-icon">●</span> DOT CLICKER
          {frenzyMode && <span className="frenzy-badge">🔥 FRENZY {frenzyTimer}s</span>}
        </div>
        <div className="header-stats">
          <button
            className={`music-toggle ${musicMuted ? 'muted' : ''}`}
            onClick={() => {
              if (!musicStarted) {
                dubstepPlayer.play()
                setMusicStarted(true)
              }
              const muted = dubstepPlayer.toggleMute()
              setMusicMuted(muted)
            }}
          >
            {musicMuted ? '🔇' : '🎵'}
          </button>
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
        <button className={`tab prestige-tab ${activeTab === 'prestige' ? 'active' : ''}`} onClick={() => setActiveTab('prestige')}>
          ⭐ Prestige Shop
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

        {activeTab === 'prestige' && (
          <div className="prestige-shop">
            <div className="prestige-shop-header">
              <span className="prestige-points-display">⭐ {gameState.prestigePoints} Prestige Points</span>
            </div>
            {[1, 2, 3, 4].map(tier => (
              <div key={tier} className="prestige-tier">
                <h4 className={`tier-title tier-${tier}`}>
                  {tier === 1 && '🌟 Tier 1 - Basic'}
                  {tier === 2 && '💫 Tier 2 - Intermediate'}
                  {tier === 3 && '✨ Tier 3 - Advanced'}
                  {tier === 4 && '👑 Tier 4 - Legendary'}
                </h4>
                <div className="prestige-upgrades-grid">
                  {gameState.prestigeUpgrades.filter(u => u.tier === tier).map(upgrade => (
                    <div
                      key={upgrade.id}
                      className={`prestige-upgrade-item ${upgrade.purchased ? 'purchased' : ''} ${gameState.prestigePoints >= upgrade.cost && !upgrade.purchased ? 'affordable' : ''}`}
                      onClick={() => {
                        if (!upgrade.purchased && gameState.prestigePoints >= upgrade.cost) {
                          setGameState(prev => prev ? {
                            ...prev,
                            prestigePoints: prev.prestigePoints - upgrade.cost,
                            prestigeUpgrades: prev.prestigeUpgrades.map(u =>
                              u.id === upgrade.id ? { ...u, purchased: true } : u
                            )
                          } : prev)
                          setNotification(`⭐ Purchased ${upgrade.name}!`)
                          setTimeout(() => setNotification(null), 3000)
                        }
                      }}
                    >
                      <span className="prestige-upgrade-icon">{upgrade.icon}</span>
                      <div className="prestige-upgrade-info">
                        <span className="prestige-upgrade-name">{upgrade.name}</span>
                        <span className="prestige-upgrade-desc">{upgrade.description}</span>
                      </div>
                      <span className={`prestige-upgrade-cost ${upgrade.purchased ? 'purchased' : ''}`}>
                        {upgrade.purchased ? '✓' : `${upgrade.cost}⭐`}
                      </span>
                    </div>
                  ))}
                </div>
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
        <button className="btn save-btn" onClick={handleManualSave}>
          💾 Save
          {lastCloudSave && (
            <span className="last-save-time">
              {Math.floor((Date.now() - lastCloudSave) / 60000)}m ago
            </span>
          )}
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

      {/* Save Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => saveStatus !== 'saving' && setShowSaveModal(false)}>
          <div className="modal save-modal" onClick={e => e.stopPropagation()}>
            <h2>
              {saveStatus === 'saving' && '💾 Saving...'}
              {saveStatus === 'success' && '✅ Saved!'}
              {saveStatus === 'error' && '❌ Error'}
            </h2>
            <div className="save-status-content">
              {saveStatus === 'saving' && (
                <div className="save-spinner"></div>
              )}
              {saveStatus === 'success' && (
                <>
                  <p className="save-success-msg">{saveMessage}</p>
                  <p className="save-details">Your progress has been saved to the cloud.</p>
                  <p className="save-details">You can continue playing on any device!</p>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <p className="save-error-msg">{saveMessage}</p>
                  <p className="save-details">Your progress is still saved locally.</p>
                </>
              )}
            </div>
            {saveStatus !== 'saving' && (
              <button className="btn close-btn" onClick={() => setShowSaveModal(false)}>Close</button>
            )}
          </div>
        </div>
      )}

      {/* Offline Earnings Modal */}
      {offlineEarningsInfo && (
        <div className="modal-overlay" onClick={() => setOfflineEarningsInfo(null)}>
          <div className="modal offline-modal" onClick={e => e.stopPropagation()}>
            <h2>🌙 Welcome Back!</h2>
            <div className="offline-info">
              <p className="offline-time">You were away for <strong>{formatTime(offlineEarningsInfo.time)}</strong></p>
              <p className="offline-earned">
                You earned <span className="offline-amount">{formatNumber(offlineEarningsInfo.amount)}</span> dots!
              </p>
              <p className="offline-hint">
                Tip: Buy offline upgrades to earn up to 150% while away!
              </p>
            </div>
            <button className="btn collect-btn" onClick={() => setOfflineEarningsInfo(null)}>
              Collect!
            </button>
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

        .music-toggle {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #2ecc71;
          padding: 6px 12px;
          border-radius: 15px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
          margin-right: 10px;
        }

        .music-toggle:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .music-toggle.muted {
          color: #666;
          border-color: rgba(255, 255, 255, 0.1);
        }

        .header-stats {
          display: flex;
          align-items: center;
          gap: 10px;
        }

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

        /* Prestige Shop Styles */
        .prestige-shop {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .prestige-shop-header {
          text-align: center;
          padding: 15px;
          background: linear-gradient(135deg, rgba(155, 89, 182, 0.2), rgba(142, 68, 173, 0.1));
          border-radius: 12px;
          border: 1px solid rgba(155, 89, 182, 0.3);
        }

        .prestige-points-display {
          font-size: 1.5rem;
          font-weight: bold;
          color: #f39c12;
        }

        .prestige-tier {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 15px;
        }

        .tier-title {
          margin-bottom: 12px;
          font-size: 1rem;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tier-1 { color: #3498db; }
        .tier-2 { color: #9b59b6; }
        .tier-3 { color: #f39c12; }
        .tier-4 { color: #e74c3c; }

        .prestige-upgrades-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .prestige-upgrade-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          opacity: 0.5;
          border: 1px solid transparent;
        }

        .prestige-upgrade-item.affordable {
          opacity: 1;
          border-color: rgba(155, 89, 182, 0.4);
        }

        .prestige-upgrade-item.affordable:hover {
          background: rgba(155, 89, 182, 0.2);
          transform: translateX(5px);
        }

        .prestige-upgrade-item.purchased {
          opacity: 0.7;
          background: linear-gradient(135deg, rgba(46, 204, 113, 0.1), rgba(39, 174, 96, 0.05));
          border-color: rgba(46, 204, 113, 0.3);
          cursor: default;
        }

        .prestige-upgrade-icon {
          font-size: 1.5rem;
          width: 40px;
          text-align: center;
        }

        .prestige-upgrade-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .prestige-upgrade-name {
          font-weight: bold;
          color: #fff;
        }

        .prestige-upgrade-desc {
          font-size: 0.8rem;
          color: #888;
        }

        .prestige-upgrade-cost {
          font-weight: bold;
          color: #f39c12;
          min-width: 50px;
          text-align: right;
        }

        .prestige-upgrade-cost.purchased {
          color: #2ecc71;
        }

        .prestige-tab {
          background: rgba(155, 89, 182, 0.2) !important;
        }

        .prestige-tab.active {
          background: rgba(155, 89, 182, 0.4) !important;
          color: #d4a5ff !important;
        }

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

        .last-save-time {
          display: block;
          font-size: 0.7rem;
          color: #666;
          font-weight: normal;
          margin-top: 2px;
        }

        .save-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Save Modal Styles */
        .save-modal {
          min-height: 200px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .save-status-content {
          padding: 20px 0;
          text-align: center;
        }

        .save-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(0, 217, 255, 0.2);
          border-top-color: #00d9ff;
          border-radius: 50%;
          margin: 0 auto;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .save-success-msg {
          color: #2ecc71;
          font-size: 1.2rem;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .save-error-msg {
          color: #e74c3c;
          font-size: 1rem;
          margin-bottom: 10px;
        }

        .save-details {
          color: #888;
          font-size: 0.9rem;
          margin: 5px 0;
        }

        /* Offline Earnings Modal */
        .offline-modal h2 {
          color: #f39c12;
        }

        .offline-info {
          background: rgba(0, 0, 0, 0.3);
          padding: 20px;
          border-radius: 10px;
          margin: 15px 0;
        }

        .offline-time {
          color: #888;
          font-size: 1rem;
          margin-bottom: 15px;
        }

        .offline-earned {
          font-size: 1.1rem;
          margin-bottom: 10px;
        }

        .offline-amount {
          color: #00d9ff;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .offline-hint {
          color: #666;
          font-size: 0.85rem;
          font-style: italic;
          margin-top: 15px;
        }

        .collect-btn {
          background: linear-gradient(135deg, #f39c12, #e67e22);
          color: white;
          width: 100%;
          padding: 15px;
          font-size: 1.1rem;
          margin-top: 10px;
        }

        .collect-btn:hover {
          transform: scale(1.02);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}

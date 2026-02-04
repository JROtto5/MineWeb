// AudioManager - Improved with proper cleanup and better ambient music

export class AudioManager {
  private static instance: AudioManager
  private audioContext: AudioContext | null = null
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null

  private musicVolume = 0.12 // 12% volume for background music
  private sfxVolume = 0.25 // 25% volume for sound effects
  private musicMuted = false
  private sfxMuted = false
  private musicPlaying = false

  // Proper tracking for cleanup
  private activeOscillators: Set<OscillatorNode> = new Set()
  private musicInterval: ReturnType<typeof setInterval> | null = null
  private chordIndex = 0

  private constructor() {
    // Audio context will be created on first user interaction
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  private initializeAudioContext() {
    if (this.audioContext) return

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create gain nodes for volume control
      this.musicGain = this.audioContext.createGain()
      this.musicGain.gain.value = this.musicMuted ? 0 : this.musicVolume
      this.musicGain.connect(this.audioContext.destination)

      this.sfxGain = this.audioContext.createGain()
      this.sfxGain.gain.value = this.sfxMuted ? 0 : this.sfxVolume
      this.sfxGain.connect(this.audioContext.destination)

      console.log('Audio system initialized')
    } catch (e) {
      console.error('Failed to initialize audio:', e)
    }
  }

  // Play a simple tone (for sound effects)
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volumeMult = 1) {
    if (!this.audioContext || !this.sfxGain || this.sfxMuted) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.type = type
      oscillator.frequency.value = frequency

      // Envelope for natural sound
      const now = this.audioContext.currentTime
      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(volumeMult, now + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration)

      oscillator.connect(gainNode)
      gainNode.connect(this.sfxGain)

      oscillator.start(now)
      oscillator.stop(now + duration)
    } catch (e) {
      // Ignore audio errors
    }
  }

  // Play ambient music note with proper cleanup
  private playMusicNote(frequency: number, duration: number) {
    if (!this.audioContext || !this.musicGain || this.musicMuted || !this.musicPlaying) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.value = frequency

      const now = this.audioContext.currentTime
      // Soft fade in/out for ambient feel
      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(0.08, now + 0.3)
      gainNode.gain.setValueAtTime(0.08, now + duration - 0.5)
      gainNode.gain.linearRampToValueAtTime(0, now + duration)

      oscillator.connect(gainNode)
      gainNode.connect(this.musicGain)

      // Track for cleanup
      this.activeOscillators.add(oscillator)

      oscillator.onended = () => {
        this.activeOscillators.delete(oscillator)
      }

      oscillator.start(now)
      oscillator.stop(now + duration)
    } catch (e) {
      // Ignore audio errors
    }
  }

  // Background Music - Ambient pad with chord progression
  playBackgroundMusic() {
    if (this.musicPlaying) return // Prevent multiple instances

    this.initializeAudioContext()
    if (!this.audioContext || !this.musicGain || this.musicMuted) return

    this.musicPlaying = true
    this.chordIndex = 0

    // Ambient chord progression (darker, more atmospheric)
    const chords = [
      [130.81, 164.81, 196.00], // C3 chord (lower, ambient)
      [146.83, 174.61, 220.00], // D3 minor
      [164.81, 196.00, 246.94], // E3 minor
      [174.61, 220.00, 261.63], // F3 major
      [146.83, 174.61, 220.00], // D3 minor (repeat for flow)
      [130.81, 164.81, 196.00], // C3 chord
    ]

    // Play chord every 3 seconds using interval (not recursive setTimeout)
    const playNextChord = () => {
      if (!this.musicPlaying || this.musicMuted) return

      const chord = chords[this.chordIndex % chords.length]

      // Play each note of the chord with slight delays for richness
      chord.forEach((freq, i) => {
        setTimeout(() => {
          this.playMusicNote(freq, 3.5)
          // Add subtle octave harmonic
          this.playMusicNote(freq * 2, 2.5)
        }, i * 100)
      })

      this.chordIndex++
    }

    // Play first chord immediately
    playNextChord()

    // Then play every 3 seconds
    this.musicInterval = setInterval(playNextChord, 3000)
  }

  playBossMusic() {
    // Stop normal music first
    this.stopMusic()

    this.initializeAudioContext()
    if (!this.audioContext || !this.musicGain || this.musicMuted) return

    this.musicPlaying = true
    this.chordIndex = 0

    // More intense chord progression for boss fights
    const chords = [
      [98.00, 123.47, 146.83],   // G2 minor (tense)
      [110.00, 130.81, 164.81],  // A2 minor
      [87.31, 110.00, 130.81],   // F2 (darker)
      [98.00, 123.47, 146.83],   // G2 minor
    ]

    const playNextChord = () => {
      if (!this.musicPlaying || this.musicMuted) return

      const chord = chords[this.chordIndex % chords.length]

      chord.forEach((freq, i) => {
        setTimeout(() => {
          this.playMusicNote(freq, 2.0)
          this.playMusicNote(freq * 2, 1.5)
        }, i * 80)
      })

      this.chordIndex++
    }

    playNextChord()
    this.musicInterval = setInterval(playNextChord, 2000) // Faster for boss
  }

  stopMusic() {
    this.musicPlaying = false

    // Clear the interval
    if (this.musicInterval) {
      clearInterval(this.musicInterval)
      this.musicInterval = null
    }

    // Stop all active oscillators
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop()
      } catch (e) {
        // Already stopped
      }
    })
    this.activeOscillators.clear()
    this.chordIndex = 0
  }

  pauseMusic() {
    this.stopMusic()
  }

  resumeMusic() {
    if (!this.musicMuted && !this.musicPlaying) {
      this.playBackgroundMusic()
    }
  }

  // Sound Effects
  playSound(soundName: string) {
    if (!this.audioContext || this.sfxMuted) return
    this.initializeAudioContext()

    switch (soundName) {
      case 'kill':
        // Quick satisfying pop
        this.playTone(600, 0.08, 'sine', 0.8)
        setTimeout(() => this.playTone(800, 0.06, 'sine', 0.6), 40)
        break

      case 'death':
        // Descending tone
        this.playTone(300, 0.15, 'sawtooth', 0.5)
        setTimeout(() => this.playTone(220, 0.2, 'sawtooth', 0.4), 100)
        setTimeout(() => this.playTone(150, 0.3, 'sawtooth', 0.3), 200)
        break

      case 'levelUp':
        // Ascending arpeggio
        this.playTone(523, 0.1, 'sine', 0.7)
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.7), 70)
        setTimeout(() => this.playTone(784, 0.1, 'sine', 0.7), 140)
        setTimeout(() => this.playTone(1047, 0.2, 'sine', 0.8), 210)
        break

      case 'shoot':
        // Quick blip
        this.playTone(400, 0.03, 'square', 0.3)
        break

      case 'purchase':
        // Cash register ding
        this.playTone(880, 0.1, 'sine', 0.6)
        setTimeout(() => this.playTone(1100, 0.15, 'sine', 0.7), 80)
        break

      case 'upgrade':
        // Sparkle sound
        this.playTone(1200, 0.08, 'sine', 0.5)
        setTimeout(() => this.playTone(1500, 0.1, 'sine', 0.6), 60)
        break

      case 'hit':
        // Impact thud
        this.playTone(150, 0.08, 'triangle', 0.6)
        break
    }
  }

  // Volume Controls
  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    if (this.musicGain && !this.musicMuted) {
      this.musicGain.gain.value = this.musicVolume
    }
  }

  setSfxVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume))
    if (this.sfxGain && !this.sfxMuted) {
      this.sfxGain.gain.value = this.sfxVolume
    }
  }

  // Mute Controls
  toggleMusicMute(): boolean {
    this.musicMuted = !this.musicMuted
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicMuted ? 0 : this.musicVolume
    }
    if (this.musicMuted) {
      this.stopMusic()
    } else {
      this.playBackgroundMusic()
    }
    return this.musicMuted
  }

  toggleSfxMute(): boolean {
    this.sfxMuted = !this.sfxMuted
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxMuted ? 0 : this.sfxVolume
    }
    return this.sfxMuted
  }

  toggleAllMute(): boolean {
    const mute = !this.musicMuted
    this.musicMuted = mute
    this.sfxMuted = mute

    if (this.musicGain) {
      this.musicGain.gain.value = mute ? 0 : this.musicVolume
    }
    if (this.sfxGain) {
      this.sfxGain.gain.value = mute ? 0 : this.sfxVolume
    }

    if (mute) {
      this.stopMusic()
    } else {
      this.playBackgroundMusic()
    }
    return mute
  }

  // Getters
  isMusicMuted(): boolean { return this.musicMuted }
  isSfxMuted(): boolean { return this.sfxMuted }
  getMusicVolume(): number { return this.musicVolume }
  getSfxVolume(): number { return this.sfxVolume }

  // Enable audio (call after user interaction)
  enableAudio() {
    this.initializeAudioContext()

    // Resume audio context if suspended (browser requirement)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        if (!this.musicMuted) {
          this.playBackgroundMusic()
        }
      })
    } else if (!this.musicMuted && !this.musicPlaying) {
      this.playBackgroundMusic()
    }
  }

  // Cleanup when leaving game
  cleanup() {
    this.stopMusic()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.musicGain = null
    this.sfxGain = null
  }
}

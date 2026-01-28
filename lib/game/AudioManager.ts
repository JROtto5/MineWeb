// AudioManager - Simplified with Web Audio API for reliable browser audio

export class AudioManager {
  private static instance: AudioManager
  private audioContext: AudioContext | null = null
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null

  private musicVolume = 0.15 // 15% volume for background music (quieter)
  private sfxVolume = 0.3 // 30% volume for sound effects
  private musicMuted = false
  private sfxMuted = false
  private musicPlaying = false
  private oscillators: OscillatorNode[] = []

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

      console.log('✅ Audio system initialized!')
    } catch (e) {
      console.error('Failed to initialize audio:', e)
    }
  }

  // Play a simple tone (for sound effects)
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.audioContext || !this.sfxGain || this.sfxMuted) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.type = type
      oscillator.frequency.value = frequency

      // Envelope for natural sound
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

      oscillator.connect(gainNode)
      gainNode.connect(this.sfxGain)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + duration)
    } catch (e) {
      console.error('Failed to play tone:', e)
    }
  }

  // Play a chord (for richer sounds)
  private playChord(frequencies: number[], duration: number) {
    frequencies.forEach(freq => this.playTone(freq, duration))
  }

  // Background Music - Simple ambient loop
  playBackgroundMusic() {
    if (!this.audioContext || this.musicMuted || this.musicPlaying) return

    this.initializeAudioContext()
    if (!this.audioContext || !this.musicGain) return

    this.musicPlaying = true
    this.playAmbientLoop()
  }

  private playAmbientLoop() {
    if (!this.audioContext || !this.musicGain || this.musicMuted || !this.musicPlaying) return

    try {
      // Play a simple ambient chord progression
      const chords = [
        [261.63, 329.63, 392.00], // C major
        [293.66, 369.99, 440.00], // D minor
        [329.63, 392.00, 493.88], // E minor
        [349.23, 440.00, 523.25], // F major
      ]

      const playChord = (chordIndex: number) => {
        if (!this.musicPlaying || this.musicMuted) return

        const chord = chords[chordIndex % chords.length]
        chord.forEach(freq => {
          if (!this.audioContext || !this.musicGain) return

          const osc = this.audioContext.createOscillator()
          const gain = this.audioContext.createGain()

          osc.type = 'sine'
          osc.frequency.value = freq
          gain.gain.value = 0.1 // Very quiet

          osc.connect(gain)
          gain.connect(this.musicGain)

          osc.start(this.audioContext.currentTime)
          osc.stop(this.audioContext.currentTime + 2)

          this.oscillators.push(osc)
        })

        // Schedule next chord
        setTimeout(() => playChord(chordIndex + 1), 2000)
      }

      playChord(0)
    } catch (e) {
      console.error('Failed to play background music:', e)
    }
  }

  playBossMusic() {
    // For now, same as background but slightly different
    this.playBackgroundMusic()
  }

  stopMusic() {
    this.musicPlaying = false
    this.oscillators.forEach(osc => {
      try {
        osc.stop()
      } catch (e) {
        // Already stopped
      }
    })
    this.oscillators = []
  }

  pauseMusic() {
    this.musicPlaying = false
  }

  resumeMusic() {
    if (!this.musicMuted) {
      this.playBackgroundMusic()
    }
  }

  // Sound Effects using tones
  playSound(soundName: string) {
    if (!this.audioContext || this.sfxMuted) return

    switch (soundName) {
      case 'kill':
        // Happy chime
        this.playTone(523.25, 0.1) // C5
        setTimeout(() => this.playTone(659.25, 0.1), 50) // E5
        setTimeout(() => this.playTone(783.99, 0.15), 100) // G5
        break

      case 'death':
        // Descending sad sound
        this.playTone(440, 0.2, 'sawtooth') // A
        setTimeout(() => this.playTone(392, 0.2, 'sawtooth'), 100) // G
        setTimeout(() => this.playTone(349.23, 0.3, 'sawtooth'), 200) // F
        break

      case 'levelUp':
        // Victory fanfare
        this.playTone(523.25, 0.1) // C5
        setTimeout(() => this.playTone(659.25, 0.1), 80) // E5
        setTimeout(() => this.playTone(783.99, 0.1), 160) // G5
        setTimeout(() => this.playTone(1046.50, 0.3), 240) // C6
        break

      case 'shoot':
        // Pew pew laser
        this.playTone(880, 0.05, 'square')
        break

      case 'purchase':
        // Cash register
        this.playChord([523.25, 659.25, 783.99], 0.15)
        setTimeout(() => this.playChord([587.33, 739.99, 880.00], 0.2), 100)
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
      this.pauseMusic()
    } else {
      this.resumeMusic()
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
      this.pauseMusic()
    } else {
      this.resumeMusic()
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
        console.log('🔊 Audio context resumed!')
        this.playBackgroundMusic()
      })
    } else {
      this.playBackgroundMusic()
    }
  }
}

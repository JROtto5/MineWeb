// AudioManager - Dubstep style music with proper cleanup

export class AudioManager {
  private static instance: AudioManager
  private audioContext: AudioContext | null = null
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null

  private musicVolume = 0.15
  private sfxVolume = 0.25
  private musicMuted = false
  private sfxMuted = false
  private musicPlaying = false

  private activeOscillators: Set<OscillatorNode> = new Set()
  private activeBufferSources: Set<AudioBufferSourceNode> = new Set()
  private musicInterval: ReturnType<typeof setInterval> | null = null
  private beatIndex = 0

  private constructor() {}

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

      this.musicGain = this.audioContext.createGain()
      this.musicGain.gain.value = this.musicMuted ? 0 : this.musicVolume
      this.musicGain.connect(this.audioContext.destination)

      this.sfxGain = this.audioContext.createGain()
      this.sfxGain.gain.value = this.sfxMuted ? 0 : this.sfxVolume
      this.sfxGain.connect(this.audioContext.destination)
    } catch (e) {
      console.error('Failed to initialize audio:', e)
    }
  }

  // =============== DUBSTEP MUSIC SYSTEM ===============

  private createWobbleBass(baseFreq: number, duration: number) {
    if (!this.audioContext || !this.musicGain || this.musicMuted || !this.musicPlaying) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()

    osc.type = 'sawtooth'
    osc.frequency.value = baseFreq

    filter.type = 'lowpass'
    filter.Q.value = 12

    // Wobble the filter frequency
    const now = this.audioContext.currentTime
    const wobbleRate = 8 // Hz - faster wobble
    for (let i = 0; i < duration * wobbleRate * 2; i++) {
      const time = now + i / (wobbleRate * 2)
      const wobbleAmount = 150 + Math.abs(Math.sin(i * Math.PI * 0.5)) * 500
      filter.frequency.setValueAtTime(wobbleAmount, time)
    }

    gain.gain.setValueAtTime(0.25, now)
    gain.gain.setValueAtTime(0.25, now + duration * 0.8)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.musicGain)

    this.activeOscillators.add(osc)
    osc.onended = () => this.activeOscillators.delete(osc)

    osc.start(now)
    osc.stop(now + duration)
  }

  private createKick() {
    if (!this.audioContext || !this.musicGain || this.musicMuted || !this.musicPlaying) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sine'
    const now = this.audioContext.currentTime
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.1)

    gain.gain.setValueAtTime(0.6, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)

    osc.connect(gain)
    gain.connect(this.musicGain)

    this.activeOscillators.add(osc)
    osc.onended = () => this.activeOscillators.delete(osc)

    osc.start(now)
    osc.stop(now + 0.25)
  }

  private createSnare() {
    if (!this.audioContext || !this.musicGain || this.musicMuted || !this.musicPlaying) return

    const bufferSize = this.audioContext.sampleRate * 0.15
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2))
    }

    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 1500

    const gain = this.audioContext.createGain()
    const now = this.audioContext.currentTime
    gain.gain.setValueAtTime(0.35, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.musicGain)

    this.activeBufferSources.add(noise)
    noise.onended = () => this.activeBufferSources.delete(noise)

    noise.start(now)
  }

  private createHiHat(open = false) {
    if (!this.audioContext || !this.musicGain || this.musicMuted || !this.musicPlaying) return

    const duration = open ? 0.15 : 0.05
    const bufferSize = this.audioContext.sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3))
    }

    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 7000

    const gain = this.audioContext.createGain()
    const now = this.audioContext.currentTime
    gain.gain.setValueAtTime(open ? 0.12 : 0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.musicGain)

    this.activeBufferSources.add(noise)
    noise.onended = () => this.activeBufferSources.delete(noise)

    noise.start(now)
  }

  private createSynth(freq: number, duration: number) {
    if (!this.audioContext || !this.musicGain || this.musicMuted || !this.musicPlaying) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'square'
    osc.frequency.value = freq

    const now = this.audioContext.currentTime
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.08, now + 0.05)
    gain.gain.setValueAtTime(0.06, now + duration * 0.7)
    gain.gain.linearRampToValueAtTime(0, now + duration)

    osc.connect(gain)
    gain.connect(this.musicGain)

    this.activeOscillators.add(osc)
    osc.onended = () => this.activeOscillators.delete(osc)

    osc.start(now)
    osc.stop(now + duration)
  }

  private playDubstepBeat() {
    if (!this.musicPlaying || this.musicMuted) return

    const bassNotes = [55, 55, 73.42, 55] // A1, A1, D2, A1
    const synthNotes = [220, 293.66, 349.23, 293.66] // A3, D4, F4, D4

    const pattern = this.beatIndex % 8

    // Kick on 1, 3, 5, 7
    if (pattern % 2 === 0) {
      this.createKick()
    }

    // Snare on 3, 7
    if (pattern === 2 || pattern === 6) {
      this.createSnare()
    }

    // Hi-hat pattern
    if (pattern % 2 === 1) {
      this.createHiHat(pattern === 3)
    }

    // Wobble bass on every beat
    if (pattern === 0 || pattern === 4) {
      this.createWobbleBass(bassNotes[Math.floor(this.beatIndex / 8) % 4], 0.4)
    }

    // Synth melody every 4 beats
    if (pattern === 0) {
      this.createSynth(synthNotes[Math.floor(this.beatIndex / 8) % 4], 0.3)
    }

    this.beatIndex++
  }

  playBackgroundMusic() {
    if (this.musicPlaying) return

    this.initializeAudioContext()
    if (!this.audioContext || !this.musicGain || this.musicMuted) return

    this.musicPlaying = true
    this.beatIndex = 0

    // Play beat every 125ms (120 BPM, eighth notes)
    this.playDubstepBeat()
    this.musicInterval = setInterval(() => this.playDubstepBeat(), 125)
  }

  playBossMusic() {
    this.stopMusic()

    this.initializeAudioContext()
    if (!this.audioContext || !this.musicGain || this.musicMuted) return

    this.musicPlaying = true
    this.beatIndex = 0

    // Faster tempo for boss (150 BPM)
    this.playDubstepBeat()
    this.musicInterval = setInterval(() => this.playDubstepBeat(), 100)
  }

  stopMusic() {
    this.musicPlaying = false

    if (this.musicInterval) {
      clearInterval(this.musicInterval)
      this.musicInterval = null
    }

    // Stop all oscillators
    this.activeOscillators.forEach(osc => {
      try { osc.stop() } catch {}
    })
    this.activeOscillators.clear()

    // Stop all buffer sources
    this.activeBufferSources.forEach(src => {
      try { src.stop() } catch {}
    })
    this.activeBufferSources.clear()

    this.beatIndex = 0
  }

  pauseMusic() {
    this.stopMusic()
  }

  resumeMusic() {
    if (!this.musicMuted && !this.musicPlaying) {
      this.playBackgroundMusic()
    }
  }

  // =============== SOUND EFFECTS ===============

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volumeMult = 1) {
    if (!this.audioContext || !this.sfxGain || this.sfxMuted) return

    try {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()

      osc.type = type
      osc.frequency.value = frequency

      const now = this.audioContext.currentTime
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(volumeMult, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration)

      osc.connect(gain)
      gain.connect(this.sfxGain)

      osc.start(now)
      osc.stop(now + duration)
    } catch {}
  }

  playSound(soundName: string) {
    if (!this.audioContext || this.sfxMuted) return
    this.initializeAudioContext()

    switch (soundName) {
      case 'kill':
        this.playTone(600, 0.08, 'sine', 0.8)
        setTimeout(() => this.playTone(800, 0.06, 'sine', 0.6), 40)
        break
      case 'death':
        this.playTone(300, 0.15, 'sawtooth', 0.5)
        setTimeout(() => this.playTone(220, 0.2, 'sawtooth', 0.4), 100)
        setTimeout(() => this.playTone(150, 0.3, 'sawtooth', 0.3), 200)
        break
      case 'levelUp':
        this.playTone(523, 0.1, 'sine', 0.7)
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.7), 70)
        setTimeout(() => this.playTone(784, 0.1, 'sine', 0.7), 140)
        setTimeout(() => this.playTone(1047, 0.2, 'sine', 0.8), 210)
        break
      case 'shoot':
        this.playTone(400, 0.03, 'square', 0.3)
        break
      case 'purchase':
        this.playTone(880, 0.1, 'sine', 0.6)
        setTimeout(() => this.playTone(1100, 0.15, 'sine', 0.7), 80)
        break
      case 'upgrade':
        this.playTone(1200, 0.08, 'sine', 0.5)
        setTimeout(() => this.playTone(1500, 0.1, 'sine', 0.6), 60)
        break
      case 'hit':
        this.playTone(150, 0.08, 'triangle', 0.6)
        break
    }
  }

  // =============== VOLUME CONTROLS ===============

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

  isMusicMuted(): boolean { return this.musicMuted }
  isSfxMuted(): boolean { return this.sfxMuted }
  getMusicVolume(): number { return this.musicVolume }
  getSfxVolume(): number { return this.sfxVolume }

  enableAudio() {
    this.initializeAudioContext()

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

  // IMPORTANT: Call this when leaving the game scene
  cleanup() {
    this.stopMusic()
    // Don't close the audio context, just stop the music
    // This allows sounds to still work if user returns
  }

  // Full cleanup - only call when completely leaving
  fullCleanup() {
    this.stopMusic()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.musicGain = null
    this.sfxGain = null
  }
}

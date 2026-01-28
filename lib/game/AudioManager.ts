// AudioManager - Handles all music and sound effects with volume/mute controls

export class AudioManager {
  private static instance: AudioManager
  private bgMusic: HTMLAudioElement | null = null
  private soundEffects: Map<string, HTMLAudioElement> = new Map()

  private musicVolume = 0.3 // 30% volume for background music
  private sfxVolume = 0.5 // 50% volume for sound effects
  private musicMuted = false
  private sfxMuted = false

  // Using royalty-free music URLs
  private musicTracks = {
    background: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3', // Energetic electronic music
    boss: 'https://assets.mixkit.co/music/preview/mixkit-games-worldbeat-466.mp3', // Epic boss music
  }

  private soundUrls = {
    kill: 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3',
    death: 'https://assets.mixkit.co/sfx/preview/mixkit-player-losing-or-failing-2042.mp3',
    levelUp: 'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3',
    shoot: 'https://assets.mixkit.co/sfx/preview/mixkit-short-laser-gun-shot-1670.mp3',
    purchase: 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-complete-or-approved-mission-205.mp3',
  }

  private constructor() {
    this.initializeAudio()
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  private initializeAudio() {
    // Pre-load sound effects
    Object.entries(this.soundUrls).forEach(([name, url]) => {
      const audio = new Audio(url)
      audio.volume = this.sfxVolume
      audio.preload = 'auto'
      this.soundEffects.set(name, audio)
    })

    // Initialize background music
    this.bgMusic = new Audio(this.musicTracks.background)
    this.bgMusic.volume = this.musicVolume
    this.bgMusic.loop = true
    this.bgMusic.preload = 'auto'
  }

  // Background Music Controls
  playBackgroundMusic() {
    if (!this.bgMusic || this.musicMuted) return

    this.bgMusic.src = this.musicTracks.background
    this.bgMusic.play().catch(e => {
      console.log('Background music autoplay blocked:', e)
    })
  }

  playBossMusic() {
    if (!this.bgMusic || this.musicMuted) return

    this.bgMusic.src = this.musicTracks.boss
    this.bgMusic.currentTime = 0
    this.bgMusic.play().catch(e => {
      console.log('Boss music autoplay blocked:', e)
    })
  }

  stopMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause()
      this.bgMusic.currentTime = 0
    }
  }

  pauseMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause()
    }
  }

  resumeMusic() {
    if (this.bgMusic && !this.musicMuted) {
      this.bgMusic.play().catch(e => {
        console.log('Music resume failed:', e)
      })
    }
  }

  // Sound Effects
  playSound(soundName: string) {
    if (this.sfxMuted) return

    const sound = this.soundEffects.get(soundName)
    if (sound) {
      // Clone the audio to allow overlapping sounds
      const clone = sound.cloneNode() as HTMLAudioElement
      clone.volume = this.sfxVolume
      clone.play().catch(e => {
        console.log(`Sound ${soundName} failed:`, e)
      })
    }
  }

  // Volume Controls
  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    if (this.bgMusic) {
      this.bgMusic.volume = this.musicVolume
    }
  }

  setSfxVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume))
    this.soundEffects.forEach(sound => {
      sound.volume = this.sfxVolume
    })
  }

  // Mute Controls
  toggleMusicMute(): boolean {
    this.musicMuted = !this.musicMuted
    if (this.musicMuted) {
      this.pauseMusic()
    } else {
      this.resumeMusic()
    }
    return this.musicMuted
  }

  toggleSfxMute(): boolean {
    this.sfxMuted = !this.sfxMuted
    return this.sfxMuted
  }

  toggleAllMute(): boolean {
    const mute = !this.musicMuted
    this.musicMuted = mute
    this.sfxMuted = mute
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
    // Some browsers require user interaction before playing audio
    this.playBackgroundMusic()
  }
}

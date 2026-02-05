// Daily Challenges System for DotSlayer
// Provides daily rotating challenges with bonus rewards
// Supports both localStorage (offline) and Supabase (online) storage

import { dailyChallengeService, DailyChallenge as SupabaseDailyChallenge } from '../supabase/DailyChallengeService'

export interface DailyChallenge {
  id: string
  name: string
  description: string
  icon: string
  type: 'kills' | 'floors' | 'damage' | 'gold' | 'combo' | 'boss' | 'no_damage' | 'speed' | 'weapon'
  target: number
  reward: {
    gold: number
    xp?: number
    item?: string
  }
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface ChallengeProgress {
  challengeId: string
  progress: number
  completed: boolean
  claimed: boolean
}

export interface DailyChallengeState {
  date: string // YYYY-MM-DD
  challenges: DailyChallenge[]
  progress: ChallengeProgress[]
  streak: number
  lastCompletedDate: string | null
}

// Challenge templates - randomly selected each day
const CHALLENGE_TEMPLATES: Omit<DailyChallenge, 'id'>[] = [
  // Easy challenges
  { name: 'Warm Up', description: 'Kill 50 enemies', icon: '💀', type: 'kills', target: 50, reward: { gold: 500 }, difficulty: 'easy' },
  { name: 'Floor Explorer', description: 'Complete 5 floors', icon: '🏃', type: 'floors', target: 5, reward: { gold: 600 }, difficulty: 'easy' },
  { name: 'Gold Rush', description: 'Collect 1,000 gold', icon: '💰', type: 'gold', target: 1000, reward: { gold: 400 }, difficulty: 'easy' },
  { name: 'Combo Starter', description: 'Reach a 20x combo', icon: '🔥', type: 'combo', target: 20, reward: { gold: 500 }, difficulty: 'easy' },
  { name: 'Damage Dealer', description: 'Deal 5,000 damage', icon: '💥', type: 'damage', target: 5000, reward: { gold: 450 }, difficulty: 'easy' },

  // Medium challenges
  { name: 'Slayer', description: 'Kill 150 enemies', icon: '⚔️', type: 'kills', target: 150, reward: { gold: 1200 }, difficulty: 'medium' },
  { name: 'Deep Diver', description: 'Complete 15 floors', icon: '🌀', type: 'floors', target: 15, reward: { gold: 1500 }, difficulty: 'medium' },
  { name: 'Wealthy', description: 'Collect 5,000 gold', icon: '🏆', type: 'gold', target: 5000, reward: { gold: 1000 }, difficulty: 'medium' },
  { name: 'Combo Master', description: 'Reach a 50x combo', icon: '⚡', type: 'combo', target: 50, reward: { gold: 1400 }, difficulty: 'medium' },
  { name: 'Devastator', description: 'Deal 25,000 damage', icon: '☄️', type: 'damage', target: 25000, reward: { gold: 1100 }, difficulty: 'medium' },
  { name: 'Boss Hunter', description: 'Defeat 2 bosses', icon: '👹', type: 'boss', target: 2, reward: { gold: 1800 }, difficulty: 'medium' },
  { name: 'Speed Runner', description: 'Complete 10 floors in under 10 minutes', icon: '⏱️', type: 'speed', target: 10, reward: { gold: 2000 }, difficulty: 'medium' },

  // Hard challenges
  { name: 'Exterminator', description: 'Kill 300 enemies', icon: '☠️', type: 'kills', target: 300, reward: { gold: 3000 }, difficulty: 'hard' },
  { name: 'Abyss Walker', description: 'Complete 30 floors', icon: '🕳️', type: 'floors', target: 30, reward: { gold: 3500 }, difficulty: 'hard' },
  { name: 'Untouchable', description: 'Complete 5 floors without taking damage', icon: '🛡️', type: 'no_damage', target: 5, reward: { gold: 4000 }, difficulty: 'hard' },
  { name: 'Combo God', description: 'Reach a 100x combo', icon: '🌟', type: 'combo', target: 100, reward: { gold: 3200 }, difficulty: 'hard' },
  { name: 'Annihilator', description: 'Deal 100,000 damage', icon: '💣', type: 'damage', target: 100000, reward: { gold: 2800 }, difficulty: 'hard' },
  { name: 'Boss Slayer', description: 'Defeat 5 bosses', icon: '🗡️', type: 'boss', target: 5, reward: { gold: 5000 }, difficulty: 'hard' },
]

export class DailyChallengeManager {
  private state: DailyChallengeState
  private onChallengeComplete?: (challenge: DailyChallenge) => void
  private onAllChallengesComplete?: (streak: number) => void
  private userId: string | null = null
  private isOnlineMode: boolean = false
  private pendingSync: boolean = false

  constructor() {
    this.state = this.loadState()
    this.checkAndRefreshChallenges()
  }

  // Set user ID for cloud sync
  setUserId(userId: string | null) {
    this.userId = userId
    this.isOnlineMode = !!userId
    if (userId) {
      this.syncWithCloud()
    }
  }

  // Sync with Supabase
  private async syncWithCloud() {
    if (!this.userId) return

    try {
      const cloudData = await dailyChallengeService.getTodaysChallenges(this.userId)

      // Update local state with cloud data
      this.state.challenges = cloudData.challenges
      this.state.progress = cloudData.progress
      this.state.streak = cloudData.streak
      this.state.date = this.getToday()

      this.saveState()
    } catch (error) {
      console.error('Failed to sync daily challenges with cloud:', error)
    }
  }

  private getToday(): string {
    return new Date().toISOString().split('T')[0]
  }

  private loadState(): DailyChallengeState {
    if (typeof localStorage === 'undefined') {
      return this.createNewState()
    }

    const saved = localStorage.getItem('dotslayer_daily_challenges')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return this.createNewState()
      }
    }
    return this.createNewState()
  }

  private saveState() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('dotslayer_daily_challenges', JSON.stringify(this.state))
    }
  }

  private createNewState(): DailyChallengeState {
    const streak = 0
    return {
      date: this.getToday(),
      challenges: this.generateDailyChallenges(streak),
      progress: [],
      streak,
      lastCompletedDate: null
    }
  }

  private checkAndRefreshChallenges() {
    const today = this.getToday()

    if (this.state.date !== today) {
      // Check if streak continues
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      const allCompletedYesterday = this.state.progress.length === 3 &&
        this.state.progress.every(p => p.completed && p.claimed)

      if (this.state.lastCompletedDate === yesterdayStr && allCompletedYesterday) {
        // Continue streak
        this.state.streak++
      } else if (this.state.lastCompletedDate !== yesterdayStr) {
        // Reset streak
        this.state.streak = 0
      }

      // Generate new challenges
      this.state.date = today
      this.state.challenges = this.generateDailyChallenges()
      this.state.progress = this.state.challenges.map(c => ({
        challengeId: c.id,
        progress: 0,
        completed: false,
        claimed: false
      }))

      this.saveState()
    }
  }

  private generateDailyChallenges(streak?: number): DailyChallenge[] {
    // Use date as seed for consistent daily challenges
    const seed = this.hashDate(this.getToday())
    const rng = this.seededRandom(seed)

    const easy = CHALLENGE_TEMPLATES.filter(c => c.difficulty === 'easy')
    const medium = CHALLENGE_TEMPLATES.filter(c => c.difficulty === 'medium')
    const hard = CHALLENGE_TEMPLATES.filter(c => c.difficulty === 'hard')

    // Pick 1 easy, 1 medium, 1 hard
    const challenges: DailyChallenge[] = [
      { ...easy[Math.floor(rng() * easy.length)], id: 'daily_easy' },
      { ...medium[Math.floor(rng() * medium.length)], id: 'daily_medium' },
      { ...hard[Math.floor(rng() * hard.length)], id: 'daily_hard' },
    ]

    // Apply streak bonus to rewards
    const currentStreak = streak !== undefined ? streak : (this.state?.streak || 0)
    const streakMultiplier = 1 + (currentStreak * 0.1) // +10% per streak day
    challenges.forEach(c => {
      c.reward.gold = Math.floor(c.reward.gold * streakMultiplier)
    })

    return challenges
  }

  private hashDate(date: string): number {
    let hash = 0
    for (let i = 0; i < date.length; i++) {
      const char = date.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
  }

  // Public API
  getChallenges(): DailyChallenge[] {
    this.checkAndRefreshChallenges()
    return this.state.challenges
  }

  getProgress(): ChallengeProgress[] {
    return this.state.progress
  }

  getStreak(): number {
    return this.state.streak
  }

  getTimeUntilReset(): string {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const diff = tomorrow.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours}h ${minutes}m`
  }

  updateProgress(type: DailyChallenge['type'], amount: number) {
    this.checkAndRefreshChallenges()

    this.state.progress.forEach((prog, index) => {
      const challenge = this.state.challenges[index]
      if (challenge.type === type && !prog.completed) {
        prog.progress = Math.min(prog.progress + amount, challenge.target)

        if (prog.progress >= challenge.target) {
          prog.completed = true
          if (this.onChallengeComplete) {
            this.onChallengeComplete(challenge)
          }

          // Check if all challenges complete
          if (this.state.progress.every(p => p.completed)) {
            this.state.lastCompletedDate = this.getToday()
            if (this.onAllChallengesComplete) {
              this.onAllChallengesComplete(this.state.streak)
            }
          }
        }
      }
    })

    this.saveState()

    // Sync with cloud if online
    if (this.isOnlineMode && this.userId) {
      dailyChallengeService.updateProgress(this.userId, type, amount).catch(err => {
        console.error('Failed to sync challenge progress:', err)
      })
    }
  }

  claimReward(challengeId: string): { gold: number } | null {
    const index = this.state.progress.findIndex(p => p.challengeId === challengeId)
    if (index === -1) return null

    const prog = this.state.progress[index]
    const challenge = this.state.challenges[index]

    if (prog.completed && !prog.claimed) {
      prog.claimed = true
      this.saveState()

      // Sync with cloud if online
      if (this.isOnlineMode && this.userId) {
        dailyChallengeService.claimReward(this.userId, challengeId).catch(err => {
          console.error('Failed to sync reward claim:', err)
        })
      }

      return challenge.reward
    }

    return null
  }

  onComplete(callback: (challenge: DailyChallenge) => void) {
    this.onChallengeComplete = callback
  }

  onAllComplete(callback: (streak: number) => void) {
    this.onAllChallengesComplete = callback
  }

  // Get formatted challenge info for UI
  getChallengeInfo(): Array<{
    challenge: DailyChallenge
    progress: number
    target: number
    percentage: number
    completed: boolean
    claimed: boolean
  }> {
    return this.state.challenges.map((challenge, index) => {
      const prog = this.state.progress[index] || { progress: 0, completed: false, claimed: false }
      return {
        challenge,
        progress: prog.progress,
        target: challenge.target,
        percentage: Math.min(100, (prog.progress / challenge.target) * 100),
        completed: prog.completed,
        claimed: prog.claimed
      }
    })
  }
}

// Singleton instance
let dailyChallengeManager: DailyChallengeManager | null = null

export function getDailyChallengeManager(): DailyChallengeManager {
  if (!dailyChallengeManager) {
    dailyChallengeManager = new DailyChallengeManager()
  }
  return dailyChallengeManager
}

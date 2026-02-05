import { supabase, DailyChallengeRecord, DailyChallengeProgress } from './client'

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

export class DailyChallengeService {
  private static instance: DailyChallengeService

  private constructor() {}

  static getInstance(): DailyChallengeService {
    if (!DailyChallengeService.instance) {
      DailyChallengeService.instance = new DailyChallengeService()
    }
    return DailyChallengeService.instance
  }

  private getToday(): string {
    return new Date().toISOString().split('T')[0]
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

  // Generate daily challenges based on date
  generateDailyChallenges(streak: number = 0): DailyChallenge[] {
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

    // Apply streak bonus to rewards (+10% per streak day)
    const streakMultiplier = 1 + (streak * 0.1)
    challenges.forEach(c => {
      c.reward.gold = Math.floor(c.reward.gold * streakMultiplier)
    })

    return challenges
  }

  // Get or create today's challenge record
  async getTodaysChallenges(userId: string): Promise<{
    challenges: DailyChallenge[]
    progress: DailyChallengeProgress[]
    streak: number
  }> {
    try {
      const today = this.getToday()

      // Try to get today's record
      const { data: existing } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_date', today)
        .single()

      if (existing) {
        const record = existing as DailyChallengeRecord
        return {
          challenges: this.generateDailyChallenges(record.streak),
          progress: record.challenges,
          streak: record.streak
        }
      }

      // Check yesterday for streak continuation
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      const { data: yesterdayRecord } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_date', yesterdayStr)
        .single()

      let streak = 0
      if (yesterdayRecord) {
        const yRecord = yesterdayRecord as DailyChallengeRecord
        const allCompleted = yRecord.challenges.length === 3 &&
          yRecord.challenges.every(p => p.completed && p.claimed)
        if (allCompleted) {
          streak = yRecord.streak + 1
        }
      }

      // Generate new challenges
      const challenges = this.generateDailyChallenges(streak)
      const progress: DailyChallengeProgress[] = challenges.map(c => ({
        challengeId: c.id,
        progress: 0,
        completed: false,
        claimed: false
      }))

      // Create today's record
      const { error } = await supabase
        .from('daily_challenges')
        .insert({
          user_id: userId,
          challenge_date: today,
          challenges: progress,
          streak,
          last_completed_date: null
        })

      if (error) {
        console.error('Failed to create daily challenge record:', error)
      }

      return { challenges, progress, streak }
    } catch (error) {
      console.error('Get daily challenges error:', error)
      // Fallback to default
      const challenges = this.generateDailyChallenges(0)
      return {
        challenges,
        progress: challenges.map(c => ({
          challengeId: c.id,
          progress: 0,
          completed: false,
          claimed: false
        })),
        streak: 0
      }
    }
  }

  // Update challenge progress
  async updateProgress(
    userId: string,
    type: DailyChallenge['type'],
    amount: number
  ): Promise<{
    updated: boolean
    completedChallenge?: DailyChallenge
    allComplete?: boolean
  }> {
    try {
      const today = this.getToday()

      // Get today's record
      const { data, error } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_date', today)
        .single()

      if (error || !data) {
        return { updated: false }
      }

      const record = data as DailyChallengeRecord
      const challenges = this.generateDailyChallenges(record.streak)
      let completedChallenge: DailyChallenge | undefined

      // Update progress
      const updatedProgress = record.challenges.map((prog, index) => {
        const challenge = challenges[index]
        if (challenge.type === type && !prog.completed) {
          const newProgress = Math.min(prog.progress + amount, challenge.target)
          const nowCompleted = newProgress >= challenge.target

          if (nowCompleted && !prog.completed) {
            completedChallenge = challenge
          }

          return {
            ...prog,
            progress: newProgress,
            completed: nowCompleted
          }
        }
        return prog
      })

      // Check if all complete
      const allComplete = updatedProgress.every(p => p.completed)

      // Update database
      const updateData: Partial<DailyChallengeRecord> = {
        challenges: updatedProgress
      }

      if (allComplete && !record.last_completed_date) {
        updateData.last_completed_date = today
      }

      await supabase
        .from('daily_challenges')
        .update(updateData)
        .eq('user_id', userId)
        .eq('challenge_date', today)

      return {
        updated: true,
        completedChallenge,
        allComplete
      }
    } catch (error) {
      console.error('Update progress error:', error)
      return { updated: false }
    }
  }

  // Claim reward for completed challenge
  async claimReward(userId: string, challengeId: string): Promise<{
    success: boolean
    reward?: { gold: number }
  }> {
    try {
      const today = this.getToday()

      const { data } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_date', today)
        .single()

      if (!data) return { success: false }

      const record = data as DailyChallengeRecord
      const challenges = this.generateDailyChallenges(record.streak)

      const challengeIndex = record.challenges.findIndex(p => p.challengeId === challengeId)
      if (challengeIndex === -1) return { success: false }

      const progress = record.challenges[challengeIndex]
      const challenge = challenges[challengeIndex]

      if (!progress.completed || progress.claimed) {
        return { success: false }
      }

      // Mark as claimed
      const updatedProgress = [...record.challenges]
      updatedProgress[challengeIndex] = { ...progress, claimed: true }

      await supabase
        .from('daily_challenges')
        .update({ challenges: updatedProgress })
        .eq('user_id', userId)
        .eq('challenge_date', today)

      return {
        success: true,
        reward: challenge.reward
      }
    } catch (error) {
      console.error('Claim reward error:', error)
      return { success: false }
    }
  }

  // Get time until reset
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

  // Get challenge templates (for local-only use)
  getChallengeTemplates(): Omit<DailyChallenge, 'id'>[] {
    return CHALLENGE_TEMPLATES
  }
}

export const dailyChallengeService = DailyChallengeService.getInstance()

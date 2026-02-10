// Weekly Challenges System for DotSlayer
// Epic week-long challenges with massive rewards
// Complements the daily challenge system

export interface WeeklyChallenge {
  id: string
  name: string
  description: string
  icon: string
  type: 'kills' | 'floors' | 'damage' | 'gold' | 'combo' | 'boss' | 'no_damage' | 'victories' | 'playtime' | 'perfect_floors'
  target: number
  reward: {
    gold: number
    xp?: number
    title?: string
    badge?: string
  }
  tier: 'bronze' | 'silver' | 'gold' | 'diamond'
}

export interface WeeklyChallengeProgress {
  challengeId: string
  progress: number
  completed: boolean
  claimed: boolean
}

export interface WeeklyChallengeState {
  weekStart: string // YYYY-MM-DD (Monday of the week)
  weekEnd: string   // YYYY-MM-DD (Sunday of the week)
  challenges: WeeklyChallenge[]
  progress: WeeklyChallengeProgress[]
  weeksCompleted: number
  totalWeeklyRewardsClaimed: number
}

// Weekly challenge templates - much bigger goals than daily
const WEEKLY_CHALLENGE_TEMPLATES: Omit<WeeklyChallenge, 'id'>[] = [
  // Bronze tier (achievable by most players)
  { name: 'Weekly Warrior', description: 'Kill 500 enemies this week', icon: '🗡️', type: 'kills', target: 500, reward: { gold: 5000, badge: 'warrior' }, tier: 'bronze' },
  { name: 'Tower Climber', description: 'Complete 50 floors this week', icon: '🏔️', type: 'floors', target: 50, reward: { gold: 6000, badge: 'climber' }, tier: 'bronze' },
  { name: 'Gold Collector', description: 'Collect 25,000 gold this week', icon: '💰', type: 'gold', target: 25000, reward: { gold: 4000, badge: 'collector' }, tier: 'bronze' },
  { name: 'Combo Enthusiast', description: 'Reach 50x combo 10 times', icon: '🔥', type: 'combo', target: 10, reward: { gold: 5500, badge: 'combo' }, tier: 'bronze' },

  // Silver tier (requires dedicated play)
  { name: 'Slaughter Master', description: 'Kill 1,500 enemies this week', icon: '☠️', type: 'kills', target: 1500, reward: { gold: 15000, title: 'Slaughter Master' }, tier: 'silver' },
  { name: 'Deep Explorer', description: 'Complete 100 floors this week', icon: '🌀', type: 'floors', target: 100, reward: { gold: 18000, title: 'Deep Explorer' }, tier: 'silver' },
  { name: 'Boss Crusher', description: 'Defeat 20 bosses this week', icon: '👹', type: 'boss', target: 20, reward: { gold: 20000, title: 'Boss Crusher' }, tier: 'silver' },
  { name: 'Damage Dealer', description: 'Deal 500,000 damage this week', icon: '💥', type: 'damage', target: 500000, reward: { gold: 16000, title: 'Damage Dealer' }, tier: 'silver' },

  // Gold tier (hardcore players)
  { name: 'Extinction Event', description: 'Kill 5,000 enemies this week', icon: '🌋', type: 'kills', target: 5000, reward: { gold: 50000, title: 'Extinction Event', badge: 'extinction' }, tier: 'gold' },
  { name: 'Floor Conqueror', description: 'Complete 200 floors this week', icon: '🏰', type: 'floors', target: 200, reward: { gold: 60000, title: 'Floor Conqueror', badge: 'conqueror' }, tier: 'gold' },
  { name: 'Untouchable', description: 'Complete 25 perfect floors (no damage)', icon: '🛡️', type: 'perfect_floors', target: 25, reward: { gold: 75000, title: 'Untouchable', badge: 'perfect' }, tier: 'gold' },
  { name: 'Champion', description: 'Win 5 complete games this week', icon: '🏆', type: 'victories', target: 5, reward: { gold: 80000, title: 'Champion', badge: 'champion' }, tier: 'gold' },

  // Diamond tier (elite players only)
  { name: 'Genocide', description: 'Kill 10,000 enemies this week', icon: '💀', type: 'kills', target: 10000, reward: { gold: 150000, title: 'The Genocide', badge: 'genocide' }, tier: 'diamond' },
  { name: 'Tower Master', description: 'Complete 500 floors this week', icon: '👑', type: 'floors', target: 500, reward: { gold: 200000, title: 'Tower Master', badge: 'tower_master' }, tier: 'diamond' },
  { name: 'Speedrun Legend', description: 'Win 10 games this week', icon: '⚡', type: 'victories', target: 10, reward: { gold: 250000, title: 'Speedrun Legend', badge: 'speedrun' }, tier: 'diamond' },
  { name: 'Dedicated Player', description: 'Play for 10 hours this week', icon: '⏰', type: 'playtime', target: 600, reward: { gold: 100000, title: 'Dedicated', badge: 'dedicated' }, tier: 'diamond' },
]

export class WeeklyChallengeManager {
  private state: WeeklyChallengeState
  private onChallengeComplete?: (challenge: WeeklyChallenge) => void
  private onAllChallengesComplete?: (weeksCompleted: number) => void

  constructor() {
    this.state = this.loadState()
    this.checkAndRefreshChallenges()
  }

  private getWeekBounds(): { start: string; end: string } {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

    const monday = new Date(now)
    monday.setDate(now.getDate() + diffToMonday)
    monday.setHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0]
    }
  }

  private loadState(): WeeklyChallengeState {
    if (typeof localStorage === 'undefined') {
      return this.createNewState()
    }

    const saved = localStorage.getItem('dotslayer_weekly_challenges')
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
      localStorage.setItem('dotslayer_weekly_challenges', JSON.stringify(this.state))
    }
  }

  private createNewState(): WeeklyChallengeState {
    const bounds = this.getWeekBounds()
    return {
      weekStart: bounds.start,
      weekEnd: bounds.end,
      challenges: this.generateWeeklyChallenges(bounds.start),
      progress: [],
      weeksCompleted: 0,
      totalWeeklyRewardsClaimed: 0
    }
  }

  private checkAndRefreshChallenges() {
    const bounds = this.getWeekBounds()

    if (this.state.weekStart !== bounds.start) {
      // New week - check if last week's challenges were all completed
      const allCompleted = this.state.progress.length > 0 &&
        this.state.progress.every(p => p.completed && p.claimed)

      if (allCompleted) {
        this.state.weeksCompleted++
      }

      // Generate new challenges
      this.state.weekStart = bounds.start
      this.state.weekEnd = bounds.end
      this.state.challenges = this.generateWeeklyChallenges(bounds.start)
      this.state.progress = this.state.challenges.map(c => ({
        challengeId: c.id,
        progress: 0,
        completed: false,
        claimed: false
      }))

      this.saveState()
    }
  }

  private generateWeeklyChallenges(weekStart: string): WeeklyChallenge[] {
    // Use week start date as seed for consistent weekly challenges
    const seed = this.hashDate(weekStart)
    const rng = this.seededRandom(seed)

    const bronze = WEEKLY_CHALLENGE_TEMPLATES.filter(c => c.tier === 'bronze')
    const silver = WEEKLY_CHALLENGE_TEMPLATES.filter(c => c.tier === 'silver')
    const gold = WEEKLY_CHALLENGE_TEMPLATES.filter(c => c.tier === 'gold')
    const diamond = WEEKLY_CHALLENGE_TEMPLATES.filter(c => c.tier === 'diamond')

    // Pick 2 bronze, 2 silver, 1 gold, 1 diamond
    const challenges: WeeklyChallenge[] = [
      { ...bronze[Math.floor(rng() * bronze.length)], id: 'weekly_bronze_1' },
      { ...bronze[Math.floor(rng() * bronze.length)], id: 'weekly_bronze_2' },
      { ...silver[Math.floor(rng() * silver.length)], id: 'weekly_silver_1' },
      { ...silver[Math.floor(rng() * silver.length)], id: 'weekly_silver_2' },
      { ...gold[Math.floor(rng() * gold.length)], id: 'weekly_gold' },
      { ...diamond[Math.floor(rng() * diamond.length)], id: 'weekly_diamond' },
    ]

    // Ensure no duplicate challenge types
    const usedTypes = new Set<string>()
    const uniqueChallenges: WeeklyChallenge[] = []

    for (const challenge of challenges) {
      if (!usedTypes.has(challenge.type)) {
        usedTypes.add(challenge.type)
        uniqueChallenges.push(challenge)
      } else {
        // Find alternative from same tier
        const tier = WEEKLY_CHALLENGE_TEMPLATES.filter(c =>
          c.tier === challenge.tier && !usedTypes.has(c.type)
        )
        if (tier.length > 0) {
          const alt = tier[Math.floor(rng() * tier.length)]
          usedTypes.add(alt.type)
          uniqueChallenges.push({ ...alt, id: challenge.id })
        }
      }
    }

    return uniqueChallenges
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
  getChallenges(): WeeklyChallenge[] {
    this.checkAndRefreshChallenges()
    return this.state.challenges
  }

  getProgress(): WeeklyChallengeProgress[] {
    return this.state.progress
  }

  getWeeksCompleted(): number {
    return this.state.weeksCompleted
  }

  getTimeUntilReset(): string {
    const now = new Date()
    const bounds = this.getWeekBounds()
    const endDate = new Date(bounds.end + 'T23:59:59')

    const diff = endDate.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) {
      return `${days}d ${hours}h`
    }
    return `${hours}h`
  }

  updateProgress(type: WeeklyChallenge['type'], amount: number) {
    this.checkAndRefreshChallenges()

    this.state.progress.forEach((prog, index) => {
      const challenge = this.state.challenges[index]
      if (challenge && challenge.type === type && !prog.completed) {
        prog.progress = Math.min(prog.progress + amount, challenge.target)

        if (prog.progress >= challenge.target) {
          prog.completed = true
          if (this.onChallengeComplete) {
            this.onChallengeComplete(challenge)
          }

          // Check if all challenges complete
          if (this.state.progress.every(p => p.completed)) {
            if (this.onAllChallengesComplete) {
              this.onAllChallengesComplete(this.state.weeksCompleted)
            }
          }
        }
      }
    })

    this.saveState()
  }

  claimReward(challengeId: string): WeeklyChallenge['reward'] | null {
    const index = this.state.progress.findIndex(p => p.challengeId === challengeId)
    if (index === -1) return null

    const prog = this.state.progress[index]
    const challenge = this.state.challenges[index]

    if (prog.completed && !prog.claimed) {
      prog.claimed = true
      this.state.totalWeeklyRewardsClaimed++
      this.saveState()
      return challenge.reward
    }

    return null
  }

  onComplete(callback: (challenge: WeeklyChallenge) => void) {
    this.onChallengeComplete = callback
  }

  onAllComplete(callback: (weeksCompleted: number) => void) {
    this.onAllChallengesComplete = callback
  }

  // Get formatted challenge info for UI
  getChallengeInfo(): Array<{
    challenge: WeeklyChallenge
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

  getTierColor(tier: WeeklyChallenge['tier']): string {
    switch (tier) {
      case 'bronze': return '#cd7f32'
      case 'silver': return '#c0c0c0'
      case 'gold': return '#ffd700'
      case 'diamond': return '#b9f2ff'
      default: return '#ffffff'
    }
  }
}

// Singleton instance
let weeklyChallengeManager: WeeklyChallengeManager | null = null

export function getWeeklyChallengeManager(): WeeklyChallengeManager {
  if (!weeklyChallengeManager) {
    weeklyChallengeManager = new WeeklyChallengeManager()
  }
  return weeklyChallengeManager
}

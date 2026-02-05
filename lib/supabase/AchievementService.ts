import { supabase, AchievementRecord } from './client'

export class AchievementService {
  private static instance: AchievementService

  private constructor() {}

  static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService()
    }
    return AchievementService.instance
  }

  // Get user's unlocked achievements
  async getUnlocked(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('unlocked')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        // Create record if doesn't exist
        await this.ensureRecord(userId)
        return []
      }

      return (data.unlocked as string[]) || []
    } catch (error) {
      console.error('Get achievements error:', error)
      return []
    }
  }

  // Ensure user has achievement record
  private async ensureRecord(userId: string): Promise<void> {
    try {
      await supabase
        .from('achievements')
        .upsert({
          user_id: userId,
          unlocked: [],
          unlocked_count: 0
        }, {
          onConflict: 'user_id'
        })
    } catch (error) {
      console.error('Ensure achievement record error:', error)
    }
  }

  // Unlock an achievement
  async unlock(userId: string, achievementId: string): Promise<boolean> {
    try {
      // Get current achievements
      const { data } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!data) {
        // Create new record with this achievement
        const { error } = await supabase
          .from('achievements')
          .insert({
            user_id: userId,
            unlocked: [achievementId],
            unlocked_count: 1
          })

        return !error
      }

      const record = data as AchievementRecord
      const unlocked = record.unlocked || []

      // Check if already unlocked
      if (unlocked.includes(achievementId)) {
        return false
      }

      // Add new achievement
      const newUnlocked = [...unlocked, achievementId]

      const { error } = await supabase
        .from('achievements')
        .update({
          unlocked: newUnlocked,
          unlocked_count: newUnlocked.length
        })
        .eq('user_id', userId)

      return !error
    } catch (error) {
      console.error('Unlock achievement error:', error)
      return false
    }
  }

  // Sync multiple achievements at once
  async syncAchievements(userId: string, achievementIds: string[]): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('achievements')
        .select('unlocked')
        .eq('user_id', userId)
        .single()

      const existing = (data?.unlocked as string[]) || []
      const allAchievements = existing.concat(achievementIds)
      const merged = allAchievements.filter((id, index) => allAchievements.indexOf(id) === index)

      const { error } = await supabase
        .from('achievements')
        .upsert({
          user_id: userId,
          unlocked: merged,
          unlocked_count: merged.length
        }, {
          onConflict: 'user_id'
        })

      return !error
    } catch (error) {
      console.error('Sync achievements error:', error)
      return false
    }
  }

  // Get leaderboard of most achievements
  async getLeaderboard(limit: number = 10): Promise<Array<{
    user_id: string
    unlocked_count: number
  }>> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('user_id, unlocked_count')
        .order('unlocked_count', { ascending: false })
        .limit(limit)

      if (error || !data) return []
      return data
    } catch (error) {
      console.error('Get achievement leaderboard error:', error)
      return []
    }
  }
}

export const achievementService = AchievementService.getInstance()

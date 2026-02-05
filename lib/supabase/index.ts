// Supabase Services - Central Export

export { supabase } from './client'
export type {
  UserProfile,
  SlayerSave,
  SlayerProgress,
  ClickerSave,
  LeaderboardEntry,
  SaveData,
  DailyChallengeRecord,
  DailyChallengeProgress,
  AchievementRecord,
  SlayerStats
} from './client'

export { SaveManager, saveManager } from './SaveManager'
export { LeaderboardService, leaderboardService } from './LeaderboardService'
export { ClickerSyncService, clickerSyncService } from './ClickerSyncService'
export type { ClickerGameState } from './ClickerSyncService'
export { SlayerProgressService, slayerProgressService } from './SlayerProgressService'

// New tracking services
export { DailyChallengeService, dailyChallengeService } from './DailyChallengeService'
export type { DailyChallenge } from './DailyChallengeService'
export { AchievementService, achievementService } from './AchievementService'
export { SlayerStatsService, slayerStatsService } from './SlayerStatsService'
export type { RunStats } from './SlayerStatsService'

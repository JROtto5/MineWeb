// Supabase Services - Central Export

export { supabase } from './client'
export type {
  UserProfile,
  SlayerSave,
  SlayerProgress,
  ClickerSave,
  LeaderboardEntry,
  SaveData
} from './client'

export { SaveManager, saveManager } from './SaveManager'
export { LeaderboardService, leaderboardService } from './LeaderboardService'
export { ClickerSyncService, clickerSyncService } from './ClickerSyncService'
export type { ClickerGameState } from './ClickerSyncService'
export { SlayerProgressService, slayerProgressService } from './SlayerProgressService'

import { supabase, SlayerSave } from './client'
import Player from '../game/Player'
import { ShopManager } from '../game/ShopSystem'
import { SkillTreeManager } from '../game/SkillTree'

export class SaveManager {
  private static instance: SaveManager

  private constructor() {}

  static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager()
    }
    return SaveManager.instance
  }

  // Save game to cloud
  async saveGame(
    userId: string,
    saveSlot: number,
    player: Player,
    floorNumber: number,
    shopManager: ShopManager,
    runStats?: {
      totalKills: number
      totalMoney: number
      highestCombo: number
      bossesKilled: number
      startTime: number
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const saveData: Partial<SlayerSave> = {
        user_id: userId,
        save_slot: saveSlot,
        player_data: {
          level: player.level,
          money: player.money,
          xp: player.xp,
          health: player.health,
          maxHealth: player.maxHealth,
          skillPoints: player.skillPoints,
          skills: this.serializeSkills(player.skillTree),
          shopItems: this.serializeShop(shopManager),
          currentWeapon: player.getCurrentWeapon(),
        },
        floor_number: floorNumber,
        is_alive: true,
        run_stats: runStats || {}
      }

      // Upsert - insert or update based on user_id + save_slot
      const { error } = await supabase
        .from('slayer_saves')
        .upsert(saveData, {
          onConflict: 'user_id,save_slot'
        })

      if (error) throw error

      return {
        success: true,
        message: `Game saved to slot ${saveSlot}!`,
      }
    } catch (error: any) {
      console.error('Save error:', error)
      return {
        success: false,
        message: `Failed to save: ${error.message}`,
      }
    }
  }

  // Load game from cloud
  async loadGame(
    userId: string,
    saveSlot: number
  ): Promise<{ success: boolean; data?: SlayerSave; message: string }> {
    try {
      const { data, error } = await supabase
        .from('slayer_saves')
        .select('*')
        .eq('user_id', userId)
        .eq('save_slot', saveSlot)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            message: `No save found in slot ${saveSlot}`,
          }
        }
        throw error
      }

      if (!data) {
        return {
          success: false,
          message: `No save found in slot ${saveSlot}`,
        }
      }

      return {
        success: true,
        data: data as SlayerSave,
        message: `Game loaded from slot ${saveSlot}!`,
      }
    } catch (error: any) {
      console.error('Load error:', error)
      return {
        success: false,
        message: `Failed to load: ${error.message}`,
      }
    }
  }

  // List all saves for a user
  async listSaves(userId: string): Promise<SlayerSave[]> {
    try {
      const { data, error } = await supabase
        .from('slayer_saves')
        .select('*')
        .eq('user_id', userId)
        .order('save_slot')

      if (error) throw error
      return (data as SlayerSave[]) || []
    } catch (error) {
      console.error('List saves error:', error)
      return []
    }
  }

  // Delete a save
  async deleteSave(
    userId: string,
    saveSlot: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('slayer_saves')
        .delete()
        .eq('user_id', userId)
        .eq('save_slot', saveSlot)

      if (error) throw error

      return {
        success: true,
        message: `Save slot ${saveSlot} deleted!`,
      }
    } catch (error: any) {
      console.error('Delete error:', error)
      return {
        success: false,
        message: `Failed to delete: ${error.message}`,
      }
    }
  }

  // Mark a save as dead
  async markSaveDead(
    userId: string,
    saveSlot: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('slayer_saves')
        .update({ is_alive: false })
        .eq('user_id', userId)
        .eq('save_slot', saveSlot)

      if (error) throw error

      return {
        success: true,
        message: `Save slot ${saveSlot} marked as dead`,
      }
    } catch (error: any) {
      console.error('Mark dead error:', error)
      return {
        success: false,
        message: `Failed to mark dead: ${error.message}`,
      }
    }
  }

  // Apply loaded save data to player
  applySaveData(saveData: SlayerSave, player: Player, shopManager: ShopManager) {
    const pd = saveData.player_data

    player.level = pd.level
    player.money = pd.money
    player.xp = pd.xp
    player.health = pd.health
    player.maxHealth = pd.maxHealth
    player.skillPoints = pd.skillPoints
    player.setCurrentWeapon(pd.currentWeapon)

    // Restore skills
    Object.entries(pd.skills).forEach(([skillId, level]) => {
      for (let i = 0; i < level; i++) {
        player.skillTree.upgradeSkill(skillId)
      }
    })

    // Restore shop items
    Object.entries(pd.shopItems).forEach(([itemId, level]) => {
      for (let i = 0; i < level; i++) {
        shopManager.purchase(itemId)
      }
    })

    // Apply bonuses
    player.applySkillBonuses()
    player.applyShopBonuses(shopManager)
  }

  private serializeSkills(skillTree: SkillTreeManager): Record<string, number> {
    const skills: Record<string, number> = {}
    const allSkills = skillTree.getAllSkills()
    allSkills.forEach(({ skill, level }) => {
      if (level > 0) {
        skills[skill.id] = level
      }
    })
    return skills
  }

  private serializeShop(shopManager: ShopManager): Record<string, number> {
    const items: Record<string, number> = {}
    const allItems = shopManager.getAllItems()
    allItems.forEach(({ item, level }) => {
      if (level > 0) {
        items[item.id] = level
      }
    })
    return items
  }
}

// Export singleton and type
export const saveManager = SaveManager.getInstance()

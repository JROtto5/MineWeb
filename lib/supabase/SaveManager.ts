import { supabase, SaveData } from './client'
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
    playerName: string,
    saveSlot: number,
    player: Player,
    stageNumber: number,
    shopManager: ShopManager
  ): Promise<{ success: boolean; message: string }> {
    try {
      const saveData: SaveData = {
        player_name: playerName,
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
        stage_number: stageNumber,
        is_alive: true,
      }

      // Check if save slot already exists
      const { data: existing } = await supabase
        .from('saves')
        .select('id')
        .eq('player_name', playerName)
        .eq('save_slot', saveSlot)
        .single()

      if (existing) {
        // Update existing save
        const { error } = await supabase
          .from('saves')
          .update(saveData)
          .eq('id', existing.id)

        if (error) throw error
      } else {
        // Create new save
        const { error } = await supabase.from('saves').insert(saveData)

        if (error) throw error
      }

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
    playerName: string,
    saveSlot: number
  ): Promise<{ success: boolean; data?: SaveData; message: string }> {
    try {
      const { data, error } = await supabase
        .from('saves')
        .select('*')
        .eq('player_name', playerName)
        .eq('save_slot', saveSlot)
        .single()

      if (error) throw error

      if (!data) {
        return {
          success: false,
          message: `No save found in slot ${saveSlot}`,
        }
      }

      return {
        success: true,
        data: data as SaveData,
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

  // List all saves for a player
  async listSaves(playerName: string): Promise<SaveData[]> {
    try {
      const { data, error } = await supabase
        .from('saves')
        .select('*')
        .eq('player_name', playerName)
        .order('save_slot')

      if (error) throw error
      return (data as SaveData[]) || []
    } catch (error) {
      console.error('List saves error:', error)
      return []
    }
  }

  // Delete a save
  async deleteSave(
    playerName: string,
    saveSlot: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('saves')
        .delete()
        .eq('player_name', playerName)
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

  // Mark a save as dead (player died)
  async markSaveDead(
    playerName: string,
    saveSlot: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('saves')
        .update({ is_alive: false })
        .eq('player_name', playerName)
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
  applySaveData(saveData: SaveData, player: Player, shopManager: ShopManager) {
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
    // Get all skill levels
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
    // Get all purchased items with their levels
    const allItems = shopManager.getAllItems()
    allItems.forEach(({ item, level }) => {
      if (level > 0) {
        items[item.id] = level
      }
    })
    return items
  }
}

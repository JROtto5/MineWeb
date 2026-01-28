import Phaser from 'phaser'

interface SlotMachineResult {
  symbols: string[]
  payout: number
  isWin: boolean
}

export class CasinoManager {
  private scene: Phaser.Scene

  private slotSymbols = ['🍒', '🍋', '🍊', '💎', '7️⃣', '⭐']
  private slotPayouts = {
    '🍒': 2,
    '🍋': 3,
    '🍊': 5,
    '💎': 10,
    '7️⃣': 20,
    '⭐': 50,
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  // Slot Machine
  spinSlots(betAmount: number): SlotMachineResult {
    const symbols: string[] = []

    // Spin 3 reels
    for (let i = 0; i < 3; i++) {
      const randomIndex = Phaser.Math.Between(0, this.slotSymbols.length - 1)
      symbols.push(this.slotSymbols[randomIndex])
    }

    // Check for win
    let payout = 0
    let isWin = false

    // Three of a kind
    if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
      const symbol = symbols[0] as keyof typeof this.slotPayouts
      payout = betAmount * this.slotPayouts[symbol]
      isWin = true
    }
    // Two of a kind (smaller payout)
    else if (symbols[0] === symbols[1] || symbols[1] === symbols[2] || symbols[0] === symbols[2]) {
      payout = Math.floor(betAmount * 1.5)
      isWin = true
    }

    return { symbols, payout, isWin }
  }

  // Blackjack (simplified)
  playBlackjack(betAmount: number): { playerHand: number; dealerHand: number; result: string; payout: number } {
    const drawCard = () => Phaser.Math.Between(1, 11)

    let playerHand = drawCard() + drawCard()
    let dealerHand = drawCard() + drawCard()

    // Player bust
    if (playerHand > 21) {
      return { playerHand, dealerHand, result: 'Bust! You lose', payout: 0 }
    }

    // Dealer bust
    if (dealerHand > 21) {
      return { playerHand, dealerHand, result: 'Dealer busts! You win!', payout: betAmount * 2 }
    }

    // Compare hands
    if (playerHand > dealerHand) {
      return { playerHand, dealerHand, result: 'You win!', payout: betAmount * 2 }
    } else if (dealerHand > playerHand) {
      return { playerHand, dealerHand, result: 'Dealer wins', payout: 0 }
    } else {
      return { playerHand, dealerHand, result: 'Push (tie)', payout: betAmount }
    }
  }

  // Roulette (simplified - just red/black)
  spinRouletteWheel(betAmount: number, betOn: 'red' | 'black'): { result: 'red' | 'black'; payout: number; isWin: boolean } {
    const result = Math.random() > 0.5 ? 'red' : 'black'
    const isWin = result === betOn

    return {
      result,
      payout: isWin ? betAmount * 2 : 0,
      isWin,
    }
  }

  // Loot box (random reward)
  openLootBox(cost: number): { reward: string; value: number; rarity: string } {
    const rarityRoll = Math.random()

    let rarity: string
    let multiplier: number

    if (rarityRoll < 0.01) {
      // 1% legendary
      rarity = 'Legendary'
      multiplier = 100
    } else if (rarityRoll < 0.05) {
      // 4% epic
      rarity = 'Epic'
      multiplier = 20
    } else if (rarityRoll < 0.20) {
      // 15% rare
      rarity = 'Rare'
      multiplier = 5
    } else if (rarityRoll < 0.50) {
      // 30% uncommon
      rarity = 'Uncommon'
      multiplier = 2
    } else {
      // 50% common
      rarity = 'Common'
      multiplier = 0.5
    }

    const value = Math.floor(cost * multiplier)

    const rewards = {
      'Legendary': '💎 Diamond Cache',
      'Epic': '🏆 Gold Stash',
      'Rare': '💰 Money Bag',
      'Uncommon': '💵 Cash Bundle',
      'Common': '🪙 Coins',
    }

    return {
      reward: rewards[rarity as keyof typeof rewards],
      value,
      rarity,
    }
  }
}

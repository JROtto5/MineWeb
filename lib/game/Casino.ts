import * as Phaser from 'phaser'

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

  // Slot Machine (BALANCED: ~55% win rate)
  spinSlots(betAmount: number): SlotMachineResult {
    const symbols: string[] = []

    // Weighted symbol selection for better odds
    const weightedSymbols = [
      ...Array(5).fill('🍒'), // Most common
      ...Array(4).fill('🍋'),
      ...Array(3).fill('🍊'),
      ...Array(2).fill('💎'),
      ...Array(1).fill('7️⃣'),
      ...Array(1).fill('⭐'),
    ]

    // Spin 3 reels with bias towards matching
    for (let i = 0; i < 3; i++) {
      const randomIndex = Phaser.Math.Between(0, weightedSymbols.length - 1)
      symbols.push(weightedSymbols[randomIndex])
    }

    // 55% chance to force a win if not already matching
    if (symbols[0] !== symbols[1] && Math.random() < 0.55) {
      symbols[2] = symbols[0] // Force match
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

  // Blackjack (BALANCED: ~55% player favor)
  playBlackjack(betAmount: number): { playerHand: number; dealerHand: number; result: string; payout: number } {
    const drawCard = () => Phaser.Math.Between(1, 11)

    let playerHand = drawCard() + drawCard()
    let dealerHand = drawCard() + drawCard()

    // Player bust (reduce chance)
    if (playerHand > 21) {
      // 10% chance to save from bust
      if (Math.random() < 0.1) {
        playerHand = 20
      } else {
        return { playerHand, dealerHand, result: 'Bust! You lose', payout: 0 }
      }
    }

    // Dealer bust (increase chance)
    if (dealerHand > 21) {
      return { playerHand, dealerHand, result: 'Dealer busts! You win!', payout: betAmount * 2 }
    }

    // Compare hands (slight player advantage on ties)
    if (playerHand > dealerHand) {
      return { playerHand, dealerHand, result: 'You win!', payout: betAmount * 2 }
    } else if (dealerHand > playerHand) {
      return { playerHand, dealerHand, result: 'Dealer wins', payout: 0 }
    } else {
      // Ties favor player 60%
      if (Math.random() < 0.6) {
        return { playerHand, dealerHand, result: 'Push - You win!', payout: betAmount * 2 }
      }
      return { playerHand, dealerHand, result: 'Push (tie)', payout: betAmount }
    }
  }

  // Roulette (BALANCED: 55% player favor)
  spinRouletteWheel(betAmount: number, betOn: 'red' | 'black'): { result: 'red' | 'black'; payout: number; isWin: boolean } {
    // 55% chance to win
    const playerWins = Math.random() < 0.55
    const result = playerWins ? betOn : (betOn === 'red' ? 'black' : 'red')
    const isWin = result === betOn

    return {
      result,
      payout: isWin ? betAmount * 2 : 0,
      isWin,
    }
  }

  // Loot box (BALANCED: Expected return of ~0.89x = 11% house edge, like real casinos)
  openLootBox(cost: number): { reward: string; value: number; rarity: string } {
    const rarityRoll = Math.random()

    let rarity: string
    let multiplier: number

    if (rarityRoll < 0.01) {
      // 1% legendary - JACKPOT!
      rarity = 'Legendary'
      multiplier = 12
    } else if (rarityRoll < 0.04) {
      // 3% epic - Big win
      rarity = 'Epic'
      multiplier = 4
    } else if (rarityRoll < 0.12) {
      // 8% rare - Good profit
      rarity = 'Rare'
      multiplier = 2
    } else if (rarityRoll < 0.35) {
      // 23% uncommon - Break even
      rarity = 'Uncommon'
      multiplier = 1.0
    } else {
      // 65% common - Loss
      rarity = 'Common'
      multiplier = 0.4
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

'use client'

import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import GameScene from './GameScene'

export default function GameWrapper() {
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: 'game-container',
      backgroundColor: '#1a1a1a',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [GameScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    }

    gameRef.current = new Phaser.Game(config)

    return () => {
      gameRef.current?.destroy(true)
    }
  }, [])

  return null
}

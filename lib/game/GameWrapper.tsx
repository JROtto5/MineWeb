'use client'

import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import MenuScene from './MenuScene'
import GameSceneV3 from './GameSceneV3'
import { useAuth } from '../context/AuthContext'

export default function GameWrapper() {
  const gameRef = useRef<Phaser.Game | null>(null)
  const { user } = useAuth()

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
      scene: [MenuScene, GameSceneV3],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    }

    gameRef.current = new Phaser.Game(config)

    // Pass user data to Phaser game registry
    if (user && gameRef.current) {
      gameRef.current.registry.set('currentUser', {
        id: user.id,
        email: user.email,
        displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Player'
      })
    }

    return () => {
      gameRef.current?.destroy(true)
    }
  }, [user])

  return null
}

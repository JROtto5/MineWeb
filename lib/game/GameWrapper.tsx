'use client'

import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import MenuScene from './MenuScene'
import GameSceneV3 from './GameSceneV3'
import { useAuth } from '../context/AuthContext'
import { AudioManager } from './AudioManager'

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
      // Cleanup before destroying: save game and stop music
      if (gameRef.current) {
        // Stop music immediately via AudioManager singleton
        const audioManager = AudioManager.getInstance()
        audioManager.cleanup()

        // Try to trigger save from the active GameSceneV3 scene
        const gameScene = gameRef.current.scene.getScene('GameSceneV3') as GameSceneV3
        if (gameScene && gameScene.scene.isActive()) {
          // Fire and forget - the save will complete in background
          gameScene.cleanupBeforeExit().catch(err => {
            console.warn('Cleanup save failed:', err)
          })
        }

        gameRef.current.destroy(true)
      }
    }
  }, [user])

  return null
}

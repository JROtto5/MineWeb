'use client'

import { useEffect, useRef, useState } from 'react'
import { Game } from '@/lib/engine/Game'

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showClickToStart, setShowClickToStart] = useState(true)
  const [fps, setFps] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 })
  const [chunksLoaded, setChunksLoaded] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState(0)

  const blockTypes = [
    { name: 'Grass', color: '#32DC46' },
    { name: 'Dirt', color: '#A06432' },
    { name: 'Stone', color: '#8C8C91' },
    { name: 'Sand', color: '#FAE6B4' },
    { name: 'Wood', color: '#966428' },
  ]

  useEffect(() => {
    if (!canvasRef.current) return

    // Create game instance
    const game = new Game(canvasRef.current)
    gameRef.current = game

    // Initialize game
    game.init().then(() => {
      console.log('Game initialized!')
      setIsLoading(false)
    })

    // Update debug info
    const debugInterval = setInterval(() => {
      if (game.isRunning) {
        setFps(game.getFPS())
        setPosition(game.getPlayerPosition())
        setChunksLoaded(game.getChunksLoaded())
        setSelectedSlot(game.getSelectedSlot())
      }
    }, 100)

    // Keyboard shortcuts for hotbar selection
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = parseInt(e.key)
      if (key >= 1 && key <= 5) {
        game.selectSlot(key - 1)
        setSelectedSlot(key - 1)
      }
    }
    window.addEventListener('keydown', handleKeyPress)

    // Cleanup
    return () => {
      clearInterval(debugInterval)
      window.removeEventListener('keydown', handleKeyPress)
      game.dispose()
    }
  }, [])

  const handleClickToStart = () => {
    if (gameRef.current && !isLoading) {
      gameRef.current.start()
      setShowClickToStart(false)

      // Request pointer lock
      canvasRef.current?.requestPointerLock()
    }
  }

  return (
    <main>
      <canvas ref={canvasRef} />

      <div id="ui-overlay">
        {/* Crosshair */}
        {!showClickToStart && !isLoading && <div id="crosshair" />}

        {/* Debug Info */}
        {!showClickToStart && !isLoading && (
          <div id="debug-info">
            <div>FPS: {fps}</div>
            <div>Position: {position.x.toFixed(1)}, {position.y.toFixed(1)}, {position.z.toFixed(1)}</div>
            <div>Chunks: {chunksLoaded}</div>
            <div>---</div>
            <div>WASD - Move</div>
            <div>Space - Jump</div>
            <div>Shift - Sprint</div>
            <div>Left Click - Break</div>
            <div>Right Click - Place</div>
            <div>1-5 - Select Block</div>
            <div>ESC - Unlock Mouse</div>
          </div>
        )}

        {/* Hotbar */}
        {!showClickToStart && !isLoading && (
          <div id="hotbar">
            {blockTypes.map((block, index) => (
              <div
                key={index}
                className={`hotbar-slot ${index === selectedSlot ? 'selected' : ''}`}
              >
                <div className="hotbar-slot-number">{index + 1}</div>
                <div style={{
                  width: '30px',
                  height: '30px',
                  backgroundColor: block.color,
                  border: '1px solid rgba(0,0,0,0.3)'
                }} />
              </div>
            ))}
          </div>
        )}

        {/* Loading Screen */}
        {isLoading && (
          <div id="loading">
            LOADING WORLD...
          </div>
        )}

        {/* Click to Start */}
        {!isLoading && showClickToStart && (
          <div id="click-to-start" onClick={handleClickToStart}>
            CLICK TO START
          </div>
        )}
      </div>
    </main>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import Phaser to avoid SSR issues
const GameWrapper = dynamic(() => import('../lib/game/GameWrapper'), {
  ssr: false,
  loading: () => (
    <div id="loading">
      <div className="loading-title">CRIME CITY</div>
      <div className="loading-subtitle">Underground Empire</div>
      <div className="loading-bar">
        <div className="loading-bar-fill"></div>
      </div>
    </div>
  ),
})

export default function Home() {
  const [gameStats, setGameStats] = useState({
    health: 100,
    maxHealth: 100,
    ammo: 30,
    maxAmmo: 30,
    money: 0,
    xp: 0,
    level: 1,
    weapon: 'Pistol',
    skillPoints: 0,
    combo: 0,
    bestCombo: 0,
  })

  const [currentMission, setCurrentMission] = useState({
    title: 'Welcome to Crime City',
    objective: 'Explore the city and eliminate enemies',
    progress: '0 / 10 enemies',
  })

  const [messages, setMessages] = useState<Array<{ text: string; type: string; id: number }>>([])

  useEffect(() => {
    // Listen for game events
    const handleGameEvent = (event: CustomEvent) => {
      const { type, data } = event.detail

      switch (type) {
        case 'statsUpdate':
          setGameStats(data)
          break
        case 'missionUpdate':
          setCurrentMission(data)
          break
        case 'message':
          const newMessage = { ...data, id: Date.now() }
          setMessages(prev => [...prev.slice(-4), newMessage])
          setTimeout(() => {
            setMessages(prev => prev.filter(m => m.id !== newMessage.id))
          }, 5000)
          break
      }
    }

    window.addEventListener('gameEvent' as any, handleGameEvent)
    return () => window.removeEventListener('gameEvent' as any, handleGameEvent)
  }, [])

  return (
    <div id="game-container">
      <GameWrapper />

      <div id="hud">
        {/* Stats */}
        <div id="stats">
          <div className="stat-bar">
            <div className="stat-label">Health</div>
            <div className="stat-bar-bg">
              <div
                className="stat-bar-fill health-bar"
                style={{ width: `${(gameStats.health / gameStats.maxHealth) * 100}%` }}
              ></div>
            </div>
            <div className="stat-value">{gameStats.health} / {gameStats.maxHealth}</div>
          </div>

          <div className="stat-bar">
            <div className="stat-label">Ammo</div>
            <div className="stat-bar-bg">
              <div
                className="stat-bar-fill ammo-bar"
                style={{ width: `${(gameStats.ammo / gameStats.maxAmmo) * 100}%` }}
              ></div>
            </div>
            <div className="stat-value">{gameStats.ammo} / {gameStats.maxAmmo}</div>
          </div>

          <div className="stat-bar">
            <div className="stat-label">Level {gameStats.level}</div>
            <div className="stat-bar-bg">
              <div
                className="stat-bar-fill xp-bar"
                style={{ width: `${(gameStats.xp % 100)}%` }}
              ></div>
            </div>
            <div className="stat-value">XP: {gameStats.xp}</div>
          </div>

          {gameStats.skillPoints > 0 && (
            <div className="stat-bar" style={{ marginTop: '10px' }}>
              <div className="stat-label" style={{ color: '#f39c12' }}>⚡ Skill Points: {gameStats.skillPoints}</div>
              <div className="stat-value" style={{ color: '#f39c12' }}>Press T to upgrade!</div>
            </div>
          )}

          {gameStats.combo > 0 && (
            <div className="stat-bar" style={{ marginTop: '10px' }}>
              <div className="stat-label" style={{ color: '#e74c3c' }}>🔥 COMBO: {gameStats.combo}x</div>
              <div className="stat-value">Best: {gameStats.bestCombo}</div>
            </div>
          )}
        </div>

        {/* Money */}
        <div id="money">
          ${gameStats.money.toLocaleString()}
        </div>

        {/* Mission */}
        <div id="mission">
          <div className="mission-title">{currentMission.title}</div>
          <div className="mission-objective">{currentMission.objective}</div>
          <div className="mission-progress">{currentMission.progress}</div>
        </div>

        {/* Weapon */}
        <div id="weapon">
          <div className="weapon-name">{gameStats.weapon}</div>
          <div className="weapon-ammo">{gameStats.ammo} rounds</div>
        </div>

        {/* Controls */}
        <div id="controls">
          <div className="control-line">WASD - Move</div>
          <div className="control-line">Mouse - Aim</div>
          <div className="control-line">Left Click - Shoot</div>
          <div className="control-line">1-3 - Switch Weapon</div>
          <div className="control-line">R - Reload</div>
          <div className="control-line">E - Casino</div>
          <div className="control-line" style={{ color: '#f39c12' }}>T - Skill Tree</div>
          <div className="control-line" style={{ color: '#2ecc71', fontWeight: 'bold' }}>B - Shop</div>
          <div className="control-line" style={{ fontSize: '11px', color: '#888' }}>SPACE/Q/F - Abilities (if purchased)</div>
        </div>

        {/* Messages */}
        <div id="messages">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.type}`}>
              {msg.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

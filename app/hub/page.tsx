'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/context/AuthContext'
import Link from 'next/link'

export default function GameHub() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hoveredGame, setHoveredGame] = useState<string | null>(null)
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number, speed: number, color: string}>>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Create floating particles
  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 20 + 10,
      color: ['#00d9ff', '#ff6b00', '#2ecc71', '#9b59b6'][Math.floor(Math.random() * 4)]
    }))
    setParticles(newParticles)
  }, [])

  if (loading) {
    return (
      <div className="hub-loading">
        <div className="loading-dot"></div>
        <p>Loading Dot Universe...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="hub-container">
      {/* Animated background particles */}
      <div className="particles-bg">
        {particles.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              animationDuration: `${p.speed}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="hub-header">
        <h1 className="hub-title">
          <span className="dot-icon">●</span> DOT UNIVERSE <span className="dot-icon">●</span>
        </h1>
        <p className="hub-subtitle">Welcome back, <span className="player-name">{(user.user_metadata as any)?.display_name || user.email?.split('@')[0] || 'Player'}</span></p>
      </header>

      {/* Game Selection */}
      <main className="games-grid">
        {/* Dot Slayer Card */}
        <Link href="/slayer" className="game-card slayer-card"
          onMouseEnter={() => setHoveredGame('slayer')}
          onMouseLeave={() => setHoveredGame(null)}>
          <div className="card-glow slayer-glow"></div>
          <div className="card-content">
            <div className="game-icon slayer-icon">
              <span className="icon-dot">●</span>
              <span className="icon-sword">⚔</span>
            </div>
            <h2 className="game-title">DOT SLAYER</h2>
            <p className="game-tagline">100 Floors of Chaos</p>
            <div className="game-features">
              <span className="feature">🎮 Roguelike Action</span>
              <span className="feature">🏆 Global Leaderboard</span>
              <span className="feature">⚡ Skill Trees</span>
              <span className="feature">👹 Epic Bosses</span>
            </div>
            <div className={`play-button ${hoveredGame === 'slayer' ? 'active' : ''}`}>
              PLAY NOW
            </div>
          </div>
        </Link>

        {/* Dot Clicker Card */}
        <Link href="/clicker" className="game-card clicker-card"
          onMouseEnter={() => setHoveredGame('clicker')}
          onMouseLeave={() => setHoveredGame(null)}>
          <div className="card-glow clicker-glow"></div>
          <div className="card-content">
            <div className="game-icon clicker-icon">
              <span className="big-dot">●</span>
              <span className="click-effect">+1</span>
            </div>
            <h2 className="game-title">DOT CLICKER</h2>
            <p className="game-tagline">Infinite Dot Empire</p>
            <div className="game-features">
              <span className="feature">👆 Addictive Clicking</span>
              <span className="feature">🏭 Build Factories</span>
              <span className="feature">🌟 Prestige System</span>
              <span className="feature">🔗 Syncs with Slayer!</span>
            </div>
            <div className={`play-button ${hoveredGame === 'clicker' ? 'active' : ''}`}>
              PLAY NOW
            </div>
          </div>
        </Link>
      </main>

      {/* Cross-game info */}
      <section className="synergy-section">
        <h3 className="synergy-title">🔗 CROSS-GAME SYNERGY</h3>
        <p className="synergy-desc">
          Play both games to unlock exclusive bonuses! DotSlayer floors boost your Clicker,
          and Clicker upgrades power up your Slayer runs!
        </p>
        <div className="synergy-stats">
          <div className="synergy-stat">
            <span className="stat-label">Slayer Floors Cleared</span>
            <span className="stat-value">0</span>
          </div>
          <div className="synergy-stat">
            <span className="stat-label">Clicker Prestiges</span>
            <span className="stat-value">0</span>
          </div>
          <div className="synergy-stat">
            <span className="stat-label">Synergy Bonus</span>
            <span className="stat-value">+0%</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="hub-footer">
        <button onClick={() => router.push('/login')} className="logout-btn">
          Sign Out
        </button>
      </footer>

      <style jsx>{`
        .hub-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a2e 100%);
          color: white;
          font-family: 'Segoe UI', system-ui, sans-serif;
          position: relative;
          overflow: hidden;
        }

        .particles-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          opacity: 0.6;
          animation: float linear infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.6; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.3; }
        }

        .hub-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: #0a0a1a;
          color: #00d9ff;
        }

        .loading-dot {
          width: 60px;
          height: 60px;
          background: #00d9ff;
          border-radius: 50%;
          animation: pulse 1s ease-in-out infinite;
          margin-bottom: 20px;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }

        .hub-header {
          text-align: center;
          padding: 60px 20px 40px;
          position: relative;
          z-index: 1;
        }

        .hub-title {
          font-size: 4rem;
          font-weight: 900;
          background: linear-gradient(135deg, #00d9ff, #ff6b00, #2ecc71);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 60px rgba(0, 217, 255, 0.5);
          margin-bottom: 10px;
          letter-spacing: 4px;
        }

        .dot-icon {
          display: inline-block;
          animation: spin 3s linear infinite;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        .hub-subtitle {
          font-size: 1.2rem;
          color: #888;
        }

        .player-name {
          color: #00d9ff;
          font-weight: bold;
        }

        .games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 40px;
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px 40px;
          position: relative;
          z-index: 1;
        }

        .game-card {
          position: relative;
          background: rgba(20, 20, 40, 0.8);
          border-radius: 20px;
          padding: 40px 30px;
          text-decoration: none;
          color: white;
          transition: all 0.3s ease;
          border: 2px solid transparent;
          overflow: hidden;
        }

        .game-card:hover {
          transform: translateY(-10px) scale(1.02);
          border-color: currentColor;
        }

        .slayer-card { color: #ff6b00; }
        .slayer-card:hover { box-shadow: 0 20px 60px rgba(255, 107, 0, 0.4); }

        .clicker-card { color: #00d9ff; }
        .clicker-card:hover { box-shadow: 0 20px 60px rgba(0, 217, 255, 0.4); }

        .card-glow {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }

        .game-card:hover .card-glow { opacity: 0.1; }

        .slayer-glow { background: radial-gradient(circle, #ff6b00 0%, transparent 70%); }
        .clicker-glow { background: radial-gradient(circle, #00d9ff 0%, transparent 70%); }

        .card-content {
          position: relative;
          z-index: 1;
          text-align: center;
        }

        .game-icon {
          font-size: 4rem;
          margin-bottom: 20px;
          position: relative;
          display: inline-block;
        }

        .slayer-icon .icon-dot {
          color: #ff6b00;
          animation: pulse 2s ease-in-out infinite;
        }

        .slayer-icon .icon-sword {
          position: absolute;
          font-size: 2rem;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
        }

        .clicker-icon .big-dot {
          color: #00d9ff;
          animation: pulse 1s ease-in-out infinite;
          text-shadow: 0 0 30px #00d9ff;
        }

        .clicker-icon .click-effect {
          position: absolute;
          font-size: 1.5rem;
          color: #2ecc71;
          font-weight: bold;
          animation: clickFloat 1s ease-out infinite;
          top: -10px;
          right: -20px;
        }

        @keyframes clickFloat {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }

        .game-title {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: 2px;
        }

        .game-tagline {
          font-size: 1rem;
          color: #888;
          margin-bottom: 25px;
        }

        .game-features {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          margin-bottom: 30px;
        }

        .feature {
          background: rgba(255, 255, 255, 0.1);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
        }

        .play-button {
          background: currentColor;
          color: #0a0a1a;
          padding: 15px 40px;
          border-radius: 30px;
          font-weight: bold;
          font-size: 1.1rem;
          letter-spacing: 2px;
          transition: all 0.3s;
        }

        .play-button.active {
          transform: scale(1.1);
          box-shadow: 0 0 30px currentColor;
        }

        .synergy-section {
          max-width: 800px;
          margin: 60px auto;
          padding: 30px;
          background: rgba(20, 20, 40, 0.6);
          border-radius: 20px;
          text-align: center;
          position: relative;
          z-index: 1;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .synergy-title {
          font-size: 1.5rem;
          color: #f39c12;
          margin-bottom: 15px;
        }

        .synergy-desc {
          color: #aaa;
          margin-bottom: 25px;
          line-height: 1.6;
        }

        .synergy-stats {
          display: flex;
          justify-content: center;
          gap: 40px;
          flex-wrap: wrap;
        }

        .synergy-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-label {
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 5px;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #00d9ff;
        }

        .hub-footer {
          text-align: center;
          padding: 40px;
          position: relative;
          z-index: 1;
        }

        .logout-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #888;
          padding: 10px 30px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .logout-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        @media (max-width: 768px) {
          .hub-title { font-size: 2.5rem; }
          .games-grid { padding: 20px; gap: 20px; }
          .game-card { padding: 30px 20px; }
          .synergy-stats { gap: 20px; }
        }
      `}</style>
    </div>
  )
}

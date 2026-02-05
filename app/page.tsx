'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/context/AuthContext'
import Link from 'next/link'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showContent, setShowContent] = useState(true)

  // Auto-redirect after a delay if logged in, but show content for SEO
  useEffect(() => {
    if (!loading && user) {
      const timer = setTimeout(() => {
        router.push('/hub')
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [user, loading, router])

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <header className="hero">
        <div className="hero-content">
          <div className="logo-container">
            <div className="logo-dot"></div>
            <h1>Dot Universe</h1>
          </div>
          <p className="tagline">Two Games. One Universe. Infinite Fun.</p>
          <p className="subtitle">Free browser games with cross-game synergy - no download required!</p>

          <div className="cta-buttons">
            {user ? (
              <Link href="/hub" className="btn btn-primary">
                Enter Game Hub
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-primary">
                  Play Now - Free!
                </Link>
                <Link href="/login" className="btn btn-secondary">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="hero-visual">
          <div className="floating-dots">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="floating-dot" style={{
                animationDelay: `${i * 0.2}s`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}></div>
            ))}
          </div>
        </div>
      </header>

      {/* Games Section */}
      <section className="games-section">
        <h2>Our Games</h2>
        <div className="games-grid">
          {/* DotSlayer Card */}
          <article className="game-card slayer">
            <div className="game-icon">
              <span className="icon-target"></span>
            </div>
            <h3>DotSlayer</h3>
            <p className="game-genre">Roguelike Action</p>
            <p className="game-description">
              Battle through 100 procedurally generated floors! Face 20+ unique enemy types,
              unlock powerful upgrades, and compete on global leaderboards. Every run is different.
            </p>
            <ul className="features-list">
              <li>100 Procedural Floors</li>
              <li>20+ Enemy Types</li>
              <li>Skill Tree System</li>
              <li>Global Leaderboards</li>
              <li>Boss Battles</li>
              <li>Multiple Weapons</li>
            </ul>
            <Link href="/slayer" className="game-link">Play DotSlayer</Link>
          </article>

          {/* Dot Clicker Card */}
          <article className="game-card clicker">
            <div className="game-icon">
              <span className="icon-click"></span>
            </div>
            <h3>Dot Clicker</h3>
            <p className="game-genre">Idle Incremental</p>
            <p className="game-description">
              Click your way to dot domination! Build an empire with 20+ buildings,
              unlock prestige upgrades, and ascend to unlock permanent bonuses.
            </p>
            <ul className="features-list">
              <li>20+ Buildings</li>
              <li>7 Prestige Tiers</li>
              <li>Ascension System</li>
              <li>Achievements</li>
              <li>Offline Progress</li>
              <li>Auto-Clickers</li>
            </ul>
            <Link href="/clicker" className="game-link">Play Dot Clicker</Link>
          </article>
        </div>
      </section>

      {/* Synergy Section */}
      <section className="synergy-section">
        <h2>Cross-Game Synergy</h2>
        <p className="synergy-description">
          Play both games and unlock special bonuses! Your progress in DotSlayer boosts
          Dot Clicker production, and your Dot Clicker prestiges enhance your DotSlayer runs.
        </p>
        <div className="synergy-features">
          <div className="synergy-item">
            <span className="synergy-arrow">DotSlayer</span>
            <span className="synergy-arrow">Dot Clicker</span>
            <p>Floors cleared = Production bonus</p>
          </div>
          <div className="synergy-item">
            <span className="synergy-arrow">Dot Clicker</span>
            <span className="synergy-arrow">DotSlayer</span>
            <p>Prestiges = Starting gold bonus</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Why Dot Universe?</h2>
        <div className="features-grid">
          <div className="feature">
            <span className="feature-icon">No Download</span>
            <h3>Play Instantly</h3>
            <p>No downloads, no installs. Just click and play in your browser.</p>
          </div>
          <div className="feature">
            <span className="feature-icon">Free</span>
            <h3>100% Free</h3>
            <p>All games are completely free to play. No paywalls, no pay-to-win.</p>
          </div>
          <div className="feature">
            <span className="feature-icon">Cloud</span>
            <h3>Cloud Saves</h3>
            <p>Your progress syncs automatically. Play on any device.</p>
          </div>
          <div className="feature">
            <span className="feature-icon">Global</span>
            <h3>Leaderboards</h3>
            <p>Compete against players worldwide. Climb the ranks!</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo"></div>
            <span>Dot Universe</span>
          </div>
          <nav className="footer-nav">
            <Link href="/hub">Game Hub</Link>
            <Link href="/slayer">DotSlayer</Link>
            <Link href="/clicker">Dot Clicker</Link>
            <Link href="/login">Sign In</Link>
          </nav>
          <p className="copyright">Play free browser games at Dot Universe</p>
        </div>
      </footer>

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #0a0a1a 0%, #0a1929 50%, #1a0a2e 100%);
          color: #e0e0e0;
          font-family: system-ui, -apple-system, sans-serif;
        }

        /* Hero */
        .hero {
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
          position: relative;
          overflow: hidden;
        }

        .hero-content {
          position: relative;
          z-index: 2;
        }

        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .logo-dot {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #00d9ff, #0099cc);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
          box-shadow: 0 0 30px rgba(0, 217, 255, 0.5);
        }

        h1 {
          font-size: 3.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #00d9ff, #00ff88);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }

        .tagline {
          font-size: 1.8rem;
          color: #00d9ff;
          margin: 10px 0;
          font-weight: 600;
        }

        .subtitle {
          font-size: 1.2rem;
          color: #888;
          margin-bottom: 30px;
        }

        .cta-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn {
          padding: 15px 40px;
          font-size: 1.2rem;
          font-weight: 600;
          border-radius: 50px;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .btn-primary {
          background: linear-gradient(135deg, #00d9ff, #0099cc);
          color: white;
          box-shadow: 0 4px 20px rgba(0, 217, 255, 0.4);
        }

        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 30px rgba(0, 217, 255, 0.6);
        }

        .btn-secondary {
          background: transparent;
          color: #00d9ff;
          border: 2px solid #00d9ff;
        }

        .btn-secondary:hover {
          background: rgba(0, 217, 255, 0.1);
        }

        .hero-visual {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .floating-dots {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .floating-dot {
          position: absolute;
          width: 10px;
          height: 10px;
          background: rgba(0, 217, 255, 0.3);
          border-radius: 50%;
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-30px) scale(1.2); opacity: 0.6; }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        /* Games Section */
        .games-section {
          padding: 80px 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .games-section h2 {
          text-align: center;
          font-size: 2.5rem;
          color: #00d9ff;
          margin-bottom: 50px;
        }

        .games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 40px;
        }

        .game-card {
          background: rgba(0, 0, 0, 0.4);
          border-radius: 20px;
          padding: 40px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .game-card:hover {
          transform: translateY(-10px);
          border-color: rgba(0, 217, 255, 0.3);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        .game-card.slayer {
          border-top: 4px solid #e74c3c;
        }

        .game-card.clicker {
          border-top: 4px solid #9b59b6;
        }

        .game-icon {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          font-size: 2rem;
        }

        .slayer .game-icon {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
        }

        .slayer .game-icon::before {
          content: '\\1F3AF';
        }

        .clicker .game-icon {
          background: linear-gradient(135deg, #9b59b6, #8e44ad);
        }

        .clicker .game-icon::before {
          content: '\\1F446';
        }

        .game-card h3 {
          font-size: 2rem;
          margin: 0 0 5px 0;
          color: white;
        }

        .game-genre {
          color: #888;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 15px;
        }

        .game-description {
          color: #bbb;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .features-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          list-style: none;
          padding: 0;
          margin: 0 0 25px 0;
        }

        .features-list li {
          color: #00d9ff;
          font-size: 0.9rem;
        }

        .features-list li::before {
          content: '\\2713 ';
          color: #00ff88;
        }

        .game-link {
          display: inline-block;
          padding: 12px 30px;
          background: rgba(0, 217, 255, 0.1);
          color: #00d9ff;
          text-decoration: none;
          border-radius: 25px;
          border: 1px solid rgba(0, 217, 255, 0.3);
          transition: all 0.3s ease;
        }

        .game-link:hover {
          background: rgba(0, 217, 255, 0.2);
          transform: translateX(5px);
        }

        /* Synergy Section */
        .synergy-section {
          padding: 80px 20px;
          background: rgba(0, 217, 255, 0.05);
          text-align: center;
        }

        .synergy-section h2 {
          font-size: 2.5rem;
          color: #00d9ff;
          margin-bottom: 20px;
        }

        .synergy-description {
          max-width: 600px;
          margin: 0 auto 40px;
          color: #bbb;
          font-size: 1.1rem;
          line-height: 1.6;
        }

        .synergy-features {
          display: flex;
          justify-content: center;
          gap: 60px;
          flex-wrap: wrap;
        }

        .synergy-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .synergy-arrow {
          background: rgba(0, 217, 255, 0.1);
          padding: 10px 20px;
          border-radius: 10px;
          color: #00d9ff;
          font-weight: 600;
        }

        .synergy-item p {
          color: #888;
          font-size: 0.9rem;
        }

        /* Features Section */
        .features-section {
          padding: 80px 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .features-section h2 {
          text-align: center;
          font-size: 2.5rem;
          color: #00d9ff;
          margin-bottom: 50px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
        }

        .feature {
          text-align: center;
          padding: 30px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 15px;
        }

        .feature-icon {
          display: block;
          font-size: 0.8rem;
          color: #00ff88;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 10px;
        }

        .feature h3 {
          color: white;
          margin: 0 0 10px 0;
        }

        .feature p {
          color: #888;
          font-size: 0.95rem;
          line-height: 1.5;
          margin: 0;
        }

        /* Footer */
        .landing-footer {
          padding: 40px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #00d9ff;
          font-weight: 600;
          font-size: 1.2rem;
        }

        .footer-logo {
          width: 30px;
          height: 30px;
          background: #00d9ff;
          border-radius: 50%;
        }

        .footer-nav {
          display: flex;
          gap: 30px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .footer-nav a {
          color: #888;
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-nav a:hover {
          color: #00d9ff;
        }

        .copyright {
          color: #555;
          font-size: 0.9rem;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          h1 {
            font-size: 2.5rem;
          }

          .tagline {
            font-size: 1.3rem;
          }

          .games-grid {
            grid-template-columns: 1fr;
          }

          .synergy-features {
            flex-direction: column;
            gap: 30px;
          }
        }
      `}</style>
    </div>
  )
}

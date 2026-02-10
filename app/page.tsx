'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/context/AuthContext'
import Link from 'next/link'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    if (!loading && user) {
      const timer = setTimeout(() => {
        router.push('/hub')
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [user, loading, router])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    const handleScroll = () => setScrollY(window.scrollY)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="landing-page">
      {/* Animated Background */}
      <div className="bg-effects">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="grid-overlay"></div>
        <div className="noise-overlay"></div>

        {/* Floating Particles */}
        <div className="particles">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className={`particle particle-${i % 5}`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${15 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <header className="hero">
        <div className="hero-content">
          {/* Logo */}
          <div className="logo-area">
            <div className="logo-ring"></div>
            <div className="logo-dot">
              <div className="logo-inner"></div>
              <div className="logo-pulse"></div>
            </div>
          </div>

          <h1 className="hero-title">
            <span className="title-word">DOT</span>
            <span className="title-word accent">UNIVERSE</span>
          </h1>

          <p className="hero-tagline">
            <span className="tagline-line"></span>
            Two Games. One Universe. Infinite Fun.
            <span className="tagline-line"></span>
          </p>

          <p className="hero-subtitle">
            Free browser games with cross-game synergy - no download required
          </p>

          {/* CTA Buttons */}
          <div className="cta-container">
            {user ? (
              <Link href="/hub" className="btn btn-primary glow-effect">
                <span className="btn-bg"></span>
                <span className="btn-content">
                  <span className="btn-icon">&#x25B6;</span>
                  Enter Game Hub
                </span>
                <span className="btn-shine"></span>
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-primary glow-effect">
                  <span className="btn-bg"></span>
                  <span className="btn-content">
                    <span className="btn-icon">&#x25B6;</span>
                    Play Now - Free!
                  </span>
                  <span className="btn-shine"></span>
                </Link>
                <Link href="/login" className="btn btn-secondary">
                  <span className="btn-content">
                    <span className="btn-icon">&#x2192;</span>
                    Sign In
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Quick Stats */}
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-icon">&#x2694;</span>
              <span className="stat-text">100 Floors</span>
            </div>
            <div className="stat-divider"></div>
            <div className="hero-stat">
              <span className="stat-icon">&#x1F3C6;</span>
              <span className="stat-text">Leaderboards</span>
            </div>
            <div className="stat-divider"></div>
            <div className="hero-stat">
              <span className="stat-icon">&#x2601;</span>
              <span className="stat-text">Cloud Saves</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator">
          <div className="scroll-mouse">
            <div className="scroll-wheel"></div>
          </div>
          <span>Scroll to explore</span>
        </div>
      </header>

      {/* Games Section */}
      <section className="games-section">
        <div className="section-header">
          <span className="section-tag">CHOOSE YOUR GAME</span>
          <h2>Our Games</h2>
          <p className="section-subtitle">Two unique experiences, perfectly connected</p>
        </div>

        <div className="games-showcase">
          {/* DotSlayer Card */}
          <article className="game-card slayer-card">
            <div className="card-glow"></div>
            <div className="card-border"></div>
            <div className="card-content">
              <div className="card-badge">ACTION ROGUELIKE</div>

              <div className="game-visual">
                <div className="visual-ring"></div>
                <div className="visual-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <div className="visual-particles">
                  {[...Array(6)].map((_, i) => <span key={i}></span>)}
                </div>
              </div>

              <h3>DotSlayer</h3>
              <p className="game-subtitle">100 Floors of Chaos</p>

              <p className="game-desc">
                Battle through procedurally generated dungeons. Face 20+ enemy types,
                unlock powerful skills, defeat epic bosses!
              </p>

              <div className="game-features">
                <div className="feature-pill">
                  <span className="pill-icon">&#x1F3AE;</span>
                  Roguelike Action
                </div>
                <div className="feature-pill">
                  <span className="pill-icon">&#x1F3C6;</span>
                  Global Rankings
                </div>
                <div className="feature-pill">
                  <span className="pill-icon">&#x26A1;</span>
                  Skill Trees
                </div>
                <div className="feature-pill">
                  <span className="pill-icon">&#x1F47E;</span>
                  Epic Bosses
                </div>
              </div>

              <Link href="/slayer" className="game-cta">
                <span className="cta-text">Play DotSlayer</span>
                <span className="cta-arrow">&#x2192;</span>
              </Link>
            </div>
          </article>

          {/* Synergy Bridge */}
          <div className="synergy-bridge">
            <div className="bridge-line"></div>
            <div className="bridge-icon">
              <span>&#x1F517;</span>
            </div>
            <div className="bridge-line"></div>
            <p>Cross-Game<br/>Synergy</p>
          </div>

          {/* Dot Clicker Card */}
          <article className="game-card clicker-card">
            <div className="card-glow"></div>
            <div className="card-border"></div>
            <div className="card-content">
              <div className="card-badge">IDLE INCREMENTAL</div>

              <div className="game-visual">
                <div className="visual-ring"></div>
                <div className="visual-icon clicker-icon">
                  <div className="click-dot"></div>
                  <div className="click-plus">+1</div>
                </div>
                <div className="visual-ripple"></div>
              </div>

              <h3>Dot Clicker</h3>
              <p className="game-subtitle">Build Your Empire</p>

              <p className="game-desc">
                Click, build, prestige, ascend! Grow from humble clicks to an
                unstoppable dot empire with 20+ buildings.
              </p>

              <div className="game-features">
                <div className="feature-pill">
                  <span className="pill-icon">&#x1F446;</span>
                  Addictive Clicking
                </div>
                <div className="feature-pill">
                  <span className="pill-icon">&#x1F3ED;</span>
                  20+ Buildings
                </div>
                <div className="feature-pill">
                  <span className="pill-icon">&#x2B50;</span>
                  Prestige System
                </div>
                <div className="feature-pill">
                  <span className="pill-icon">&#x1F4C8;</span>
                  Offline Progress
                </div>
              </div>

              <Link href="/clicker" className="game-cta clicker-cta">
                <span className="cta-text">Play Dot Clicker</span>
                <span className="cta-arrow">&#x2192;</span>
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <span className="section-tag">WHY DOT UNIVERSE</span>
          <h2>Game Features</h2>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrap">
              <span className="feature-icon">&#x26A1;</span>
            </div>
            <h3>Instant Play</h3>
            <p>No downloads, no installs. Click and play instantly in your browser.</p>
          </div>

          <div className="feature-card highlight">
            <div className="feature-icon-wrap">
              <span className="feature-icon">&#x1F517;</span>
            </div>
            <h3>Cross-Game Synergy</h3>
            <p>Progress in one game boosts the other. Play both for maximum rewards!</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrap">
              <span className="feature-icon">&#x1F4B0;</span>
            </div>
            <h3>100% Free</h3>
            <p>No paywalls, no ads, no pay-to-win. Just pure gaming fun.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrap">
              <span className="feature-icon">&#x2601;</span>
            </div>
            <h3>Cloud Saves</h3>
            <p>Your progress syncs automatically across all your devices.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrap">
              <span className="feature-icon">&#x1F3C6;</span>
            </div>
            <h3>Leaderboards</h3>
            <p>Compete globally. Climb the ranks and prove you're the best!</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrap">
              <span className="feature-icon">&#x1F4F1;</span>
            </div>
            <h3>Mobile Ready</h3>
            <p>Play on desktop, tablet, or phone. Your adventure, anywhere.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-box">
            <span className="stat-num">100+</span>
            <span className="stat-label">Floors</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">20+</span>
            <span className="stat-label">Enemy Types</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">40+</span>
            <span className="stat-label">Achievements</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">&#x221E;</span>
            <span className="stat-label">Fun</span>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="section-header">
          <span className="section-tag">PLAYER REVIEWS</span>
          <h2>What Players Say</h2>
        </div>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="stars">&#x2605;&#x2605;&#x2605;&#x2605;&#x2605;</div>
            <p>"Finally a browser roguelike that doesn't feel like a mobile port. The synergy system is genius!"</p>
            <div className="author">
              <span className="author-avatar">R</span>
              <span className="author-name">r/WebGames user</span>
            </div>
          </div>

          <div className="testimonial-card featured">
            <div className="stars">&#x2605;&#x2605;&#x2605;&#x2605;&#x2605;</div>
            <p>"Been playing Dot Clicker for a week straight. The prestige system is perfectly balanced."</p>
            <div className="author">
              <span className="author-avatar">I</span>
              <span className="author-name">r/incremental_games</span>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="stars">&#x2605;&#x2605;&#x2605;&#x2605;&#x2605;</div>
            <p>"Love that my progress in one game helps the other. Smart design!"</p>
            <div className="author">
              <span className="author-avatar">D</span>
              <span className="author-name">Discord member</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="cta-glow"></div>
        <h2>Ready to Begin?</h2>
        <p>Join the Dot Universe and start your adventure today!</p>
        <Link href="/login" className="btn btn-primary btn-mega glow-effect">
          <span className="btn-bg"></span>
          <span className="btn-content">
            <span className="btn-icon">&#x25B6;</span>
            Start Playing - It's Free!
          </span>
          <span className="btn-shine"></span>
        </Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo"></div>
            <span>Dot Universe</span>
          </div>
          <nav className="footer-nav">
            <Link href="/hub">Game Hub</Link>
            <Link href="/slayer">DotSlayer</Link>
            <Link href="/clicker">Dot Clicker</Link>
            <Link href="/profile">Profile</Link>
            <Link href="/news">News</Link>
          </nav>
          <p className="copyright">2025-2026 Dot Universe. Play free browser games.</p>
        </div>
      </footer>

      <style jsx>{`
        /* Base */
        .landing-page {
          min-height: 100vh;
          background: #030308;
          color: #fff;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          overflow-x: hidden;
          position: relative;
        }

        /* Background Effects - Simplified for browser compatibility */
        .bg-effects {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(ellipse 80% 50% at 20% 30%, rgba(0, 150, 200, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(100, 50, 150, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 70% 50% at 70% 80%, rgba(200, 80, 0, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 50% 50% at 30% 70%, rgba(0, 180, 100, 0.06) 0%, transparent 50%);
        }

        .gradient-orb {
          display: none;
        }

        .grid-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image:
            linear-gradient(rgba(0, 217, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 217, 255, 0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        .noise-overlay {
          display: none;
        }

        .particles {
          position: fixed;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          animation: particleDrift 20s linear infinite;
          opacity: 0.4;
        }

        .particle-0 { background: #00d9ff; }
        .particle-1 { background: #ff6b00; }
        .particle-2 { background: #2ecc71; }
        .particle-3 { background: #9b59b6; }
        .particle-4 { background: #f1c40f; }

        @keyframes particleDrift {
          0% {
            transform: translateY(100vh) translateX(0);
            opacity: 0;
          }
          5% { opacity: 0.4; }
          95% { opacity: 0.4; }
          100% {
            transform: translateY(-20vh) translateX(30px);
            opacity: 0;
          }
        }

        /* Hero Section */
        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
          position: relative;
          z-index: 1;
        }

        .hero-content {
          max-width: 800px;
        }

        /* Logo */
        .logo-area {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 30px;
        }

        .logo-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #00d9ff, #0099cc);
          border-radius: 50%;
          box-shadow:
            0 0 60px rgba(0, 217, 255, 0.6),
            inset 0 0 30px rgba(255, 255, 255, 0.2);
        }

        .logo-inner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 30px;
          height: 30px;
          background: radial-gradient(circle, #fff 0%, transparent 70%);
          border-radius: 50%;
        }

        .logo-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          border: 3px solid rgba(0, 217, 255, 0.5);
          border-radius: 50%;
          animation: logoPulse 2s ease-out infinite;
        }

        .logo-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 110px;
          height: 110px;
          border: 2px solid rgba(0, 217, 255, 0.3);
          border-radius: 50%;
          animation: logoSpin 10s linear infinite;
        }

        .logo-ring::before {
          content: '';
          position: absolute;
          top: -5px;
          left: 50%;
          width: 10px;
          height: 10px;
          background: #00d9ff;
          border-radius: 50%;
          transform: translateX(-50%);
        }

        @keyframes logoPulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }

        @keyframes logoSpin {
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        /* Hero Title */
        .hero-title {
          font-size: 5rem;
          font-weight: 900;
          letter-spacing: 10px;
          margin: 0 0 20px 0;
          line-height: 1.1;
        }

        .title-word {
          display: block;
          background: linear-gradient(180deg, #fff 0%, #888 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .title-word.accent {
          background: linear-gradient(135deg, #00d9ff 0%, #00ff88 50%, #ff6b00 100%);
          -webkit-background-clip: text;
          background-clip: text;
          animation: titleGradient 5s ease infinite;
          background-size: 200% 200%;
        }

        @keyframes titleGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .hero-tagline {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          font-size: 1.5rem;
          color: #00d9ff;
          margin: 0 0 15px 0;
          font-weight: 600;
        }

        .tagline-line {
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00d9ff, transparent);
        }

        .hero-subtitle {
          font-size: 1.1rem;
          color: #666;
          margin: 0 0 40px 0;
        }

        /* CTA Buttons */
        .cta-container {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 50px;
        }

        .btn {
          position: relative;
          padding: 18px 45px;
          font-size: 1.1rem;
          font-weight: 700;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          text-decoration: none;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, #00d9ff, #0077ff);
          color: #fff;
        }

        .btn-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #00d9ff, #0077ff);
          transition: all 0.3s;
        }

        .btn-primary:hover .btn-bg {
          filter: brightness(1.2);
        }

        .btn-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-icon {
          font-size: 0.9rem;
        }

        .btn-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: btnShine 3s infinite;
        }

        @keyframes btnShine {
          0% { left: -100%; }
          50%, 100% { left: 100%; }
        }

        .glow-effect {
          box-shadow:
            0 0 20px rgba(0, 217, 255, 0.4),
            0 0 40px rgba(0, 217, 255, 0.2);
        }

        .glow-effect:hover {
          transform: translateY(-3px);
          box-shadow:
            0 0 30px rgba(0, 217, 255, 0.6),
            0 0 60px rgba(0, 217, 255, 0.3);
        }

        .btn-secondary {
          background: transparent;
          border: 2px solid rgba(0, 217, 255, 0.5);
          color: #00d9ff;
        }

        .btn-secondary:hover {
          background: rgba(0, 217, 255, 0.1);
          border-color: #00d9ff;
        }

        /* Hero Stats */
        .hero-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 30px;
          flex-wrap: wrap;
        }

        .hero-stat {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #888;
          font-size: 0.95rem;
        }

        .stat-icon {
          font-size: 1.2rem;
        }

        .stat-divider {
          width: 4px;
          height: 4px;
          background: #444;
          border-radius: 50%;
        }

        /* Scroll Indicator */
        .scroll-indicator {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          color: #555;
          font-size: 0.85rem;
          animation: scrollBounce 2s ease-in-out infinite;
        }

        .scroll-mouse {
          width: 24px;
          height: 38px;
          border: 2px solid #444;
          border-radius: 15px;
          position: relative;
        }

        .scroll-wheel {
          width: 4px;
          height: 8px;
          background: #00d9ff;
          border-radius: 2px;
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          animation: scrollWheel 1.5s ease-in-out infinite;
        }

        @keyframes scrollWheel {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 1; }
          100% { transform: translateX(-50%) translateY(10px); opacity: 0; }
        }

        @keyframes scrollBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(10px); }
        }

        /* Section Styling */
        section {
          position: relative;
          z-index: 1;
          padding: 100px 20px;
        }

        .section-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .section-tag {
          display: inline-block;
          padding: 8px 20px;
          background: rgba(0, 217, 255, 0.1);
          border: 1px solid rgba(0, 217, 255, 0.2);
          border-radius: 20px;
          color: #00d9ff;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 2px;
          margin-bottom: 20px;
        }

        .section-header h2 {
          font-size: 3rem;
          font-weight: 800;
          margin: 0;
          background: linear-gradient(180deg, #fff 0%, #888 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .section-subtitle {
          color: #666;
          margin-top: 15px;
        }

        /* Games Section */
        .games-section {
          max-width: 1400px;
          margin: 0 auto;
        }

        .games-showcase {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 30px;
          flex-wrap: wrap;
        }

        /* Game Cards */
        .game-card {
          position: relative;
          width: 400px;
          max-width: 100%;
          border-radius: 30px;
          overflow: hidden;
          transition: all 0.4s ease;
        }

        .card-glow {
          position: absolute;
          inset: 0;
          border-radius: 30px;
          opacity: 0;
          transition: opacity 0.4s;
        }

        .slayer-card .card-glow {
          box-shadow: 0 0 80px rgba(255, 107, 0, 0.4);
        }

        .clicker-card .card-glow {
          box-shadow: 0 0 80px rgba(0, 217, 255, 0.4);
        }

        .game-card:hover .card-glow {
          opacity: 1;
        }

        .card-border {
          position: absolute;
          inset: 0;
          border-radius: 30px;
          padding: 2px;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
        }

        .slayer-card .card-border {
          background: linear-gradient(135deg, rgba(255, 107, 0, 0.5), transparent, rgba(255, 107, 0, 0.3));
        }

        .clicker-card .card-border {
          background: linear-gradient(135deg, rgba(0, 217, 255, 0.5), transparent, rgba(0, 217, 255, 0.3));
        }

        .card-content {
          position: relative;
          background: linear-gradient(180deg, rgba(10, 15, 30, 0.95) 0%, rgba(5, 10, 20, 0.98) 100%);
          border-radius: 28px;
          padding: 40px 30px;
          backdrop-filter: blur(20px);
        }

        .card-badge {
          display: inline-block;
          padding: 6px 15px;
          border-radius: 15px;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 2px;
          margin-bottom: 25px;
        }

        .slayer-card .card-badge {
          background: linear-gradient(135deg, #ff6b00, #ff4400);
          color: #fff;
        }

        .clicker-card .card-badge {
          background: linear-gradient(135deg, #00d9ff, #0099ff);
          color: #fff;
        }

        /* Game Visual */
        .game-visual {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 25px;
        }

        .visual-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 3px dashed rgba(255, 255, 255, 0.1);
          animation: visualSpin 20s linear infinite;
        }

        @keyframes visualSpin {
          100% { transform: rotate(360deg); }
        }

        .visual-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .slayer-card .visual-icon svg {
          width: 60px;
          height: 60px;
          color: #ff6b00;
          filter: drop-shadow(0 0 10px rgba(255, 107, 0, 0.5));
        }

        .clicker-icon {
          flex-direction: column;
        }

        .click-dot {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #00d9ff, #0077ff);
          border-radius: 50%;
          box-shadow: 0 0 30px rgba(0, 217, 255, 0.5);
        }

        .click-plus {
          position: absolute;
          top: 5px;
          right: 5px;
          font-size: 1rem;
          font-weight: 800;
          color: #2ecc71;
          animation: clickPlus 1s ease-out infinite;
        }

        @keyframes clickPlus {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-15px); opacity: 0; }
        }

        .visual-ripple {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          border: 2px solid rgba(0, 217, 255, 0.3);
          border-radius: 50%;
          animation: ripple 2s ease-out infinite;
        }

        @keyframes ripple {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }

        .visual-particles span {
          position: absolute;
          width: 6px;
          height: 6px;
          background: #ff6b00;
          border-radius: 50%;
          animation: particleBurst 1.5s ease-out infinite;
        }

        .visual-particles span:nth-child(1) { top: 0; left: 50%; animation-delay: 0s; }
        .visual-particles span:nth-child(2) { top: 20%; right: 0; animation-delay: 0.25s; }
        .visual-particles span:nth-child(3) { bottom: 20%; right: 0; animation-delay: 0.5s; }
        .visual-particles span:nth-child(4) { bottom: 0; left: 50%; animation-delay: 0.75s; }
        .visual-particles span:nth-child(5) { bottom: 20%; left: 0; animation-delay: 1s; }
        .visual-particles span:nth-child(6) { top: 20%; left: 0; animation-delay: 1.25s; }

        @keyframes particleBurst {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0); opacity: 0; }
        }

        .game-card h3 {
          font-size: 2rem;
          font-weight: 800;
          margin: 0;
        }

        .slayer-card h3 { color: #ff6b00; }
        .clicker-card h3 { color: #00d9ff; }

        .game-subtitle {
          color: #666;
          margin: 5px 0 15px 0;
          font-size: 0.95rem;
        }

        .game-desc {
          color: #999;
          font-size: 0.95rem;
          line-height: 1.6;
          margin: 0 0 20px 0;
        }

        /* Feature Pills */
        .game-features {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 25px;
        }

        .feature-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          font-size: 0.8rem;
          color: #aaa;
        }

        .pill-icon {
          font-size: 1rem;
        }

        /* Game CTA */
        .game-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 30px;
          border-radius: 25px;
          text-decoration: none;
          font-weight: 700;
          transition: all 0.3s;
        }

        .slayer-card .game-cta {
          background: linear-gradient(135deg, rgba(255, 107, 0, 0.2), rgba(255, 50, 0, 0.1));
          border: 2px solid rgba(255, 107, 0, 0.4);
          color: #ff6b00;
        }

        .slayer-card .game-cta:hover {
          background: linear-gradient(135deg, #ff6b00, #ff4400);
          color: #fff;
          transform: translateX(5px);
          box-shadow: 0 0 30px rgba(255, 107, 0, 0.4);
        }

        .clicker-card .game-cta {
          background: linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(0, 150, 255, 0.1));
          border: 2px solid rgba(0, 217, 255, 0.4);
          color: #00d9ff;
        }

        .clicker-card .game-cta:hover {
          background: linear-gradient(135deg, #00d9ff, #0077ff);
          color: #fff;
          transform: translateX(5px);
          box-shadow: 0 0 30px rgba(0, 217, 255, 0.4);
        }

        .cta-arrow {
          transition: transform 0.3s;
        }

        .game-cta:hover .cta-arrow {
          transform: translateX(5px);
        }

        /* Synergy Bridge */
        .synergy-bridge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 20px 0;
        }

        .bridge-line {
          width: 2px;
          height: 40px;
          background: linear-gradient(180deg, transparent, rgba(243, 156, 18, 0.5), transparent);
        }

        .bridge-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, rgba(243, 156, 18, 0.2), rgba(241, 196, 15, 0.1));
          border: 2px solid rgba(243, 156, 18, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          animation: bridgePulse 2s ease-in-out infinite;
        }

        @keyframes bridgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .synergy-bridge p {
          color: #666;
          font-size: 0.85rem;
          text-align: center;
          margin: 0;
        }

        /* Features Grid */
        .features-section {
          max-width: 1200px;
          margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 25px;
        }

        .feature-card {
          background: linear-gradient(145deg, rgba(15, 20, 35, 0.8), rgba(10, 15, 25, 0.9));
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 35px 30px;
          transition: all 0.3s;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          border-color: rgba(0, 217, 255, 0.2);
        }

        .feature-card.highlight {
          border-color: rgba(0, 217, 255, 0.3);
          background: linear-gradient(145deg, rgba(0, 217, 255, 0.1), rgba(10, 15, 25, 0.9));
        }

        .feature-icon-wrap {
          width: 60px;
          height: 60px;
          background: rgba(0, 217, 255, 0.1);
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .feature-icon {
          font-size: 1.8rem;
        }

        .feature-card h3 {
          font-size: 1.3rem;
          margin: 0 0 10px 0;
          color: #fff;
        }

        .feature-card p {
          color: #888;
          margin: 0;
          line-height: 1.6;
        }

        /* Stats Section */
        .stats-section {
          background: linear-gradient(180deg, rgba(0, 217, 255, 0.05) 0%, transparent 50%, rgba(255, 107, 0, 0.05) 100%);
        }

        .stats-container {
          display: flex;
          justify-content: center;
          gap: 60px;
          flex-wrap: wrap;
          max-width: 1000px;
          margin: 0 auto;
        }

        .stat-box {
          text-align: center;
          padding: 30px;
        }

        .stat-num {
          display: block;
          font-size: 4rem;
          font-weight: 900;
          background: linear-gradient(135deg, #00d9ff, #00ff88);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }

        .stat-label {
          display: block;
          color: #666;
          font-size: 1rem;
          margin-top: 10px;
        }

        /* Testimonials */
        .testimonials-section {
          max-width: 1200px;
          margin: 0 auto;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 25px;
        }

        .testimonial-card {
          background: linear-gradient(145deg, rgba(15, 20, 35, 0.8), rgba(10, 15, 25, 0.9));
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 30px;
          transition: all 0.3s;
        }

        .testimonial-card:hover {
          transform: translateY(-5px);
        }

        .testimonial-card.featured {
          border-color: rgba(243, 156, 18, 0.3);
          background: linear-gradient(145deg, rgba(243, 156, 18, 0.1), rgba(10, 15, 25, 0.9));
        }

        .stars {
          color: #f39c12;
          font-size: 1.3rem;
          margin-bottom: 15px;
        }

        .testimonial-card p {
          color: #bbb;
          font-style: italic;
          line-height: 1.6;
          margin: 0 0 20px 0;
        }

        .author {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .author-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #00d9ff, #0077ff);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
        }

        .author-name {
          color: #888;
          font-size: 0.9rem;
        }

        /* Final CTA */
        .final-cta {
          text-align: center;
          padding: 120px 20px;
          position: relative;
          z-index: 1;
          background: linear-gradient(180deg, transparent 0%, rgba(0, 30, 60, 0.3) 50%, transparent 100%);
        }

        .cta-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          height: 300px;
          background: radial-gradient(ellipse, rgba(0, 150, 200, 0.1) 0%, transparent 60%);
          pointer-events: none;
          z-index: -1;
        }

        .final-cta h2 {
          font-size: 3.5rem;
          font-weight: 900;
          margin: 0 0 15px 0;
          position: relative;
          z-index: 2;
          background: linear-gradient(180deg, #fff 0%, #aaa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .final-cta p {
          color: #888;
          font-size: 1.2rem;
          margin: 0 0 40px 0;
          position: relative;
          z-index: 2;
        }

        .btn-mega {
          padding: 22px 60px;
          font-size: 1.3rem;
          position: relative;
          z-index: 2;
          display: inline-flex;
        }

        /* Footer */
        .footer {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding: 50px 20px;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 25px;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.3rem;
          font-weight: 700;
          color: #fff;
        }

        .footer-logo {
          width: 35px;
          height: 35px;
          background: linear-gradient(135deg, #00d9ff, #0077ff);
          border-radius: 50%;
        }

        .footer-nav {
          display: flex;
          gap: 30px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .footer-nav a {
          color: #666;
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-nav a:hover {
          color: #00d9ff;
        }

        .copyright {
          color: #444;
          font-size: 0.9rem;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .synergy-bridge {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 3rem;
          }

          .hero-tagline {
            font-size: 1.2rem;
          }

          .tagline-line {
            display: none;
          }

          .section-header h2 {
            font-size: 2rem;
          }

          .game-card {
            width: 100%;
          }

          .stat-num {
            font-size: 2.5rem;
          }

          .stats-container {
            gap: 30px;
          }

          .final-cta h2 {
            font-size: 2.5rem;
          }

          .btn-mega {
            padding: 18px 40px;
            font-size: 1.1rem;
          }
        }
      `}</style>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/context/AuthContext'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && user) {
      router.push('/hub')
    }
  }, [user, loading, router])

  const handleNav = (path: string) => {
    router.push(path)
  }

  if (!mounted) return null

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0f 0%, #0d1117 50%, #0a0a0f 100%)',
      color: '#fff',
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      overflowX: 'hidden',
    }}>
      {/* Hero Section */}
      <header style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 20px',
        position: 'relative',
        background: 'radial-gradient(ellipse 80% 50% at 50% 30%, rgba(0, 100, 150, 0.15) 0%, transparent 60%)',
      }}>
        {/* Logo */}
        <div style={{
          width: '100px',
          height: '100px',
          background: 'linear-gradient(135deg, #00d9ff 0%, #0066cc 100%)',
          borderRadius: '50%',
          marginBottom: '30px',
          boxShadow: '0 0 60px rgba(0, 217, 255, 0.4), inset 0 0 30px rgba(255, 255, 255, 0.2)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '30px',
            height: '30px',
            background: 'radial-gradient(circle, #fff 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 8vw, 5rem)',
          fontWeight: 900,
          letterSpacing: '8px',
          margin: '0 0 10px 0',
          lineHeight: 1.1,
        }}>
          <span style={{
            display: 'block',
            background: 'linear-gradient(180deg, #ffffff 0%, #888888 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>DOT</span>
          <span style={{
            display: 'block',
            background: 'linear-gradient(135deg, #00d9ff 0%, #00ff88 50%, #ff6b00 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>UNIVERSE</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 3vw, 1.5rem)',
          color: '#00d9ff',
          margin: '0 0 10px 0',
          fontWeight: 600,
        }}>
          Two Games. One Universe. Infinite Fun.
        </p>

        <p style={{
          fontSize: '1rem',
          color: '#666',
          margin: '0 0 40px 0',
        }}>
          Free browser games with cross-game synergy - no download required
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '50px',
        }}>
          {user ? (
            <button
              onClick={() => handleNav('/hub')}
              style={{
                padding: '18px 45px',
                fontSize: '1.1rem',
                fontWeight: 700,
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #00d9ff, #0077ff)',
                color: '#fff',
                boxShadow: '0 0 30px rgba(0, 217, 255, 0.4)',
                transition: 'all 0.3s ease',
              }}
            >
              Enter Game Hub
            </button>
          ) : (
            <>
              <button
                onClick={() => handleNav('/login')}
                style={{
                  padding: '18px 45px',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #00d9ff, #0077ff)',
                  color: '#fff',
                  boxShadow: '0 0 30px rgba(0, 217, 255, 0.4)',
                  transition: 'all 0.3s ease',
                }}
              >
                Play Now - Free!
              </button>
              <button
                onClick={() => handleNav('/login')}
                style={{
                  padding: '18px 45px',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  borderRadius: '50px',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: '2px solid rgba(0, 217, 255, 0.5)',
                  color: '#00d9ff',
                  transition: 'all 0.3s ease',
                }}
              >
                Sign In
              </button>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '30px',
          flexWrap: 'wrap',
          color: '#888',
          fontSize: '0.95rem',
        }}>
          <span>100 Floors</span>
          <span style={{ color: '#444' }}>|</span>
          <span>Leaderboards</span>
          <span style={{ color: '#444' }}>|</span>
          <span>Cloud Saves</span>
        </div>

        {/* Scroll Indicator */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#555',
          fontSize: '0.85rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: '24px',
            height: '38px',
            border: '2px solid #444',
            borderRadius: '15px',
            margin: '0 auto 10px',
            position: 'relative',
          }}>
            <div style={{
              width: '4px',
              height: '8px',
              background: '#00d9ff',
              borderRadius: '2px',
              position: 'absolute',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
            }} />
          </div>
          Scroll to explore
        </div>
      </header>

      {/* Games Section */}
      <section style={{
        padding: '100px 20px',
        maxWidth: '1400px',
        margin: '0 auto',
        background: 'transparent',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: 'rgba(0, 217, 255, 0.1)',
            border: '1px solid rgba(0, 217, 255, 0.2)',
            borderRadius: '20px',
            color: '#00d9ff',
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '2px',
            marginBottom: '20px',
          }}>CHOOSE YOUR GAME</span>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800,
            margin: 0,
            background: 'linear-gradient(180deg, #fff 0%, #888 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Our Games</h2>
          <p style={{ color: '#666', marginTop: '15px' }}>Two unique experiences, perfectly connected</p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center',
          gap: '30px',
          flexWrap: 'wrap',
        }}>
          {/* DotSlayer Card */}
          <div style={{
            width: '400px',
            maxWidth: '100%',
            background: 'linear-gradient(180deg, rgba(20, 25, 40, 0.95) 0%, rgba(10, 15, 25, 0.98) 100%)',
            borderRadius: '24px',
            padding: '40px 30px',
            border: '1px solid rgba(255, 107, 0, 0.3)',
            position: 'relative',
          }}>
            <span style={{
              display: 'inline-block',
              padding: '6px 15px',
              borderRadius: '15px',
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '2px',
              marginBottom: '25px',
              background: 'linear-gradient(135deg, #ff6b00, #ff4400)',
              color: '#fff',
            }}>ACTION ROGUELIKE</span>

            <div style={{
              width: '100px',
              height: '100px',
              margin: '0 auto 25px',
              background: 'radial-gradient(circle, rgba(255, 107, 0, 0.2) 0%, transparent 70%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2" style={{ width: '50px', height: '50px' }}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>

            <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#ff6b00' }}>DotSlayer</h3>
            <p style={{ color: '#666', margin: '5px 0 15px 0', fontSize: '0.95rem' }}>100 Floors of Chaos</p>
            <p style={{ color: '#999', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              Battle through procedurally generated dungeons. Face 20+ enemy types, unlock powerful skills, defeat epic bosses!
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '25px' }}>
              {['Roguelike Action', 'Global Rankings', 'Skill Trees', 'Epic Bosses'].map((f) => (
                <span key={f} style={{
                  padding: '8px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  color: '#aaa',
                }}>{f}</span>
              ))}
            </div>

            <button
              onClick={() => handleNav('/slayer')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 30px',
                borderRadius: '25px',
                border: '2px solid rgba(255, 107, 0, 0.4)',
                background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.2), rgba(255, 50, 0, 0.1))',
                color: '#ff6b00',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.3s',
              }}
            >
              Play DotSlayer
            </button>
          </div>

          {/* Synergy Bridge - Desktop only */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, rgba(243, 156, 18, 0.2), rgba(241, 196, 15, 0.1))',
              border: '2px solid rgba(243, 156, 18, 0.3)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
            }}>
              🔗
            </div>
            <p style={{ color: '#666', fontSize: '0.85rem', textAlign: 'center', margin: '10px 0 0 0' }}>
              Cross-Game<br/>Synergy
            </p>
          </div>

          {/* Dot Clicker Card */}
          <div style={{
            width: '400px',
            maxWidth: '100%',
            background: 'linear-gradient(180deg, rgba(20, 25, 40, 0.95) 0%, rgba(10, 15, 25, 0.98) 100%)',
            borderRadius: '24px',
            padding: '40px 30px',
            border: '1px solid rgba(0, 217, 255, 0.3)',
            position: 'relative',
          }}>
            <span style={{
              display: 'inline-block',
              padding: '6px 15px',
              borderRadius: '15px',
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '2px',
              marginBottom: '25px',
              background: 'linear-gradient(135deg, #00d9ff, #0099ff)',
              color: '#fff',
            }}>IDLE INCREMENTAL</span>

            <div style={{
              width: '100px',
              height: '100px',
              margin: '0 auto 25px',
              background: 'radial-gradient(circle, rgba(0, 217, 255, 0.2) 0%, transparent 70%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, #00d9ff, #0077ff)',
                borderRadius: '50%',
                boxShadow: '0 0 30px rgba(0, 217, 255, 0.5)',
              }} />
            </div>

            <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#00d9ff' }}>Dot Clicker</h3>
            <p style={{ color: '#666', margin: '5px 0 15px 0', fontSize: '0.95rem' }}>Build Your Empire</p>
            <p style={{ color: '#999', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              Click, build, prestige, ascend! Grow from humble clicks to an unstoppable dot empire with 20+ buildings.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '25px' }}>
              {['Addictive Clicking', '20+ Buildings', 'Prestige System', 'Offline Progress'].map((f) => (
                <span key={f} style={{
                  padding: '8px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  color: '#aaa',
                }}>{f}</span>
              ))}
            </div>

            <button
              onClick={() => handleNav('/clicker')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 30px',
                borderRadius: '25px',
                border: '2px solid rgba(0, 217, 255, 0.4)',
                background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(0, 150, 255, 0.1))',
                color: '#00d9ff',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.3s',
              }}
            >
              Play Dot Clicker
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '100px 20px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: 'rgba(0, 217, 255, 0.1)',
            border: '1px solid rgba(0, 217, 255, 0.2)',
            borderRadius: '20px',
            color: '#00d9ff',
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '2px',
            marginBottom: '20px',
          }}>WHY DOT UNIVERSE</span>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800,
            margin: 0,
            background: 'linear-gradient(180deg, #fff 0%, #888 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Game Features</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '25px',
        }}>
          {[
            { icon: '⚡', title: 'Instant Play', desc: 'No downloads, no installs. Click and play instantly in your browser.', highlight: false },
            { icon: '🔗', title: 'Cross-Game Synergy', desc: 'Progress in one game boosts the other. Play both for maximum rewards!', highlight: true },
            { icon: '💰', title: '100% Free', desc: 'No paywalls, no ads, no pay-to-win. Just pure gaming fun.', highlight: false },
            { icon: '☁️', title: 'Cloud Saves', desc: 'Your progress syncs automatically across all your devices.', highlight: false },
            { icon: '🏆', title: 'Leaderboards', desc: "Compete globally. Climb the ranks and prove you're the best!", highlight: false },
            { icon: '📱', title: 'Mobile Ready', desc: 'Play on desktop, tablet, or phone. Your adventure, anywhere.', highlight: false },
          ].map((feature) => (
            <div key={feature.title} style={{
              background: feature.highlight
                ? 'linear-gradient(145deg, rgba(0, 217, 255, 0.1), rgba(10, 15, 25, 0.9))'
                : 'linear-gradient(145deg, rgba(15, 20, 35, 0.8), rgba(10, 15, 25, 0.9))',
              border: feature.highlight
                ? '1px solid rgba(0, 217, 255, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '20px',
              padding: '35px 30px',
              transition: 'all 0.3s',
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'rgba(0, 217, 255, 0.1)',
                borderRadius: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                fontSize: '1.8rem',
              }}>{feature.icon}</div>
              <h3 style={{ fontSize: '1.3rem', margin: '0 0 10px 0', color: '#fff' }}>{feature.title}</h3>
              <p style={{ color: '#888', margin: 0, lineHeight: 1.6 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section style={{
        padding: '80px 20px',
        background: 'linear-gradient(180deg, rgba(0, 217, 255, 0.03) 0%, transparent 50%, rgba(255, 107, 0, 0.03) 100%)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '60px',
          flexWrap: 'wrap',
          maxWidth: '1000px',
          margin: '0 auto',
        }}>
          {[
            { num: '100+', label: 'Floors' },
            { num: '20+', label: 'Enemy Types' },
            { num: '40+', label: 'Achievements' },
            { num: '∞', label: 'Fun' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center', padding: '30px' }}>
              <span style={{
                display: 'block',
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #00d9ff, #00ff88)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1,
              }}>{stat.num}</span>
              <span style={{ display: 'block', color: '#666', fontSize: '1rem', marginTop: '10px' }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{
        padding: '100px 20px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: 'rgba(0, 217, 255, 0.1)',
            border: '1px solid rgba(0, 217, 255, 0.2)',
            borderRadius: '20px',
            color: '#00d9ff',
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '2px',
            marginBottom: '20px',
          }}>PLAYER REVIEWS</span>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800,
            margin: 0,
            background: 'linear-gradient(180deg, #fff 0%, #888 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>What Players Say</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '25px',
        }}>
          {[
            { text: "Finally a browser roguelike that doesn't feel like a mobile port. The synergy system is genius!", author: 'r/WebGames user', avatar: 'R', featured: false },
            { text: "Been playing Dot Clicker for a week straight. The prestige system is perfectly balanced.", author: 'r/incremental_games', avatar: 'I', featured: true },
            { text: "Love that my progress in one game helps the other. Smart design!", author: 'Discord member', avatar: 'D', featured: false },
          ].map((t, i) => (
            <div key={i} style={{
              background: t.featured
                ? 'linear-gradient(145deg, rgba(243, 156, 18, 0.1), rgba(10, 15, 25, 0.9))'
                : 'linear-gradient(145deg, rgba(15, 20, 35, 0.8), rgba(10, 15, 25, 0.9))',
              border: t.featured
                ? '1px solid rgba(243, 156, 18, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '20px',
              padding: '30px',
            }}>
              <div style={{ color: '#f39c12', fontSize: '1.3rem', marginBottom: '15px' }}>★★★★★</div>
              <p style={{ color: '#bbb', fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 20px 0' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #00d9ff, #0077ff)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}>{t.avatar}</span>
                <span style={{ color: '#888', fontSize: '0.9rem' }}>{t.author}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{
        textAlign: 'center',
        padding: '120px 20px',
        background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0, 100, 150, 0.1) 0%, transparent 60%)',
      }}>
        <h2 style={{
          fontSize: 'clamp(2rem, 6vw, 3.5rem)',
          fontWeight: 900,
          margin: '0 0 15px 0',
          background: 'linear-gradient(180deg, #fff 0%, #aaa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>Ready to Begin?</h2>
        <p style={{ color: '#888', fontSize: '1.2rem', margin: '0 0 40px 0' }}>
          Join the Dot Universe and start your adventure today!
        </p>
        <button
          onClick={() => handleNav('/login')}
          style={{
            padding: '22px 60px',
            fontSize: '1.3rem',
            fontWeight: 700,
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #00d9ff, #0077ff)',
            color: '#fff',
            boxShadow: '0 0 40px rgba(0, 217, 255, 0.4)',
            transition: 'all 0.3s ease',
          }}
        >
          Start Playing - It's Free!
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '50px 20px',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '25px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '1.3rem',
            fontWeight: 700,
          }}>
            <div style={{
              width: '35px',
              height: '35px',
              background: 'linear-gradient(135deg, #00d9ff, #0077ff)',
              borderRadius: '50%',
            }} />
            Dot Universe
          </div>

          <nav style={{
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {[
              { label: 'Game Hub', path: '/hub' },
              { label: 'DotSlayer', path: '/slayer' },
              { label: 'Dot Clicker', path: '/clicker' },
              { label: 'Profile', path: '/profile' },
              { label: 'News', path: '/news' },
            ].map((link) => (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                }}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <p style={{ color: '#444', fontSize: '0.9rem' }}>
            2025-2026 Dot Universe. Play free browser games.
          </p>
        </div>
      </footer>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/context/AuthContext'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/hub')
    }
  }, [user, loading, router])

  const handleGoogleSignIn = async () => {
    try {
      setError('')
      setIsSubmitting(true)
      await signInWithGoogle()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google'
      setError(errorMessage)
      setIsSubmitting(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    try {
      setError('')
      setIsSubmitting(true)
      const { error: authError } = isSignUp
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password)
      if (authError) {
        setError(authError.message || 'Authentication failed')
        setIsSubmitting(false)
      } else if (isSignUp) {
        setError('Check your email for confirmation link')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
      setError(errorMessage)
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #050510 0%, #0a0a20 50%, #050510 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#00d9ff',
        fontSize: '1.2rem',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        letterSpacing: '3px',
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          background: 'radial-gradient(circle at 30% 30%, #00ffff, #00d9ff, #0088aa)',
          borderRadius: '50%',
          marginBottom: '20px',
          boxShadow: '0 0 40px rgba(0, 217, 255, 0.6)',
        }} />
        Loading Dot Universe...
      </div>
    )
  }

  if (user) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #050510 0%, #0a0a20 25%, #150a25 50%, #0a1520 75%, #050510 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: '20px',
      position: 'relative',
    }}>
      {/* Background glows */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(ellipse 60% 40% at 30% 20%, rgba(0, 217, 255, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse 50% 30% at 70% 80%, rgba(255, 107, 0, 0.06) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
      }} />

      <div style={{
        background: 'linear-gradient(145deg, rgba(20, 25, 40, 0.95), rgba(10, 15, 30, 0.98))',
        padding: '50px 40px',
        borderRadius: '24px',
        border: '1px solid rgba(0, 217, 255, 0.2)',
        boxShadow: '0 0 60px rgba(0, 217, 255, 0.15), 0 20px 60px rgba(0, 0, 0, 0.5)',
        maxWidth: '450px',
        width: '100%',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <div style={{
            width: '70px',
            height: '70px',
            background: 'linear-gradient(135deg, #00d9ff 0%, #0066cc 100%)',
            borderRadius: '50%',
            margin: '0 auto 20px',
            boxShadow: '0 0 40px rgba(0, 217, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              background: 'radial-gradient(circle, #fff 0%, transparent 70%)',
              borderRadius: '50%',
            }} />
          </div>
        </div>

        <h1 style={{
          fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
          textAlign: 'center',
          margin: '0 0 10px 0',
          fontWeight: 900,
          letterSpacing: '4px',
        }}>
          <span style={{ color: '#00d9ff', textShadow: '0 0 20px rgba(0, 217, 255, 0.8)' }}>●</span>
          <span style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #00d9ff 50%, #ffffff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: '0 10px',
          }}>DOT UNIVERSE</span>
          <span style={{ color: '#ff6b00', textShadow: '0 0 20px rgba(255, 107, 0, 0.8)' }}>●</span>
        </h1>

        <p style={{ color: '#889', textAlign: 'center', fontSize: '0.95rem', marginBottom: '30px' }}>
          Two Epic Games. One Account. Infinite Fun.
        </p>

        {/* Error */}
        {error && (
          <div style={{
            background: error.includes('email') ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
            border: `1px solid ${error.includes('email') ? 'rgba(46, 204, 113, 0.3)' : 'rgba(231, 76, 60, 0.3)'}`,
            color: error.includes('email') ? '#2ecc71' : '#e74c3c',
            padding: '12px 15px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '0.9rem',
            textAlign: 'center',
          }}>{error}</div>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '16px',
            background: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            opacity: isSubmitting ? 0.6 : 1,
            color: '#333',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '25px 0',
          gap: '15px',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />
          <span style={{ color: '#556', fontSize: '0.85rem' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '14px 16px',
              marginBottom: '12px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid rgba(0, 217, 255, 0.2)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '1rem',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border-color 0.3s',
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '14px 16px',
              marginBottom: '20px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid rgba(0, 217, 255, 0.2)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '1rem',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border-color 0.3s',
            }}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '16px',
              background: isSubmitting ? '#333' : 'linear-gradient(135deg, #00d9ff, #0077ff)',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: isSubmitting ? 'none' : '0 4px 20px rgba(0, 217, 255, 0.4)',
              transition: 'all 0.3s',
            }}
          >
            {isSubmitting ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#889', fontSize: '0.95rem' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError('') }}
            style={{
              background: 'none',
              border: 'none',
              color: '#00d9ff',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.95rem',
              fontWeight: 600,
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        {/* Stats */}
        <div style={{
          marginTop: '30px',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '20px 0',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          {[
            { value: '100+', label: 'Floors', color: '#00d9ff' },
            { value: 'Free', label: 'Forever', color: '#2ecc71' },
            { value: '2', label: 'Games', color: '#f39c12' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#556' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div style={{
          marginTop: '20px',
          padding: '15px 20px',
          background: 'rgba(0, 217, 255, 0.05)',
          borderRadius: '12px',
          borderLeft: '3px solid #00d9ff',
        }}>
          <p style={{ color: '#aaa', fontSize: '0.9rem', margin: 0, fontStyle: 'italic', lineHeight: 1.6 }}>
            "Finally a browser roguelike that doesn't feel like a mobile port. The synergy system is genius!"
          </p>
          <p style={{ color: '#00d9ff', fontSize: '0.8rem', margin: '10px 0 0 0', fontWeight: 700 }}>
            - r/WebGames user
          </p>
        </div>

        {/* Back to Home */}
        <div style={{ textAlign: 'center', marginTop: '25px' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#556',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

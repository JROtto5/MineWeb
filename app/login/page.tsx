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
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google')
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
      } else {
        // Success - will redirect via useEffect
        if (isSignUp) {
          setError('Check your email for confirmation link')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #0a4d68 0%, #05878a 50%, #0a4d68 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#05878a',
        fontSize: '24px',
        fontFamily: 'system-ui'
      }}>
        Loading DotSlayer...
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a4d68 0%, #05878a 50%, #0a4d68 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui',
      padding: '20px'
    }}>
      <div style={{
        background: '#0f1419',
        padding: '40px',
        borderRadius: '16px',
        border: '2px solid #05878a',
        boxShadow: '0 0 40px rgba(5, 135, 138, 0.5)',
        maxWidth: '450px',
        width: '100%'
      }}>
        {/* Logo/Title */}
        <h1 style={{
          fontSize: '42px',
          color: '#05878a',
          textAlign: 'center',
          margin: '0 0 10px 0',
          fontWeight: 'bold',
          textShadow: '0 0 20px rgba(5, 135, 138, 0.8)'
        }}>
          <span style={{ color: '#00d9ff' }}>●</span> DOT UNIVERSE <span style={{ color: '#ff6b00' }}>●</span>
        </h1>

        <p style={{
          color: '#88c0d0',
          textAlign: 'center',
          fontSize: '14px',
          marginBottom: '30px'
        }}>
          Two Epic Games. One Account. Infinite Fun.
        </p>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#8b0000',
            color: '#ffffff',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
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
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            opacity: isSubmitting ? 0.6 : 1
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
          textAlign: 'center',
          margin: '20px 0',
          color: '#4c566a',
          fontSize: '14px'
        }}>
          or
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '12px',
              background: '#1a1f2e',
              border: '1px solid #2e3440',
              borderRadius: '8px',
              color: '#eceff4',
              fontSize: '16px',
              boxSizing: 'border-box'
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
              padding: '12px',
              marginBottom: '20px',
              background: '#1a1f2e',
              border: '1px solid #2e3440',
              borderRadius: '8px',
              color: '#eceff4',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '16px',
              background: isSubmitting ? '#444' : 'linear-gradient(135deg, #05878a, #088395)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 15px rgba(5, 135, 138, 0.4)'
            }}
          >
            {isSubmitting ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '20px',
          color: '#88c0d0',
          fontSize: '14px'
        }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <a
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
            }}
            style={{
              color: '#05878a',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </a>
        </p>

        {/* Features Preview */}
        <div style={{
          marginTop: '40px',
          padding: '20px',
          background: '#1a1f2e',
          borderRadius: '8px',
          border: '1px solid #2e3440'
        }}>
          <h3 style={{ color: '#ff6b00', fontSize: '14px', marginBottom: '8px', marginTop: 0 }}>
            DOT SLAYER - Roguelike Action
          </h3>
          <ul style={{
            color: '#88c0d0',
            fontSize: '13px',
            lineHeight: '20px',
            paddingLeft: '20px',
            margin: '0 0 15px 0'
          }}>
            <li>100 procedurally generated floors</li>
            <li>Epic bosses & skill trees</li>
            <li>Global leaderboards</li>
          </ul>
          <h3 style={{ color: '#00d9ff', fontSize: '14px', marginBottom: '8px', marginTop: 0 }}>
            DOT CLICKER - Idle Empire
          </h3>
          <ul style={{
            color: '#88c0d0',
            fontSize: '13px',
            lineHeight: '20px',
            paddingLeft: '20px',
            margin: 0
          }}>
            <li>Addictive idle progression</li>
            <li>Buildings, upgrades & prestige</li>
            <li>Cross-game synergy bonuses!</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

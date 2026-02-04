'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/context/AuthContext'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/hub')
      } else {
        router.push('/login')
      }
    }
  }, [user, loading, router])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a2e 100%)',
      color: '#00d9ff',
    }}>
      <div style={{
        width: 80,
        height: 80,
        background: '#00d9ff',
        borderRadius: '50%',
        animation: 'pulse 1s ease-in-out infinite',
        marginBottom: 20,
      }}></div>
      <p style={{ fontSize: '1.5rem' }}>Loading Dot Universe...</p>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}

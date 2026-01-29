'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { authService, User } from '../supabase/auth'
import type { Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions
    authService.getSession().then(({ session }) => {
      setSession(session)
      setUser(session?.user as User || null)
      setLoading(false)
    })

    // Listen for changes
    const subscription = authService.onAuthStateChange((session) => {
      setSession(session)
      setUser(session?.user as User || null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const { error } = await authService.signInWithGoogle()
    if (error) {
      console.error('Google sign-in error:', error)
      throw error
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await authService.signInWithEmail(email, password)
    if (error) {
      console.error('Email sign-in error:', error)
      return { error }
    }
    setSession(data.session)
    setUser(data.user as User)
    return { error: null }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    const { data, error } = await authService.signUpWithEmail(email, password)
    if (error) {
      console.error('Email sign-up error:', error)
      return { error }
    }
    // Note: Email confirmation might be required
    if (data.session) {
      setSession(data.session)
      setUser(data.user as User)
    }
    return { error: null }
  }

  const signOut = async () => {
    const { error } = await authService.signOut()
    if (error) {
      console.error('Sign-out error:', error)
      throw error
    }
    setSession(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

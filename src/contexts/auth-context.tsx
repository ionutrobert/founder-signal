'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface AuthContextType {
  isAuthDrawerOpen: boolean
  openAuthDrawer: (defaultTab?: 'login' | 'signup') => void
  closeAuthDrawer: () => void
  authDefaultTab: 'login' | 'signup'
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState(false)
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'signup'>('login')

  const openAuthDrawer = useCallback((defaultTab: 'login' | 'signup' = 'login') => {
    setAuthDefaultTab(defaultTab)
    setIsAuthDrawerOpen(true)
  }, [])

  const closeAuthDrawer = useCallback(() => {
    setIsAuthDrawerOpen(false)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuthDrawerOpen,
        openAuthDrawer,
        closeAuthDrawer,
        authDefaultTab,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

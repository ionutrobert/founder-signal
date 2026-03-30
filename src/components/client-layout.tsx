'use client'

import { useAuth } from '@/contexts/auth-context'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import AuthDrawer from '@/components/auth/auth-drawer'
import { Toaster } from 'sonner'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isAuthDrawerOpen, closeAuthDrawer, authDefaultTab } = useAuth()
  
  return (
    <>
      <Navigation />
      <main className="pt-16">
        {children}
      </main>
      <Footer />
      <AuthDrawer isOpen={isAuthDrawerOpen} onClose={closeAuthDrawer} defaultTab={authDefaultTab} />
      <Toaster />
    </>
  )
}

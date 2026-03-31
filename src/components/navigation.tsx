'use client'

import { useState, useEffect } from 'react'
import { Signal, ArrowRight, Menu, FileText, History, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

const sheetLinks = [
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { openAuthDrawer } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300',
          isScrolled
            ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm'
            : 'bg-transparent'
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex h-16 items-center justify-between">
            {/* Left: Logo Pill Container */}
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div 
                className="flex items-center gap-2 bg-slate-900 rounded-full px-4 py-2 transition-transform"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#E7EB5D]">
                  <Signal className="h-4 w-4 text-slate-900" />
                </div>
                <span className="text-white font-semibold text-sm">
                  Founder Signal
                </span>
              </motion.div>
            </Link>

            {/* Center: Tagline (hidden on mobile) */}
            <div className="hidden lg:flex items-center">
              <span className="text-sm text-slate-500">
                A smarter way to build and grow
              </span>
            </div>

            {/* Right: CTA + Hamburger */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => openAuthDrawer('signup')}
                className="hidden sm:flex items-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-5 py-2.5 transition-all group"
              >
                Start free trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger>
          <Menu className="h-6 w-6" />
        </SheetTrigger>
                <SheetContent side="right" className="w-full max-w-sm p-0">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="flex flex-col h-full"
                  >
                    {/* Header with Logo and Close */}
                    <SheetHeader className="p-6 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <Link 
                          href="/" 
                          onClick={() => setIsSheetOpen(false)}
                          className="flex items-center gap-2"
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#E7EB5D]">
                            <Signal className="h-4 w-4 text-slate-900" />
                          </div>
                          <span className="text-slate-900 font-semibold text-sm">
                            Founder Signal
                          </span>
                        </Link>
                      </div>
                    </SheetHeader>

                    {/* Menu Items */}
                    <nav className="flex-1 p-6">
                      <SheetTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
                        Menu
                      </SheetTitle>
                      <div className="space-y-1">
                        {sheetLinks.map((link, index) => (
                          <motion.div
                            key={link.href}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.3 }}
                          >
                            <Link
                              href={link.href}
                              onClick={() => setIsSheetOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                              <link.icon className="h-5 w-5 text-slate-400" />
                              {link.label}
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </nav>

                    {/* Bottom Get Started Button */}
                    <div className="p-6 border-t border-slate-100">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                      >
                        <Button
                          onClick={() => {
                            openAuthDrawer('signup')
                            setIsSheetOpen(false)
                          }}
                          className="w-full flex items-center justify-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-base font-medium px-6 py-4"
                        >
                          Get Started
                          <ArrowRight className="h-5 w-5" />
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </div>
      </header>
    </>
  )
}

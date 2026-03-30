'use client'

import { useState, useEffect } from 'react'
import { Menu, X, Signal, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/docs', label: 'API' },
]

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { openAuthDrawer } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

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
              <div className="flex items-center gap-2 bg-slate-900 rounded-full px-4 py-2 transition-transform group-hover:scale-105">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#E7EB5D]">
                  <Signal className="h-4 w-4 text-slate-900" />
                </div>
                <span className="text-white font-semibold text-sm">
                  Founder Signal
                </span>
              </div>
            </Link>

            {/* Center: Tagline (hidden on mobile) */}
            <div className="hidden lg:flex items-center">
              <span className="text-sm text-slate-500">
                A smarter way to build and grow
              </span>
            </div>

            {/* Right: CTA + Hamburger */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => openAuthDrawer('signup')}
                className="hidden sm:flex items-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-5 py-2.5 transition-all group"
              >
                Start free trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Full-screen Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-white"
          >
            <div className="flex flex-col h-full">
              {/* Header with close button */}
              <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
                <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#E7EB5D]">
                    <Signal className="h-4 w-4 text-slate-900" />
                  </div>
                  <span className="text-slate-900 font-semibold text-sm">
                    Founder Signal
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-900 hover:bg-slate-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Menu Links */}
              <nav className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8">
                <div className="space-y-1">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="block py-4 text-3xl font-semibold text-slate-900 hover:text-slate-600 transition-colors border-b border-slate-100"
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Mobile CTA */}
                <div className="mt-8 sm:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      openAuthDrawer('signup')
                      setIsMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-full bg-slate-900 text-white text-base font-medium px-6 py-4"
                  >
                    Start free trial
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </nav>

              {/* Footer */}
              <div className="px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Validate your startup idea before you build.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

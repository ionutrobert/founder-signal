"use client"

import { useState, useEffect } from "react"
import { Menu, X, Signal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#api", label: "API" },
]

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="relative text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-slate-900 group"
    >
      {label}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#E7EB5D] transition-all duration-300 group-hover:w-full" />
    </a>
  )
}

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { openAuthDrawer } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300",
        isScrolled
          ? "bg-white/90 backdrop-blur-lg border-b border-slate-200/50 shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E7EB5D] shadow-sm">
              <Signal className="h-5 w-5 text-slate-900" />
            </div>
            <span className="text-lg font-semibold text-slate-900">
              Founder Signal
            </span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="min-h-10 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              onClick={() => openAuthDrawer('login')}
            >
              Sign In
            </Button>
            <Button
              size="sm"
              onClick={() => openAuthDrawer('signup')}
              className="min-h-10 bg-[#E7EB5D] hover:bg-[#D4D854] text-slate-900 font-medium shadow-sm"
            >
              Start Free
              <Badge variant="secondary" className="ml-2 bg-slate-900 text-white text-[10px] px-1.5 py-0 h-5">
                FREE
              </Badge>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </nav>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-lg">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  className="w-full min-h-10"
                  onClick={() => { openAuthDrawer('login'); setIsMobileMenuOpen(false) }}
                >
                  Sign In
                </Button>
                <Button 
                  className="w-full min-h-10 bg-[#E7EB5D] hover:bg-[#D4D854] text-slate-900"
                  onClick={() => { openAuthDrawer('signup'); setIsMobileMenuOpen(false) }}
                >
                  Start Free
                  <Badge variant="secondary" className="ml-2 bg-slate-900 text-white text-[10px] px-1.5 py-0 h-5">
                    FREE
                  </Badge>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

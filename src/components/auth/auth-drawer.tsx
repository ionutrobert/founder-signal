'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, EyeOff } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

interface AuthDrawerProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'login' | 'signup'
}

function FloatingInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  showPasswordToggle = false,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  showPasswordToggle?: boolean
}) {
  const [isFocused, setIsFocused] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  const hasValue = value.length > 0
  const isFloating = isFocused || hasValue
  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className={cn(
          'pointer-events-none absolute left-4 transition-all duration-200',
          isFloating
            ? 'top-1 text-[11px] font-medium text-slate-500'
            : 'top-1/2 -translate-y-1/2 text-sm text-slate-400'
        )}
      >
        {label}
      </label>
      <Input
        id={id}
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          'h-14 rounded-xl border-slate-200 bg-white pt-4 text-slate-900',
          'focus-visible:border-[#E7EB5D] focus-visible:ring-[#E7EB5D]/20'
        )}
        autoComplete={type === 'password' ? 'current-password' : 'email'}
      />
      {showPasswordToggle && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
        >
          {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      )}
    </div>
  )
}

export default function AuthDrawer({ isOpen, onClose }: AuthDrawerProps) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [rememberMe, setRememberMe] = React.useState(false)

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleSocialLogin = (provider: 'google' | 'github') => {
    console.log(`Login with ${provider}`)
  }

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Email login:', { email, password, rememberMe })
  }

  const containerVariants = {
    hidden: { x: '100%' },
    visible: {
      x: 0,
      transition: { type: 'spring' as const, damping: 30, stiffness: 300 }
    },
    exit: {
      x: '100%',
      transition: { type: 'spring' as const, damping: 30, stiffness: 300 }
    }
  }

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  }

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.08, delayChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={handleBackdropClick}
          />

          <motion.aside
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex flex-col min-h-full">
              <div className="relative z-10 flex-1 flex flex-col justify-center px-8 py-12">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </button>

                <motion.div
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  className="w-full max-w-sm mx-auto"
                >
                  <motion.div variants={itemVariants} className="mb-8 text-center">
                    <h2 className="text-2xl font-semibold text-slate-900">
                      Welcome back
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Sign in to validate your startup ideas
                    </p>
                  </motion.div>

                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <motion.div variants={itemVariants}>
                      <FloatingInput
                        id="login-email"
                        label="Email"
                        type="email"
                        value={email}
                        onChange={setEmail}
                      />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <FloatingInput
                        id="login-password"
                        label="Password"
                        type="password"
                        value={password}
                        onChange={setPassword}
                        showPasswordToggle
                      />
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex items-center justify-between">
                      <label htmlFor="remember-me" className="inline-flex cursor-pointer items-center gap-2">
                        <Checkbox
                          id="remember-me"
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        />
                        <span className="text-sm text-slate-600">Remember me</span>
                      </label>
                      <button
                        type="button"
                        className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-[#E7EB5D] hover:bg-[#D4D854] text-slate-900 font-medium"
                      >
                        Sign In
                      </Button>
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-slate-400">or</span>
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => handleSocialLogin('google')}
                        className="w-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      >
                        <svg className="mr-2 size-5" viewBox="0 0 24 24" aria-hidden="true">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => handleSocialLogin('github')}
                        className="w-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      >
                        <svg className="mr-2 size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.218.694.825.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        Continue with GitHub
                      </Button>
                    </motion.div>

                    <motion.div variants={itemVariants} className="pt-4 text-center">
                      <p className="text-sm text-slate-500">
                        Don&apos;t have an account?{' '}
                        <button type="button" className="font-medium text-slate-700 hover:text-slate-900">
                          Sign up for free
                        </button>
                      </p>
                    </motion.div>
                  </form>
                </motion.div>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export { AuthDrawer }

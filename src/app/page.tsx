'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowUpRight, Target, Users, TrendingUp, Clock, Signal } from 'lucide-react'

import { RecentAnalyses } from '@/components/recent-analyses'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { LogoCarousel } from '@/components/logo-carousel'
import { ScoreGauge } from '@/components/score-gauge'

const PENDING_IDEA_STORAGE_KEY = 'founder-signal:pending-idea'

export default function HomePage() {
  const router = useRouter()
  const [idea, setIdea] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!idea.trim()) {
      setError('Please describe your startup idea.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      window.sessionStorage.setItem(PENDING_IDEA_STORAGE_KEY, idea.trim())
      router.push('/processing')
    } catch {
      setError('Unable to start the live analysis. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section - Full width with gradients */}
      <section className="relative pt-24 pb-0 overflow-hidden">
        {/* Full-width background with gradient orbs */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100/50" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-violet-100/40 to-blue-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-gradient-to-br from-lime-100/30 to-emerald-100/20 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Row 1: Two-column hero content */}
          <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-16 pt-8 lg:pt-12">
            {/* Left column - Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-medium text-slate-900 tracking-tight max-w-xl lg:max-w-2xl leading-[1.1]">
                Validate your{' '}
                <span className="font-serif italic">idea</span>{' '}
                before you{' '}
                <span className="font-serif italic">build</span>
              </h1>
            </motion.div>

            {/* Right column - Description + CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:w-2/5 flex flex-col gap-6"
            >
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                AI-powered validation that surfaces demand signals, blind spots, and next moves
                for your startup idea.
              </p>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href="#validate"
                  className={buttonVariants({
                    size: 'lg',
                    className: 'bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 h-12 rounded-lg gap-2 flex-1 sm:flex-none group'
                  })}
                >
                  <span>Get Started</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <Link
                  href="/sample"
                  className={buttonVariants({
                    variant: 'outline',
                    size: 'lg',
                    className: 'border-slate-200 text-slate-700 hover:bg-slate-50 px-6 h-12 rounded-lg flex-1 sm:flex-none'
                  })}
                >
                  View Sample
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Row 2: Logo bar - contained within max-w */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center gap-4 sm:gap-8 py-10 lg:py-12 border-t border-slate-100 mt-8 overflow-hidden"
          >
            <p className="text-sm text-slate-500 shrink-0 w-32 lg:w-40">
              Trusted by leading tech teams
            </p>
            <div className="flex-1 min-w-0">
              <LogoCarousel />
            </div>
          </motion.div>
        </div>

        {/* Row 3: Report Preview with full-width background image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="relative mt-8"
        >
          {/* Full-width background image container - no border radius */}
          <div className="relative overflow-hidden" style={{ height: '600px' }}>
            {/* Background image - full width, no border radius */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: 'url(/hero-bg.jpg)' }}
            />
            {/* Overlay to darken image slightly */}
            <div className="absolute inset-0 bg-slate-900/20" />
            
            {/* Report mockup - contained and centered */}
            <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="relative h-full overflow-hidden">
                {/* Report wrapper - light theme, contained width */}
                <div className="relative mx-auto max-w-4xl mt-8 mb-0 rounded-t-2xl overflow-hidden bg-white shadow-2xl">
                  {/* Decorative top gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-white to-blue-50/30 pointer-events-none" />
                  
                  {/* Site header (decorative, not clickable) */}
                  <div className="relative flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                        <Signal className="w-5 h-5 text-[#E7EB5D]" />
                      </div>
                      <span className="text-slate-900 font-semibold">Founder Signal</span>
                    </div>
                    <div className="flex items-center gap-6 text-slate-500 text-sm">
                      <span className="hidden sm:inline">Reports</span>
                      <span className="hidden sm:inline">History</span>
                      <span className="hidden sm:inline">Settings</span>
                      <div className="w-8 h-8 rounded-full bg-slate-200" />
                    </div>
                  </div>

                  {/* Report content */}
                  <div className="relative p-6 lg:p-8">
                    {/* Report header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Validation Report</h3>
                        <p className="text-sm text-slate-500">AI Analysis Complete</p>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Strong
                      </div>
                    </div>

                    {/* Two column layout: Sections on left, Score on right */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left column - Stacked sections */}
                      <div className="lg:col-span-2 space-y-4">
                        {/* Why Now */}
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-violet-600" />
                              </div>
                              <div>
                                <h3 className="text-slate-900 font-semibold">Why Now</h3>
                                <p className="text-xs text-slate-500">Market timing and momentum</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-emerald-600">92</span>
                              <span className="text-sm text-slate-400">/100</span>
                            </div>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full w-[92%] bg-emerald-500 rounded-full" />
                          </div>
                        </div>

                        {/* Problem Clarity */}
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Target className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="text-slate-900 font-semibold">Problem Clarity</h3>
                                <p className="text-xs text-slate-500">How clearly the problem is framed</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-emerald-600">88</span>
                              <span className="text-sm text-slate-400">/100</span>
                            </div>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full w-[88%] bg-emerald-500 rounded-full" />
                          </div>
                        </div>

                        {/* Target Audience */}
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                <Users className="w-5 h-5 text-amber-600" />
                              </div>
                              <div>
                                <h3 className="text-slate-900 font-semibold">Target Audience</h3>
                                <p className="text-xs text-slate-500">Who the product serves</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-amber-600">85</span>
                              <span className="text-sm text-slate-400">/100</span>
                            </div>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full w-[85%] bg-amber-500 rounded-full" />
                          </div>
                        </div>
                      </div>

                      {/* Right column - Score gauge (partially visible) */}
                      <div className="hidden lg:flex flex-col items-center justify-start pt-4">
                        <div className="relative">
                          <ScoreGauge score={87} size={160} duration={2500} />
                          <div className="mt-4 text-center">
                            <p className="text-slate-900 font-semibold text-lg">Overall Score</p>
                            <p className="text-emerald-600 text-sm font-medium">Strong Potential</p>
                          </div>
                        </div>
                        
                        {/* Additional section preview partially visible */}
                        <div className="mt-6 w-full bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 text-slate-500" />
                            </div>
                            <span className="text-sm font-medium text-slate-700">Market</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-amber-600">78</span>
                            <span className="text-xs text-slate-400">/100</span>
                          </div>
                          <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full w-[78%] bg-amber-500 rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* More content below that gets cut off */}
                    <div className="mt-6 space-y-4 opacity-60">
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 h-16" />
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 h-16" />
                    </div>
                  </div>

                  {/* Bottom fade gradient */}
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Form Section */}
      <section id="validate" className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-slate-900">
              Ready to validate your idea?
            </h2>
            <p className="mt-2 text-slate-600">
              Get an analyst-grade evaluation in seconds.
            </p>
          </div>

          <Card className="bg-white shadow-sm border border-slate-200">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="idea" className="block text-sm font-medium text-slate-700 mb-2">
                    Describe your startup idea
                  </label>
                  <Textarea
                    id="idea"
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="A platform that helps freelancers find equity-based startup opportunities..."
                    className="min-h-[120px] border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                    disabled={isSubmitting}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium h-12 rounded-lg"
                >
                  {isSubmitting ? 'Analyzing...' : 'Validate Idea'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Analyses */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RecentAnalyses />
        </div>
      </section>
    </main>
  )
}

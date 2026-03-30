'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Target, Users, TrendingUp, Clock, CheckCircle } from 'lucide-react'

import { RecentAnalyses } from '@/components/recent-analyses'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

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
      {/* Hero Section */}
      <section className="relative pt-24 pb-0 overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100/50" />

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
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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

          {/* Row 2: Logo bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center gap-4 sm:gap-8 py-10 lg:py-12 border-t border-slate-100 mt-8"
          >
            <p className="text-sm text-slate-500 shrink-0 w-32 lg:w-40">
              Trusted by leading tech teams
            </p>
            <div className="relative flex-1 overflow-hidden">
              {/* Fade masks */}
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
              <div className="flex gap-8 items-center animate-marquee whitespace-nowrap">
                {['Linear', 'Vercel', 'Notion', 'Figma', 'Stripe', 'Slack', 'Zoom', 'Webflow'].map((name) => (
                  <div key={name} className="flex items-center gap-2 text-slate-400 opacity-60">
                    <div className="w-5 h-5 rounded bg-slate-200" />
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                ))}
                {['Linear', 'Vercel', 'Notion', 'Figma', 'Stripe', 'Slack', 'Zoom', 'Webflow'].map((name) => (
                  <div key={`${name}-2`} className="flex items-center gap-2 text-slate-400 opacity-60">
                    <div className="w-5 h-5 rounded bg-slate-200" />
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Row 3: Report Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="relative"
          >
            {/* Background wrapper */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 border border-slate-200">
              {/* Subtle blur/gradient background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-blue-50/30 to-lime-50/50" />
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-violet-200/30 to-blue-200/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-br from-lime-200/20 to-emerald-200/10 rounded-full blur-3xl" />

              {/* Report content */}
              <div className="relative p-6 lg:p-8">
                {/* Report header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                      <span className="text-[#E7EB5D] font-bold text-sm">FS</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Validation Report</h3>
                      <p className="text-xs text-slate-500">AI Analysis Complete</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Strong
                  </div>
                </div>

                {/* Report sections grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Why Now */}
                  <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">Why Now</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">92<span className="text-sm font-normal text-slate-500">/100</span></p>
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-[92%] bg-emerald-500 rounded-full" />
                    </div>
                  </div>

                  {/* Problem */}
                  <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">Problem Clarity</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">88<span className="text-sm font-normal text-slate-500">/100</span></p>
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-[88%] bg-emerald-500 rounded-full" />
                    </div>
                  </div>

                  {/* Audience */}
                  <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">Target Audience</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">85<span className="text-sm font-normal text-slate-500">/100</span></p>
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-[85%] bg-emerald-500 rounded-full" />
                    </div>
                  </div>

                  {/* Market - partially visible */}
                  <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">Market</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">78<span className="text-sm font-normal text-slate-500">/100</span></p>
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-[78%] bg-amber-500 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Additional preview content */}
                <div className="mt-4 space-y-3">
                  <div className="bg-white/70 rounded-lg p-3 border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Market Timing</p>
                    <p className="text-sm text-slate-700">Strong tailwinds from AI adoption and remote work trends...</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Competitive Advantage</p>
                    <p className="text-sm text-slate-700">First-mover advantage in underserved niche with...</p>
                  </div>
                </div>
              </div>

              {/* Bottom fade gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </div>
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

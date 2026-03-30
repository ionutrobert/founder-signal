'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BarChart3, FileText, Sparkles } from 'lucide-react'

import { LogoCarousel } from '@/components/logo-carousel'
import { RecentAnalyses } from '@/components/recent-analyses'
import { ScrollReveal } from '@/components/animations'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { SocialProofBadge } from '@/components/social-proof-badge'
import { ReportPreviewCard } from '@/components/report-preview-card'
import { AnimatedStats } from '@/components/animated-stats'

const PENDING_IDEA_STORAGE_KEY = 'founder-signal:pending-idea'

const features = [
  {
    title: 'Demand Signals',
    description: 'Surface market clarity, urgency, and likely customer pull for your idea.'
  },
  {
    title: 'Blind Spots',
    description: 'Highlight risks, assumptions, and missing validation angles.'
  },
  {
    title: 'Next Moves',
    description: 'Generate immediate validation steps and positioning ideas.'
  }
]

const howItWorksSteps = [
  {
    icon: FileText,
    title: 'Describe your idea',
    description: "Tell us what you're building"
  },
  {
    icon: Sparkles,
    title: 'AI analyzes',
    description: 'Our framework evaluates 11 dimensions'
  },
  {
    icon: BarChart3,
    title: 'Get your report',
    description: 'Score, verdict, and actionable insights'
  }
]

const reportAreas = [
  { title: 'Problem Clarity', description: 'Is this a real problem people will pay to solve?' },
  { title: 'Target Audience', description: 'Who exactly is your customer? Can you reach them?' },
  { title: 'Market Insight', description: 'Is the market big enough? Growing? Timing right?' },
  { title: 'Competition', description: 'Who else is solving this? Can you differentiate?' },
  { title: 'Positioning', description: 'How should you frame your value proposition?' },
  { title: 'MVP Scope', description: 'What should you build first? What can wait?' },
  { title: 'Monetization', description: 'How will you make money? Is it sustainable?' },
  { title: 'Risks', description: 'What could kill this? Technical, market, operational' }
]



export default function HomePage() {
  const router = useRouter()
  const [idea, setIdea] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function scrollToValidate() {
    document.getElementById('validate')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
    <main className="min-h-screen overflow-x-clip bg-transparent">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -right-40 -top-40 h-[50rem] w-[50rem] rounded-full blur-[100px]"
          style={{ backgroundColor: 'rgb(231 235 93 / 0.15)' }}
        />
        <div
          className="absolute -left-40 top-20 h-[40rem] w-[40rem] rounded-full blur-[80px]"
          style={{ backgroundColor: 'rgb(139 92 246 / 0.1)' }}
        />
        <div
          className="absolute left-1/3 top-[20rem] h-[35rem] w-[35rem] rounded-full blur-[70px]"
          style={{ backgroundColor: 'rgb(59 130 246 / 0.08)' }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-32 pb-16 md:pt-40 md:pb-24">
        {/* Hero Section - Two Column Layout */}
        <section className="mx-auto mb-16 flex max-w-6xl flex-col items-center lg:flex-row lg:items-center lg:gap-16">
          {/* Left Column - Content */}
          <div className="flex-1 max-w-2xl">
            {/* Social Proof Badge */}
            <SocialProofBadge />

            {/* Headline with italic emphasis */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8"
            >
              <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl leading-[1.1]">
                <span className="italic font-serif">Validate</span> Your Startup Idea
              </h1>
              <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl leading-[1.1] mt-2">
                Before You <span className="italic font-serif">Build</span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-6 max-w-xl text-lg leading-8 text-slate-600 md:text-xl"
            >
              AI-powered validation that surfaces demand signals, blind spots, and next moves 
              for your startup idea. Get an analyst-grade evaluation in seconds.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-10 flex flex-col gap-3 sm:flex-row"
            >
              <Button
                type="button"
                size="lg"
                onClick={scrollToValidate}
                className="min-h-12 bg-[#E7EB5D] hover:bg-[#D4D854] text-slate-900 font-medium px-8 shadow-sm transition-colors duration-200"
              >
                Analyze Idea
              </Button>
              <Link
                href="/sample"
                className={buttonVariants({
                  variant: 'outline',
                  size: 'lg',
                  className: 'min-h-12 border-slate-200 bg-white px-8 text-slate-700 hover:bg-slate-50 transition-colors duration-200'
                })}
              >
                See Sample Report
              </Link>
            </motion.div>
          </div>

        {/* Right Column - Report Preview */}
        <div className="mt-16 lg:mt-0 flex-1 flex items-center justify-center">
          <ReportPreviewCard />
        </div>
      </section>

      {/* Logo Carousel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mb-16"
      >
        <LogoCarousel />
      </motion.div>

      {/* Animated Stats */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="mb-16 px-4"
      >
        <AnimatedStats />
      </motion.section>

        <ScrollReveal delay={0.1} className="mx-auto mb-16 max-w-5xl py-4">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900">How It Works</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {howItWorksSteps.map((step) => {
              const Icon = step.icon

              return (
                <Card
                  key={step.title}
                  className="border-slate-200 bg-white text-center shadow-sm"
                >
                  <CardContent className="flex items-center flex-col gap-4 px-6 py-6">
                    <div className="flex size-12 items-center justify-center rounded-full bg-[#E7EB5D]/20 text-slate-900">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                      <p className="text-sm text-slate-600">{step.description}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2} className="mx-auto mb-16 max-w-5xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900">What You Get</h2>
            <p className="mt-2 text-sm text-slate-500">Every validation report includes:</p>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-4">
            {reportAreas.map((area) => (
              <div key={area.title} className="border-t border-slate-200 pt-4">
                <h3 className="text-base font-semibold text-slate-900">{area.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{area.description}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.3} className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-6">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </ScrollReveal>

        <ScrollReveal delay={0.4} id="validate" className="py-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-2 text-center text-2xl font-semibold text-slate-900">
              Ready to validate your idea?
            </h2>
            <p className="mb-8 text-center text-slate-600">
              Paste your startup concept below and get an analyst-grade evaluation in seconds.
            </p>

            <Card className="border-slate-200 bg-white shadow-lg">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="idea" className="mb-2 block text-sm font-medium text-slate-700">
                      Describe your startup idea
                    </label>
                    <Textarea
                      id="idea"
                      aria-label="Startup idea description"
                      placeholder="A platform that helps freelancers find equity-based startup opportunities..."
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      className="min-h-32 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                      disabled={isSubmitting}
                    />
                  </div>

                  {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

                  <div className="flex justify-center">
                    <Button
                      type="submit"
                      size="lg"
                      aria-label="Analyze startup idea"
                      aria-busy={isSubmitting}
                      disabled={isSubmitting}
                      className="min-h-11 min-w-48 bg-[#E7EB5D] hover:bg-[#D4D854] text-slate-900 font-medium"
                    >
                      {isSubmitting ? 'Preparing live analysis...' : 'Analyze Idea'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </ScrollReveal>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <RecentAnalyses />
        </section>
      </div>
    </main>
  )
}

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, FileText, Sparkles } from 'lucide-react'

import { LogoCarousel } from '@/components/logo-carousel'
import { RecentAnalyses } from '@/components/recent-analyses'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

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
  {
    title: 'Problem Clarity',
    description: 'Is this a real problem people will pay to solve?'
  },
  {
    title: 'Target Audience',
    description: 'Who exactly is your customer? Can you reach them?'
  },
  {
    title: 'Market Insight',
    description: 'Is the market big enough? Growing? Timing right?'
  },
  {
    title: 'Competition',
    description: 'Who else is solving this? Can you differentiate?'
  },
  {
    title: 'Positioning',
    description: 'How should you frame your value proposition?'
  },
  {
    title: 'MVP Scope',
    description: 'What should you build first? What can wait?'
  },
  {
    title: 'Monetization',
    description: 'How will you make money? Is it sustainable?'
  },
  {
    title: 'Risks',
    description: 'What could kill this? Technical, market, operational'
  }
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
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -right-40 -top-40 h-[50rem] w-[50rem] rounded-full blur-[100px]"
          style={{ backgroundColor: 'rgb(var(--aurora-blue) / 0.25)' }}
        />
        <div
          className="absolute -left-40 top-20 h-[40rem] w-[40rem] rounded-full blur-[80px]"
          style={{ backgroundColor: 'rgb(var(--aurora-indigo) / 0.2)' }}
        />
        <div
          className="absolute left-1/3 top-[20rem] h-[35rem] w-[35rem] rounded-full blur-[70px]"
          style={{ backgroundColor: 'rgb(var(--aurora-pink) / 0.18)' }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <section className="mx-auto mb-16 flex max-w-5xl flex-col items-start">
          <p className="text-sm font-medium tracking-[0.18em] text-slate-500">Founder Signal</p>

          <div className="mt-16 max-w-4xl">
            <div className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-[var(--shadow-soft)] backdrop-blur-sm">
              Idea validation for founders moving fast
            </div>

            <h1 className="mt-6 max-w-3xl text-6xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-7xl md:text-8xl">
              Stop Building Things Nobody Wants
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-600 md:text-2xl md:leading-9">
              Founder Signal helps you pressure-test an idea before you sink weeks into code, hiring, or
              positioning. Describe the problem, audience, and wedge in plain English. We surface demand
              signals, blind spots, and the next validation steps that actually matter. So you can move
              with conviction instead of guesswork.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                size="lg"
                onClick={scrollToValidate}
                className="bg-primary px-7 text-primary-foreground shadow-[var(--shadow-lifted)]"
              >
                Validate Your Idea
              </Button>
              <Link
                href="/sample"
                className={buttonVariants({
                  variant: 'outline',
                  size: 'lg',
                  className: 'border-slate-200 bg-white/80 px-7 text-slate-700 shadow-none backdrop-blur-sm'
                })}
              >
                See Sample Report
              </Link>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Clear signals on demand, risk, and next moves in seconds.
            </p>
          </div>
        </section>

        <LogoCarousel />

        <section className="mx-auto mb-16 max-w-5xl py-4">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-foreground">How It Works</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {howItWorksSteps.map((step) => {
              const Icon = step.icon

              return (
                <Card
                  key={step.title}
                  className="border-border/80 bg-card/95 text-center shadow-[var(--shadow-soft)]"
                >
                  <CardContent className="flex items-center flex-col gap-4 px-6 py-6">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="mx-auto mb-16 max-w-5xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-foreground">What You Get</h2>
            <p className="mt-2 text-sm text-muted-foreground">Every validation report includes:</p>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-4">
            {reportAreas.map((area) => (
              <div key={area.title} className="border-t border-border/70 pt-4">
                <h3 className="text-base font-semibold text-foreground">{area.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{area.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
              <CardContent className="p-6">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section id="validate" className="py-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-2 text-center text-2xl font-semibold text-slate-900">
              Ready to validate your idea?
            </h2>
            <p className="mb-8 text-center text-slate-600">
              Paste your startup concept below and get an analyst-grade evaluation in seconds.
            </p>

            <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-lifted)]">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="idea" className="mb-2 block text-sm font-medium text-slate-700">
                      Describe your startup idea
                    </label>
                    <Textarea
                      id="idea"
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
                      disabled={isSubmitting}
                      className="min-w-48 bg-primary text-primary-foreground"
                    >
                      {isSubmitting ? 'Preparing live analysis...' : 'Analyze Idea'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
</section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <RecentAnalyses />
      </section>
    </div>
  </main>
  )
}

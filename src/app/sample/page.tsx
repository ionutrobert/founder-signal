'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { CompetitorProfile, PersonaProfile, ValidationReport, Verdict } from '@/types/validation'

const SCORE_RADIUS = 45
const SCORE_CIRCUMFERENCE = 2 * Math.PI * SCORE_RADIUS

const sampleReport: ValidationReport = {
  score: 72,
  verdict: 'needs-work',
  ideaSummary: {
    title: 'QR Code Icebreaker Game for Social Events',
    oneLiner:
      'A mobile game that uses QR codes to facilitate connections between strangers at bars and social gatherings.',
    category: 'Consumer Social',
    problemTheme: 'Social Connection',
    tractionEvidence: [
      "22.2K monthly search volume for 'icebreaker games'",
      '+24567% growth in QR code usage post-pandemic',
      'Reddit threads about awkward silences at social events'
    ]
  },
  whyNow: {
    timing: 'Post-pandemic social reconnection creates unique window',
    marketForces: [
      'Social anxiety increased 25% during pandemic',
      'Bars and venues seeking engagement tools',
      'Experience economy prioritizes authentic connections'
    ],
    enablingTechnology: [
      'QR code adoption at all-time high',
      'Mobile-first social behavior normalized',
      'Real-time matching algorithms mature'
    ],
    culturalShift: [
      'Millennials prefer experiences over dating apps',
      'In-person events returning with tech integration',
      'Gamification accepted in social contexts'
    ]
  },
  problemClarity: {
    problemStatement:
      'People struggle to initiate conversations with strangers at social venues, leading to awkward silences and missed connections.',
    severity: 'moderate',
    affectedUsers: 'Adults aged 25-45 who attend bars, networking events, and social gatherings',
    evidence: [
      'Social anxiety affects 15% of adults globally',
      '71% of people report feeling awkward at networking events',
      'QR code adoption accelerated 300% post-pandemic'
    ],
    confidenceLevel: 'Medium - problem is real but severity varies by demographic'
  },
  targetAudience: {
    icp:
      'Socially motivated adults aged 28-40 who regularly attend networking events, bars, and social gatherings and value authentic connections',
    keySegments: [
      'Young professionals (28-35) at networking events',
      'Regular bar-goers (25-40) seeking social connections',
      'Event organizers looking for engagement tools'
    ],
    personas: [
      {
        name: 'Networking Nick',
        description: 'Early career professional who attends 2-3 networking events monthly',
        painPoints: ['Awkward silences with strangers', 'Difficulty standing out', 'Forgettable conversations'],
        goals: ['Make meaningful connections', 'Feel more confident', 'Remember who they met']
      },
      {
        name: 'Social Sarah',
        description:
          'Regular bar-goer who enjoys meeting new people but finds initiation difficult',
        painPoints: ['Approaching strangers feels unnatural', 'Fear of rejection', 'No conversation starters'],
        goals: ['Expand social circle', 'Have more fun nights out', 'Connect with like-minded people']
      }
    ]
  },
  marketInsight: {
    tam: '$12B (global social entertainment market)',
    sam: '$2.4B (US bar and event entertainment)',
    som: '$120M (early adopters in urban markets)',
    trends: [
      'QR code adoption accelerating post-pandemic',
      'Rise of experience-driven social events',
      'Millennials seeking authentic connections over dating apps'
    ],
    growthSignals: [
      'Social anxiety apps market growing 25% YoY',
      'Icebreaker game apps trending on app stores',
      'Bar/venue technology investments increasing'
    ]
  },
  competition: {
    directCompetitors: [
      {
        name: 'Meetup',
        strengths: ['Large user base', 'Event integration', 'Proven market'],
        weaknesses: ['No gamification', 'Focuses on groups not strangers', 'Generic matching'],
        positioningNotes: 'Meets similar need but in different context'
      },
      {
        name: 'Bumble BFF',
        strengths: ['Friend-finding validation', 'Clean UI', 'Brand trust'],
        weaknesses: ['App fatigue required', 'Not location-specific', 'No event integration'],
        positioningNotes: 'Addresses different use case'
      }
    ],
    indirectCompetitors: [
      {
        name: 'Traditional icebreaker games',
        strengths: ['No tech required', 'Instant to use', 'Zero learning curve'],
        weaknesses: ['Awkward for some', 'Limited variety', 'Requires group buy-in'],
        positioningNotes: 'Digital version can be more seamless'
      }
    ],
    competitiveAdvantage:
      'QR code mechanic creates low-friction entry point and shareable moments that traditional solutions lack'
  },
  positioning: {
    uniqueValueProposition: 'The first icebreaker that makes strangers feel like they already know each other',
    differentiators: [
      'QR-based — no app download required to participate',
      'Game mechanic creates natural conversation flow',
      'Venue partnership potential for gamified experiences'
    ],
    messagingPillars: [
      'Break the ice without breaking a sweat',
      'Real connections, not awkward small talk',
      'Turn strangers into friends in 3 scans'
    ],
    brandPromise: "You'll never stand alone at a party again"
  },
  mvpScope: {
    coreFeatures: [
      'QR code generation and scanning',
      'Trivia/question card system',
      'Simple user profile',
      'Venue discovery map'
    ],
    timeline: '8 weeks to beta',
    successMetrics: ['50 venues signed for pilot', '10,000 QR scans in first month', '3.5 avg session length', '40% return rate'],
    resourceNeeds: ['1 React Native developer', '1 UI/UX designer', 'Venue partnership outreach (founder)'],
    deferredCapabilities: [
      'Leaderboards and competitions',
      'Social sharing features',
      'Premium venue analytics dashboard',
      'Multi-language support'
    ]
  },
  monetization: {
    revenueModel: 'Freemium B2C + B2B SaaS for venues',
    pricingStrategy:
      'Free for users with optional premium ($4.99/mo). Venues pay $99/mo for analytics and engagement tools.',
    salesChannels: [
      'App Store / Play Store launch',
      'Venue partnerships (direct sales)',
      'Event partnerships (B2B2C)',
      'Social media marketing'
    ],
    projections: '$50K MRR by month 6 if 20 venues and 5K users achieved',
    keyAssumptions: [
      'Users will download app for venue-specific experience',
      'Venues will pay for engagement analytics',
      'QR mechanic creates sufficient novelty for viral growth'
    ]
  },
  risks: {
    technical: [
      'QR scanning accuracy in low-light bar environments',
      'Privacy concerns with scanning stranger-generated codes'
    ],
    market: [
      'App fatigue — users hesitant to download another app',
      'Venues may prefer established solutions',
      'Social gaming stigma'
    ],
    operational: ['Venue sales cycle longer than expected', 'Content moderation for user-generated questions'],
    regulatory: ['Age verification for venue partnerships', 'Data privacy compliance across jurisdictions']
  }
}

const verdictStyles: Record<Verdict, { label: string; className: string }> = {
  pass: {
    label: 'Pass',
    className: 'border border-emerald-200 bg-emerald-50 text-emerald-700'
  },
  'needs-work': {
    label: 'Needs Work',
    className: 'border border-amber-200 bg-amber-50 text-amber-700'
  },
  fail: {
    label: 'Fail',
    className: 'border border-red-200 bg-red-50 text-red-700'
  }
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function formatLabel(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function BulletList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>
  }

  const cleanItem = (item: string) => item.replace(/^[•\-\*\u2022\u2023]\s*/, '').trim()

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm leading-6 text-slate-600">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
          <span>{cleanItem(item)}</span>
        </li>
      ))}
    </ul>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="text-sm leading-6 text-slate-700">{value}</p>
    </div>
  )
}

function Subsection({
  title,
  children,
  description
}: {
  title: string
  children: ReactNode
  description?: string
}) {
  return (
    <div className="space-y-3 rounded-[calc(var(--radius)-0.1rem)] border border-slate-200/80 bg-slate-50/70 p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description ? <p className="text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {children}
    </div>
  )
}

function CompetitorGroup({
  title,
  competitors,
  emptyLabel
}: {
  title: string
  competitors: CompetitorProfile[]
  emptyLabel: string
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {competitors.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <div className="space-y-3">
          {competitors.map((competitor) => (
            <Subsection
              key={competitor.name}
              title={competitor.name}
              description={competitor.positioningNotes}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Strengths</p>
                  <BulletList items={competitor.strengths} emptyLabel="No strengths noted." />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Weaknesses</p>
                  <BulletList items={competitor.weaknesses} emptyLabel="No weaknesses noted." />
                </div>
              </div>
            </Subsection>
          ))}
        </div>
      )}
    </div>
  )
}

function PersonaGroup({ personas }: { personas: PersonaProfile[] }) {
  if (personas.length === 0) {
    return <p className="text-sm text-slate-500">No personas defined.</p>
  }

  return (
    <div className="space-y-3">
      {personas.map((persona) => (
        <Subsection key={persona.name} title={persona.name} description={persona.description}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pain Points</p>
              <BulletList items={persona.painPoints} emptyLabel="No pain points listed." />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Goals</p>
              <BulletList items={persona.goals} emptyLabel="No goals listed." />
            </div>
          </div>
        </Subsection>
      ))}
    </div>
  )
}

export default function SamplePage() {
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    setDisplayScore(0)

    const frame = window.requestAnimationFrame(() => {
      setDisplayScore(clampScore(sampleReport.score))
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  const score = clampScore(sampleReport.score)
  const scoreOffset = useMemo(
    () => SCORE_CIRCUMFERENCE - (displayScore / 100) * SCORE_CIRCUMFERENCE,
    [displayScore]
  )
  const verdict = verdictStyles[sampleReport.verdict]

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-blue-300/15 blur-3xl" />
        <div className="absolute left-0 top-1/3 h-80 w-80 rounded-full bg-violet-300/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Card className="border-slate-200/80 bg-white/95 shadow-[var(--shadow-lifted)]">
          <CardContent className="flex flex-col gap-8 p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-600">Sample validation report</p>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                  {sampleReport.ideaSummary.title}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                  {sampleReport.ideaSummary.oneLiner}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Badge className={verdict.className}>{verdict.label}</Badge>
                <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                  {sampleReport.ideaSummary.category}
                </Badge>
                <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                  {sampleReport.ideaSummary.problemTheme}
                </Badge>
              </div>
              <Link
                href="/"
                className={buttonVariants({
                  size: 'lg',
                  className: 'mt-2 bg-primary px-7 text-primary-foreground shadow-[var(--shadow-lifted)]'
                })}
              >
                Try Your Own Idea
              </Link>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-[calc(var(--radius)+0.25rem)] border border-slate-200/80 bg-slate-50/80 px-6 py-5">
              <div className="relative h-36 w-36">
                <svg aria-hidden="true" className="h-36 w-36 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={SCORE_RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r={SCORE_RADIUS}
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={SCORE_CIRCUMFERENCE}
                    strokeDashoffset={scoreOffset}
                    style={{ transition: 'stroke-dashoffset 1000ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-semibold tracking-tight text-slate-900">{score}</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Score</span>
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600">Overall founder signal confidence</p>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">Idea Summary</CardTitle>
              <CardDescription className="text-slate-600">Core framing for the concept under review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Title" value={sampleReport.ideaSummary.title} />
              <Field label="One-Liner" value={sampleReport.ideaSummary.oneLiner} />
              <Field label="Category" value={sampleReport.ideaSummary.category} />
              <Field label="Problem Theme" value={sampleReport.ideaSummary.problemTheme} />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Traction Evidence</p>
                <BulletList items={sampleReport.ideaSummary.tractionEvidence} emptyLabel="No traction evidence captured." />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">Problem Clarity</CardTitle>
              <CardDescription className="text-slate-600">How clearly the problem is framed and evidenced.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Problem Statement" value={sampleReport.problemClarity.problemStatement} />
              <Field label="Severity" value={formatLabel(sampleReport.problemClarity.severity)} />
              <Field label="Affected Users" value={sampleReport.problemClarity.affectedUsers} />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Evidence</p>
                <BulletList items={sampleReport.problemClarity.evidence} emptyLabel="No problem evidence provided." />
              </div>
              <Field label="Confidence Level" value={sampleReport.problemClarity.confidenceLevel} />
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">Target Audience</CardTitle>
              <CardDescription className="text-slate-600">Who the product serves and why they care.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Ideal Customer Profile" value={sampleReport.targetAudience.icp} />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Key Segments</p>
                <BulletList items={sampleReport.targetAudience.keySegments} emptyLabel="No key segments defined." />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Personas</p>
                <PersonaGroup personas={sampleReport.targetAudience.personas} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">Market Insight</CardTitle>
              <CardDescription className="text-slate-600">Market sizing, momentum, and directional signals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="TAM" value={sampleReport.marketInsight.tam} />
                <Field label="SAM" value={sampleReport.marketInsight.sam} />
                <Field label="SOM" value={sampleReport.marketInsight.som} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Trends</p>
                <BulletList items={sampleReport.marketInsight.trends} emptyLabel="No market trends listed." />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Growth Signals</p>
                <BulletList items={sampleReport.marketInsight.growthSignals} emptyLabel="No growth signals listed." />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)] md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">Competition</CardTitle>
              <CardDescription className="text-slate-600">Where the idea stands against alternatives in the market.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <CompetitorGroup
                title="Direct Competitors"
                competitors={sampleReport.competition.directCompetitors}
                emptyLabel="No direct competitors listed."
              />
              <CompetitorGroup
                title="Indirect Competitors"
                competitors={sampleReport.competition.indirectCompetitors}
                emptyLabel="No indirect competitors listed."
              />
              <Field label="Competitive Advantage" value={sampleReport.competition.competitiveAdvantage} />
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">Positioning</CardTitle>
              <CardDescription className="text-slate-600">How the business should show up in the market.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Unique Value Proposition" value={sampleReport.positioning.uniqueValueProposition} />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Differentiators</p>
                <BulletList items={sampleReport.positioning.differentiators} emptyLabel="No differentiators listed." />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Messaging Pillars</p>
                <BulletList items={sampleReport.positioning.messagingPillars} emptyLabel="No messaging pillars listed." />
              </div>
              <Field label="Brand Promise" value={sampleReport.positioning.brandPromise} />
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">MVP Scope</CardTitle>
              <CardDescription className="text-slate-600">What to build first and how to measure traction.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Core Features</p>
                <BulletList items={sampleReport.mvpScope.coreFeatures} emptyLabel="No core features defined." />
              </div>
              <Field label="Timeline" value={sampleReport.mvpScope.timeline} />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Success Metrics</p>
                <BulletList items={sampleReport.mvpScope.successMetrics} emptyLabel="No success metrics defined." />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resource Needs</p>
                <BulletList items={sampleReport.mvpScope.resourceNeeds} emptyLabel="No resource needs listed." />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Deferred Capabilities</p>
                <BulletList items={sampleReport.mvpScope.deferredCapabilities} emptyLabel="No deferred capabilities listed." />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">Monetization</CardTitle>
              <CardDescription className="text-slate-600">Revenue logic, pricing, and go-to-market assumptions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Revenue Model" value={sampleReport.monetization.revenueModel} />
              <Field label="Pricing Strategy" value={sampleReport.monetization.pricingStrategy} />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sales Channels</p>
                <BulletList items={sampleReport.monetization.salesChannels} emptyLabel="No sales channels defined." />
              </div>
              <Field label="Projections" value={sampleReport.monetization.projections} />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Key Assumptions</p>
                <BulletList items={sampleReport.monetization.keyAssumptions} emptyLabel="No assumptions listed." />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">Risks</CardTitle>
              <CardDescription className="text-slate-600">Operational, technical, and market risks to manage early.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Subsection title="Technical">
                <BulletList items={sampleReport.risks.technical} emptyLabel="No technical risks identified." />
              </Subsection>
              <Subsection title="Market">
                <BulletList items={sampleReport.risks.market} emptyLabel="No market risks identified." />
              </Subsection>
              <Subsection title="Operational">
                <BulletList items={sampleReport.risks.operational} emptyLabel="No operational risks identified." />
              </Subsection>
              <Subsection title="Regulatory">
                <BulletList items={sampleReport.risks.regulatory} emptyLabel="No regulatory risks identified." />
              </Subsection>
            </CardContent>
          </Card>
        </section>

        <div className="flex justify-center pb-2 pt-2">
          <Link
            href="/"
            className={buttonVariants({
              size: 'lg',
              className: 'bg-primary px-7 text-primary-foreground shadow-[var(--shadow-lifted)]'
            })}
          >
            Try Your Own Idea
          </Link>
        </div>
      </div>
    </main>
  )
}

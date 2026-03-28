'use client'

import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type {
  CompetitorProfile,
  PersonaProfile,
  ValidationReport,
  Verdict
} from '@/types/validation'

const SCORE_RADIUS = 45
const SCORE_CIRCUMFERENCE = 2 * Math.PI * SCORE_RADIUS

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

function parseValidationReport(dataParam: string): ValidationReport | null {
  const attempts = [dataParam]

  try {
    const decoded = decodeURIComponent(dataParam)

    if (decoded !== dataParam) {
      attempts.push(decoded)
    }
  } catch {}

  for (const value of attempts) {
    try {
      const parsed = JSON.parse(value) as unknown

      if (isValidationReport(parsed)) {
        return parsed
      }
    } catch {
      continue
    }
  }

  return null
}

function isValidationReport(value: unknown): value is ValidationReport {
  if (!value || typeof value !== 'object') {
    return false
  }

  const report = value as Partial<ValidationReport>

  return (
    typeof report.score === 'number' &&
    typeof report.verdict === 'string' &&
    !!report.ideaSummary &&
    !!report.problemClarity &&
    !!report.targetAudience &&
    !!report.marketInsight &&
    !!report.competition &&
    !!report.positioning &&
    !!report.mvpScope &&
    !!report.monetization &&
    !!report.risks
  )
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

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm leading-6 text-slate-600">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
          <span>{item}</span>
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

function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-blue-300/15 blur-3xl" />
        <div className="absolute left-0 top-1/3 h-80 w-80 rounded-full bg-violet-300/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="animate-pulse space-y-8">
          <Card className="border-slate-200/80 bg-white/95 shadow-[var(--shadow-lifted)]">
            <CardContent className="flex flex-col gap-8 p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col items-center gap-4 text-center lg:items-start lg:text-left">
                <div className="h-4 w-36 rounded-full bg-slate-200" />

                <div className="space-y-3">
                  <div className="h-8 w-48 rounded bg-slate-200" />
                  <div className="h-4 w-72 max-w-full rounded bg-slate-200" />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                  <div className="h-7 w-20 rounded-full bg-slate-200" />
                  <div className="h-7 w-24 rounded-full bg-slate-200" />
                  <div className="h-7 w-28 rounded-full bg-slate-200" />
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 rounded-[calc(var(--radius)+0.25rem)] border border-slate-200/80 bg-slate-50/80 px-6 py-5">
                <div className="h-36 w-36 rounded-full bg-slate-200" />
                <div className="h-4 w-44 rounded bg-slate-200" />
              </div>
            </CardContent>
          </Card>

          <section className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
                <CardContent className="space-y-4 p-6">
                  <div className="h-5 w-32 rounded bg-slate-200" />
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-slate-100" />
                    <div className="h-3 w-3/4 rounded bg-slate-100" />
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        </div>
      </div>
    </main>
  )
}

function ResultPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [report, setReport] = useState<ValidationReport | null>(null)
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    const dataParam = searchParams.get('data')

    if (!dataParam) {
      router.replace('/')
      return
    }

    const parsedReport = parseValidationReport(dataParam)

    if (!parsedReport) {
      router.replace('/')
      return
    }

    setReport(parsedReport)
  }, [router, searchParams])

  useEffect(() => {
    if (!report) {
      return
    }

    setDisplayScore(0)

    const frame = window.requestAnimationFrame(() => {
      setDisplayScore(clampScore(report.score))
    })

    return () => window.cancelAnimationFrame(frame)
  }, [report])

  const score = report ? clampScore(report.score) : 0
  const scoreOffset = useMemo(
    () => SCORE_CIRCUMFERENCE - (displayScore / 100) * SCORE_CIRCUMFERENCE,
    [displayScore]
  )

  if (!report) {
    return <LoadingSkeleton />
  }

  const verdict = verdictStyles[report.verdict]

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
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-600">Validation report</p>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                  {report.ideaSummary.title}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                  {report.ideaSummary.oneLiner}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Badge className={verdict.className}>{verdict.label}</Badge>
                <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                  {report.ideaSummary.category}
                </Badge>
                <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                  {report.ideaSummary.problemTheme}
                </Badge>
              </div>
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
              <Field label="Title" value={report.ideaSummary.title} />
              <Field label="One-Liner" value={report.ideaSummary.oneLiner} />
              <Field label="Category" value={report.ideaSummary.category} />
              <Field label="Problem Theme" value={report.ideaSummary.problemTheme} />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Traction Evidence</p>
                <BulletList items={report.ideaSummary.tractionEvidence} emptyLabel="No traction evidence captured." />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">Problem Clarity</CardTitle>
              <CardDescription className="text-slate-600">How clearly the problem is framed and evidenced.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Problem Statement" value={report.problemClarity.problemStatement} />
              <Field label="Severity" value={formatLabel(report.problemClarity.severity)} />
              <Field label="Affected Users" value={report.problemClarity.affectedUsers} />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Evidence</p>
                <BulletList items={report.problemClarity.evidence} emptyLabel="No problem evidence provided." />
              </div>
              <Field label="Confidence Level" value={report.problemClarity.confidenceLevel} />
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">Target Audience</CardTitle>
              <CardDescription className="text-slate-600">Who the product serves and why they care.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Ideal Customer Profile" value={report.targetAudience.icp} />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Key Segments</p>
                <BulletList items={report.targetAudience.keySegments} emptyLabel="No key segments defined." />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Personas</p>
                <PersonaGroup personas={report.targetAudience.personas} />
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
                <Field label="TAM" value={report.marketInsight.tam} />
                <Field label="SAM" value={report.marketInsight.sam} />
                <Field label="SOM" value={report.marketInsight.som} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Trends</p>
                <BulletList items={report.marketInsight.trends} emptyLabel="No market trends listed." />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Growth Signals</p>
                <BulletList items={report.marketInsight.growthSignals} emptyLabel="No growth signals listed." />
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
                competitors={report.competition.directCompetitors}
                emptyLabel="No direct competitors listed."
              />
              <CompetitorGroup
                title="Indirect Competitors"
                competitors={report.competition.indirectCompetitors}
                emptyLabel="No indirect competitors listed."
              />
              <Field label="Competitive Advantage" value={report.competition.competitiveAdvantage} />
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">Positioning</CardTitle>
              <CardDescription className="text-slate-600">How the business should show up in the market.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Unique Value Proposition" value={report.positioning.uniqueValueProposition} />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Differentiators</p>
                <BulletList items={report.positioning.differentiators} emptyLabel="No differentiators listed." />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Messaging Pillars</p>
                <BulletList items={report.positioning.messagingPillars} emptyLabel="No messaging pillars listed." />
              </div>
              <Field label="Brand Promise" value={report.positioning.brandPromise} />
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
                <BulletList items={report.mvpScope.coreFeatures} emptyLabel="No core features defined." />
              </div>
              <Field label="Timeline" value={report.mvpScope.timeline} />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Success Metrics</p>
                <BulletList items={report.mvpScope.successMetrics} emptyLabel="No success metrics defined." />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resource Needs</p>
                <BulletList items={report.mvpScope.resourceNeeds} emptyLabel="No resource needs listed." />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Deferred Capabilities</p>
                <BulletList items={report.mvpScope.deferredCapabilities} emptyLabel="No deferred capabilities listed." />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">Monetization</CardTitle>
              <CardDescription className="text-slate-600">Revenue logic, pricing, and go-to-market assumptions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Revenue Model" value={report.monetization.revenueModel} />
              <Field label="Pricing Strategy" value={report.monetization.pricingStrategy} />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sales Channels</p>
                <BulletList items={report.monetization.salesChannels} emptyLabel="No sales channels defined." />
              </div>
              <Field label="Projections" value={report.monetization.projections} />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Key Assumptions</p>
                <BulletList items={report.monetization.keyAssumptions} emptyLabel="No assumptions listed." />
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
                <BulletList items={report.risks.technical} emptyLabel="No technical risks identified." />
              </Subsection>
              <Subsection title="Market">
                <BulletList items={report.risks.market} emptyLabel="No market risks identified." />
              </Subsection>
              <Subsection title="Operational">
                <BulletList items={report.risks.operational} emptyLabel="No operational risks identified." />
              </Subsection>
              <Subsection title="Regulatory">
                <BulletList items={report.risks.regulatory} emptyLabel="No regulatory risks identified." />
              </Subsection>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ResultPageContent />
    </Suspense>
  )
}

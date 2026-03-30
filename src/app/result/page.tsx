'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Toaster } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  HeroSection,
  SectionCard,
  ActionPanel,
  QuickStats,
  ACPFramework,
} from '@/components/report'
import { scoreToStrength, type StrengthLevel } from '@/lib/strength'
import type {
  CompetitorProfile,
  PersonaProfile,
  PhaseResult,
  ValidationResult,
} from '@/types/validation'

function isValidationReport(value: unknown): value is ValidationResult {
  if (!value || typeof value !== 'object') {
    return false
  }

  const report = value as Partial<ValidationResult>

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

function getSectionStrength(
  sectionName: string,
  phases?: PhaseResult[] | null
): StrengthLevel | null {
  if (!phases || phases.length === 0) return null

  for (const phase of phases) {
    const sectionScore = phase.sectionScores?.find(
      s => s.section === sectionName
    )
    if (sectionScore) {
      return scoreToStrength(sectionScore.score)
    }
  }
  return null
}

function formatLabel(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function BulletList({ items, emptyLabel }: { items?: string[] | null; emptyLabel: string }) {
  if (!items || items.length === 0) {
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
  children: React.ReactNode
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
  competitors?: CompetitorProfile[] | null
  emptyLabel: string
}) {
  if (!competitors || competitors.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
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
    </div>
  )
}

function PersonaGroup({ personas }: { personas?: PersonaProfile[] | null }) {
  if (!personas || personas.length === 0) {
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
              <div className="flex min-w-0 flex-1 flex-col items-center gap-4 text-center lg:items-start lg:text-left">
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
                <div className="mt-4 flex gap-2">
                  <div className="h-9 w-9 rounded-lg bg-slate-200" />
                  <div className="h-9 w-9 rounded-lg bg-slate-200" />
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-center gap-4 rounded-[calc(var(--radius)+0.25rem)] border border-slate-200/80 bg-slate-50/80 px-6 py-5">
                <div className="relative h-36 w-36">
                  <div className="h-36 w-36 rounded-full bg-slate-200" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <div className="h-10 w-12 rounded bg-slate-300" />
                    <div className="h-3 w-14 rounded bg-slate-300" />
                  </div>
                </div>
                <div className="h-4 w-44 rounded bg-slate-200" />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
            <div className="space-y-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-32 rounded bg-slate-200" />
                      <div className="h-5 w-5 rounded-full bg-slate-100" />
                    </div>
                    <div className="h-4 w-48 rounded bg-slate-100" />
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-3">
                      <div className="h-3 w-24 rounded bg-slate-200" />
                      <div className="h-4 w-full rounded bg-slate-100" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-3 w-28 rounded bg-slate-200" />
                      <div className="h-4 w-3/4 rounded bg-slate-100" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-32 rounded bg-slate-200" />
                      <div className="flex items-start gap-2">
                        <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-200" />
                        <div className="h-3 w-40 rounded bg-slate-100" />
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-200" />
                        <div className="h-3 w-32 rounded bg-slate-100" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-6">
              <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
                <CardContent className="p-4">
                  <div className="h-4 w-20 rounded bg-slate-200" />
                  <div className="mt-4 space-y-2">
                    <div className="h-8 w-full rounded bg-slate-100" />
                    <div className="h-8 w-full rounded bg-slate-100" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
                <CardContent className="p-4">
                  <div className="h-4 w-24 rounded bg-slate-200" />
                  <div className="mt-4 space-y-2">
                    <div className="h-4 w-full rounded bg-slate-100" />
                    <div className="h-4 w-3/4 rounded bg-slate-100" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

const ANALYSIS_RESULT_STORAGE_KEY = 'founder-signal:analysis-result'

function ResultPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [report, setReport] = useState<ValidationResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const savedResultIdRef = useRef<string | null>(null)

  useEffect(() => {
    const resultId = searchParams.get('id')

    if (resultId) {
      fetch(`/api/result/${resultId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Result not found')
          }
          return response.json()
        })
        .then(data => {
          if (data.success && isValidationReport(data.data)) {
            setReport(data.data)
          } else {
            setError('Invalid result data')
          }
        })
        .catch(() => {
          setError('Failed to load result')
        })
        .finally(() => {
          setIsLoading(false)
        })
      return
    }

    const storedData = window.sessionStorage.getItem(ANALYSIS_RESULT_STORAGE_KEY)

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData) as unknown
        if (isValidationReport(parsed)) {
          setReport(parsed)
          setIsLoading(false)
          return
        }
      } catch {
        // Continue to error
      }
      window.sessionStorage.removeItem(ANALYSIS_RESULT_STORAGE_KEY)
    }

    if (!resultId) {
      setError('No result data found. Please try analyzing your idea again.')
      setIsLoading(false)
      return
    }
  }, [searchParams])

  useEffect(() => {
    if (!isLoading && !report && error) {
      const timeout = setTimeout(() => {
        router.replace('/')
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [isLoading, report, error, router])

  useEffect(() => {
    const resultId = searchParams.get('id')
    if (report && resultId && savedResultIdRef.current !== resultId) {
      savedResultIdRef.current = resultId
      import('@/components/recent-analyses').then(({ saveToHistory }) => {
        saveToHistory({
          resultId,
          idea: report.ideaSummary.title,
          score: report.score,
          verdict: report.verdict,
          timestamp: Date.now(),
        })
      })
    }
  }, [report, searchParams])

  const score = report ? clampScore(report.score) : 0

  const resultId = searchParams.get('id')

  if (isLoading || !report) {
    return <LoadingSkeleton />
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <Toaster position="top-right" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-blue-300/15 blur-3xl" />
        <div className="absolute left-0 top-1/3 h-80 w-80 rounded-full bg-violet-300/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <HeroSection
          title={report.ideaSummary.title}
          oneLiner={report.ideaSummary.oneLiner}
          score={score}
          verdict={report.verdict}
          category={report.ideaSummary.category}
          problemTheme={report.ideaSummary.problemTheme}
          resultId={resultId || undefined}
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          <div className="space-y-6">
            <SectionCard
              title="Why Now"
              description="Market timing and momentum factors"
              score={report.whyNow?.score}
              scoreReasoning={report.whyNow?.scoreReasoning}
              strength={getSectionStrength('whyNow', report.phases)}
              className="border-blue-200 bg-blue-50/30"
            >
              <Field label="Timing Assessment" value={report.whyNow?.timing || 'Not assessed'} />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Market Forces</p>
                <BulletList items={report.whyNow?.marketForces} emptyLabel="No market forces identified." />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Enabling Technology</p>
                <BulletList items={report.whyNow?.enablingTechnology} emptyLabel="No enabling technologies identified." />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cultural Shift</p>
                <BulletList items={report.whyNow?.culturalShift} emptyLabel="No cultural shifts identified." />
              </div>
            </SectionCard>

            <SectionCard
              title="Problem Clarity"
              description="How clearly the problem is framed and evidenced."
              score={report.problemClarity?.score}
              scoreReasoning={report.problemClarity?.scoreReasoning}
              strength={getSectionStrength('problemClarity', report.phases)}
            >
              <Field label="Problem Statement" value={report.problemClarity.problemStatement} />
              <Field label="Severity" value={formatLabel(report.problemClarity.severity)} />
              <Field label="Affected Users" value={report.problemClarity.affectedUsers} />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Evidence</p>
                <BulletList items={report.problemClarity.evidence} emptyLabel="No problem evidence provided." />
              </div>
              <Field label="Confidence Level" value={report.problemClarity.confidenceLevel} />
            </SectionCard>

            <SectionCard
              title="Target Audience"
              description="Who the product serves and why they care."
              score={report.targetAudience?.score}
              scoreReasoning={report.targetAudience?.scoreReasoning}
              strength={getSectionStrength('targetAudience', report.phases)}
            >
              <Field label="Ideal Customer Profile" value={report.targetAudience.icp} />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Key Segments</p>
                <BulletList items={report.targetAudience.keySegments} emptyLabel="No key segments defined." />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Personas</p>
                <PersonaGroup personas={report.targetAudience.personas} />
              </div>
            </SectionCard>

            <SectionCard
              title="Market Insight"
              description="Market sizing, momentum, and directional signals."
              score={report.marketInsight?.score}
              scoreReasoning={report.marketInsight?.scoreReasoning}
              strength={getSectionStrength('marketInsight', report.phases)}
            >
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
            </SectionCard>

            <SectionCard
              title="Competition"
              description="Where the idea stands against alternatives in the market."
              score={report.competition?.score}
              scoreReasoning={report.competition?.scoreReasoning}
              strength={getSectionStrength('competition', report.phases)}
            >
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
            </SectionCard>

            <SectionCard
              title="Positioning"
              description="How the business should show up in the market."
              score={report.positioning?.score}
              scoreReasoning={report.positioning?.scoreReasoning}
              strength={getSectionStrength('positioning', report.phases)}
            >
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
            </SectionCard>

            <SectionCard
              title="MVP Scope"
              description="What to build first and how to measure traction."
              score={report.mvpScope?.score}
              scoreReasoning={report.mvpScope?.scoreReasoning}
              strength={getSectionStrength('mvpScope', report.phases)}
            >
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
            </SectionCard>

            <SectionCard
              title="Monetization"
              description="Revenue logic, pricing, and go-to-market assumptions."
              score={report.monetization?.score}
              scoreReasoning={report.monetization?.scoreReasoning}
              strength={getSectionStrength('monetization', report.phases)}
            >
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
            </SectionCard>

            <SectionCard
              title="Risks"
              description="Operational, technical, and market risks to manage early."
              score={report.risks?.score}
              scoreReasoning={report.risks?.scoreReasoning}
              strength={getSectionStrength('risks', report.phases)}
            >
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
            </SectionCard>
          </div>

          <div className="space-y-6">
            {resultId && (
              <ActionPanel resultId={resultId} title={report.ideaSummary.title} />
            )}
            <QuickStats report={report} />
            <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-slate-900">ACP Framework</CardTitle>
              </CardHeader>
              <CardContent>
                <ACPFramework
                  audience={6.5}
                  community={5.0}
                  product={7.0}
                  maxScore={10}
                  showOverall={true}
                />
                <p className="mt-4 text-xs text-slate-500">
                  Placeholder scores - actual analysis coming soon
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
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

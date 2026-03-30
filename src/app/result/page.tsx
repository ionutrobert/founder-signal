'use client'

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Toaster } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { ShareButtons } from '@/components/share-buttons'
import { saveToHistory } from '@/components/recent-analyses'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReportTabs } from '@/components/report-tabs'
import { ScoreTooltip } from '@/components/score-tooltip'
import { SimplifiedReport } from '@/components/simplified-report'
import type {
  CompetitorProfile,
  PersonaProfile,
  PhaseResult,
  ValidationResult,
  Verdict
} from '@/types/validation'

const SCORE_RADIUS = 45
const SCORE_CIRCUMFERENCE = 2 * Math.PI * SCORE_RADIUS

type StrengthLevel = 'critical' | 'weak' | 'neutral' | 'good' | 'strong'

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

const strengthStyles: Record<StrengthLevel, string> = {
  critical: 'border-l-[3px] border-l-red-300 bg-red-50/30',
  weak: 'border-l-2 border-l-amber-300 bg-amber-50/30',
  neutral: 'border-l border-l-slate-300',
  good: 'border-l-2 border-l-emerald-300 bg-emerald-50/30',
  strong: 'border-l-[3px] border-l-emerald-400 bg-emerald-50/50',
}

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

function scoreToStrength(score: number): StrengthLevel {
  if (score >= 80) return 'strong'
  if (score >= 65) return 'good'
  if (score >= 50) return 'neutral'
  if (score >= 35) return 'weak'
  return 'critical'
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

function getStrengthClass(strength: StrengthLevel | null): string {
  if (!strength) return ''
  return strengthStyles[strength]
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

          <div className="space-y-6">
            <div className="flex gap-2 rounded-lg border border-slate-200/80 bg-slate-50/50 p-1">
              <div className="flex-1 rounded-md bg-white px-4 py-2 shadow-sm">
                <div className="mx-auto h-5 w-20 rounded bg-slate-200" />
              </div>
              <div className="flex-1 px-4 py-2">
                <div className="mx-auto h-5 w-16 rounded bg-slate-200" />
              </div>
            </div>

            <section className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card
                  key={i}
                  className={cn(
                    'border-slate-200/80 bg-white shadow-[var(--shadow-soft)]',
                    i === 5 ? 'md:col-span-2' : undefined
                  )}
                >
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
                    <div className="space-y-3">
                      <div className="h-3 w-20 rounded bg-slate-200" />
                      <div className="h-4 w-1/2 rounded bg-slate-100" />
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
            </section>
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
  const [displayScore, setDisplayScore] = useState(0)
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

  // No resultId and no stored data
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
    if (!report) {
      return
    }

    setDisplayScore(0)

    const frame = window.requestAnimationFrame(() => {
      setDisplayScore(clampScore(report.score))
    })

    return () => window.cancelAnimationFrame(frame)
  }, [report])

  useEffect(() => {
    const resultId = searchParams.get('id')
    if (report && resultId && savedResultIdRef.current !== resultId) {
      savedResultIdRef.current = resultId
      saveToHistory({
        resultId,
        idea: report.ideaSummary.title,
        score: report.score,
        verdict: report.verdict,
        timestamp: Date.now(),
      })
    }
  }, [report, searchParams])

	const score = report ? clampScore(report.score) : 0
	const scoreOffset = useMemo(
		() => SCORE_CIRCUMFERENCE - (displayScore / 100) * SCORE_CIRCUMFERENCE,
		[displayScore]
	)

	const resultId = searchParams.get('id')

	if (isLoading || !report) {
		return <LoadingSkeleton />
	}

	const verdict = verdictStyles[report.verdict]

	return (
		<main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
			<Toaster position="top-right" />
			<div className="pointer-events-none absolute inset-0 overflow-hidden">
				<div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-blue-300/15 blur-3xl" />
				<div className="absolute left-0 top-1/3 h-80 w-80 rounded-full bg-violet-300/10 blur-3xl" />
			</div>

			<div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Card className="border-slate-200/80 bg-white/95 shadow-[var(--shadow-lifted)]">
          <CardContent className="flex flex-col gap-8 p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-col items-center gap-4 text-center lg:items-start lg:text-left">
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
						{resultId && (
							<div className="mt-4">
								<ShareButtons resultId={resultId} title={report.ideaSummary.title} />
							</div>
						)}
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

<ReportTabs
technicalContent={(
<section className="grid gap-6 md:grid-cols-2">
<Card className={cn(
'border-slate-200/80 bg-white shadow-[var(--shadow-soft)]',
getStrengthClass(getSectionStrength('ideaSummary', report.phases))
)}>
<CardHeader className="pb-3">
<CardTitle className="flex items-center text-lg text-slate-900">
Idea Summary
<ScoreTooltip
score={report.ideaSummary?.score}
reasoning={report.ideaSummary?.scoreReasoning}
strength={getSectionStrength('ideaSummary', report.phases)}
/>
</CardTitle>
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

<Card className={cn(
'border-slate-200/80 bg-white shadow-[var(--shadow-soft)]',
getStrengthClass(getSectionStrength('problemClarity', report.phases))
)}>
<CardHeader className="pb-3">
<CardTitle className="flex items-center text-lg text-slate-900">
Problem Clarity
<ScoreTooltip
score={report.problemClarity?.score}
reasoning={report.problemClarity?.scoreReasoning}
strength={getSectionStrength('problemClarity', report.phases)}
/>
</CardTitle>
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

<Card className={cn(
'border-slate-200/80 bg-white shadow-[var(--shadow-soft)]',
getStrengthClass(getSectionStrength('targetAudience', report.phases))
)}>
<CardHeader className="pb-3">
<CardTitle className="flex items-center text-lg text-slate-900">
Target Audience
<ScoreTooltip
score={report.targetAudience?.score}
reasoning={report.targetAudience?.scoreReasoning}
strength={getSectionStrength('targetAudience', report.phases)}
/>
</CardTitle>
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

<Card className={cn(
'border-slate-200/80 bg-white shadow-[var(--shadow-soft)]',
getStrengthClass(getSectionStrength('marketInsight', report.phases))
)}>
<CardHeader className="pb-3">
<CardTitle className="flex items-center text-lg text-slate-900">
Market Insight
<ScoreTooltip
score={report.marketInsight?.score}
reasoning={report.marketInsight?.scoreReasoning}
strength={getSectionStrength('marketInsight', report.phases)}
/>
</CardTitle>
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

<Card className={cn(
'border-slate-200/80 bg-white shadow-[var(--shadow-soft)] md:col-span-2',
getStrengthClass(getSectionStrength('competition', report.phases))
)}>
<CardHeader className="pb-3">
<CardTitle className="flex items-center text-lg text-slate-900">
Competition
<ScoreTooltip
score={report.competition?.score}
reasoning={report.competition?.scoreReasoning}
strength={getSectionStrength('competition', report.phases)}
/>
</CardTitle>
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

<Card className={cn(
'border-slate-200/80 bg-white shadow-[var(--shadow-soft)]',
getStrengthClass(getSectionStrength('positioning', report.phases))
)}>
<CardHeader className="pb-3">
<CardTitle className="flex items-center text-lg text-slate-900">
Positioning
<ScoreTooltip
score={report.positioning?.score}
reasoning={report.positioning?.scoreReasoning}
strength={getSectionStrength('positioning', report.phases)}
/>
</CardTitle>
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

<Card className={cn(
'border-slate-200/80 bg-white shadow-[var(--shadow-soft)]',
getStrengthClass(getSectionStrength('mvpScope', report.phases))
)}>
<CardHeader className="pb-3">
<CardTitle className="flex items-center text-lg text-slate-900">
MVP Scope
<ScoreTooltip
score={report.mvpScope?.score}
reasoning={report.mvpScope?.scoreReasoning}
strength={getSectionStrength('mvpScope', report.phases)}
/>
</CardTitle>
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

<Card className={cn(
'border-slate-200/80 bg-white shadow-[var(--shadow-soft)]',
getStrengthClass(getSectionStrength('monetization', report.phases))
)}>
<CardHeader className="pb-3">
<CardTitle className="flex items-center text-lg text-slate-900">
Monetization
<ScoreTooltip
score={report.monetization?.score}
reasoning={report.monetization?.scoreReasoning}
strength={getSectionStrength('monetization', report.phases)}
/>
</CardTitle>
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

<Card className={cn(
'border-slate-200/80 bg-white shadow-[var(--shadow-soft)]',
getStrengthClass(getSectionStrength('risks', report.phases))
)}>
<CardHeader className="pb-3">
<CardTitle className="flex items-center text-lg text-slate-900">
Risks
<ScoreTooltip
score={report.risks?.score}
reasoning={report.risks?.scoreReasoning}
strength={getSectionStrength('risks', report.phases)}
/>
</CardTitle>
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
)}
simplifiedContent={<SimplifiedReport report={report} />}
/>
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

'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Toaster } from 'sonner'
import { motion } from 'framer-motion'
import {
  ChevronDown,
  Target,
  Users,
  TrendingUp,
  Sword,
  Zap,
  DollarSign,
  AlertTriangle,
  Lightbulb,
  Clock,
  Share2,
  Download,
  Copy,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { scoreToStrength, type StrengthLevel } from '@/lib/strength'
import { ScoreGauge } from '@/components/score-gauge'
import { cn } from '@/lib/utils'
import type {
  CompetitorProfile,
  PersonaProfile,
  PhaseResult,
  ValidationResult,
} from '@/types/validation'

// Section icon mapping
const sectionIcons: Record<string, typeof Target> = {
  'Why Now': Clock,
  'Problem Clarity': Lightbulb,
  'Target Audience': Users,
  'Market Insight': TrendingUp,
  Competition: Sword,
  Positioning: Target,
  'MVP Scope': Zap,
  Monetization: DollarSign,
  Risks: AlertTriangle,
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

const strengthStyles: Record<StrengthLevel, { border: string; bg: string; text: string }> = {
  critical: { border: 'border-red-200', bg: 'bg-red-50/50', text: 'text-red-700' },
  weak: { border: 'border-amber-200', bg: 'bg-amber-50/50', text: 'text-amber-700' },
  neutral: { border: 'border-slate-200', bg: 'bg-slate-50/50', text: 'text-slate-700' },
  good: { border: 'border-emerald-200', bg: 'bg-emerald-50/50', text: 'text-emerald-700' },
  strong: { border: 'border-emerald-300', bg: 'bg-emerald-50/50', text: 'text-emerald-700' },
}

const verdictStyles = {
  pass: { label: 'Strong Potential', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  'needs-work': { label: 'Needs Refinement', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  fail: { label: 'High Risk', className: 'bg-red-100 text-red-700 border-red-200' },
}

// Collapsible Section Component
interface ReportSectionProps {
  title: string
  score?: number
  strength?: StrengthLevel | null
  children: React.ReactNode
  defaultOpen?: boolean
}

function ReportSection({ title, score, strength, children, defaultOpen = false }: ReportSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const Icon = sectionIcons[title] || Target
  const style = strength ? strengthStyles[strength] : strengthStyles.neutral

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        'rounded-xl border bg-white overflow-hidden transition-all',
        isOpen ? style.border : 'border-slate-200'
      )}>
        <CollapsibleTrigger className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                style.bg
              )}>
                <Icon className={cn('w-5 h-5', style.text)} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-900">{title}</h3>
                {score !== undefined && (
                  <p className={cn('text-sm font-medium', style.text)}>
                    Score: {score}/100
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {score !== undefined && (
                <div className={cn(
                  'px-2.5 py-1 rounded-full text-sm font-medium',
                  style.bg,
                  style.text
                )}>
                  {score}
                </div>
              )}
              <ChevronDown className={cn(
                'w-5 h-5 text-slate-400 transition-transform duration-200',
                isOpen && 'rotate-180'
              )} />
            </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-5 pb-5 pt-2 border-t border-slate-100">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

function BulletList({ items, emptyLabel }: { items?: string[] | null; emptyLabel: string }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>
  }

  const cleanItem = (item: string) => item.replace(/^[•\-\*\u2022\u2023]\s*/, '').trim()

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          <span>{cleanItem(item)}</span>
        </li>
      ))}
    </ul>
  )
}

function Field({ label, value }: { label: string; value: unknown }) {
  const displayValue = (() => {
    if (value === null || value === undefined) return 'Not specified'
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (typeof value === 'object') {
      if ('assessment' in value && typeof value.assessment === 'string') return value.assessment
      if ('value' in value) return String(value.value)
      return JSON.stringify(value)
    }
    return String(value)
  })()

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-sm text-slate-700">{displayValue}</p>
    </div>
  )
}

function CompetitorGroup({
  title,
  competitors,
  emptyLabel,
}: {
  title: string
  competitors?: CompetitorProfile[] | null
  emptyLabel: string
}) {
  if (!competitors || competitors.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <div className="space-y-3">
        {competitors.map((competitor) => (
          <div
            key={competitor.name}
            className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2"
          >
            <p className="font-medium text-slate-900">{competitor.name}</p>
            {competitor.positioningNotes && (
              <p className="text-sm text-slate-600">{competitor.positioningNotes}</p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Strengths</p>
                <BulletList items={competitor.strengths} emptyLabel="None noted" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Weaknesses</p>
                <BulletList items={competitor.weaknesses} emptyLabel="None noted" />
              </div>
            </div>
          </div>
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
        <div
          key={persona.name}
          className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2"
        >
          <p className="font-medium text-slate-900">{persona.name}</p>
          <p className="text-sm text-slate-600">{persona.description}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Pain Points</p>
              <BulletList items={persona.painPoints} emptyLabel="None listed" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Goals</p>
              <BulletList items={persona.goals} emptyLabel="None listed" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SharePanel({ resultId }: { resultId: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/result?id=${resultId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="gap-2"
      >
        {copied ? <Copy className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        {copied ? 'Copied!' : 'Copy Link'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        Download PDF
      </Button>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-6">
          {/* Score header skeleton */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200">
            <div className="flex flex-col items-center gap-6">
              <div className="h-40 w-40 rounded-full bg-slate-200" />
              <div className="space-y-3 text-center">
                <div className="h-6 w-32 rounded-full bg-slate-200 mx-auto" />
                <div className="h-4 w-48 rounded bg-slate-200 mx-auto" />
              </div>
            </div>
          </div>
          {/* Sections skeleton */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-200" />
                <div className="flex-1">
                  <div className="h-5 w-32 rounded bg-slate-200" />
                  <div className="h-4 w-20 rounded bg-slate-100 mt-1" />
                </div>
              </div>
            </div>
          ))}
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
  const verdict = report?.verdict || 'needs-work'
  const verdictStyle = verdictStyles[verdict]

  const resultId = searchParams.get('id')

  if (isLoading || !report) {
    return <LoadingSkeleton />
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header with Score and Verdict */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200 shadow-sm mb-8"
        >
          <div className="flex flex-col items-center text-center">
            {/* Score */}
            <ScoreGauge score={score} size={160} duration={2000} />

            {/* Verdict */}
            <div className="mt-6">
              <Badge
                variant="outline"
                className={cn(
                  'px-4 py-2 text-lg font-semibold border-2',
                  verdictStyle.className
                )}
              >
                {verdictStyle.label}
              </Badge>
            </div>

            {/* Title and Summary */}
            <h1 className="mt-6 text-2xl sm:text-3xl font-bold text-slate-900">
              {report.ideaSummary.title}
            </h1>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl">
              {report.ideaSummary.oneLiner}
            </p>

            {/* Tags */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Badge variant="outline" className="text-slate-600">
                {report.ideaSummary.category}
              </Badge>
              <Badge variant="outline" className="text-slate-600">
                {report.ideaSummary.problemTheme}
              </Badge>
            </div>

            {/* Share */}
            {resultId && (
              <div className="mt-6">
                <SharePanel resultId={resultId} />
              </div>
            )}
          </div>
        </motion.div>

        {/* Expandable Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Detailed Analysis
          </h2>

          <ReportSection
            title="Why Now"
            score={report.whyNow?.score}
            strength={getSectionStrength('whyNow', report.phases)}
          >
            <div className="space-y-4">
              <Field label="Timing Assessment" value={report.whyNow?.timing} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Market Forces</p>
                <BulletList items={report.whyNow?.marketForces} emptyLabel="No market forces identified" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Enabling Technology</p>
                <BulletList items={report.whyNow?.enablingTechnology} emptyLabel="No enabling technologies identified" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Cultural Shift</p>
                <BulletList items={report.whyNow?.culturalShift} emptyLabel="No cultural shifts identified" />
              </div>
            </div>
          </ReportSection>

          <ReportSection
            title="Problem Clarity"
            score={report.problemClarity?.score}
            strength={getSectionStrength('problemClarity', report.phases)}
          >
            <div className="space-y-4">
              <Field label="Problem Statement" value={report.problemClarity.problemStatement} />
              <Field label="Severity" value={report.problemClarity.severity} />
              <Field label="Affected Users" value={report.problemClarity.affectedUsers} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Evidence</p>
                <BulletList items={report.problemClarity.evidence} emptyLabel="No evidence provided" />
              </div>
              <Field label="Confidence Level" value={report.problemClarity.confidenceLevel} />
            </div>
          </ReportSection>

          <ReportSection
            title="Target Audience"
            score={report.targetAudience?.score}
            strength={getSectionStrength('targetAudience', report.phases)}
          >
            <div className="space-y-4">
              <Field label="Ideal Customer Profile" value={report.targetAudience.icp} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Key Segments</p>
                <BulletList items={report.targetAudience.keySegments} emptyLabel="No key segments defined" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Personas</p>
                <PersonaGroup personas={report.targetAudience.personas} />
              </div>
            </div>
          </ReportSection>

          <ReportSection
            title="Market Insight"
            score={report.marketInsight?.score}
            strength={getSectionStrength('marketInsight', report.phases)}
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="TAM" value={report.marketInsight.tam} />
                <Field label="SAM" value={report.marketInsight.sam} />
                <Field label="SOM" value={report.marketInsight.som} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Trends</p>
                <BulletList items={report.marketInsight.trends} emptyLabel="No trends listed" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Growth Signals</p>
                <BulletList items={report.marketInsight.growthSignals} emptyLabel="No growth signals listed" />
              </div>
            </div>
          </ReportSection>

          <ReportSection
            title="Competition"
            score={report.competition?.score}
            strength={getSectionStrength('competition', report.phases)}
          >
            <div className="space-y-4">
              <CompetitorGroup
                title="Direct Competitors"
                competitors={report.competition.directCompetitors}
                emptyLabel="No direct competitors listed"
              />
              <CompetitorGroup
                title="Indirect Competitors"
                competitors={report.competition.indirectCompetitors}
                emptyLabel="No indirect competitors listed"
              />
              <Field label="Competitive Advantage" value={report.competition.competitiveAdvantage} />
            </div>
          </ReportSection>

          <ReportSection
            title="Positioning"
            score={report.positioning?.score}
            strength={getSectionStrength('positioning', report.phases)}
          >
            <div className="space-y-4">
              <Field label="Unique Value Proposition" value={report.positioning.uniqueValueProposition} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Differentiators</p>
                <BulletList items={report.positioning.differentiators} emptyLabel="No differentiators listed" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Messaging Pillars</p>
                <BulletList items={report.positioning.messagingPillars} emptyLabel="No messaging pillars listed" />
              </div>
              <Field label="Brand Promise" value={report.positioning.brandPromise} />
            </div>
          </ReportSection>

          <ReportSection
            title="MVP Scope"
            score={report.mvpScope?.score}
            strength={getSectionStrength('mvpScope', report.phases)}
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Core Features</p>
                <BulletList items={report.mvpScope.coreFeatures} emptyLabel="No core features defined" />
              </div>
              <Field label="Timeline" value={report.mvpScope.timeline} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Success Metrics</p>
                <BulletList items={report.mvpScope.successMetrics} emptyLabel="No success metrics defined" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Resource Needs</p>
                <BulletList items={report.mvpScope.resourceNeeds} emptyLabel="No resource needs listed" />
              </div>
            </div>
          </ReportSection>

          <ReportSection
            title="Monetization"
            score={report.monetization?.score}
            strength={getSectionStrength('monetization', report.phases)}
          >
            <div className="space-y-4">
              <Field label="Revenue Model" value={report.monetization.revenueModel} />
              <Field label="Pricing Strategy" value={report.monetization.pricingStrategy} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Sales Channels</p>
                <BulletList items={report.monetization.salesChannels} emptyLabel="No sales channels defined" />
              </div>
              <Field label="Projections" value={report.monetization.projections} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Key Assumptions</p>
                <BulletList items={report.monetization.keyAssumptions} emptyLabel="No assumptions listed" />
              </div>
            </div>
          </ReportSection>

          <ReportSection
            title="Risks"
            score={report.risks?.score}
            strength={getSectionStrength('risks', report.phases)}
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Technical</p>
                <BulletList items={report.risks.technical} emptyLabel="No technical risks identified" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Market</p>
                <BulletList items={report.risks.market} emptyLabel="No market risks identified" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Operational</p>
                <BulletList items={report.risks.operational} emptyLabel="No operational risks identified" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Regulatory</p>
                <BulletList items={report.risks.regulatory} emptyLabel="No regulatory risks identified" />
              </div>
            </div>
          </ReportSection>
        </motion.div>
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

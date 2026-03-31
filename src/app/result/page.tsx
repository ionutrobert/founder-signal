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
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
  'Problem': Lightbulb,
  'Audience': Users,
  'Market': TrendingUp,
  'Competition': Sword,
  'Positioning': Target,
  'MVP': Zap,
  'Monetization': DollarSign,
  'Risks': AlertTriangle,
}

// Section order for the accordion
const sectionOrder = [
  'Why Now',
  'Problem',
  'Audience',
  'Market',
  'Competition',
  'Positioning',
  'MVP',
  'Monetization',
  'Risks',
]

// Map report section names to display names
const sectionNameMap: Record<string, string> = {
  whyNow: 'Why Now',
  problemClarity: 'Problem',
  targetAudience: 'Audience',
  marketInsight: 'Market',
  competition: 'Competition',
  positioning: 'Positioning',
  mvpScope: 'MVP',
  monetization: 'Monetization',
  risks: 'Risks',
}

function isValidationReport(value: unknown): value is ValidationResult {
  if (!value || typeof value !== 'object') {
    return false
  }

  const report = value as Partial<ValidationResult>

  return (
    typeof report.score === 'number' &&
    typeof report.verdict === 'string' &&
    !!report.executiveSummary &&
    !!report.ideaSummary &&
    !!report.whyNow &&
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

function getSectionScore(
  sectionName: string,
  phases?: PhaseResult[] | null
): number | undefined {
  if (!phases || phases.length === 0) return undefined

  for (const phase of phases) {
    const sectionScore = phase.sectionScores?.find(
      s => s.section === sectionName
    )
    if (sectionScore) {
      return sectionScore.score
    }
  }
  return undefined
}

const verdictStyles = {
  pass: { 
    label: 'Strong Potential', 
    className: 'bg-lime-100 text-lime-800 border-lime-200',
    icon: CheckCircle2,
  },
  'needs-work': { 
    label: 'Needs Refinement', 
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: AlertCircle,
  },
  fail: { 
    label: 'High Risk', 
    className: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: AlertTriangle,
  },
}

// Score indicator component with diagonal arrows
function ScoreIndicator({ score }: { score?: number }) {
  if (score === undefined) return null

  const isStrong = score >= 65

  return (
    <div className="flex items-center gap-1 text-sm font-medium text-slate-600">
      <span>{score}</span>
      {isStrong ? (
        <ArrowUpRight className="w-4 h-4 text-slate-600" />
      ) : (
        <ArrowDownRight className="w-4 h-4 text-slate-600" />
      )}
    </div>
  )
}

// Accordion Section Component
interface AccordionSectionProps {
  title: string
  score?: number
  children: React.ReactNode
  defaultOpen?: boolean
}

function AccordionSection({ title, score, children, defaultOpen = false }: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const Icon = sectionIcons[title] || Target

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <CollapsibleTrigger className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Icon className="w-5 h-5 text-slate-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-slate-900">{title}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ScoreIndicator score={score} />
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
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-500" />
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
        className="gap-2 border-slate-300 hover:bg-slate-50"
      >
        {copied ? <Copy className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        {copied ? 'Copied!' : 'Copy Link'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 border-slate-300 hover:bg-slate-50"
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
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Executive summary skeleton */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 h-fit">
              <div className="h-40 w-40 rounded-full bg-slate-200 mx-auto" />
              <div className="h-6 w-32 rounded-full bg-slate-200 mx-auto mt-6" />
              <div className="h-4 w-48 rounded bg-slate-200 mx-auto mt-3" />
            </div>
            {/* Sections skeleton */}
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-200" />
                    <div className="flex-1">
                      <div className="h-5 w-32 rounded bg-slate-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

const ANALYSIS_RESULT_STORAGE_KEY = 'founder-signal:analysis-result'

// Calculate overall assessment based on score
function getOverallAssessment(score: number): string {
  if (score >= 80) {
    return 'This startup idea shows exceptional promise with strong market fit and clear differentiation. Ready to validate with an MVP.'
  } else if (score >= 65) {
    return 'This startup idea has solid fundamentals and market potential. A few areas need refinement before building.'
  } else if (score >= 50) {
    return 'This idea has some merit but needs significant work on positioning, market fit, or competitive differentiation.'
  } else {
    return 'This idea faces substantial challenges. Consider pivoting or addressing critical gaps before proceeding.'
  }
}

// Generate key takeaways from report
function generateKeyTakeaways(report: ValidationResult): string[] {
  const takeaways: string[] = []
  
  if (report.score >= 65) {
    takeaways.push('Strong overall validation score indicates viable market opportunity')
  }
  
  if (report.problemClarity?.severity === 'High') {
    takeaways.push('Clear, high-severity problem identified with strong customer pain')
  }
  
  if (report.marketInsight?.tam && typeof report.marketInsight.tam === 'object' && 'value' in report.marketInsight.tam) {
    const tamValue = String(report.marketInsight.tam.value)
    if (tamValue.includes('B') || tamValue.includes('T')) {
      takeaways.push('Large addressable market provides significant growth potential')
    }
  }
  
  if (report.positioning?.differentiators && report.positioning.differentiators.length > 0) {
    takeaways.push(`Unique positioning with ${report.positioning.differentiators.length} clear differentiators`)
  }
  
  if (report.competition?.directCompetitors && report.competition.directCompetitors.length === 0) {
    takeaways.push('Limited direct competition creates first-mover advantage opportunity')
  }
  
  if (takeaways.length === 0) {
    takeaways.push('Idea shows potential but needs deeper market validation')
    takeaways.push('Consider refining value proposition and competitive positioning')
  }
  
  return takeaways
}

// Generate action items from report
function generateActionItems(report: ValidationResult): string[] {
  const actions: string[] = []
  
  if (report.score < 65) {
    actions.push('Refine core value proposition and market positioning')
  }
  
  if (!report.targetAudience?.personas || report.targetAudience.personas.length === 0) {
    actions.push('Define specific customer personas to guide product development')
  }
  
  if (!report.mvpScope?.coreFeatures || report.mvpScope.coreFeatures.length === 0) {
    actions.push('Prioritize 3-5 core features for initial MVP scope')
  }
  
  if (!report.monetization?.revenueModel) {
    actions.push('Develop clear monetization strategy and pricing model')
  }
  
  if (report.risks?.market && report.risks.market.length > 0) {
    actions.push('Create mitigation plan for identified market risks')
  }
  
  if (actions.length < 3) {
    actions.push('Build landing page to validate demand before full development')
    actions.push('Set up customer interviews to validate problem-solution fit')
  }
  
  return actions.slice(0, 4)
}

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
  const VerdictIcon = verdictStyle.icon

  const resultId = searchParams.get('id')

  if (isLoading || !report) {
    return <LoadingSkeleton />
  }

  const overallAssessment = getOverallAssessment(score)
  const keyTakeaways = generateKeyTakeaways(report)
  const actionItems = generateActionItems(report)

  // Get scores for each section
  const sectionScores: Record<string, number | undefined> = {
    'Why Now': getSectionScore('whyNow', report.phases),
    'Problem': getSectionScore('problemClarity', report.phases),
    'Audience': getSectionScore('targetAudience', report.phases),
    'Market': getSectionScore('marketInsight', report.phases),
    'Competition': getSectionScore('competition', report.phases),
    'Positioning': getSectionScore('positioning', report.phases),
    'MVP': getSectionScore('mvpScope', report.phases),
    'Monetization': getSectionScore('monetization', report.phases),
    'Risks': getSectionScore('risks', report.phases),
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN - Executive Summary (Sticky) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
          >
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* Executive Summary Card */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
                {/* Overall Score */}
                <div className="text-center mb-6">
                  <div className="inline-flex flex-col items-center">
                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
                      Overall Score
                    </span>
                    <div className="relative">
                      <div className={cn(
                        'text-7xl font-bold leading-none',
                        score >= 80 ? 'text-lime-600' :
                        score >= 65 ? 'text-lime-500' :
                        score >= 50 ? 'text-amber-500' : 'text-rose-500'
                      )}>
                        {score}
                      </div>
                      <div className="text-lg text-slate-400 font-medium mt-1">/100</div>
                    </div>
                  </div>
                </div>

                {/* Verdict Badge */}
                <div className="flex justify-center mb-6">
                  <Badge
                    variant="outline"
                    className={cn(
                      'px-4 py-2 text-base font-semibold border-2 flex items-center gap-2',
                      verdictStyle.className
                    )}
                  >
                    <VerdictIcon className="w-4 h-4" />
                    {verdictStyle.label}
                  </Badge>
                </div>

                {/* Idea Title */}
                <h1 className="text-xl font-bold text-slate-900 text-center mb-2">
                  {report.ideaSummary.title}
                </h1>
                <p className="text-sm text-slate-500 text-center mb-6">
                  {report.ideaSummary.oneLiner}
                </p>

                {/* Plain English Summary */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-lime-600" />
                    <span className="text-sm font-semibold text-slate-900">Summary</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {overallAssessment}
                  </p>
                </div>

                {/* Key Takeaways */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-lime-600" />
                    Key Takeaways
                  </h3>
                  <ul className="space-y-2">
                    {keyTakeaways.map((takeaway, idx) => (
                      <li key={`takeaway-${idx}-${takeaway.slice(0, 20)}`} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-500" />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Items */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-lime-600" />
                    Action Items
                  </h3>
                  <ul className="space-y-2">
                    {actionItems.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Share Panel */}
                {resultId && (
                  <div className="pt-4 border-t border-slate-100">
                    <SharePanel resultId={resultId} />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN - Detailed Sections (Scrollable) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-4"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-slate-500" />
              Detailed Analysis
            </h2>

            {/* Accordion Sections */}
            <AccordionSection
              title="Why Now"
              score={sectionScores['Why Now']}
              defaultOpen={true}
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
            </AccordionSection>

            <AccordionSection
              title="Problem"
              score={sectionScores['Problem']}
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
            </AccordionSection>

            <AccordionSection
              title="Audience"
              score={sectionScores['Audience']}
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
            </AccordionSection>

            <AccordionSection
              title="Market"
              score={sectionScores['Market']}
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
            </AccordionSection>

            <AccordionSection
              title="Competition"
              score={sectionScores['Competition']}
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
            </AccordionSection>

            <AccordionSection
              title="Positioning"
              score={sectionScores['Positioning']}
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
            </AccordionSection>

            <AccordionSection
              title="MVP"
              score={sectionScores['MVP']}
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
            </AccordionSection>

            <AccordionSection
              title="Monetization"
              score={sectionScores['Monetization']}
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
            </AccordionSection>

            <AccordionSection
              title="Risks"
              score={sectionScores['Risks']}
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
            </AccordionSection>
          </motion.div>
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

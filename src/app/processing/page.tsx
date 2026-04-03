'use client'

import { useEffect, useRef, useState, useCallback, useId } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Clock, 
  Target, 
  Users, 
  TrendingUp, 
  Sword, 
  Zap, 
  DollarSign,
  AlertTriangle,
  ChevronDown,
  Check,
  Loader2,
  Sparkles
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ActivityFeed } from '@/components/animated-list'
import { streamAnalyzeIdea } from '@/lib/streaming-client'
import type { StreamAnalyzeEvent } from '@/types/validation'
import { AnimatedScore } from '@/components/animated-score'

const PENDING_IDEA_STORAGE_KEY = 'founder-signal:pending-idea'
const ANALYSIS_RESULT_STORAGE_KEY = 'founder-signal:analysis-result'
const IS_PUBLIC_STORAGE_KEY = 'founder-signal:is-public'
const REDIRECT_DELAY_MS = 1500

type Phase = 'research' | 'structural' | 'strategic' | 'complete'

interface SectionData {
  id: string
  name: string
  score: number | null
  icon: typeof Clock
  color: string
}

interface PhaseData {
  id: Phase
  title: string
  sections: SectionData[]
}

const phaseConfig: PhaseData[] = [
  {
    id: 'research',
    title: 'Research Phase',
    sections: [
      { id: 'whyNow', name: 'Why Now', score: null, icon: Clock, color: 'violet' },
      { id: 'problem', name: 'Problem', score: null, icon: Target, color: 'blue' },
      { id: 'audience', name: 'Audience', score: null, icon: Users, color: 'amber' },
    ],
  },
  {
    id: 'structural',
    title: 'Structural Phase',
    sections: [
      { id: 'market', name: 'Market', score: null, icon: TrendingUp, color: 'emerald' },
      { id: 'competition', name: 'Competition', score: null, icon: Sword, color: 'rose' },
      { id: 'positioning', name: 'Positioning', score: null, icon: Zap, color: 'indigo' },
    ],
  },
  {
    id: 'strategic',
    title: 'Strategic Phase',
    sections: [
      { id: 'mvp', name: 'MVP Scope', score: null, icon: Sparkles, color: 'purple' },
      { id: 'monetization', name: 'Monetization', score: null, icon: DollarSign, color: 'cyan' },
      { id: 'risks', name: 'Risks', score: null, icon: AlertTriangle, color: 'orange' },
    ],
  },
]


function SectionCard({ section, status }: { section: SectionData; status: 'pending' | 'active' | 'completed' }) {
  const Icon = section.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center gap-3 rounded-xl border p-3 transition-all',
        status === 'completed' && 'bg-white border-slate-200',
        status === 'active' && 'bg-white border-slate-200 shadow-sm',
        status === 'pending' && 'bg-slate-50/50 border-slate-100 opacity-60'
      )}
    >
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
        status === 'completed' && 'bg-emerald-50 text-emerald-600',
        status === 'active' && 'bg-slate-100 text-slate-400',
        status === 'pending' && 'bg-slate-100 text-slate-400'
      )}>
        {status === 'completed' ? (
          <Check className="w-4 h-4" />
        ) : status === 'active' ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-4 h-4" />
          </motion.div>
        ) : (
          <Icon className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          status === 'completed' ? 'text-slate-900' : 'text-slate-600'
        )}>
          {section.name}
        </p>
      </div>
    </motion.div>
  )
}

function PhaseCard({
  phase,
  currentPhase,
  expanded,
  onToggle
}: {
  phase: PhaseData
  currentPhase: Phase
  expanded: boolean
  onToggle: () => void
}) {
  const getPhaseStatus = () => {
    const order = ['research', 'structural', 'strategic', 'complete']
    const currentIndex = order.indexOf(currentPhase)
    const phaseIndex = order.indexOf(phase.id)

    if (phaseIndex < currentIndex) return 'completed'
    if (phaseIndex === currentIndex) return 'active'
    return 'pending'
  }

  const status = getPhaseStatus()
  const sections = phase.sections

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'overflow-hidden rounded-xl border bg-white transition-shadow',
        status === 'active' && 'shadow-md border-slate-200',
        status === 'completed' && 'border-slate-200',
        status === 'pending' && 'border-slate-100 opacity-70'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
      >
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>
        
      <div className="flex-shrink-0">
        {status === 'completed' && (
          <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
            <Check className="w-4 h-4 text-emerald-600" strokeWidth={3} />
          </div>
        )}
        {status === 'active' && (
          <div className="w-6 h-6 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-[#E7EB5D] animate-spin" />
          </div>
        )}
        {status === 'pending' && (
          <div className="w-6 h-6 rounded-full border-2 border-slate-200" />
        )}
      </div>

        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-semibold truncate',
            status === 'completed' && 'text-slate-900',
            status === 'active' && 'text-slate-900',
            status === 'pending' && 'text-slate-500'
          )}>
            {phase.title}
          </p>
          <p className="text-xs text-slate-500">
            {status === 'completed' && `${sections.length} sections analyzed`}
            {status === 'active' && 'Analyzing...'}
            {status === 'pending' && 'Waiting...'}
          </p>
        </div>
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="border-t border-slate-100"
        >
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                status={
                  status === 'completed' ? 'completed' :
                  status === 'active' ? 'active' :
                  'pending'
                }
              />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default function ProcessingPage() {
	const router = useRouter()
	const redirectTimeoutRef = useRef<number | null>(null)
	const [idea, setIdea] = useState<string | null>(null)
	const [isPublic, setIsPublic] = useState(true)
	const [hasLoadedIdea, setHasLoadedIdea] = useState(false)
	const [score, setScore] = useState(0)
  const [currentPhase, setCurrentPhase] = useState<Phase>('research')
  const [activityMessages, setActivityMessages] = useState<{ id: string; message: string }[]>([])

const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['research']))
const [isComplete, setIsComplete] = useState(false)
const [error, setError] = useState<string | null>(null)

  const baseId = useId()
  const counterRef = useRef(0)
  const getActivityId = useCallback(() => {
    counterRef.current += 1
    return `${baseId}-activity-${counterRef.current}`
  }, [baseId])

	useEffect(() => {
		const storedIdea = window.sessionStorage.getItem(PENDING_IDEA_STORAGE_KEY)
		const storedIsPublic = window.sessionStorage.getItem(IS_PUBLIC_STORAGE_KEY)
		if (!storedIdea?.trim()) {
			router.replace('/')
			return
		}
		setIdea(storedIdea)
		setIsPublic(storedIsPublic !== 'false')
		setHasLoadedIdea(true)
	}, [router])

useEffect(() => {
if (!idea) return

const controller = new AbortController()
setScore(0)
setActivityMessages([])
setCurrentPhase('research')
setIsComplete(false)
setError(null)

    const handleEvent = (event: StreamAnalyzeEvent) => {
      if (event.type === 'score') {
        setScore(event.value)
        return
      }

      if (event.type === 'activity') {
        setActivityMessages((current) => [
          ...current.slice(-4),
          { id: getActivityId(), message: event.message }
        ])

        if (event.phase === 'RESEARCH') {
          setCurrentPhase('research')
          setExpandedPhases((prev) => new Set([...prev, 'research']))
        } else if (event.phase === 'STRUCTURAL') {
          setCurrentPhase('structural')
          setExpandedPhases((prev) => new Set([...prev, 'structural']))
        } else if (event.phase === 'STRATEGIC') {
          setCurrentPhase('strategic')
          setExpandedPhases((prev) => new Set([...prev, 'strategic']))
        }
        return
      }

	if (event.type === 'complete') {
		setScore(event.data.score)
		setIsComplete(true)
		setCurrentPhase('complete')
		window.sessionStorage.removeItem(PENDING_IDEA_STORAGE_KEY)
		window.sessionStorage.removeItem(IS_PUBLIC_STORAGE_KEY)

        try {
          window.sessionStorage.setItem(ANALYSIS_RESULT_STORAGE_KEY, JSON.stringify(event.data))
        } catch {
          // Ignore storage errors
        }

        if (redirectTimeoutRef.current) {
          window.clearTimeout(redirectTimeoutRef.current)
        }

        redirectTimeoutRef.current = window.setTimeout(() => {
          if (event.resultId) {
            router.push(`/result?id=${event.resultId}`)
          } else {
            router.push('/result')
          }
        }, REDIRECT_DELAY_MS)
      }
    }

	void streamAnalyzeIdea({
		idea,
		isPublic,
		signal: controller.signal,
		onEvent: handleEvent
	}).catch((streamError) => {
		if (controller.signal.aborted) return
		const errorMessage = streamError instanceof Error ? streamError.message : 'Analysis failed'
		console.error('Stream error:', streamError)
		setError(errorMessage)
		setActivityMessages([])
	})

	return () => {
		controller.abort()
	}
}, [idea, isPublic, router, getActivityId])

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(phaseId)) {
        next.delete(phaseId)
      } else {
        next.add(phaseId)
      }
      return next
    })
  }

  const getStatusText = () => {
    if (isComplete) return 'Analysis complete'
    if (currentPhase === 'research') return 'Researching market...'
    if (currentPhase === 'structural') return 'Analyzing structure...'
    if (currentPhase === 'strategic') return 'Evaluating strategy...'
    return 'Starting analysis...'
  }

  const getVerdictColor = () => {
    if (score >= 80) return 'text-emerald-600'
    if (score >= 50) return 'text-amber-600'
    return 'text-red-600'
  }

if (!hasLoadedIdea) {
return (
<main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
<div className="flex items-center justify-center min-h-screen">
<Card className="w-full max-w-md mx-4">
<CardContent className="flex items-center gap-4 p-6">
<Loader2 className="h-5 w-5 animate-spin text-[#E7EB5D]" />
<span className="text-slate-600">Preparing your analysis...</span>
</CardContent>
</Card>
</div>
</main>
)
}

if (error) {
return (
<main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
<div className="flex items-center justify-center min-h-screen">
<Card className="w-full max-w-md mx-4 border-red-200">
<CardContent className="p-6">
<div className="flex items-start gap-4">
<AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
<div>
<h2 className="text-base font-semibold text-slate-900 mb-1">Analysis Failed</h2>
<p className="text-sm text-slate-600">{error}</p>
<button
type="button"
onClick={() => router.push('/')}
className="mt-4 text-sm font-medium text-[#E7EB5D] hover:underline"
>
Try again
</button>
</div>
</div>
</CardContent>
</Card>
</div>
</main>
)
}

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -right-40 top-0 w-[800px] h-[800px] bg-gradient-to-br from-violet-100/40 to-blue-100/30 rounded-full blur-3xl" />
        <div className="absolute -left-40 top-1/3 w-[600px] h-[600px] bg-gradient-to-br from-lime-100/30 to-emerald-100/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E7EB5D] mb-3">
            Live Analysis
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight mb-4">
            Validating your idea
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto text-sm leading-relaxed">
            {idea}
          </p>
        </motion.div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Left column - Phases (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            {phaseConfig.map((phase) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                currentPhase={currentPhase}
                expanded={expandedPhases.has(phase.id)}
                onToggle={() => togglePhase(phase.id)}
              />
            ))}
          </div>

          {/* Right column - Score & Activity (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Score Card */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Overall Score
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
          <AnimatedScore value={score} isCalculating={!isComplete} size="lg" />

          <div className="mt-6 text-center space-y-2">
            <p className={cn('text-2xl font-bold', score === 0 && !isComplete ? 'text-slate-400' : getVerdictColor())}>
              {score === 0 && !isComplete ? 'Calculating...' : score >= 80 ? 'Strong' : score >= 50 ? 'Needs Work' : 'Needs Work'}
            </p>
                  <p className="text-sm text-slate-500">
                    {isComplete ? 'Analysis complete' : getStatusText()}
                  </p>
                </div>

            {/* Progress bar */}
            <div className="w-full mt-6">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    score === 0 && !isComplete ? 'bg-slate-300' :
                    score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: score === 0 && !isComplete ? '0%' : `${score}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Current Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityMessages.length > 0 ? (
                  <ActivityFeed messages={activityMessages} />
                ) : (
                  <div className="flex items-center gap-3 text-slate-400 py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Initializing analysis...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completion message */}
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-100"
              >
                <p className="text-sm text-emerald-700 font-medium">
                  Analysis complete! Opening report...
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { ErrorDisplay } from '@/components/error-display'
import { StreamingScore } from '@/components/streaming-score'
import { ProcessingTimeline } from '@/components/processing-timeline'
import { Card, CardContent } from '@/components/ui/card'
import { streamAnalyzeIdea } from '@/lib/streaming-client'
import type {
  StreamAnalyzeEvent,
  ValidationSectionName,
  ValidationSections,
  Verdict
} from '@/types/validation'

const PENDING_IDEA_STORAGE_KEY = 'founder-signal:pending-idea'
const ANALYSIS_RESULT_STORAGE_KEY = 'founder-signal:analysis-result'
const REDIRECT_DELAY_MS = 900

export default function ProcessingPage() {
  const router = useRouter()
  const redirectTimeoutRef = useRef<number | null>(null)
  const [idea, setIdea] = useState<string | null>(null)
  const [hasLoadedIdea, setHasLoadedIdea] = useState(false)
  const [score, setScore] = useState(0)
  const [sections, setSections] = useState<Partial<ValidationSections>>({})
  const [currentPhase, setCurrentPhase] = useState<'research' | 'structural' | 'strategic' | 'complete'>('research')
  const [activeSection, setActiveSection] = useState<ValidationSectionName | null>(null)
  const [activityMessages, setActivityMessages] = useState<string[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [finalVerdict, setFinalVerdict] = useState<Verdict | null>(null)

  useEffect(() => {
    const storedIdea = window.sessionStorage.getItem(PENDING_IDEA_STORAGE_KEY)
    if (!storedIdea?.trim()) {
      router.replace('/')
      return
    }
    setIdea(storedIdea)
    setHasLoadedIdea(true)
  }, [router])

  useEffect(() => {
    if (!idea) return

    const controller = new AbortController()
    setSections({})
    setScore(0)
    setError(null)
    setFinalVerdict(null)
    setActivityMessages([])
    setCurrentPhase('research')
    setActiveSection(null)
    setIsStreaming(true)

    const handleEvent = (event: StreamAnalyzeEvent) => {
      if (event.type === 'status') {
        return
      }

      if (event.type === 'score') {
        setScore(event.value)
        return
      }

      if (event.type === 'section') {
        setSections((current) => ({
          ...current,
          [event.name]: event.data
        }))
        setActiveSection(event.name as ValidationSectionName)
        return
      }

      if (event.type === 'activity') {
        setActivityMessages((current) => [...current.slice(-5), event.message])

        if (event.phase === 'RESEARCH') {
          setCurrentPhase('research')
        } else if (event.phase === 'STRUCTURAL') {
          setCurrentPhase('structural')
        } else if (event.phase === 'STRATEGIC') {
          setCurrentPhase('strategic')
        }
        return
      }

      if (event.type === 'phase') {
        if (event.status === 'complete') {
          setActivityMessages([])
        }
        return
      }

      if (event.type === 'error') {
        setError(event.message)
        setIsStreaming(false)
        return
      }

      if (event.type === 'complete') {
        setSections(event.data)
        setScore(event.data.score)
        setFinalVerdict(event.data.verdict)
        setCurrentPhase('complete')
        setIsStreaming(false)
        window.sessionStorage.removeItem(PENDING_IDEA_STORAGE_KEY)

        // Store result in sessionStorage as fallback
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
      signal: controller.signal,
      onEvent: handleEvent
    })
      .catch((streamError) => {
        if (controller.signal.aborted) return
        const message = streamError instanceof Error ? streamError.message : 'Unable to stream the analysis.'
        setError(message)
        setIsStreaming(false)
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsStreaming(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [idea, router])

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  if (!hasLoadedIdea) {
    return (
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-12">
          <Card className="w-full max-w-lg border-border/80 bg-card/95 shadow-[var(--shadow-lifted)]">
            <CardContent className="flex items-center gap-3 px-6 py-6 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Preparing your live validation workspace...
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -right-32 top-0 h-[32rem] w-[32rem] rounded-full blur-[100px]"
          style={{ backgroundColor: 'rgb(var(--aurora-blue) / 0.18)' }}
        />
        <div
          className="absolute left-0 top-24 h-[28rem] w-[28rem] rounded-full blur-[90px]"
          style={{ backgroundColor: 'rgb(var(--aurora-indigo) / 0.14)' }}
        />
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Card className="border-border/80 bg-card/95 shadow-[var(--shadow-lifted)]">
          <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                Live Analysis
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                Validating your idea
              </h1>
              <p className="text-sm leading-6 text-slate-600">
                {idea}
              </p>
            </div>
            <div className="flex shrink-0 justify-center md:justify-end">
      <div className="rounded-lg border border-border/80 bg-slate-50/80 px-5 py-4" aria-live="polite" aria-atomic="true">
        <StreamingScore value={score} status={isStreaming ? 'Streaming' : 'Ready'} />
      </div>
            </div>
          </CardContent>
        </Card>

        {error ? (
          <div className="space-y-4" role="alert">
            <ErrorDisplay message={error} variant="network" onRetry={() => {
              setSections({})
              setScore(0)
              setError(null)
              window.location.reload()
            }} />
          </div>
        ) : (
          <output aria-live="polite" className="block" aria-label="Analysis progress">
            <ProcessingTimeline
              currentPhase={currentPhase}
              sections={sections}
              activeSection={activeSection}
              activityMessages={activityMessages}
            />
          </output>
        )}

        {finalVerdict && (
          <div className="text-center text-sm text-muted-foreground">
            Analysis complete. Opening full report...
          </div>
        )}
      </div>
    </main>
  )
}

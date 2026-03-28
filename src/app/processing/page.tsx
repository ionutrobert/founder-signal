'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, LoaderCircle, Sparkles } from 'lucide-react'

import { ErrorDisplay } from '@/components/error-display'
import { StreamingScore } from '@/components/streaming-score'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { streamAnalyzeIdea } from '@/lib/streaming-client'
import { cn } from '@/lib/utils'
import type {
  StreamAnalyzeEvent,
  ValidationSectionName,
  ValidationSections,
  Verdict
} from '@/types/validation'

const PENDING_IDEA_STORAGE_KEY = 'founder-signal:pending-idea'
const REDIRECT_DELAY_MS = 900

const verdictCopy: Record<Verdict, { label: string; className: string }> = {
  pass: {
    label: 'Pass',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700'
  },
  'needs-work': {
    label: 'Needs work',
    className: 'border-amber-200 bg-amber-50 text-amber-700'
  },
  fail: {
    label: 'Fail',
    className: 'border-red-200 bg-red-50 text-red-700'
  }
}

const sectionMeta: Array<{
  name: ValidationSectionName
  title: string
  description: string
}> = [
  {
    name: 'ideaSummary',
    title: 'Idea summary',
    description: 'Core framing, category, and traction evidence.'
  },
  {
    name: 'problemClarity',
    title: 'Problem clarity',
    description: 'How sharply the pain is defined and evidenced.'
  },
  {
    name: 'targetAudience',
    title: 'Target audience',
    description: 'ICP, segments, and the highest-priority personas.'
  },
  {
    name: 'marketInsight',
    title: 'Market insight',
    description: 'Sizing, timing, and demand signals.'
  },
  {
    name: 'competition',
    title: 'Competition',
    description: 'Direct and indirect alternatives in the market.'
  },
  {
    name: 'positioning',
    title: 'Positioning',
    description: 'UVP, differentiators, and messaging pillars.'
  },
  {
    name: 'mvpScope',
    title: 'MVP scope',
    description: 'What to ship first and how to validate it.'
  },
  {
    name: 'monetization',
    title: 'Monetization',
    description: 'Revenue model, pricing, and channel assumptions.'
  },
  {
    name: 'risks',
    title: 'Risks',
    description: 'Technical, market, and operational constraints.'
  }
]

function BulletList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm leading-6 text-slate-600">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="text-sm leading-6 text-slate-700">{value}</p>
    </div>
  )
}

function SectionShell({
  title,
  description,
  children,
  status
}: {
  title: string
  description: string
  children: ReactNode
  status?: ReactNode
}) {
  return (
    <Card className="border-border/80 bg-card/95 shadow-[var(--shadow-soft)]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg text-slate-900">{title}</CardTitle>
            <CardDescription className="text-slate-600">{description}</CardDescription>
          </div>
          {status}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

function PendingSectionCard({ title, description, isCurrent }: { title: string; description: string; isCurrent: boolean }) {
  return (
    <Card
      className={cn(
        'border-dashed border-border/80 bg-card/70 shadow-none transition-colors',
        isCurrent ? 'border-primary/40 bg-primary/5' : 'opacity-75'
      )}
    >
      <CardContent className="space-y-3 px-5 py-5">
        <div className="flex items-center gap-3">
          {isCurrent ? (
            <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden="true" />
          ) : (
            <div className="size-4 rounded-full border border-border bg-muted" aria-hidden="true" />
          )}
          <div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function renderSectionPreview(name: ValidationSectionName, sections: Partial<ValidationSections>) {
  switch (name) {
    case 'ideaSummary': {
      const section = sections.ideaSummary

      if (!section) {
        return null
      }

      return (
        <SectionShell title="Idea summary" description="The concept the model is anchoring on.">
          <Field label="Title" value={section.title} />
          <Field label="One-liner" value={section.oneLiner} />
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-border bg-card text-foreground">
              {section.category}
            </Badge>
            <Badge variant="outline" className="border-border bg-card text-foreground">
              {section.problemTheme}
            </Badge>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Traction evidence
            </p>
            <BulletList items={section.tractionEvidence} emptyLabel="No traction evidence captured yet." />
          </div>
        </SectionShell>
      )
    }
    case 'problemClarity': {
      const section = sections.problemClarity

      if (!section) {
        return null
      }

      return (
        <SectionShell title="Problem clarity" description="How severe and concrete the problem appears.">
          <Field label="Problem statement" value={section.problemStatement} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Severity" value={section.severity} />
            <Field label="Confidence" value={section.confidenceLevel} />
          </div>
          <Field label="Affected users" value={section.affectedUsers} />
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Evidence</p>
            <BulletList items={section.evidence} emptyLabel="No evidence streamed yet." />
          </div>
        </SectionShell>
      )
    }
    case 'targetAudience': {
      const section = sections.targetAudience

      if (!section) {
        return null
      }

      return (
        <SectionShell title="Target audience" description="Who feels the pain most acutely.">
          <Field label="Ideal customer profile" value={section.icp} />
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Key segments</p>
            <BulletList items={section.keySegments} emptyLabel="No segments defined yet." />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Lead personas</p>
            <BulletList
              items={section.personas.map((persona) => `${persona.name}: ${persona.description}`)}
              emptyLabel="No personas defined yet."
            />
          </div>
        </SectionShell>
      )
    }
    case 'marketInsight': {
      const section = sections.marketInsight

      if (!section) {
        return null
      }

      return (
        <SectionShell title="Market insight" description="Sizing and demand context around the idea.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="TAM" value={section.tam} />
            <Field label="SAM" value={section.sam} />
            <Field label="SOM" value={section.som} />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Trends</p>
            <BulletList items={section.trends} emptyLabel="No trends listed yet." />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Growth signals</p>
            <BulletList items={section.growthSignals} emptyLabel="No growth signals listed yet." />
          </div>
        </SectionShell>
      )
    }
    case 'competition': {
      const section = sections.competition

      if (!section) {
        return null
      }

      return (
        <SectionShell title="Competition" description="How the market landscape looks so far.">
          <Field label="Competitive advantage" value={section.competitiveAdvantage} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Direct</p>
              <BulletList
                items={section.directCompetitors.map((competitor) => competitor.name)}
                emptyLabel="No direct competitors listed."
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Indirect</p>
              <BulletList
                items={section.indirectCompetitors.map((competitor) => competitor.name)}
                emptyLabel="No indirect competitors listed."
              />
            </div>
          </div>
        </SectionShell>
      )
    }
    case 'positioning': {
      const section = sections.positioning

      if (!section) {
        return null
      }

      return (
        <SectionShell title="Positioning" description="The angle that feels strongest in-market.">
          <Field label="Unique value proposition" value={section.uniqueValueProposition} />
          <Field label="Brand promise" value={section.brandPromise} />
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Differentiators</p>
            <BulletList items={section.differentiators} emptyLabel="No differentiators listed yet." />
          </div>
        </SectionShell>
      )
    }
    case 'mvpScope': {
      const section = sections.mvpScope

      if (!section) {
        return null
      }

      return (
        <SectionShell title="MVP scope" description="The shortest path to learning.">
          <Field label="Timeline" value={section.timeline} />
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Core features</p>
            <BulletList items={section.coreFeatures} emptyLabel="No core features listed yet." />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Success metrics</p>
            <BulletList items={section.successMetrics} emptyLabel="No success metrics listed yet." />
          </div>
        </SectionShell>
      )
    }
    case 'monetization': {
      const section = sections.monetization

      if (!section) {
        return null
      }

      return (
        <SectionShell title="Monetization" description="Revenue mechanics and pricing logic.">
          <Field label="Revenue model" value={section.revenueModel} />
          <Field label="Pricing strategy" value={section.pricingStrategy} />
          <Field label="Projections" value={section.projections} />
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sales channels</p>
            <BulletList items={section.salesChannels} emptyLabel="No sales channels listed yet." />
          </div>
        </SectionShell>
      )
    }
    case 'risks': {
      const section = sections.risks

      if (!section) {
        return null
      }

      return (
        <SectionShell title="Risks" description="Failure modes surfacing during analysis.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Technical</p>
              <BulletList items={section.technical} emptyLabel="No technical risks identified." />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Market</p>
              <BulletList items={section.market} emptyLabel="No market risks identified." />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Operational</p>
              <BulletList items={section.operational} emptyLabel="No operational risks identified." />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Regulatory</p>
              <BulletList items={section.regulatory} emptyLabel="No regulatory risks identified." />
            </div>
          </div>
        </SectionShell>
      )
    }
  }
}

export default function ProcessingPage() {
  const router = useRouter()
  const redirectTimeoutRef = useRef<number | null>(null)
  const [idea, setIdea] = useState<string | null>(null)
  const [hasLoadedIdea, setHasLoadedIdea] = useState(false)
  const [runKey, setRunKey] = useState(0)
  const [score, setScore] = useState(0)
  const [sections, setSections] = useState<Partial<ValidationSections>>({})
  const [statusMessage, setStatusMessage] = useState('Waiting for your idea…')
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
    if (!idea) {
      return
    }

    const activeRunKey = runKey
    const controller = new AbortController()

    setSections({})
    setScore(0)
    setError(null)
    setFinalVerdict(null)
    setStatusMessage(activeRunKey === 0 ? 'Connecting to NVIDIA NIM' : 'Reconnecting to NVIDIA NIM')
    setIsStreaming(true)

    const handleEvent = (event: StreamAnalyzeEvent) => {
      if (event.type === 'status') {
        setStatusMessage(event.message)
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
        return
      }

      if (event.type === 'error') {
        setError(event.message)
        setStatusMessage('Stream interrupted')
        setIsStreaming(false)
        return
      }

      if (event.type === 'complete') {
        setSections(event.data)
        setScore(event.data.score)
        setFinalVerdict(event.data.verdict)
        setStatusMessage('Analysis complete. Opening full report…')
        setIsStreaming(false)
        window.sessionStorage.removeItem(PENDING_IDEA_STORAGE_KEY)

        if (redirectTimeoutRef.current) {
          window.clearTimeout(redirectTimeoutRef.current)
        }

        const encodedReport = encodeURIComponent(JSON.stringify(event.data))
        redirectTimeoutRef.current = window.setTimeout(() => {
          router.push(`/result?data=${encodedReport}`)
        }, REDIRECT_DELAY_MS)
      }
    }

    void streamAnalyzeIdea({
      idea,
      signal: controller.signal,
      onEvent: handleEvent
    })
      .catch((streamError) => {
        if (controller.signal.aborted) {
          return
        }

        const message = streamError instanceof Error ? streamError.message : 'Unable to stream the analysis.'
        setError(message)
        setStatusMessage('Unable to continue the live stream')
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
  }, [idea, router, runKey])

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  const loadedSections = useMemo(
    () => sectionMeta.filter((section) => Boolean(sections[section.name])),
    [sections]
  )

  const currentPendingIndex = loadedSections.length
  const ideaPreview = idea?.trim() ? idea.trim() : ''

  if (!hasLoadedIdea) {
    return (
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-12">
          <Card className="w-full max-w-lg border-border/80 bg-card/95 shadow-[var(--shadow-lifted)]">
            <CardContent className="flex items-center gap-3 px-6 py-6 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden="true" />
              Preparing your live validation workspace…
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-transparent">
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

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Card className="border-border/80 bg-card/95 shadow-[var(--shadow-lifted)]">
          <CardContent className="grid gap-8 px-6 py-6 lg:grid-cols-[minmax(0,1.2fr)_320px] lg:px-8 lg:py-8">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-primary/12 text-primary shadow-none">Live analysis</Badge>
                {finalVerdict ? (
                  <Badge className={cn('shadow-none', verdictCopy[finalVerdict].className)}>
                    {verdictCopy[finalVerdict].label}
                  </Badge>
                ) : null}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Founder Signal processing
                </p>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
                  Streaming your validation report in real time
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                  We’re scoring the idea, expanding each analysis section, and staging the final report as soon as it’s ready.
                </p>
              </div>

              <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/70 bg-muted/50 p-5 shadow-[var(--shadow-soft)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Idea under review</p>
                <p className="mt-3 text-sm leading-7 text-slate-700 md:text-base">
                  {ideaPreview}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2">
                  {isStreaming ? (
                    <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                  )}
                  <span>{statusMessage}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2">
                  <Sparkles className="size-4 text-primary" aria-hidden="true" />
                  <span>{loadedSections.length} / {sectionMeta.length} sections ready</span>
                </div>
              </div>
            </div>

            <div className="rounded-[calc(var(--radius)+0.5rem)] border border-border/80 bg-slate-50/80 px-6 py-6">
              <StreamingScore value={score} status={isStreaming ? 'Streaming' : 'Ready'} />
            </div>
          </CardContent>
        </Card>

        {error ? (
          <div className="space-y-4">
            <ErrorDisplay message={error} variant="network" onRetry={() => setRunKey((value) => value + 1)} />
            <div className="flex justify-center">
              <Button type="button" variant="outline" onClick={() => router.push('/')}>
                Back to home
              </Button>
            </div>
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="h-fit border-border/80 bg-card/95 shadow-[var(--shadow-soft)]">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">Processing map</CardTitle>
              <CardDescription className="text-slate-600">Sections appear as the model finishes them.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sectionMeta.map((section, index) => {
                const isLoaded = Boolean(sections[section.name])
                const isCurrent = !isLoaded && index === currentPendingIndex && isStreaming

                return (
                  <div
                    key={section.name}
                    className={cn(
                      'flex items-start gap-3 rounded-[calc(var(--radius)-0.15rem)] border px-4 py-3 transition-colors',
                      isLoaded
                        ? 'border-primary/20 bg-primary/5'
                        : isCurrent
                          ? 'border-border bg-muted/70'
                          : 'border-border/70 bg-card'
                    )}
                  >
                    <div className="mt-0.5">
                      {isLoaded ? (
                        <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                      ) : isCurrent ? (
                        <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden="true" />
                      ) : (
                        <div className="size-4 rounded-full border border-border bg-muted" aria-hidden="true" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">{section.title}</p>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {loadedSections.map((section) => (
              <div key={section.name} className="animate-in fade-in-0 slide-in-from-bottom-3 duration-500">
                {renderSectionPreview(section.name, sections)}
              </div>
            ))}

            {sectionMeta
              .filter((section) => !sections[section.name])
              .slice(0, Math.max(1, 6 - loadedSections.length))
              .map((section, index) => (
                <PendingSectionCard
                  key={section.name}
                  title={section.title}
                  description={section.description}
                  isCurrent={isStreaming && index === 0}
                />
              ))}
          </div>
        </section>
      </div>
    </main>
  )
}

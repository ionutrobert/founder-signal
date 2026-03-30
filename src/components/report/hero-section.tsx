'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ShareButtons } from '@/components/share-buttons'
import { ScoreGauge } from '@/components/report/framework/score-gauge'
import type { Verdict } from '@/types/validation'

const verdictStyles: Record<Verdict, { label: string; className: string }> = {
  pass: {
    label: 'Pass',
    className: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  'needs-work': {
    label: 'Needs Work',
    className: 'border border-amber-200 bg-amber-50 text-amber-700',
  },
  fail: {
    label: 'Fail',
    className: 'border border-red-200 bg-red-50 text-red-700',
  },
}

interface HeroSectionProps {
  title: string
  oneLiner: string
  score: number
  verdict: Verdict
  category: string
  problemTheme: string
  resultId?: string
  className?: string
}

export function HeroSection({
  title,
  oneLiner,
  score,
  verdict,
  category,
  problemTheme,
  resultId,
  className,
}: HeroSectionProps) {
  const verdictStyle = verdictStyles[verdict]

  return (
    <Card
      className={cn(
        'border-slate-200/80 bg-gradient-to-br from-slate-50 to-white shadow-[var(--shadow-lifted)]',
        className
      )}
    >
      <CardContent className="flex flex-col gap-8 p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-4 text-center lg:items-start lg:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-600">
            Validation report
          </p>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              {oneLiner}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Badge className={verdictStyle.className}>{verdictStyle.label}</Badge>
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
              {category}
            </Badge>
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
              {problemTheme}
            </Badge>
          </div>

          {resultId && (
            <div className="mt-4">
              <ShareButtons resultId={resultId} title={title} />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-4 rounded-[calc(var(--radius)+0.25rem)] border border-slate-200/80 bg-slate-50/80 px-6 py-5">
          <ScoreGauge score={score} size="lg" label="Score" />
          <p className="text-sm font-medium text-slate-600">
            Overall founder signal confidence
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

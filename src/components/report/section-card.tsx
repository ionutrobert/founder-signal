'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScoreTooltip } from '@/components/score-tooltip'
import type { StrengthLevel } from '@/components/strength-indicator'

interface SectionCardProps {
  title: string
  description?: string
  score?: number
  scoreReasoning?: string
  strength?: StrengthLevel | null
  detailHref?: string
  children: React.ReactNode
  className?: string
}

const strengthBorderStyles: Record<StrengthLevel, string> = {
  critical: 'border-l-[3px] border-l-red-300 bg-red-50/30',
  weak: 'border-l-2 border-l-amber-300 bg-amber-50/30',
  neutral: 'border-l border-l-slate-300',
  good: 'border-l-2 border-l-emerald-300 bg-emerald-50/30',
  strong: 'border-l-[3px] border-l-emerald-400 bg-emerald-50/50',
}

export function SectionCard({
  title,
  description,
  score,
  scoreReasoning,
  strength,
  detailHref,
  children,
  className,
}: SectionCardProps) {
  const strengthClass = strength ? strengthBorderStyles[strength] : ''

  return (
    <Card
      className={cn(
        'border-slate-200/80 bg-white shadow-[var(--shadow-soft)]',
        strengthClass,
        className
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
          {title}
          {(score !== undefined || scoreReasoning) && (
            <ScoreTooltip
              score={score}
              reasoning={scoreReasoning}
              strength={strength ?? null}
            />
          )}
        </CardTitle>
        {description && (
          <p className="text-sm text-slate-600">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {children}
        {detailHref && (
          <Link
            href={detailHref}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            See details
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { AnimatedScore } from '@/components/shadcnspace'
import type { StrengthLevel } from '@/components/strength-indicator'

interface ScoreCardProps {
  title: string
  score: number
  summary?: string
  strength?: StrengthLevel
  href?: string
  className?: string
}

const strengthGlowColors: Record<StrengthLevel, string> = {
  critical: 'rgba(239, 68, 68, 0.08)',
  weak: 'rgba(245, 158, 11, 0.08)',
  neutral: 'rgba(100, 116, 139, 0.05)',
  good: 'rgba(16, 185, 129, 0.08)',
  strong: 'rgba(16, 185, 129, 0.12)',
}

const strengthBorderColors: Record<StrengthLevel, string> = {
  critical: 'border-red-400',
  weak: 'border-amber-400',
  neutral: 'border-slate-300',
  good: 'border-emerald-400',
  strong: 'border-emerald-500',
}

const strengthTextColors: Record<StrengthLevel, string> = {
  critical: 'text-red-600',
  weak: 'text-amber-600',
  neutral: 'text-slate-600',
  good: 'text-emerald-600',
  strong: 'text-emerald-700',
}

function getStrengthFromScore(score: number): StrengthLevel {
  if (score >= 80) return 'strong'
  if (score >= 65) return 'good'
  if (score >= 50) return 'neutral'
  if (score >= 35) return 'weak'
  return 'critical'
}

export function ScoreCard({
  title,
  score,
  summary,
  strength,
  href,
  className,
}: ScoreCardProps) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)))
  const resolvedStrength = strength ?? getStrengthFromScore(clampedScore)
  const glowColor = strengthGlowColors[resolvedStrength]
  const borderColor = strengthBorderColors[resolvedStrength]
  const textColor = strengthTextColors[resolvedStrength]

  const content = (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border border-slate-200/80 bg-white p-4 transition-all',
        'border-t-[3px]',
        borderColor,
        href && 'cursor-pointer hover:border-slate-300 hover:shadow-md',
        className
      )}
      style={{
        boxShadow: `0 0 15px ${glowColor}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-slate-700">{title}</h3>
        <span className={cn('text-2xl font-semibold tracking-[-0.04em]', textColor)}>
          <AnimatedScore score={clampedScore} size="sm" />
        </span>
      </div>

      {summary && (
        <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
          {summary}
        </p>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}

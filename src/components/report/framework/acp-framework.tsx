'use client'

import { cn } from '@/lib/utils'
import type { StrengthLevel } from '@/components/strength-indicator'

interface ACPBarProps {
  label: string
  score: number
  maxScore?: number
  strength?: StrengthLevel
}

const strengthColors: Record<StrengthLevel, { bg: string; fill: string; text: string }> = {
  critical: { bg: 'bg-red-100', fill: 'bg-red-500', text: 'text-red-700' },
  weak: { bg: 'bg-amber-100', fill: 'bg-amber-500', text: 'text-amber-700' },
  neutral: { bg: 'bg-slate-100', fill: 'bg-slate-400', text: 'text-slate-700' },
  good: { bg: 'bg-emerald-100', fill: 'bg-emerald-500', text: 'text-emerald-700' },
  strong: { bg: 'bg-emerald-100', fill: 'bg-emerald-600', text: 'text-emerald-800' },
}

function getStrengthFromScore(score: number, max: number): StrengthLevel {
  const percentage = (score / max) * 100
  if (percentage >= 80) return 'strong'
  if (percentage >= 65) return 'good'
  if (percentage >= 50) return 'neutral'
  if (percentage >= 35) return 'weak'
  return 'critical'
}

function ACPBar({ label, score, maxScore = 10, strength }: ACPBarProps) {
  const clampedScore = Math.max(0, Math.min(maxScore, score))
  const resolvedStrength = strength ?? getStrengthFromScore(clampedScore, maxScore)
  const colors = strengthColors[resolvedStrength]
  const percentage = (clampedScore / maxScore) * 100

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className={cn('text-sm font-semibold', colors.text)}>
          {clampedScore.toFixed(1)}/{maxScore}
        </span>
      </div>
      <div className={cn('h-3 w-full rounded-full', colors.bg)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors.fill)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

interface ACPFrameworkProps {
  audience: number
  community: number
  product: number
  maxScore?: number
  showOverall?: boolean
  className?: string
}

export function ACPFramework({
  audience,
  community,
  product,
  maxScore = 10,
  showOverall = true,
  className,
}: ACPFrameworkProps) {
  const overall = (audience + community + product) / 3
  const overallStrength = getStrengthFromScore(overall, maxScore)
  const overallColors = strengthColors[overallStrength]

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <ACPBar label="Audience" score={audience} maxScore={maxScore} />
      <ACPBar label="Community" score={community} maxScore={maxScore} />
      <ACPBar label="Product" score={product} maxScore={maxScore} />

      {showOverall && (
        <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3">
          <span className="text-sm font-medium uppercase tracking-[0.18em] text-slate-600">
            Overall Score
          </span>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-2 w-16 rounded-full',
                overallColors.bg
              )}
            >
              <div
                className={cn('h-full rounded-full', overallColors.fill)}
                style={{ width: `${(overall / maxScore) * 100}%` }}
              />
            </div>
            <span className={cn('text-lg font-semibold', overallColors.text)}>
              {overall.toFixed(1)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export { getStrengthFromScore }

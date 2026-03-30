export type StrengthLevel = 'critical' | 'weak' | 'neutral' | 'good' | 'strong'

export function scoreToStrength(score: number): StrengthLevel {
  if (score >= 80) return 'strong'
  if (score >= 65) return 'good'
  if (score >= 50) return 'neutral'
  if (score >= 35) return 'weak'
  return 'critical'
}

export const strengthStyles: Record<StrengthLevel, string> = {
  critical: 'border-l-[3px] border-l-red-300 bg-red-50/30',
  weak: 'border-l-2 border-l-amber-300 bg-amber-50/30',
  neutral: 'border-l border-l-slate-300',
  good: 'border-l-2 border-l-emerald-300 bg-emerald-50/30',
  strong: 'border-l-[3px] border-l-emerald-400 bg-emerald-50/50',
}

import { cn } from '@/lib/utils'

type StrengthLevel = 'critical' | 'weak' | 'neutral' | 'good' | 'strong'

interface StrengthIndicatorProps {
  strength: StrengthLevel
  children: React.ReactNode
  className?: string
}

const strengthStyles: Record<StrengthLevel, string> = {
  critical: 'bg-red-50/50 border-l-[3px] border-red-200',
  weak: 'bg-amber-50/50 border-l-2 border-amber-200',
  neutral: 'bg-slate-50/50 border-l border-slate-200',
  good: 'bg-emerald-50/50 border-l-2 border-emerald-200',
  strong: 'bg-emerald-100/50 border-l-[3px] border-emerald-300',
}

export function StrengthIndicator({
  strength,
  children,
  className,
}: StrengthIndicatorProps) {
  return (
    <div
      className={cn(
        'rounded-r-md px-3 py-2 transition-colors duration-200',
        strengthStyles[strength],
        className
      )}
    >
      {children}
    </div>
  )
}

export type { StrengthLevel }

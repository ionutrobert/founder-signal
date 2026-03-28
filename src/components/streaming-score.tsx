import { cn } from '@/lib/utils'

const SCORE_RADIUS = 54
const SCORE_CIRCUMFERENCE = 2 * Math.PI * SCORE_RADIUS

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

interface StreamingScoreProps {
  value: number
  label?: string
  status?: string
  isStreaming?: boolean
  className?: string
}

export function StreamingScore({
  value,
  label = 'Live validation score',
  status,
  isStreaming = true,
  className
}: StreamingScoreProps) {
  const score = clampScore(value)
  const strokeDashoffset = SCORE_CIRCUMFERENCE - (score / 100) * SCORE_CIRCUMFERENCE

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="relative h-40 w-40">
        <svg aria-hidden="true" className="h-40 w-40 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={SCORE_RADIUS}
            fill="none"
            stroke="rgb(var(--border))"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={SCORE_RADIUS}
            fill="none"
            stroke="url(#streamingScoreGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={SCORE_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
          <defs>
            <linearGradient id="streamingScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(var(--primary))" />
              <stop offset="100%" stopColor="rgb(var(--aurora-indigo))" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-semibold tracking-[-0.04em] text-foreground">{score}</span>
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Score
          </span>
        </div>
      </div>

      <div className="space-y-1 text-center">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {status ? (
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span
              className={cn(
                'h-2 w-2 rounded-full bg-primary',
                isStreaming ? 'animate-pulse' : 'opacity-80'
              )}
            />
            <span>{status}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

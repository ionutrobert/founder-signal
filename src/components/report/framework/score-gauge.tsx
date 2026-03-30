'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type GaugeSize = 'sm' | 'md' | 'lg'

interface ScoreGaugeProps {
  score: number
  size?: GaugeSize
  label?: string
  showValue?: boolean
  className?: string
}

const sizeConfig: Record<GaugeSize, { dimensions: number; strokeWidth: number; fontSize: string; labelSize: string }> = {
  sm: { dimensions: 80, strokeWidth: 6, fontSize: 'text-lg', labelSize: 'text-[10px]' },
  md: { dimensions: 120, strokeWidth: 8, fontSize: 'text-2xl', labelSize: 'text-xs' },
  lg: { dimensions: 160, strokeWidth: 10, fontSize: 'text-4xl', labelSize: 'text-sm' },
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981'
  if (score >= 65) return '#34d399'
  if (score >= 50) return '#64748b'
  if (score >= 35) return '#f59e0b'
  return '#ef4444'
}

function getGradientId(): string {
  return `gauge-gradient-${Math.random().toString(36).slice(2, 9)}`
}

export function ScoreGauge({
  score,
  size = 'md',
  label,
  showValue = true,
  className,
}: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const config = sizeConfig[size]
  const radius = (config.dimensions - config.strokeWidth) / 2 - 4
  const circumference = 2 * Math.PI * radius
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)))
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference
  const gradientId = getGradientId()
  const color = getScoreColor(clampedScore)

  useEffect(() => {
    let animationFrameId: number
    const duration = 1000
    const startTime = performance.now()
    const startValue = 0
    const endValue = clampedScore

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValue + (endValue - startValue) * easeOut
      setAnimatedScore(currentValue)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate)
      }
    }

    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
  }, [clampedScore])

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div
        className="relative"
        style={{ width: config.dimensions, height: config.dimensions }}
      >
        <svg
          aria-hidden="true"
          className="-rotate-90"
          viewBox={`0 0 ${config.dimensions} ${config.dimensions}`}
          style={{ width: config.dimensions, height: config.dimensions }}
        >
          <circle
            cx={config.dimensions / 2}
            cy={config.dimensions / 2}
            r={radius}
            fill="none"
            stroke="rgb(226 232 240)"
            strokeWidth={config.strokeWidth}
          />
          <circle
            cx={config.dimensions / 2}
            cy={config.dimensions / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 150ms ease-out',
            }}
          />
          <defs>
            <linearGradient
              id={gradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color} stopOpacity="0.7" />
            </linearGradient>
          </defs>
        </svg>

        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={cn(
                'font-semibold tracking-[-0.04em] text-foreground',
                config.fontSize
              )}
            >
              {Math.round(animatedScore)}
            </span>
          </div>
        )}
      </div>

      {label && (
        <span
          className={cn(
            'font-medium uppercase tracking-[0.18em] text-muted-foreground',
            config.labelSize
          )}
        >
          {label}
        </span>
      )}
    </div>
  )
}

'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ValidationResult } from '@/types/validation'

interface QuickStatsProps {
  report: ValidationResult
}

type TrendDirection = 'up' | 'down' | 'stable'

interface MetricItem {
  label: string
  value: string | undefined
  trend?: TrendDirection
}

function TrendIcon({ trend }: { trend: TrendDirection }) {
  const iconClass = 'h-4 w-4'
  
  switch (trend) {
    case 'up':
      return <TrendingUp className={`${iconClass} text-emerald-500`} aria-hidden="true" />
    case 'down':
      return <TrendingDown className={`${iconClass} text-red-500`} aria-hidden="true" />
    case 'stable':
    default:
      return <Minus className={`${iconClass} text-slate-400`} aria-hidden="true" />
  }
}

function MetricRow({ label, value, trend }: MetricItem) {
  if (!value) return null

  return (
    <div className="py-2">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</span>
        {trend && <TrendIcon trend={trend} />}
      </div>
      <div className="mt-1">
        <span className="text-lg font-semibold tracking-[-0.04em] text-slate-900">{value}</span>
      </div>
    </div>
  )
}

function parseMarketValue(value: string | undefined): { amount: string; trend: TrendDirection } | null {
  if (!value) return null
  
  const trend: TrendDirection = value.includes('+') || value.includes('growth') ? 'up' 
    : value.includes('-') || value.includes('decline') ? 'down' 
    : 'stable'
  
  return { amount: value, trend }
}

export function QuickStats({ report }: QuickStatsProps) {
  const { marketInsight } = report
  
  const metrics: MetricItem[] = [
    { label: 'TAM', value: marketInsight.tam, trend: 'stable' },
    { label: 'SAM', value: marketInsight.sam, trend: 'stable' },
    { label: 'SOM', value: marketInsight.som, trend: 'stable' },
  ]
  
  const growthRate = marketInsight.growthSignals?.[0]
  const growthMetric = growthRate ? parseMarketValue(growthRate) : null

  return (
    <Card className="border-slate-200/80 bg-white shadow-[var(--shadow-soft)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-slate-900">Market Size</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {metrics.map((metric) => (
          <MetricRow key={metric.label} {...metric} />
        ))}
        
        {growthMetric && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Growth Signal</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900">
                  {growthMetric.amount}
                </span>
                <TrendIcon trend={growthMetric.trend} />
              </div>
            </div>
          </div>
        )}
        
        {marketInsight.trends && marketInsight.trends.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">
              Key Trends
            </p>
            <div className="space-y-1">
              {marketInsight.trends.slice(0, 3).map((trend) => (
                <p key={trend} className="text-sm text-slate-600">
                  {trend.replace(/^[-\u2022]\s*/, '')}
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

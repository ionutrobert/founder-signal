'use client'

import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { StrengthLevel } from '@/components/strength-indicator'

interface ScoreTooltipProps {
  score?: number
  reasoning?: string
  strength: StrengthLevel | null
}

const strengthLabels: Record<StrengthLevel, string> = {
  critical: 'Critical issues',
  weak: 'Needs improvement',
  neutral: 'Adequate',
  good: 'Strong',
  strong: 'Excellent',
}

export function ScoreTooltip({ score, reasoning, strength }: ScoreTooltipProps) {
  if (!score || !reasoning) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="ml-1.5 inline-flex items-center">
          <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs" side="top">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{score}/100</span>
              {strength && (
                <span className="text-xs text-slate-500">
                  {strengthLabels[strength]}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600">{reasoning}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

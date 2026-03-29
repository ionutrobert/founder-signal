'use client'

import { useMemo } from 'react'
import { CheckCircle2, LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ActivityMessage } from './activity-message'
import type { ValidationSectionName } from '@/types/validation'

interface SectionItemProps {
  name: ValidationSectionName
  title: string
  description: string
  isActive: boolean
  isComplete: boolean
  activityMessages: string[]
}

export function SectionItem({
  name,
  title,
  description,
  isActive,
  isComplete,
  activityMessages,
}: SectionItemProps) {
  const statusIcon = useMemo(() => {
    if (isComplete) {
      return <CheckCircle2 className="size-4 text-primary" />
    }
    if (isActive) {
      return <LoaderCircle className="size-4 animate-spin text-primary" />
    }
    return <div className="size-4 rounded-full border border-border bg-muted" />
  }, [isComplete, isActive])

  const renderedMessages = useMemo(() => 
    activityMessages.map((msg, idx) => (
      <ActivityMessage 
        key={`${name}-${msg.slice(0, 30)}`} 
        message={msg} 
        index={idx} 
      />
    )),
    [activityMessages, name]
  )

  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-300',
        isActive && 'border-primary/40 bg-primary/5',
        isComplete && 'border-primary/20 bg-primary/5',
        !isActive && !isComplete && 'border-border/50 bg-card opacity-60'
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="mt-0.5">{statusIcon}</div>
        <div className="flex-1">
          <p className={cn(
            'text-sm font-semibold',
            isComplete ? 'text-primary' : 'text-slate-900'
          )}>
            {title}
          </p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      {isActive && activityMessages.length > 0 && (
        <div className="space-y-2 border-t border-border/50 px-4 py-3">
          {renderedMessages}
        </div>
      )}
    </div>
  )
}

'use client'

import { cn } from '@/lib/utils'

interface ActivityMessageProps {
  message: string
  index: number
}

export function ActivityMessage({ message, index }: ActivityMessageProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 text-sm text-slate-600',
        'animate-in fade-in-0 slide-in-from-left-4 duration-300'
      )}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
    >
      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
      <span>{message}</span>
    </div>
  )
}

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Check, Loader2 } from 'lucide-react'

interface AnimatedListItem {
  id: string
  text: string
  status: 'active' | 'completed'
}

interface AnimatedListProps {
  items: AnimatedListItem[]
  className?: string
}

export function AnimatedList({ items, className }: AnimatedListProps) {
  // Show last 3 items
  const visibleItems = items.slice(-3)

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <AnimatePresence mode="popLayout">
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1
          
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ 
                opacity: isLast ? 1 : 0.6, 
                y: 0, 
                scale: 1,
              }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ 
                type: 'spring', 
                stiffness: 350, 
                damping: 25,
                opacity: { duration: 0.2 }
              }}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-4 py-3',
                item.status === 'active' 
                  ? 'border-slate-200 bg-white shadow-sm' 
                  : 'border-emerald-100 bg-emerald-50/50'
              )}
            >
              <div className="flex-shrink-0">
                {item.status === 'active' ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="h-5 w-5 text-slate-600" />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500"
                  >
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </div>
              <span 
                className={cn(
                  'flex-1 text-sm',
                  item.status === 'active' ? 'font-medium text-slate-900' : 'text-slate-600'
                )}
              >
                {item.text}
              </span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

interface ActivityMessage {
  id: string
  message: string
}

interface ActivityFeedProps {
  messages: ActivityMessage[]
  className?: string
}

export function ActivityFeed({ messages, className }: ActivityFeedProps) {
  // Convert messages to items with unique IDs
  const items: AnimatedListItem[] = messages.map((msg, index) => ({
    id: msg.id,
    text: msg.message,
    status: index === messages.length - 1 ? 'active' : 'completed',
  }))

  return <AnimatedList items={items} className={className} />
}

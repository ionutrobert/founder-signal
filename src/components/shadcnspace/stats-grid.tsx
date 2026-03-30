'use client'

import { useRef } from 'react'
import { useInView, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { NumberTicker } from '@/components/shadcnspace'

interface StatItem {
  value: number
  label: string
  prefix?: string
  suffix?: string
}

interface StatsGridProps {
  stats: StatItem[]
  className?: string
  columns?: 2 | 3 | 4
}

const columnStyles = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
}

export function StatsGrid({ stats, className, columns = 4 }: StatsGridProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <div ref={ref} className={cn('grid gap-6', columnStyles[columns], className)}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{
            duration: 0.5,
            delay: index * 0.1,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 p-6 shadow-[var(--shadow-soft)] backdrop-blur-sm"
        >
          <div className="flex items-baseline text-3xl font-bold tracking-[-0.04em] text-slate-900">
            {stat.prefix && <span className="text-2xl">{stat.prefix}</span>}
            <NumberTicker
              value={stat.value}
              duration={2}
              delay={index * 0.2}
              className="text-3xl font-bold text-slate-900"
            />
            {stat.suffix && <span className="text-2xl">{stat.suffix}</span>}
          </div>
          <p className="mt-2 text-sm text-slate-600">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  )
}

interface AnimatedCounterProps {
  value: number
  prefix?: string
  suffix?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeStyles = {
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-5xl',
}

export function AnimatedCounter({
  value,
  prefix,
  suffix,
  className,
  size = 'md',
}: AnimatedCounterProps) {
  return (
    <span className={cn('flex items-baseline', sizeStyles[size], className)}>
      {prefix && <span className="text-2xl">{prefix}</span>}
      <NumberTicker value={value} duration={1.5} className={sizeStyles[size]} />
      {suffix && <span className="text-2xl">{suffix}</span>}
    </span>
  )
}

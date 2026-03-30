'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView, useSpring, useTransform, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface NumberTickerProps {
  value: number
  direction?: 'up' | 'down'
  className?: string
  delay?: number
  duration?: number
  formatNumber?: (value: number) => string
}

export function NumberTicker({
  value,
  direction = 'up',
  className,
  delay = 0,
  duration = 1.5,
  formatNumber = (v) => Math.round(v).toLocaleString(),
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '0px' })
  const [hasAnimated, setHasAnimated] = useState(false)

  const spring = useSpring(0, {
    damping: 60,
    stiffness: 100,
    duration: duration * 1000,
  })

  const display = useTransform(spring, (current) => {
    return formatNumber(direction === 'up' ? current : value - current + (value % 1 === 0 ? 0 : value))
  })

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timeout = setTimeout(() => {
        spring.set(value)
        setHasAnimated(true)
      }, delay * 1000)
      return () => clearTimeout(timeout)
    }
  }, [isInView, value, delay, spring, hasAnimated])

  return (
    <motion.span ref={ref} className={cn('tabular-nums', className)}>
      {hasAnimated ? <motion.span>{display}</motion.span> : formatNumber(0)}
    </motion.span>
  )
}

interface AnimatedScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeStyles = {
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-5xl',
}

export function AnimatedScore({ score, size = 'md', className }: AnimatedScoreProps) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)))

  return (
    <NumberTicker
      value={clampedScore}
      className={cn('font-semibold tracking-[-0.04em]', sizeStyles[size], className)}
      duration={1.2}
    />
  )
}

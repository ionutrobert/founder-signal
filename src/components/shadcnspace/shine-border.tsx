'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ShineBorderProps {
  children: React.ReactNode
  className?: string
  borderRadius?: number | string
  shineColor?: string
  duration?: number
  as?: 'div' | 'span' | 'section'
}

export function ShineBorder({
  children,
  className,
  borderRadius = 12,
  shineColor = 'rgba(59, 130, 246, 0.5)',
  duration = 3,
  as: Component = 'div',
}: Omit<ShineBorderProps, 'borderWidth'>) {
  return (
    <Component className={cn('relative overflow-hidden p-[1px]', className)}>
      <div
        className="absolute inset-0"
        style={{
          borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, transparent, ${shineColor}, transparent)`,
          }}
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>
      <div
        className="relative z-10 h-full w-full"
        style={{
          borderRadius: typeof borderRadius === 'number' ? `${borderRadius - 1}px` : `calc(${borderRadius} - 1px)`,
        }}
      >
        {children}
      </div>
    </Component>
  )
}

interface GlowingCardProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
  borderColor?: string
}

const glowColors = {
  blue: 'rgba(59, 130, 246, 0.15)',
  emerald: 'rgba(16, 185, 129, 0.15)',
  amber: 'rgba(245, 158, 11, 0.15)',
  red: 'rgba(239, 68, 68, 0.15)',
  purple: 'rgba(139, 92, 246, 0.15)',
}

export function GlowingCard({
  children,
  className,
  glowColor = 'emerald',
  borderColor,
}: GlowingCardProps) {
  const resolvedGlowColor = glowColors[glowColor as keyof typeof glowColors] || glowColor

  return (
    <ShineBorder
      borderRadius={12}
      shineColor={borderColor || resolvedGlowColor.replace('0.15', '0.5')}
      duration={4}
      className={className}
    >
      <div
        className="h-full w-full rounded-xl border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-soft)]"
        style={{
          boxShadow: `0 0 20px ${resolvedGlowColor}, 0 0 40px ${resolvedGlowColor}`,
        }}
      >
        {children}
      </div>
    </ShineBorder>
  )
}

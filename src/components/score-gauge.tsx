'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import confetti from 'canvas-confetti'

interface ScoreGaugeProps {
  score: number
  size?: number
  duration?: number
}

export function ScoreGauge({ score, size = 200, duration = 2000 }: ScoreGaugeProps) {
  const [isAnimating, setIsAnimating] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const triggerConfetti = useCallback(() => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const y = (rect.top + rect.height / 2) / window.innerHeight
    
    // Left side confetti
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { x: 0, y: y },
      angle: 45,
      colors: ['#E7EB5D', '#22c55e', '#eab308'],
    })
    
    // Right side confetti
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { x: 1, y: y },
      angle: 135,
      colors: ['#E7EB5D', '#22c55e', '#eab308'],
    })
  }, [])

  const springScore = useSpring(0, {
    stiffness: 50,
    damping: 20,
    duration: duration,
  })

  const displayScore = useTransform(springScore, (latest) => Math.round(latest))
  const [currentScore, setCurrentScore] = useState(0)

  useEffect(() => {
    const unsubscribe = displayScore.on('change', (latest) => {
      setCurrentScore(latest)
      if (latest >= 90 && !showConfetti && score >= 90) {
        setShowConfetti(true)
        triggerConfetti()
      }
    })
    return unsubscribe
  }, [displayScore, showConfetti, score, triggerConfetti])

  useEffect(() => {
    const timer = setTimeout(() => {
      springScore.set(score)
      setIsAnimating(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [score, springScore])

  const getScoreColor = (value: number): string => {
    if (value < 50) return '#ef4444' // red
    if (value < 90) return '#eab308' // yellow
    return '#22c55e' // green
  }

  const circumference = 2 * Math.PI * 80
  const strokeDashoffset = circumference - (currentScore / 100) * circumference

  return (
    <div ref={containerRef} className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 200 200" className="transform -rotate-90" aria-label={`Validation score: ${currentScore} out of 100`}>
        <title>Validation Score Gauge</title>
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
        />
        {/* Progress circle */}
        <motion.circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke={getScoreColor(currentScore)}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: duration / 1000, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className="text-5xl font-bold text-slate-900"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {currentScore}
        </motion.span>
        {isAnimating && (
          <span className="text-sm text-slate-500 mt-1">Calculating...</span>
        )}
      </div>
      {/* Score range indicators */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-slate-500">0-49</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-slate-500">50-89</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-slate-500">90+</span>
        </div>
      </div>
    </div>
  )
}

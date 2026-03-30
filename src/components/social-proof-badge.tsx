'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

interface SocialProofBadgeProps {
  rating?: number
  reviewCount?: string
}

export function SocialProofBadge({ 
  rating = 4.9,
  reviewCount = '500+'
}: SocialProofBadgeProps) {
  const avatars = [
    { color: '#3b82f6', initial: 'J' },
    { color: '#8b5cf6', initial: 'L' },
    { color: '#10b981', initial: 'A' },
    { color: '#f59e0b', initial: 'M' },
  ]

  return (
    <motion.div 
      className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* Overlapping avatars */}
      <div className="flex -space-x-2">
        {avatars.map((avatar, index) => (
          <motion.div
            key={avatar.initial}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
            style={{ backgroundColor: avatar.color }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            {avatar.initial}
          </motion.div>
        ))}
      </div>
      
      {/* Rating and reviews */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-semibold text-slate-900">{rating}/5</span>
        </div>
        <span className="text-sm text-slate-500">Rating</span>
        <span className="text-slate-300">|</span>
        <span className="text-sm font-semibold text-slate-900">{reviewCount}</span>
        <span className="text-sm text-slate-500">Reviews</span>
      </div>
    </motion.div>
  )
}

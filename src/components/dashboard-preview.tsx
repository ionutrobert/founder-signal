'use client'

import { motion } from 'framer-motion'
import { Check, Target, Users, TrendingUp, Zap } from 'lucide-react'
import { ScoreGauge } from './score-gauge'

const sections = [
  { name: 'Problem', score: 85, icon: Target, color: 'bg-emerald-500' },
  { name: 'Audience', score: 92, icon: Users, color: 'bg-emerald-500' },
  { name: 'Market', score: 78, icon: TrendingUp, color: 'bg-amber-500' },
  { name: 'Position', score: 88, icon: Zap, color: 'bg-emerald-500' },
]

export function DashboardPreview() {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white max-w-md mx-auto">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-100/70 via-blue-100/50 to-lime-100/70" />
      
      {/* Content */}
      <div className="relative p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Validation Report</h3>
            <p className="text-sm text-slate-500">Analysis complete</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
            <Check className="w-4 h-4" />
            Strong
          </div>
        </div>
        
        {/* Score */}
        <div className="flex justify-center">
          <ScoreGauge score={87} size={140} duration={2500} />
        </div>
        
        {/* Section Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {sections.map((section, i) => {
            const Icon = section.icon
            return (
              <motion.div
                key={section.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-100"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-2 h-2 rounded-full ${section.color}`} />
                  <span className="text-xs font-medium text-slate-600">{section.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span className="text-lg font-bold text-slate-900">{section.score}</span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Additional preview sections */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="space-y-2"
        >
          <div className="p-3 rounded-xl bg-white/60 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Problem Clarity</span>
              <span className="text-sm font-semibold text-emerald-600">85</span>
            </div>
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full w-[85%] bg-emerald-500 rounded-full" />
            </div>
          </div>
          
          <div className="p-3 rounded-xl bg-white/60 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Market Timing</span>
              <span className="text-sm font-semibold text-amber-600">78</span>
            </div>
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full w-[78%] bg-amber-500 rounded-full" />
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />
    </div>
  )
}

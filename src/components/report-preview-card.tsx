'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Check, TrendingUp, Users, Target, Zap } from 'lucide-react'
import { ScoreGauge } from './score-gauge'

const reportSections = [
  { 
    name: 'Problem Clarity', 
    score: 85, 
    icon: Target,
    color: 'bg-emerald-500'
  },
  { 
    name: 'Target Audience', 
    score: 92, 
    icon: Users,
    color: 'bg-emerald-500'
  },
  { 
    name: 'Market Insight', 
    score: 78, 
    icon: TrendingUp,
    color: 'bg-amber-500'
  },
  { 
    name: 'Positioning', 
    score: 88, 
    icon: Zap,
    color: 'bg-emerald-500'
  },
]

export function ReportPreviewCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <Card className="border-slate-200 bg-white shadow-2xl p-6 md:p-8 w-full max-w-lg mx-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Validation Report</h3>
            <p className="text-sm text-slate-500">AI-powered analysis complete</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
            <Check className="w-4 h-4" />
            Strong
          </div>
        </div>

        {/* Score Section */}
        <div className="flex flex-col items-center mb-8">
          <ScoreGauge score={87} size={180} duration={2500} />
        </div>

        {/* Section Cards Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {reportSections.map((section, index) => {
            const Icon = section.icon
            const isGood = section.score >= 80
            const isMedium = section.score >= 60 && section.score < 80
            
            return (
              <motion.div
                key={section.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isGood ? 'bg-emerald-100 text-emerald-600' : 
                    isMedium ? 'bg-amber-100 text-amber-600' : 
                    'bg-red-100 text-red-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-sm font-semibold ${
                    isGood ? 'text-emerald-600' : 
                    isMedium ? 'text-amber-600' : 
                    'text-red-600'
                  }`}>
                    {section.score}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-700 leading-tight">
                  {section.name}
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* Verdict Section */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Overall Verdict</p>
              <p className="text-xs text-slate-500">Based on 11 validation dimensions</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-semibold text-emerald-600">Proceed</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Decorative blur effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-[#E7EB5D]/20 via-purple-500/10 to-blue-500/20 blur-2xl -z-10 rounded-3xl" />
    </motion.div>
  )
}

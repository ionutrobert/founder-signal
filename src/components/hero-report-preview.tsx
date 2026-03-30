"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NumberTicker } from "@/components/shadcnspace/number-ticker"
import { cn } from "@/lib/utils"

const sections = [
  { name: "Problem", score: 85 },
  { name: "Market", score: 68 },
  { name: "Competition", score: 45 },
  { name: "Positioning", score: 72 },
]

const overallScore = 72

function CircularProgress({ score, size = 120, strokeWidth = 8 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference

  const getStrokeColor = (s: number) => {
    if (s >= 80) return "#059669"
    if (s >= 65) return "#10b981"
    if (s >= 50) return "#f59e0b"
    if (s >= 35) return "#f97316"
    return "#ef4444"
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size} aria-hidden="true">
        <circle
          className="text-slate-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
          strokeLinecap="round"
          stroke={getStrokeColor(score)}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold text-slate-900")}>
          <NumberTicker value={score} duration={1.2} />
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          STRONG
        </span>
      </div>
    </div>
  )
}

function AnimatedProgressBar({ score, label, delay }: { score: number; label: string; delay: number }) {
  const getBarColor = (s: number) => {
    if (s >= 80) return "from-emerald-500 to-emerald-400"
    if (s >= 65) return "from-emerald-400 to-teal-400"
    if (s >= 50) return "from-amber-500 to-amber-400"
    if (s >= 35) return "from-orange-500 to-amber-500"
    return "from-red-500 to-orange-500"
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 text-slate-600">{label}</span>
      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", getBarColor(score))}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay, ease: "easeOut" }}
        />
      </div>
      <span className="w-8 text-right font-medium tabular-nums text-slate-700">
        <NumberTicker value={score} duration={0.8} delay={delay} />
      </span>
    </div>
  )
}

export default function HeroReportPreview() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Card className="relative w-full max-w-sm overflow-hidden bg-white border border-slate-200 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-[#E7EB5D]/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-lg font-semibold text-slate-900">Validation Report</CardTitle>
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Overall Score</p>
          {mounted && <CircularProgress score={overallScore} />}
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        <div className="space-y-3">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-3">Sections</p>
          {sections.map((section, index) => (
            <AnimatedProgressBar
              key={section.name}
              label={section.name}
              score={section.score}
              delay={0.2 + index * 0.1}
            />
          ))}
        </div>

        <div className="pt-2">
          <button type="button" className="w-full py-2.5 px-4 rounded-lg bg-[#E7EB5D] text-slate-900 text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#D4D854] transition-colors duration-200">
            View Full Report
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

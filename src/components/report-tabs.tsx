'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

type TabType = 'technical' | 'simplified'

interface ReportTabsProps {
  defaultTab?: TabType
  technicalContent: React.ReactNode
  simplifiedContent: React.ReactNode
}

export function ReportTabs({
  defaultTab = 'technical',
  technicalContent,
  simplifiedContent,
}: ReportTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab)

  return (
    <div className="space-y-6">
      <div className="flex gap-2 rounded-lg border border-slate-200/80 bg-slate-50/50 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('technical')}
          className={cn(
            'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 min-h-11',
            activeTab === 'technical'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          Technical
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('simplified')}
          className={cn(
            'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 min-h-11',
            activeTab === 'simplified'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          Summary
        </button>
      </div>

      <div className="animate-in fade-in-0 duration-200">
        {activeTab === 'technical' ? technicalContent : simplifiedContent}
      </div>
    </div>
  )
}

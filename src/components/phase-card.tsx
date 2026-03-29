'use client'

import { useMemo } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight, LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionItem } from './section-item'
import type { ValidationSectionName, ValidationSections } from '@/types/validation'

const sectionMeta: Array<{
  name: ValidationSectionName
  title: string
  description: string
}> = [
  { name: 'ideaSummary', title: 'Idea summary', description: 'Core framing and traction evidence' },
  { name: 'problemClarity', title: 'Problem clarity', description: 'How sharply pain is defined' },
  { name: 'targetAudience', title: 'Target audience', description: 'ICP and personas' },
  { name: 'marketInsight', title: 'Market insight', description: 'Sizing and demand signals' },
  { name: 'competition', title: 'Competition', description: 'Market alternatives' },
  { name: 'positioning', title: 'Positioning', description: 'UVP and differentiators' },
  { name: 'mvpScope', title: 'MVP scope', description: 'What to ship first' },
  { name: 'monetization', title: 'Monetization', description: 'Revenue model' },
  { name: 'risks', title: 'Risks', description: 'Constraints and blockers' },
]

interface PhaseCardProps {
  phase: 'RESEARCH' | 'STRUCTURAL' | 'STRATEGIC'
  phaseLabel: string
  status: 'waiting' | 'active' | 'complete'
  sections: Partial<ValidationSections>
  activeSection: ValidationSectionName | null
  activityMessages: string[]
}

export function PhaseCard({
  phase,
  phaseLabel,
  status,
  sections,
  activeSection,
  activityMessages,
}: PhaseCardProps) {
  const phaseSections = useMemo(() => {
    if (phase === 'RESEARCH') return []
    if (phase === 'STRUCTURAL') {
      return sectionMeta.filter(s =>
        ['problemClarity', 'targetAudience', 'marketInsight', 'monetization', 'risks'].includes(s.name)
      )
    }
    return sectionMeta.filter(s =>
      ['ideaSummary', 'competition', 'positioning', 'mvpScope'].includes(s.name)
    )
  }, [phase])

  const statusIcon = useMemo(() => {
    if (status === 'complete') {
      return <CheckCircle2 className="size-5 text-primary" />
    }
    if (status === 'active') {
      return <LoaderCircle className="size-5 animate-spin text-primary" />
    }
    return <div className="size-5 rounded-full border-2 border-border bg-muted" />
  }, [status])

  const isExpanded = status === 'active'

  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-300',
        status === 'active' && 'border-primary/30 bg-primary/5',
        status === 'complete' && 'border-primary/20',
        status === 'waiting' && 'border-border/50 opacity-60'
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {statusIcon}
        <div className="flex-1">
          <p className={cn(
            'text-sm font-semibold',
            status === 'complete' && 'text-primary',
            status === 'active' && 'text-primary'
          )}>
            Phase: {phaseLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            {status === 'waiting' && 'Waiting...'}
            {status === 'active' && 'Processing...'}
            {status === 'complete' && 'Complete'}
          </p>
        </div>
        {isExpanded ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
      </div>

      {isExpanded && phaseSections.length > 0 && (
        <div className="space-y-2 border-t border-border/50 p-3">
          {phaseSections.map((section) => (
            <SectionItem
              key={section.name}
              name={section.name}
              title={section.title}
              description={section.description}
              isActive={activeSection === section.name}
              isComplete={!!sections[section.name]}
              activityMessages={activeSection === section.name ? activityMessages : []}
            />
          ))}
        </div>
      )}
    </div>
  )
}

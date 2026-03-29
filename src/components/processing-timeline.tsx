'use client'

import { useMemo } from 'react'
import { PhaseCard } from './phase-card'
import type { ValidationSections, ValidationSectionName } from '@/types/validation'

type PhaseState = 'waiting' | 'active' | 'complete'
type CurrentPhase = 'research' | 'structural' | 'strategic' | 'complete'

interface ProcessingTimelineProps {
  currentPhase: CurrentPhase
  sections: Partial<ValidationSections>
  activeSection: ValidationSectionName | null
  activityMessages: string[]
}

function getResearchStatus(phase: CurrentPhase): PhaseState {
  if (phase === 'research') return 'active'
  return 'complete'
}

function getStructuralStatus(phase: CurrentPhase): PhaseState {
  if (phase === 'structural') return 'active'
  if (phase === 'strategic' || phase === 'complete') return 'complete'
  return 'waiting'
}

function getStrategicStatus(phase: CurrentPhase): PhaseState {
  if (phase === 'strategic') return 'active'
  if (phase === 'complete') return 'complete'
  return 'waiting'
}

export function ProcessingTimeline({
  currentPhase,
  sections,
  activeSection,
  activityMessages,
}: ProcessingTimelineProps) {
  const researchStatus = useMemo(() => getResearchStatus(currentPhase), [currentPhase])
  const structuralStatus = useMemo(() => getStructuralStatus(currentPhase), [currentPhase])
  const strategicStatus = useMemo(() => getStrategicStatus(currentPhase), [currentPhase])

  return (
    <div className="space-y-3">
      <PhaseCard
        phase="RESEARCH"
        phaseLabel="Research"
        status={researchStatus}
        sections={sections}
        activeSection={null}
        activityMessages={currentPhase === 'research' ? activityMessages : []}
      />
      <PhaseCard
        phase="STRUCTURAL"
        phaseLabel="Structural"
        status={structuralStatus}
        sections={sections}
        activeSection={activeSection}
        activityMessages={currentPhase === 'structural' ? activityMessages : []}
      />
      <PhaseCard
        phase="STRATEGIC"
        phaseLabel="Strategic"
        status={strategicStatus}
        sections={sections}
        activeSection={activeSection}
        activityMessages={currentPhase === 'strategic' ? activityMessages : []}
      />
    </div>
  )
}

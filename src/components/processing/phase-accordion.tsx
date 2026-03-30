'use client'

import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, Circle, ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type CurrentPhase = 'research' | 'structural' | 'strategic' | 'complete'

interface SubPhase {
  id: string
  title: string
  status: 'completed' | 'active' | 'pending'
}

interface PhaseData {
  id: string
  title: string
  status: 'completed' | 'active' | 'pending'
  subPhases: SubPhase[]
}

interface PhaseAccordionProps {
  currentPhase: CurrentPhase
  activityMessages: string[]
}

const phaseConfig: Record<string, { title: string; subPhases: string[] }> = {
  research: {
    title: 'Phase 1: Research',
    subPhases: ['Market Analysis', 'Problem Definition', 'Initial Validation'],
  },
  structural: {
    title: 'Phase 2: Structural',
    subPhases: ['Audience Segmentation', 'Competition Analysis', 'Positioning Strategy', 'MVP Scope Definition'],
  },
  strategic: {
    title: 'Phase 3: Strategic',
    subPhases: ['Revenue Model', 'Risk Assessment', 'Go-to-Market', 'Final Synthesis'],
  },
}

function getPhaseStatus(phaseId: string, currentPhase: CurrentPhase): 'completed' | 'active' | 'pending' {
  const order = ['research', 'structural', 'strategic']
  const currentIndex = order.indexOf(currentPhase)
  const phaseIndex = order.indexOf(phaseId)

  if (phaseIndex < currentIndex || currentPhase === 'complete') return 'completed'
  if (phaseIndex === currentIndex) return 'active'
  return 'pending'
}

function getSubPhaseStatus(
  subPhaseIndex: number,
  phaseStatus: 'completed' | 'active' | 'pending',
  totalSubPhases: number
): 'completed' | 'active' | 'pending' {
  if (phaseStatus === 'completed') return 'completed'
  if (phaseStatus === 'pending') return 'pending'
  const activeIndex = Math.floor(totalSubPhases * 0.3)
  if (subPhaseIndex < activeIndex) return 'completed'
  if (subPhaseIndex === activeIndex) return 'active'
  return 'pending'
}

const springTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
}

function StatusIcon({ status, size = 16 }: { status: 'completed' | 'active' | 'pending'; size?: number }) {
  if (status === 'completed') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={springTransition}
        className="flex items-center justify-center rounded-full bg-slate-900 p-0.5"
      >
        <Check className="text-white" style={{ width: size, height: size }} strokeWidth={2.5} />
      </motion.div>
    )
  }
  if (status === 'active') {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="flex items-center justify-center"
      >
        <Loader2 className="text-[#E7EB5D]" style={{ width: size + 2, height: size + 2 }} strokeWidth={2.5} />
      </motion.div>
    )
  }
  return (
    <Circle
      className="text-slate-300"
      style={{ width: size, height: size }}
      strokeWidth={2}
      fill="none"
    />
  )
}

function ActivityMessage({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-2 text-sm text-slate-600"
    >
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E7EB5D]" />
      <span className="leading-relaxed">{message}</span>
    </motion.div>
  )
}

function PhaseHeader({
  phase,
  isExpanded,
  onToggle,
}: {
  phase: PhaseData
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      type="button"
      className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50"
    >
      <motion.div
        animate={{ rotate: isExpanded ? 0 : -90 }}
        transition={springTransition}
        className="flex-shrink-0"
      >
        <ChevronDown className="size-4 text-slate-400" />
      </motion.div>
      <StatusIcon status={phase.status} size={18} />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-semibold truncate',
            phase.status === 'completed' && 'text-slate-900',
            phase.status === 'active' && 'text-slate-900',
            phase.status === 'pending' && 'text-slate-500'
          )}
        >
          {phase.title}
        </p>
        <p className="text-xs text-slate-500">
          {phase.status === 'completed' && 'Completed'}
          {phase.status === 'active' && 'Processing...'}
          {phase.status === 'pending' && 'Waiting...'}
        </p>
      </div>
    </button>
  )
}

function SubPhaseList({
  subPhases,
  activityMessages,
  isActive,
}: {
  subPhases: SubPhase[]
  activityMessages: string[]
  isActive: boolean
}) {
  return (
    <motion.div
      initial={false}
      animate={{
        height: 'auto',
        opacity: 1,
      }}
      exit={{ height: 0, opacity: 0 }}
      transition={springTransition}
      className="overflow-hidden"
    >
      <div className="border-t border-slate-100 px-5 py-3 space-y-2">
        <AnimatePresence mode="popLayout">
          {subPhases.map((subPhase, idx) => (
            <motion.div
              key={subPhase.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: idx * 0.05, ...springTransition }}
              className="flex items-center gap-3 py-1"
            >
              <StatusIcon status={subPhase.status} size={14} />
              <span
                className={cn(
                  'text-sm',
                  subPhase.status === 'completed' && 'text-slate-700',
                  subPhase.status === 'active' && 'text-slate-900 font-medium',
                  subPhase.status === 'pending' && 'text-slate-400'
                )}
              >
                {subPhase.title}
              </span>
              {subPhase.status === 'active' && (
                <span className="text-xs text-slate-400 animate-pulse">...</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isActive && activityMessages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-3 pt-3 border-t border-slate-100"
          >
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              <AnimatePresence mode="popLayout">
              {activityMessages.slice(-5).map((msg) => (
                <ActivityMessage key={msg} message={msg} />
              ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

function PhaseAccordionItem({
  phase,
  isExpanded,
  onToggle,
  activityMessages,
}: {
  phase: PhaseData
  isExpanded: boolean
  onToggle: () => void
  activityMessages: string[]
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
    >
      <Card
        className={cn(
          'overflow-hidden transition-shadow duration-300 bg-white border border-slate-200',
          phase.status === 'active' && 'shadow-md',
          phase.status === 'pending' && 'opacity-60'
        )}
      >
        <PhaseHeader phase={phase} isExpanded={isExpanded} onToggle={onToggle} />
        <AnimatePresence initial={false}>
          {isExpanded && (
            <SubPhaseList
              subPhases={phase.subPhases}
              activityMessages={activityMessages}
              isActive={phase.status === 'active'}
            />
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

function buildPhaseData(currentPhase: CurrentPhase): PhaseData[] {
  const phases: PhaseData[] = []

  for (const [phaseId, config] of Object.entries(phaseConfig)) {
    const phaseStatus = getPhaseStatus(phaseId, currentPhase)
    const subPhases: SubPhase[] = config.subPhases.map((title, index) => ({
      id: `${phaseId}-${index}`,
      title,
      status: getSubPhaseStatus(index, phaseStatus, config.subPhases.length),
    }))

    phases.push({
      id: phaseId,
      title: config.title,
      status: phaseStatus,
      subPhases,
    })
  }

  return phases
}

export default function PhaseAccordion({
  currentPhase,
  activityMessages,
}: PhaseAccordionProps) {
  const phases = useMemo(() => buildPhaseData(currentPhase), [currentPhase])
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())

  useEffect(() => {
    setExpandedPhases((prev) => {
      const next = new Set(prev)
      phases.forEach((phase) => {
        if (phase.status === 'active') {
          next.add(phase.id)
        } else if (phase.status === 'completed' && prev.has(phase.id)) {
          next.add(phase.id)
        }
      })
      return next
    })
  }, [phases])

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(phaseId)) {
        next.delete(phaseId)
      } else {
        next.add(phaseId)
      }
      return next
    })
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {phases.map((phase) => (
          <PhaseAccordionItem
            key={phase.id}
            phase={phase}
            isExpanded={expandedPhases.has(phase.id)}
            onToggle={() => togglePhase(phase.id)}
            activityMessages={phase.status === 'active' ? activityMessages : []}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

export { PhaseAccordion }

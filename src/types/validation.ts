export interface IdeaSummary {
  title: string
  oneLiner: string
  category: string
  problemTheme: string
  tractionEvidence: string[]
  summary?: string
  score?: number
  scoreReasoning?: string
}

export interface WhyNow {
  timing: string
  marketForces: string[]
  enablingTechnology: string[]
  culturalShift: string[]
  summary?: string
  score?: number
  scoreReasoning?: string
}

export interface ProblemClarity {
  problemStatement: string
  severity: 'critical' | 'moderate' | 'low'
  affectedUsers: string
  evidence: string[]
  confidenceLevel: string
  summary?: string
  score?: number
  scoreReasoning?: string
}

export interface PersonaProfile {
  name: string
  description: string
  painPoints: string[]
  goals: string[]
}

export interface TargetAudience {
  icp: string
  keySegments: string[]
  personas: PersonaProfile[]
  summary?: string
  score?: number
  scoreReasoning?: string
}

export interface MarketInsight {
  tam: string
  sam: string
  som: string
  trends: string[]
  growthSignals: string[]
  marketGrowthRate?: string
  marketMaturity?: 'emerging' | 'growing' | 'mature' | 'declining'
  keyMetrics?: { name: string; value: string; trend: 'up' | 'down' | 'stable' }[]
  summary?: string
  score?: number
  scoreReasoning?: string
}

export interface CompetitorProfile {
  name: string
  strengths: string[]
  weaknesses: string[]
  positioningNotes: string
}

export interface Competition {
  directCompetitors: CompetitorProfile[]
  indirectCompetitors: CompetitorProfile[]
  competitiveAdvantage: string
  marketShareEstimate?: string
  competitiveIntensity?: 'low' | 'medium' | 'high'
  summary?: string
  score?: number
  scoreReasoning?: string
}

export interface Positioning {
  uniqueValueProposition: string
  differentiators: string[]
  messagingPillars: string[]
  brandPromise: string
  summary?: string
  score?: number
  scoreReasoning?: string
}

export interface MVPScope {
  coreFeatures: string[]
  timeline: string
  successMetrics: string[]
  resourceNeeds: string[]
  deferredCapabilities: string[]
  summary?: string
  score?: number
  scoreReasoning?: string
}

export interface Monetization {
  revenueModel: string
  pricingStrategy: string
  salesChannels: string[]
  projections: string
  keyAssumptions: string[]
  summary?: string
  score?: number
  scoreReasoning?: string
}

export interface Risks {
  technical: string[]
  market: string[]
  operational: string[]
  regulatory: string[]
  summary?: string
  score?: number
  scoreReasoning?: string
}

export type Score = number

export type Verdict = 'pass' | 'fail' | 'needs-work'

export interface ValidationReport {
  ideaSummary: IdeaSummary
  whyNow: WhyNow
  problemClarity: ProblemClarity
  targetAudience: TargetAudience
  marketInsight: MarketInsight
  competition: Competition
  positioning: Positioning
  mvpScope: MVPScope
  monetization: Monetization
  risks: Risks
  score: Score
  verdict: Verdict
}

export const validationSectionOrder = [
  'ideaSummary',
  'whyNow',
  'problemClarity',
  'targetAudience',
  'marketInsight',
  'competition',
  'positioning',
  'mvpScope',
  'monetization',
  'risks'
] as const

export type ValidationSectionName = (typeof validationSectionOrder)[number]

export type ValidationSections = Pick<ValidationReport, ValidationSectionName>

type StreamSectionEvent = {
  [K in ValidationSectionName]: {
    type: 'section'
    name: K
    data: ValidationReport[K]
  }
}[ValidationSectionName]

export type StreamAnalyzeEvent =
  | {
      type: 'status'
      stage: 'connecting' | 'streaming' | 'assembling' | 'complete'
      message: string
    }
  | {
      type: 'score'
      value: number
    }
  | StreamSectionEvent
  | {
      type: 'complete'
      data: ValidationReport
      resultId?: string
    }
  | {
      type: 'error'
      message: string
      recoverable?: boolean
    }
  | {
      type: 'activity'
      phase: string
      section?: string
      message: string
    }
  | {
      type: 'phase'
      phase: 'RESEARCH' | 'STRUCTURAL' | 'STRATEGIC'
      status: 'starting' | 'active' | 'complete'
    }
  | {
      type: 'sectionScore'
      section: string
      score: number
    }

export interface APIError {
  code: string
  message: string
  details: string[]
}

interface APIResponseSuccess<T> {
  success: true
  data: T
}

interface APIResponseFailure {
  success: false
  error: APIError
}

export type APIResponse<T> = APIResponseSuccess<T> | APIResponseFailure

export enum ValidationPhase {
  RESEARCH = 'RESEARCH',
  STRUCTURAL = 'STRUCTURAL',
  STRATEGIC = 'STRATEGIC',
}

export interface PartialFailure {
  phase: ValidationPhase
  section: string
  error: string
  recovered: boolean
}

export interface SectionScore {
  section: string
  score: number
  weight: number
}

export interface PhaseResult {
  phase: ValidationPhase
  completed: boolean
  duration: number
  modelUsed: string
  sectionScores: SectionScore[]
  failures: PartialFailure[]
}

export interface ValidationResult extends ValidationReport {
  phases?: PhaseResult[]
  partialFailures?: PartialFailure[]
}

export interface ValidationRequest {
  idea: string
  enablePhases?: boolean
  maxRetries?: number
}

export interface ValidationResponse {
  result: ValidationResult
  metadata: {
    duration: number
    model: string
    phases: PhaseResult[]
    partialFailures: PartialFailure[]
  }
}

export function isValidationResult(obj: unknown): obj is ValidationResult {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }

  const result = obj as Partial<ValidationResult>

  return (
    typeof result.score === 'number' &&
    (result.verdict === 'pass' || result.verdict === 'fail' || result.verdict === 'needs-work') &&
    typeof result.ideaSummary === 'object' &&
    result.ideaSummary !== null
  )
}

export function isPartialFailure(obj: unknown): obj is PartialFailure {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }

  const failure = obj as Partial<PartialFailure>

  return (
    (failure.phase === ValidationPhase.RESEARCH ||
     failure.phase === ValidationPhase.STRUCTURAL ||
     failure.phase === ValidationPhase.STRATEGIC) &&
    typeof failure.section === 'string' &&
    typeof failure.error === 'string' &&
    typeof failure.recovered === 'boolean'
  )
}

export function calculateOverallScore(sectionScores: SectionScore[]): number {
  if (sectionScores.length === 0) {
    return 0
  }

  const totalWeight = sectionScores.reduce((sum, section) => sum + section.weight, 0)
  const weightedSum = sectionScores.reduce(
    (sum, section) => sum + section.score * section.weight,
    0
  )

  return Math.round(weightedSum / totalWeight)
}

export function determineVerdict(score: number): 'pass' | 'fail' | 'needs-work' {
  if (score >= 80) {
    return 'pass'
  }
  if (score >= 60) {
    return 'needs-work'
  }
  return 'fail'
}

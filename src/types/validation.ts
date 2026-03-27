export interface IdeaSummary {
  title: string
  oneLiner: string
  category: string
  problemTheme: string
  tractionEvidence: string[]
}

export interface ProblemClarity {
  problemStatement: string
  severity: 'critical' | 'moderate' | 'low'
  affectedUsers: string
  evidence: string[]
  confidenceLevel: string
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
}

export interface MarketInsight {
  tam: string
  sam: string
  som: string
  trends: string[]
  growthSignals: string[]
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
}

export interface Positioning {
  uniqueValueProposition: string
  differentiators: string[]
  messagingPillars: string[]
  brandPromise: string
}

export interface MVPScope {
  coreFeatures: string[]
  timeline: string
  successMetrics: string[]
  resourceNeeds: string[]
  deferredCapabilities: string[]
}

export interface Monetization {
  revenueModel: string
  pricingStrategy: string
  salesChannels: string[]
  projections: string
  keyAssumptions: string[]
}

export interface Risks {
  technical: string[]
  market: string[]
  operational: string[]
  regulatory: string[]
}

export type Score = number

export type Verdict = 'pass' | 'fail' | 'needs-work'

export interface ValidationReport {
  ideaSummary: IdeaSummary
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

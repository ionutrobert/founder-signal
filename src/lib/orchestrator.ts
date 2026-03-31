/**
 * Section weights that sum to 1.0 across ALL validation sections
 * These determine how each section contributes to the overall score
 */
const SECTION_WEIGHTS: Record<string, number> = {
  ideaSummary: 0.13,
  whyNow: 0.08,
  problemClarity: 0.10,
  targetAudience: 0.10,
  marketInsight: 0.10,
  competition: 0.15,
  positioning: 0.10,
  mvpScope: 0.12,
  monetization: 0.05,
  risks: 0.07,
}

function calculateScoreFromVerdict(verdict: 'pass' | 'fail' | 'needs-work'): number {
  switch (verdict) {
    case 'pass':
      return 85
    case 'needs-work':
      return 70
    case 'fail':
      return 40
  }
}

function extractSectionScoresFromData(
  data: Record<string, unknown>,
  weights: Record<string, number>
): SectionScore[] {
  const scores: SectionScore[] = []
  for (const [section, weight] of Object.entries(weights)) {
    const sectionData = data[section] as { score?: number } | undefined
    if (sectionData && typeof sectionData.score === 'number') {
      scores.push({ section, score: sectionData.score, weight })
    }
  }
  return scores
}

import {
  ValidationPhase,
  PhaseResult,
  PartialFailure,
  ValidationResult,
  ValidationReport,
  SectionScore,
  determineVerdict,
  ValidationSections,
} from '../types/validation';
import { ModelConfig } from '../types/model-config';
import {
  generateResearchPrompt,
  generateStructuralPrompt,
  generateStrategicPrompt,
} from './prompts';
import { executePhaseRequest, executePhaseRequestStreaming, StreamingCallbacks } from './nim-client-v2';
import { getRankedModels, refreshHealthTest } from './model-health-service';
import { getRequestContext } from './request-context';

/**
 * Context for a validation request execution
 */
export interface PhaseExecutionContext {
  requestId: string;
  idea: string;
  startTime: number;
  phases: PhaseResult[];
  partialFailures: PartialFailure[];
}

/**
 * Progress callback for phase execution events
 */
export interface ProgressCallback {
  (event: PhaseProgressEvent): void | Promise<void>;
}

/**
 * Event types for phase progress
 */
export interface PhaseProgressEvent {
  phase: ValidationPhase;
  status: 'starting' | 'streaming' | 'complete' | 'failed';
  message?: string;
  data?: unknown;
  sections?: {
    ideaSummary?: ValidationSections['ideaSummary'];
    problemClarity?: ValidationSections['problemClarity'];
    targetAudience?: ValidationSections['targetAudience'];
    marketInsight?: ValidationSections['marketInsight'];
    competition?: ValidationSections['competition'];
    positioning?: ValidationSections['positioning'];
    mvpScope?: ValidationSections['mvpScope'];
    monetization?: ValidationSections['monetization'];
    risks?: ValidationSections['risks'];
  };
  sectionScores?: SectionScore[];
  finalScore?: number;
  finalVerdict?: 'pass' | 'fail' | 'needs-work';
}

/**
 * Research phase result structure
 */
export interface ResearchResult {
  marketTrends: string[];
  growthSignals: string[];
  directCompetitors: string[];
  indirectCompetitors: string[];
  marketTiming: string;
  industryDynamics: string[];
}

/**
 * Structural phase result structure
 */
export interface StructuralResult {
  problemClarity: ValidationSections['problemClarity'];
  targetAudience: ValidationSections['targetAudience'];
  marketInsight: ValidationSections['marketInsight'];
  monetization: ValidationSections['monetization'];
  risks: ValidationSections['risks'];
}

/**
 * Strategic phase result structure
 */
export interface StrategicResult {
  ideaSummary: ValidationSections['ideaSummary'];
  competition: ValidationSections['competition'];
  positioning: ValidationSections['positioning'];
  mvpScope: ValidationSections['mvpScope'];
  score: number;
  verdict: 'pass' | 'fail' | 'needs-work';
}

/**
 * Get current request context (from request-context.ts)
 */
function getCurrentContext(): PhaseExecutionContext | undefined {
  const ctx = getRequestContext();
  if (!ctx) return undefined;
  // Map RequestContextData to PhaseExecutionContext
  return {
    requestId: ctx.requestId,
    idea: ctx.idea,
    startTime: ctx.startTime,
    phases: [],
    partialFailures: ctx.failures.map(f => ({
      phase: f.phase as ValidationPhase,
      section: f.section,
      error: f.error,
      recovered: false,
    })),
  };
}

/**
* Execute a phase with cascade logic
* Tries models in ranked order from health service
* After 3 consecutive failures, triggers health refresh
*/
async function executePhaseWithRetry<T>(
  phase: ValidationPhase,
  executor: (model: ModelConfig) => Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  // Check if aborted
  if (signal?.aborted) {
    throw new Error('Phase execution aborted');
  }

  // Get ranked models from health service
  let rankedModels = await getRankedModels();

  if (rankedModels.length === 0) {
    throw new Error('We are experiencing high demand at the moment. All available models are currently overloaded. Please try again in a few minutes.');
  }

  console.log(`[orchestrator] ${phase}: Starting cascade through ${rankedModels.length} ranked models`);

  let consecutiveFailures = 0;
  const maxConsecutiveFailures = 3;

  // Try each model in ranked order
  for (let i = 0; i < rankedModels.length; i++) {
    const model = rankedModels[i]!;

    // Check if aborted before each attempt
    if (signal?.aborted) {
      throw new Error('Phase execution aborted');
    }

    try {
      console.log(`[orchestrator] ${phase}: Trying model ${i + 1}/${rankedModels.length}: ${model.id}`);
      const result = await executor(model);
      console.log(`[orchestrator] ${phase}: Success with model ${model.id}`);
      return result;
    } catch (error) {
      consecutiveFailures++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[orchestrator] ${phase}: Model ${model.id} failed: ${errorMessage}`);

      // After 3 consecutive failures, trigger health refresh
      if (consecutiveFailures >= maxConsecutiveFailures) {
        console.log(`[orchestrator] ${phase}: ${consecutiveFailures} consecutive failures, refreshing health...`);
        await refreshHealthTest();
        // Get fresh ranked models
        rankedModels = await getRankedModels();
        consecutiveFailures = 0;
        // Reset index to try from the beginning with new rankings
        i = -1;
        continue;
      }

      // If this is the last model and it failed
      if (i === rankedModels.length - 1) {
        throw new Error('We are experiencing high demand at the moment. All available models are currently overloaded. Please try again in a few minutes.');
      }

      console.log(`[orchestrator] ${phase}: Cascading to next model...`);
    }
  }

  // Should never reach here, but just in case
  throw new Error('We are experiencing high demand at the moment. All available models are currently overloaded. Please try again in a few minutes.');
}

/**
 * Parse JSON response with error handling
 */
function parseJsonResponse<T>(content: string, phase: ValidationPhase): T | null {
  try {
    const cleaned = content.replace(/^```(?:json)?\s*\n?|\n?\s*```$/g, '').trim();

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      console.error(`[orchestrator] ${phase}: No JSON braces found in response`);
      return null;
    }

    const jsonStr = cleaned.slice(firstBrace, lastBrace + 1);
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    console.error(`[orchestrator] ${phase}: JSON parse error:`, error instanceof Error ? error.message : 'Unknown');
    const context = getCurrentContext();
    if (context) {
      context.partialFailures.push({
        phase,
        section: 'json_parsing',
        error: `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recovered: false,
      });
    }
    return null;
  }
}

/**
 * Execute Research Phase
 *
 * Analyzes market trends, competitors, timing, and industry dynamics
 */
export async function executeResearchPhase(
  context: PhaseExecutionContext,
  onProgress?: ProgressCallback,
  signal?: AbortSignal
): Promise<PhaseResult & { data: ResearchResult }> {
  const phase = ValidationPhase.RESEARCH;
  const startTime = Date.now();

  await onProgress?.({
    phase,
    status: 'starting',
    message: 'Starting market research analysis...',
  });

  // Emit phase event
  await onProgress?.({
    phase: ValidationPhase.RESEARCH,
    status: 'streaming',
    message: 'phase:starting',
  } as PhaseProgressEvent);

  const prompt = generateResearchPrompt(context.idea);

  // Show processing message while API is working
  await onProgress?.({
    phase,
    status: 'streaming',
    message: 'Analyzing market trends and competition...',
  } as PhaseProgressEvent);

  // INDEFINITE RETRY: Keep trying until success or abort
  const response = await executePhaseWithRetry(phase, (model) =>
    executePhaseRequest(prompt, { temperature: 0.7, maxTokens: 3000, model }),
    signal
  );

  const parsed = parseJsonResponse<ResearchResult>(response.content, phase);

  if (!parsed) {
    // This should never happen due to indefinite retry, but handle just in case
    throw new Error('Failed to parse research phase response after all retries');
  }

  const duration = Date.now() - startTime;

  const result: PhaseResult & { data: ResearchResult } = {
    phase,
    completed: true,
    duration,
    modelUsed: response.model,
    sectionScores: [],
    failures: [],
    data: parsed,
  };

  context.phases.push(result);

  // Emit phase complete (single event)
  await onProgress?.({
    phase,
    status: 'complete',
    message: 'Research phase completed',
    data: parsed,
  });

  return result;
}

/**
 * Execute Structural Phase
 *
 * Evaluates problem clarity, target audience, market size, business model, and risks
 */
export async function executeStructuralPhase(
  context: PhaseExecutionContext,
  researchResult: PhaseResult & { data: ResearchResult },
  onProgress?: ProgressCallback,
  signal?: AbortSignal
): Promise<PhaseResult & { data: StructuralResult }> {
  const phase = ValidationPhase.STRUCTURAL;
  const startTime = Date.now();

  await onProgress?.({
    phase,
    status: 'starting',
    message: 'Starting structural validation...',
  });

  // Emit phase starting event
  await onProgress?.({
    phase: ValidationPhase.STRUCTURAL,
    status: 'streaming',
    message: 'phase:starting',
  } as PhaseProgressEvent);

  const researchContext = JSON.stringify(researchResult.data, null, 2);
  const prompt = generateStructuralPrompt(context.idea, researchContext);

  // Show processing message while API is working
  await onProgress?.({
    phase,
    status: 'streaming',
    message: 'Analyzing problem clarity, target audience, and market...',
  } as PhaseProgressEvent);

  // Section keys for streaming detection
  const structuralSectionKeys = ['problemClarity', 'targetAudience', 'marketInsight', 'monetization', 'risks'];

  const formatSectionName = (key: string): string => {
    const names: Record<string, string> = {
      problemClarity: 'Problem clarity',
      targetAudience: 'Target audience',
      marketInsight: 'Market insight',
      monetization: 'Monetization',
      risks: 'Risks',
      ideaSummary: 'Idea summary',
      competition: 'Competition',
      positioning: 'Positioning',
      mvpScope: 'MVP scope',
    }
    return names[key] || key
  }

  const streamingCallbacks: StreamingCallbacks = {
    onSection: async (key: string, data: unknown, index: number) => {
      console.log(`[orchestrator] STRUCTURAL: Section ${key} completed (index ${index})`);

      await onProgress?.({
        phase,
        status: 'streaming',
        message: `Analyzed ${formatSectionName(key)}`,
        sections: {
          [key]: data,
        },
      });
    },
  };

  // INDEFINITE RETRY: Keep trying until success or abort
  const response = await executePhaseWithRetry(phase, (model) =>
    executePhaseRequestStreaming(prompt, structuralSectionKeys, streamingCallbacks, {
      temperature: 0.7,
      maxTokens: 4000,
      model,
    }),
    signal
  );

  console.log('[orchestrator] STRUCTURAL: API response received, content length:', response.content.length);

  const parsed = parseJsonResponse<StructuralResult>(response.content, phase);

  if (!parsed) {
    // This should never happen due to indefinite retry
    throw new Error('Failed to parse structural phase response after all retries');
  }

  console.log('[orchestrator] STRUCTURAL: Parsed successfully');

  const duration = Date.now() - startTime;

  const structuralSectionScores = extractSectionScoresFromData(
    parsed as unknown as Record<string, unknown>,
    SECTION_WEIGHTS
  )

  if (structuralSectionScores.length === 0) {
    console.warn('[orchestrator] STRUCTURAL: No AI scores found, using fallback')
  }

  const result: PhaseResult & { data: StructuralResult } = {
    phase,
    completed: true,
    duration,
    modelUsed: response.model,
    sectionScores: structuralSectionScores,
    failures: [],
    data: parsed,
  }

  context.phases.push(result);

  // Emit phase complete event (single)
  await onProgress?.({
    phase,
    status: 'complete',
    message: 'Structural phase completed',
    data: parsed,
    sectionScores: structuralSectionScores,
  });

  return result;
}

/**
 * Execute Strategic Phase
 *
 * Evaluates competitive advantage, positioning, MVP scope, and final verdict
 */
export async function executeStrategicPhase(
  context: PhaseExecutionContext,
  structuralResult: PhaseResult & { data: StructuralResult },
  onProgress?: ProgressCallback,
  signal?: AbortSignal
): Promise<PhaseResult & { data: StrategicResult }> {
  const phase = ValidationPhase.STRATEGIC;
  const startTime = Date.now();

  await onProgress?.({
    phase,
    status: 'starting',
    message: 'Starting strategic evaluation...',
  });

  // Emit phase starting event FIRST
  await onProgress?.({
    phase: ValidationPhase.STRATEGIC,
    status: 'streaming',
    message: 'phase:starting',
  } as PhaseProgressEvent);

  const structuralContext = JSON.stringify(structuralResult.data, null, 2);
  const prompt = generateStrategicPrompt(context.idea, structuralContext);

  // Show processing message while API is working
  await onProgress?.({
    phase,
    status: 'streaming',
    message: 'Analyzing idea summary, competition, and positioning...',
  } as PhaseProgressEvent);

  // Section keys for streaming detection
  const strategicSectionKeys = ['ideaSummary', 'competition', 'positioning', 'mvpScope'];

  const formatSectionName = (key: string): string => {
    const names: Record<string, string> = {
      problemClarity: 'Problem clarity',
      targetAudience: 'Target audience',
      marketInsight: 'Market insight',
      monetization: 'Monetization',
      risks: 'Risks',
      ideaSummary: 'Idea summary',
      competition: 'Competition',
      positioning: 'Positioning',
      mvpScope: 'MVP scope',
    }
    return names[key] || key
  }

  const streamingCallbacks: StreamingCallbacks = {
    onSection: async (key: string, data: unknown, index: number) => {
      console.log(`[orchestrator] STRATEGIC: Section ${key} completed (index ${index})`);

      await onProgress?.({
        phase,
        status: 'streaming',
        message: `Analyzed ${formatSectionName(key)}`,
        sections: {
          [key]: data,
        },
      });
    },
  };

  // INDEFINITE RETRY: Keep trying until success or abort
  const response = await executePhaseWithRetry(phase, (model) =>
    executePhaseRequestStreaming(prompt, strategicSectionKeys, streamingCallbacks, {
      temperature: 0.7,
      maxTokens: 4000,
      model,
    }),
    signal
  );

  console.log('[orchestrator] STRATEGIC: API response received, content length:', response.content.length);

  const parsed = parseJsonResponse<StrategicResult>(response.content, phase);

  if (!parsed) {
    // This should never happen due to indefinite retry
    throw new Error('Failed to parse strategic phase response after all retries');
  }

  console.log('[orchestrator] STRATEGIC: Parsed successfully');

  const duration = Date.now() - startTime;

  const strategicSectionScores = extractSectionScoresFromData(
    parsed as unknown as Record<string, unknown>,
    SECTION_WEIGHTS
  )

  if (strategicSectionScores.length === 0) {
    console.warn('[orchestrator] STRATEGIC: No AI scores found, using fallback')
  }

  const result: PhaseResult & { data: StrategicResult } = {
    phase,
    completed: true,
    duration,
    modelUsed: response.model,
    sectionScores: strategicSectionScores,
    failures: [],
    data: parsed,
  }

  context.phases.push(result);

  // Emit phase complete event (single)
  await onProgress?.({
    phase,
    status: 'complete',
    message: 'Strategic phase completed',
    data: parsed,
    sectionScores: strategicSectionScores,
    finalScore: parsed.score,
    finalVerdict: parsed.verdict,
  });

  return result;
}

/**
 * Merge phase results into final ValidationReport
 */
function mergePhaseResults(
  research: PhaseResult & { data: ResearchResult },
  structural: PhaseResult & { data: StructuralResult },
  strategic: PhaseResult & { data: StrategicResult }
): ValidationResult {
  const structuralScores = extractSectionScoresFromData(
    structural.data as unknown as Record<string, unknown>,
    SECTION_WEIGHTS
  )
  const strategicScores = extractSectionScoresFromData(
    strategic.data as unknown as Record<string, unknown>,
    SECTION_WEIGHTS
  )

  const allSectionScores: SectionScore[] = [
    ...structuralScores,
    ...strategicScores,
  ]

  let overallScore: number
  let verdict: 'pass' | 'fail' | 'needs-work'

  if (allSectionScores.length > 0) {
    const totalWeight = allSectionScores.reduce((sum, s) => sum + s.weight, 0)
    const weightedSum = allSectionScores.reduce((sum, s) => sum + s.score * s.weight, 0)
    overallScore = Math.round(weightedSum / totalWeight)
    verdict = determineVerdict(overallScore)
  } else {
    overallScore = strategic.data.score ?? calculateScoreFromVerdict(strategic.data.verdict)
    verdict = strategic.data.verdict
  }

  const whyNowData = {
    timing: research.data.marketTiming || 'Market timing assessment pending',
    marketForces: research.data.industryDynamics || [],
    enablingTechnology: research.data.growthSignals?.filter(s => 
      s.toLowerCase().includes('ai') || 
      s.toLowerCase().includes('technology') ||
      s.toLowerCase().includes('platform')
    ) || [],
    culturalShift: research.data.marketTrends?.slice(0, 3) || [],
  }

  const report: ValidationReport = {
    executiveSummary: {
      plainEnglish: `Your startup idea has been validated with a score of ${overallScore}/100.`,
      keyTakeaways: strategic.data.ideaSummary?.tractionEvidence?.slice(0, 3) || [],
      actionItems: ['Build an MVP to test core assumptions', 'Validate with target users', 'Iterate based on feedback'],
    },
    ideaSummary: strategic.data.ideaSummary,
    whyNow: whyNowData,
    problemClarity: structural.data.problemClarity,
    targetAudience: structural.data.targetAudience,
    marketInsight: structural.data.marketInsight,
    competition: strategic.data.competition,
    positioning: strategic.data.positioning,
    mvpScope: strategic.data.mvpScope,
    monetization: structural.data.monetization,
    risks: structural.data.risks,
    score: overallScore,
    verdict,
  };

  const result: ValidationResult = {
    ...report,
    phases: [research, structural, strategic],
  };

  return result;
}

/**
 * Orchestrate 3-Phase Validation
 *
 * Main entry point for the 3-phase validation system.
 * Executes Research → Structural → Strategic phases with progressive callbacks.
 *
 * @param idea - Startup idea to validate
 * @param onProgress - Optional progress callback for phase events
 * @returns Complete validation result with all phases
 */
export async function orchestrate3PhaseValidation(
  idea: string,
  onProgress?: ProgressCallback,
  signal?: AbortSignal
): Promise<ValidationResult> {
  const ctx = getRequestContext();

  const context: PhaseExecutionContext = {
    requestId: ctx?.requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    idea: idea.trim(),
    startTime: ctx?.startTime || Date.now(),
    phases: [],
    partialFailures: [],
  };

  // Pass signal to allow cancellation
  const researchResult = await executeResearchPhase(context, onProgress, signal);

  const structuralResult = await executeStructuralPhase(
    context,
    researchResult,
    onProgress,
    signal
  );

  const strategicResult = await executeStrategicPhase(
    context,
    structuralResult,
    onProgress,
    signal
  );

  const finalResult = mergePhaseResults(
    researchResult,
    structuralResult,
    strategicResult
  );

  if (context.partialFailures.length > 0) {
    finalResult.partialFailures = context.partialFailures;
  }

  return finalResult;
}

/**
 * Get execution statistics for a validation request
 */
export function getExecutionStats(context: PhaseExecutionContext): {
  totalDuration: number;
  phaseCount: number;
  completedPhases: number;
  failureCount: number;
  averagePhaseDuration: number;
} {
  const totalDuration = Date.now() - context.startTime;
  const phaseCount = context.phases.length;
  const completedPhases = context.phases.filter(p => p.completed).length;
  const failureCount = context.partialFailures.length;
  const averagePhaseDuration =
    phaseCount > 0
      ? context.phases.reduce((sum, p) => sum + p.duration, 0) / phaseCount
      : 0;

  return {
    totalDuration,
    phaseCount,
    completedPhases,
    failureCount,
    averagePhaseDuration,
  };
}

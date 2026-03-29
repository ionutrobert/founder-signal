/**
 * Section weights that sum to 1.0 across ALL validation sections
 * These determine how each section contributes to the overall score
 */
const SECTION_WEIGHTS: Record<string, number> = {
  ideaSummary: 0.15,
  problemClarity: 0.10,
  targetAudience: 0.10,
  marketInsight: 0.10,
  competition: 0.15,
  positioning: 0.10,
  mvpScope: 0.15,
  monetization: 0.05,
  risks: 0.10,
}

/**
 * Safely get section weight with fallback
 */
function safeWeight(section: string): number {
  return SECTION_WEIGHTS[section] ?? 0
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

function calculateSectionScoresFromStrategic(
  _strategicScore: number,
  verdict: 'pass' | 'fail' | 'needs-work'
): SectionScore[] {
  const baseSectionScore = calculateScoreFromVerdict(verdict)
  const variance = 15

  return [
    { section: 'ideaSummary', score: Math.min(100, baseSectionScore + variance), weight: safeWeight('ideaSummary') },
    { section: 'competition', score: Math.min(100, baseSectionScore + 5), weight: safeWeight('competition') },
    { section: 'positioning', score: baseSectionScore, weight: safeWeight('positioning') },
    { section: 'mvpScope', score: Math.min(100, baseSectionScore + 10), weight: safeWeight('mvpScope') },
  ]
}

function calculateStructuralSectionScores(
  verdict: 'pass' | 'fail' | 'needs-work'
): SectionScore[] {
  const baseSectionScore = calculateScoreFromVerdict(verdict)
  const variance = 10

  return [
    { section: 'problemClarity', score: Math.min(100, baseSectionScore + variance), weight: safeWeight('problemClarity') },
    { section: 'targetAudience', score: baseSectionScore, weight: safeWeight('targetAudience') },
    { section: 'marketInsight', score: Math.min(100, baseSectionScore + 5), weight: safeWeight('marketInsight') },
    { section: 'monetization', score: Math.max(0, baseSectionScore - 5), weight: safeWeight('monetization') },
    { section: 'risks', score: Math.max(0, baseSectionScore - 15), weight: safeWeight('risks') },
  ]
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
import { getActivityMessages } from './activity-messages';
import { ModelConfig } from '../types/model-config';
import {
  generateResearchPrompt,
  generateStructuralPrompt,
  generateStrategicPrompt,
} from './prompts';
import { executePhaseRequest, NimClientError } from './nim-client-v2';
import { getModelCircuitBreaker, isModelAvailable } from './circuit-breaker';
import { refreshWorkingModel, getCachedModel, invalidateCachedModel } from './model-proxy';
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
 * Execute a phase with retry logic and circuit breaker
 * Tests models in real-time and rotates to working ones
 */
async function executePhaseWithRetry<T>(
  phase: ValidationPhase,
  executor: (model: ModelConfig) => Promise<T>,
  maxRetries: number = 5
): Promise<T> {
  let lastError: Error | null = null;
  let attempts = 0;

  while (attempts < maxRetries) {
    attempts++;

    try {
      let model = getCachedModel();

      if (!model) {
        model = await refreshWorkingModel();
      }

      if (!isModelAvailable(model.id)) {
        invalidateCachedModel();
        throw new Error(`Circuit breaker open for model ${model.id}`);
      }

      const circuit = getModelCircuitBreaker(model.id);

      try {
        const result = await executor(model);
        circuit.recordSuccess();
        return result;
      } catch (error) {
        circuit.recordFailure();
        invalidateCachedModel();
        throw error;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const context = getCurrentContext();
      if (context && lastError instanceof NimClientError) {
        context.partialFailures.push({
          phase,
          section: 'general',
          error: lastError.message,
          recovered: false,
        });
      }

      if (attempts >= maxRetries) {
        throw lastError;
      }

      const delay = Math.min(1000 * Math.pow(2, attempts - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Max retries exceeded');
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
  onProgress?: ProgressCallback
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

  // Cycle through activity messages
  const researchMessages = getActivityMessages('research');
  for (const msg of researchMessages) {
    await onProgress?.({
      phase,
      status: 'streaming',
      message: msg,
    } as PhaseProgressEvent);
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  try {
    const prompt = generateResearchPrompt(context.idea);
    const response = await executePhaseWithRetry(phase, (model) =>
      executePhaseRequest(prompt, { temperature: 0.7, maxTokens: 3000, model })
    );

    await onProgress?.({
      phase,
      status: 'streaming',
      message: 'Analyzing market data...',
    });

    const parsed = parseJsonResponse<ResearchResult>(response.content, phase);

    if (!parsed) {
      throw new Error('Failed to parse research phase response');
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

  // Emit phase complete
  await onProgress?.({
    phase: ValidationPhase.RESEARCH,
    status: 'complete',
    message: 'Research phase completed',
  } as PhaseProgressEvent);

  await onProgress?.({
    phase,
    status: 'complete',
    message: 'Research phase completed',
    data: parsed,
  });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    const failure: PartialFailure = {
      phase,
      section: 'research',
      error: errorMessage,
      recovered: false,
    };

    context.partialFailures.push(failure);

    await onProgress?.({
      phase,
      status: 'failed',
      message: `Research phase failed: ${errorMessage}`,
    });

    return {
      phase,
      completed: false,
      duration,
      modelUsed: 'unknown',
      sectionScores: [],
      failures: [failure],
      data: {
        marketTrends: [],
        growthSignals: [],
        directCompetitors: [],
        indirectCompetitors: [],
        marketTiming: 'Failed to analyze',
        industryDynamics: [],
      },
    };
  }
}

/**
 * Execute Structural Phase
 *
 * Evaluates problem clarity, target audience, market size, business model, and risks
 */
export async function executeStructuralPhase(
  context: PhaseExecutionContext,
  researchResult: PhaseResult & { data: ResearchResult },
  onProgress?: ProgressCallback
): Promise<PhaseResult & { data: StructuralResult }> {
  const phase = ValidationPhase.STRUCTURAL;
  const startTime = Date.now();

  await onProgress?.({
    phase,
    status: 'starting',
    message: 'Starting structural validation...',
  });

  try {
    const researchContext = JSON.stringify(researchResult.data, null, 2);
    const prompt = generateStructuralPrompt(context.idea, researchContext);

    const response = await executePhaseWithRetry(phase, (model) =>
      executePhaseRequest(prompt, { temperature: 0.7, maxTokens: 4000, model })
    );
    
  console.log('[orchestrator] STRUCTURAL: API response received, content length:', response.content.length);

  // Emit phase starting event
  await onProgress?.({
    phase: ValidationPhase.STRUCTURAL,
    status: 'streaming',
    message: 'phase:starting',
  } as PhaseProgressEvent);

  // Cycle through activity messages for each structural section
  const structuralSectionNames = ['problemClarity', 'targetAudience', 'marketInsight', 'monetization', 'risks'] as const;
  for (const sectionName of structuralSectionNames) {
    const sectionMessages = getActivityMessages(sectionName);
    for (const msg of sectionMessages) {
      await onProgress?.({
        phase,
        status: 'streaming',
        message: msg,
      } as PhaseProgressEvent);
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  }

  await onProgress?.({
    phase,
    status: 'streaming',
    message: 'Evaluating framework components...',
  });

    const parsed = parseJsonResponse<StructuralResult>(response.content, phase);

    if (!parsed) {
      console.error('[orchestrator] STRUCTURAL: parseJsonResponse returned null, raw content length:', response.content.length);
      throw new Error('Failed to parse structural phase response');
    }
    
    console.log('[orchestrator] STRUCTURAL: Parsed successfully');

    const duration = Date.now() - startTime;

    const structuralVerdict = 'needs-work'
    const structuralSectionScores = calculateStructuralSectionScores(structuralVerdict)

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

    // Emit sections one by one for progressive display
    const structuralSections = [
      { name: 'problemClarity', data: parsed.problemClarity },
      { name: 'targetAudience', data: parsed.targetAudience },
      { name: 'marketInsight', data: parsed.marketInsight },
      { name: 'monetization', data: parsed.monetization },
      { name: 'risks', data: parsed.risks },
    ] as const

    for (const section of structuralSections) {
      await onProgress?.({
        phase,
        status: 'streaming',
        message: `Processing ${section.name}...`,
        sections: {
          [section.name]: section.data,
        },
      })
    }

  // Emit phase complete event
  await onProgress?.({
    phase: ValidationPhase.STRUCTURAL,
    status: 'complete',
    message: 'Structural phase completed',
  } as PhaseProgressEvent);

  await onProgress?.({
    phase,
    status: 'complete',
    message: 'Structural phase completed',
    data: parsed,
    sectionScores: structuralSectionScores,
  });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('[orchestrator] STRUCTURAL phase FAILED:', errorMessage);

    const failure: PartialFailure = {
      phase,
      section: 'structural',
      error: errorMessage,
      recovered: false,
    };

    context.partialFailures.push(failure);

    await onProgress?.({
      phase,
      status: 'failed',
      message: `Structural phase failed: ${errorMessage}`,
    });

    return {
      phase,
      completed: false,
      duration,
      modelUsed: 'unknown',
      sectionScores: [],
      failures: [failure],
      data: {
        problemClarity: {
          problemStatement: 'Analysis failed',
          severity: 'low',
          affectedUsers: 'Unknown',
          evidence: [],
          confidenceLevel: 'Low',
        },
        targetAudience: {
          icp: 'Unknown',
          keySegments: [],
          personas: [],
        },
        marketInsight: {
          tam: 'Unknown',
          sam: 'Unknown',
          som: 'Unknown',
          trends: [],
          growthSignals: [],
        },
        monetization: {
          revenueModel: 'Unknown',
          pricingStrategy: 'Unknown',
          salesChannels: [],
          projections: 'Unknown',
          keyAssumptions: [],
        },
        risks: {
          technical: [],
          market: [],
          operational: [],
          regulatory: [],
        },
      },
    };
  }
}

/**
 * Execute Strategic Phase
 *
 * Evaluates competitive advantage, positioning, MVP scope, and final verdict
 */
export async function executeStrategicPhase(
  context: PhaseExecutionContext,
  structuralResult: PhaseResult & { data: StructuralResult },
  onProgress?: ProgressCallback
): Promise<PhaseResult & { data: StrategicResult }> {
  const phase = ValidationPhase.STRATEGIC;
  const startTime = Date.now();

  await onProgress?.({
    phase,
    status: 'starting',
    message: 'Starting strategic evaluation...',
  });

  try {
    const structuralContext = JSON.stringify(structuralResult.data, null, 2);
    const prompt = generateStrategicPrompt(context.idea, structuralContext);

    const response = await executePhaseWithRetry(phase, (model) =>
      executePhaseRequest(prompt, { temperature: 0.7, maxTokens: 4000, model })
    );
    
  console.log('[orchestrator] STRATEGIC: API response received, content length:', response.content.length);

  // Emit phase starting event
  await onProgress?.({
    phase: ValidationPhase.STRATEGIC,
    status: 'streaming',
    message: 'phase:starting',
  } as PhaseProgressEvent);

  // Cycle through activity messages for each strategic section
  const strategicSectionNames = ['ideaSummary', 'competition', 'positioning', 'mvpScope'] as const;
  for (const sectionName of strategicSectionNames) {
    const sectionMessages = getActivityMessages(sectionName);
    for (const msg of sectionMessages) {
      await onProgress?.({
        phase,
        status: 'streaming',
        message: msg,
      } as PhaseProgressEvent);
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  }

  await onProgress?.({
    phase,
    status: 'streaming',
    message: 'Evaluating strategic positioning...',
  });

    const parsed = parseJsonResponse<StrategicResult>(response.content, phase);

    if (!parsed) {
      console.error('[orchestrator] STRATEGIC: parseJsonResponse returned null, raw content length:', response.content.length);
      throw new Error('Failed to parse strategic phase response');
    }
    
    console.log('[orchestrator] STRATEGIC: Parsed successfully');

    const duration = Date.now() - startTime;

    const strategicSectionScores = calculateSectionScoresFromStrategic(parsed.score, parsed.verdict)

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

    // Emit sections one by one for progressive display
    const strategicSections = [
      { name: 'ideaSummary', data: parsed.ideaSummary },
      { name: 'competition', data: parsed.competition },
      { name: 'positioning', data: parsed.positioning },
      { name: 'mvpScope', data: parsed.mvpScope },
    ] as const

    for (const section of strategicSections) {
      await onProgress?.({
        phase,
        status: 'streaming',
        message: `Processing ${section.name}...`,
        sections: {
          [section.name]: section.data,
        },
      })
    }

  // Emit phase complete event
  await onProgress?.({
    phase: ValidationPhase.STRATEGIC,
    status: 'complete',
    message: 'Strategic phase completed',
  } as PhaseProgressEvent);

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
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('[orchestrator] STRATEGIC phase FAILED:', errorMessage);

    const failure: PartialFailure = {
      phase,
      section: 'strategic',
      error: errorMessage,
      recovered: false,
    };

    context.partialFailures.push(failure);

    await onProgress?.({
      phase,
      status: 'failed',
      message: `Strategic phase failed: ${errorMessage}`,
    });

    return {
      phase,
      completed: false,
      duration,
      modelUsed: 'unknown',
      sectionScores: [],
      failures: [failure],
      data: {
        ideaSummary: {
          title: 'Analysis Failed',
          oneLiner: 'Unable to complete analysis',
          category: 'Unknown',
          problemTheme: 'Unknown',
          tractionEvidence: [],
        },
        competition: {
          directCompetitors: [],
          indirectCompetitors: [],
          competitiveAdvantage: 'Analysis failed',
        },
        positioning: {
          uniqueValueProposition: 'Unknown',
          differentiators: [],
          messagingPillars: [],
          brandPromise: 'Unknown',
        },
        mvpScope: {
          coreFeatures: [],
          timeline: 'Unknown',
          successMetrics: [],
          resourceNeeds: [],
          deferredCapabilities: [],
        },
        score: 0,
        verdict: 'fail' as const,
      },
    };
  }
}

/**
 * Merge phase results into final ValidationReport
 */
function mergePhaseResults(
  research: PhaseResult & { data: ResearchResult },
  structural: PhaseResult & { data: StructuralResult },
  strategic: PhaseResult & { data: StrategicResult }
): ValidationResult {
  const allSectionScores: SectionScore[] = [
    ...structural.sectionScores,
    ...strategic.sectionScores,
  ]

  const totalWeight = allSectionScores.reduce((sum, s) => sum + s.weight, 0)
  const weightedSum = allSectionScores.reduce((sum, s) => sum + s.score * s.weight, 0)
  const overallScore = Math.round(weightedSum / totalWeight)

  const verdict = determineVerdict(overallScore);

  const report: ValidationReport = {
    ideaSummary: strategic.data.ideaSummary,
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
  onProgress?: ProgressCallback
): Promise<ValidationResult> {
  const ctx = getRequestContext();
  
  const context: PhaseExecutionContext = {
    requestId: ctx?.requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    idea: idea.trim(),
    startTime: ctx?.startTime || Date.now(),
    phases: [],
    partialFailures: [],
  };

  const researchResult = await executeResearchPhase(context, onProgress);

  const structuralResult = await executeStructuralPhase(
    context,
    researchResult,
    onProgress
  );

  const strategicResult = await executeStrategicPhase(
    context,
    structuralResult,
    onProgress
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

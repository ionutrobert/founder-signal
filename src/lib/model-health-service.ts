/**
 * Model Health Service - FCM-Style Testing & Smart Model Selection
 *
 * This module provides intelligent model selection with health tracking,
 * FCM-style stability scoring, parallel testing, caching, and cascade logic.
 */

import { ModelConfig, HealthMetrics, DEFAULT_HEALTH_METRICS } from '../types/model-config';
import { getModelCatalog, getModelById } from './model-catalog';

const NIM_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';

// Models to test (in priority order based on the task requirements)
const MODELS_TO_TEST = [
  'moonshotai/kimi-k2.5', // S+, 200k context
  'qwen/qwen3-coder-480b-a35b-instruct', // S+, 128k context
  'z-ai/glm5', // S+, 128k context
  'moonshotai/kimi-k2-thinking', // S+, 200k context
  'z-ai/glm4.7', // S+, 128k context
  'minimaxai/minimax-m2.5', // S+, 200k context
];

// Cache configuration
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Test configuration
const TEST_TIMEOUT_MS = 5000; // 5 seconds
const MAX_FAILURES_BEFORE_REFRESH = 3;

/**
 * Result from testing a single model
 */
export interface ModelTestResult {
  modelId: string;
  success: boolean;
  latency: number;
  timestamp: number;
  error?: string;
  p95Latency: number;
  jitter: number;
  spikeRate: number;
  reliability: number;
}

/**
 * Cached health data
 */
interface CachedHealthData {
  results: ModelTestResult[];
  timestamp: number;
  rankedModels: ModelConfig[];
}

// In-memory cache
let healthCache: CachedHealthData | null = null;

// Failure tracking for auto-refresh
let consecutiveFailures = 0;

/**
 * Test prompt for model health checks
 */
const TEST_PROMPT = {
  system: 'Analyze this startup idea briefly',
  user: 'A parking app that uses AI to find spots',
};

/**
 * Create an AbortSignal with timeout
 */
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

/**
 * Test a single model with the validation prompt
 */
async function testSingleModel(modelId: string): Promise<ModelTestResult> {
  const startTime = Date.now();

  try {
    const response = await fetch(NIM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: TEST_PROMPT.system },
          { role: 'user', content: TEST_PROMPT.user },
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
      signal: createTimeoutSignal(TEST_TIMEOUT_MS),
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return {
        modelId,
        success: false,
        latency,
        timestamp: Date.now(),
        error: `HTTP ${response.status}: ${response.statusText}`,
        p95Latency: latency,
        jitter: 0,
        spikeRate: 1,
        reliability: 0,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Validate success criteria
    if (!content || content.trim().length === 0) {
      return {
        modelId,
        success: false,
        latency,
        timestamp: Date.now(),
        error: 'Empty response content',
        p95Latency: latency,
        jitter: 0,
        spikeRate: 1,
        reliability: 0,
      };
    }

    // Calculate health metrics for this single test
    const p95Latency = latency;
    const jitter = 0; // Single test, no jitter
    const spikeRate = 0; // Single successful test
    const reliability = 1.0;

    return {
      modelId,
      success: true,
      latency,
      timestamp: Date.now(),
      p95Latency,
      jitter,
      spikeRate,
      reliability,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if it's a timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        modelId,
        success: false,
        latency: TEST_TIMEOUT_MS,
        timestamp: Date.now(),
        error: `Timeout after ${TEST_TIMEOUT_MS}ms`,
        p95Latency: TEST_TIMEOUT_MS,
        jitter: 0,
        spikeRate: 1,
        reliability: 0,
      };
    }

    return {
      modelId,
      success: false,
      latency,
      timestamp: Date.now(),
      error: errorMessage,
      p95Latency: latency,
      jitter: 0,
      spikeRate: 1,
      reliability: 0,
    };
  }
}

/**
 * Test all models in parallel with 5s timeout
 */
export async function testAllModels(): Promise<ModelTestResult[]> {
  console.log('[ModelHealthService] Testing all models in parallel...');
  console.log('[ModelHealthService] Models to test:', MODELS_TO_TEST);

  const testPromises = MODELS_TO_TEST.map(modelId => testSingleModel(modelId));

  try {
    const results = await Promise.all(testPromises);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(
      `[ModelHealthService] Test complete: ${successful} successful, ${failed} failed`
    );

    // Update failure tracking
    if (failed > 0) {
      consecutiveFailures++;
      console.log(
        `[ModelHealthService] Consecutive failures: ${consecutiveFailures}/${MAX_FAILURES_BEFORE_REFRESH}`
      );
    } else {
      consecutiveFailures = 0;
    }

    // Auto-refresh after 3 failures
    if (consecutiveFailures >= MAX_FAILURES_BEFORE_REFRESH) {
      console.log(
        '[ModelHealthService] Max failures reached, triggering health refresh...'
      );
      consecutiveFailures = 0;
      // Schedule refresh for next tick to avoid blocking
      setTimeout(() => refreshHealthTest(), 0);
    }

    return results;
  } catch (error) {
    console.error('[ModelHealthService] Error testing models:', error);
    return MODELS_TO_TEST.map(modelId => ({
      modelId,
      success: false,
      latency: TEST_TIMEOUT_MS,
      timestamp: Date.now(),
      error: 'Test batch failed',
      p95Latency: TEST_TIMEOUT_MS,
      jitter: 0,
      spikeRate: 1,
      reliability: 0,
    }));
  }
}

/**
 * Calculate FCM-style stability score
 * Formula: 30% p95 + 30% jitter + 20% spike + 20% reliability
 */
export function calculateStabilityScore(health: HealthMetrics): number {
  // Normalize metrics (0-1 scale, where 1 is best)
  // p95: Lower is better, normalize against 10s max
  const normalizedP95 = Math.max(0, 1 - health.p95Latency / 10000);

  // Jitter: Lower is better, normalize against 5s max
  const normalizedJitter = Math.max(0, 1 - health.jitter / 5000);

  // Spike rate: Lower is better (already 0-1)
  const normalizedSpike = Math.max(0, 1 - health.spikeRate);

  // Reliability: Higher is better (already 0-1)
  const normalizedReliability = health.reliability;

  // FCM formula weights
  const stabilityScore =
    normalizedP95 * 0.3 +
    normalizedJitter * 0.3 +
    normalizedSpike * 0.2 +
    normalizedReliability * 0.2;

  // Return score between 0-100
  return Math.round(stabilityScore * 100);
}

/**
 * Check if cache is stale (>30min)
 */
export function isCacheStale(): boolean {
  if (!healthCache) {
    return true;
  }

  const age = Date.now() - healthCache.timestamp;
  return age > CACHE_TTL_MS;
}

/**
 * Build ModelConfig from test result
 */
function buildModelConfigFromResult(result: ModelTestResult): ModelConfig {
  const existingModel = getModelById(result.modelId);

  // Determine context window based on model
  let contextWindow = 128000;
  if (
    result.modelId.includes('kimi-k2') ||
    result.modelId.includes('minimax-m2.5')
  ) {
    contextWindow = 200000;
  }

  // Determine priority based on model list order
  const priority = MODELS_TO_TEST.indexOf(result.modelId) + 1;

  const health: HealthMetrics = {
    lastSeen: result.timestamp,
    p95Latency: result.p95Latency,
    jitter: result.jitter,
    spikeRate: result.spikeRate,
    reliability: result.reliability,
    stabilityScore: calculateStabilityScore({
      lastSeen: result.timestamp,
      p95Latency: result.p95Latency,
      jitter: result.jitter,
      spikeRate: result.spikeRate,
      reliability: result.reliability,
    }),
    lastHealthCheck: result.timestamp,
  };

  return {
    id: result.modelId,
    tier: {
      tier: 'S+',
      priority: priority,
      maxRetries: 5,
      timeout: 60000,
    },
    endpoint: NIM_ENDPOINT,
    health,
    contextWindow,
    priority,
  };
}

/**
 * Get ranked models (cached or fresh)
 * Returns models sorted by stability score (highest first)
 */
export async function getRankedModels(): Promise<ModelConfig[]> {
  // Return cached results if not stale
  if (!isCacheStale() && healthCache) {
    console.log('[ModelHealthService] Using cached health data');
    return healthCache.rankedModels;
  }

  // Run fresh health test
  console.log('[ModelHealthService] Cache stale, running fresh health test...');
  const results = await testAllModels();

  // Build model configs from successful results
  const modelConfigs: ModelConfig[] = results
    .filter(result => result.success)
    .map(result => buildModelConfigFromResult(result));

  // Sort by stability score (highest first)
  const rankedModels = modelConfigs.sort((a, b) => {
    const scoreA = calculateStabilityScore(a.health);
    const scoreB = calculateStabilityScore(b.health);
    return scoreB - scoreA;
  });

  // Update cache
  healthCache = {
    results,
    timestamp: Date.now(),
    rankedModels,
  };

  console.log(
    '[ModelHealthService] Ranked models:',
    rankedModels.map(m => `${m.id} (score: ${m.health.stabilityScore})`)
  );

  return rankedModels;
}

/**
 * Cascade through models until success
 * Tries models in ranked order, moving to next on failure
 */
export async function cascadeThroughModels<T>(
  models: ModelConfig[],
  executor: (model: ModelConfig) => Promise<T>
): Promise<T> {
  const errors: Error[] = [];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    console.log(`[ModelHealthService] Trying model ${i + 1}/${models.length}: ${model.id}`);

    try {
      const result = await executor(model);
      console.log(`[ModelHealthService] Success with model: ${model.id}`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[ModelHealthService] Model ${model.id} failed: ${errorMessage}`);
      errors.push(new Error(`Model ${model.id} failed: ${errorMessage}`));

      // Track failure
      consecutiveFailures++;

      // Continue to next model
      if (i < models.length - 1) {
        console.log(`[ModelHealthService] Cascading to next model...`);
      }
    }
  }

  // All models failed
  const allErrors = errors.map(e => e.message).join('; ');
  throw new Error(`All models failed. Errors: ${allErrors}`);
}

/**
 * Refresh health test
 * Forces a fresh health test and clears the cache
 */
export async function refreshHealthTest(): Promise<void> {
  console.log('[ModelHealthService] Refreshing health test...');

  // Clear cache to force fresh test
  healthCache = null;
  consecutiveFailures = 0;

  // Run fresh test
  await getRankedModels();

  console.log('[ModelHealthService] Health test refreshed');
}

/**
 * Get current cache status
 */
export function getCacheStatus(): {
  hasCache: boolean;
  ageMs: number;
  isStale: boolean;
  resultsCount: number;
} {
  if (!healthCache) {
    return {
      hasCache: false,
      ageMs: 0,
      isStale: true,
      resultsCount: 0,
    };
  }

  const ageMs = Date.now() - healthCache.timestamp;
  return {
    hasCache: true,
    ageMs,
    isStale: ageMs > CACHE_TTL_MS,
    resultsCount: healthCache.results.length,
  };
}

/**
 * Get failure statistics
 */
export function getFailureStats(): {
  consecutiveFailures: number;
  maxFailures: number;
  shouldRefresh: boolean;
} {
  return {
    consecutiveFailures,
    maxFailures: MAX_FAILURES_BEFORE_REFRESH,
    shouldRefresh: consecutiveFailures >= MAX_FAILURES_BEFORE_REFRESH,
  };
}

/**
 * Clear the health cache
 */
export function clearHealthCache(): void {
  healthCache = null;
  consecutiveFailures = 0;
  console.log('[ModelHealthService] Health cache cleared');
}

/**
 * Get health summary for all tested models
 */
export async function getHealthSummary(): Promise<{
  models: {
    id: string;
    success: boolean;
    latency: number;
    stabilityScore: number;
    error?: string;
  }[];
  testedAt: number;
  cacheAgeMs: number;
}> {
  const rankedModels = await getRankedModels();
  const cacheStatus = getCacheStatus();

  return {
    models: rankedModels.map(model => ({
      id: model.id,
      success: model.health.reliability > 0,
      latency: model.health.p95Latency,
      stabilityScore: model.health.stabilityScore,
    })),
    testedAt: healthCache?.timestamp || Date.now(),
    cacheAgeMs: cacheStatus.ageMs,
  };
}

// Export configuration for external use
export const HEALTH_SERVICE_CONFIG = {
  TEST_TIMEOUT_MS,
  CACHE_TTL_MS,
  MAX_FAILURES_BEFORE_REFRESH,
  MODELS_TO_TEST,
};

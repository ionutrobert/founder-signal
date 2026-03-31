/**
 * Model Health Service - Dynamic Model Selection
 * 
 * Tests all available models and selects the fastest working one.
 * Never hardcodes model selection - always uses real-time health data.
 * 
 * Flow:
 * 1. Test all models in parallel (5s timeout each)
 * 2. Rank by: working status → latency → context window
 * 3. Use fastest working model
 * 4. Cascade to next fastest on failure
 * 5. Re-test after 3 consecutive failures or 30min cache expiry
 */

import { ModelConfig } from '../types/model-config';
import { getModelCatalog } from './model-catalog';
import { 
  testAllModels,
  calculateStabilityScore,
  type HealthCheckResult 
} from './nim-health-client';

// Cache configuration
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// In-memory cache
let healthCache: {
  results: HealthCheckResult[];
  timestamp: number;
  rankedModels: ModelConfig[];
} | null = null;

// Failure tracking
let consecutiveFailures = 0;
const MAX_FAILURES_BEFORE_REFRESH = 3;

/**
 * Check if cache is stale (>30min old)
 */
export function isCacheStale(): boolean {
  if (!healthCache) return true;
  return Date.now() - healthCache.timestamp > CACHE_TTL_MS;
}

/**
 * Get ranked models - ALWAYS tests first to find fastest working model
 * 
 * This ensures we never use a hardcoded model order.
 * The system dynamically discovers which models are working and fastest.
 */
export async function getRankedModels(): Promise<ModelConfig[]> {
  // Use cache if fresh
  if (healthCache && !isCacheStale()) {
    console.log(`[ModelHealthService] Using cached health data (${healthCache.results.length} models tested)`);
    return healthCache.rankedModels;
  }

  // ALWAYS run fresh health test to find fastest working model
  console.log('[ModelHealthService] Running health test to find fastest working model...');
  return refreshHealthTest();
}

/**
 * Run fresh health test on all models
 * Tests all models in parallel and ranks by actual performance
 */
export async function refreshHealthTest(): Promise<ModelConfig[]> {
  const startTime = Date.now();
  console.log('[ModelHealthService] Testing all models in parallel...');
  
  const results = await testAllModels();
  const testDuration = Date.now() - startTime;
  
  const workingResults = results.filter(r => r.available);
  
  console.log(`[ModelHealthService] Health test completed in ${testDuration}ms`);
  console.log(`[ModelHealthService] Working models: ${workingResults.length}/${results.length}`);
  
  if (workingResults.length > 0) {
    console.log('[ModelHealthService] Ranked by speed:');
    workingResults.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.modelId}: ${r.latency}ms`);
    });
  } else {
    console.warn('[ModelHealthService] No working models found!');
  }

  // Get models from catalog (has endpoint field)
  const catalogModels = getModelCatalog();

  // Build ranked model list with health data
  const rankedModels = catalogModels.map(catalogModel => {
    const healthResult = results.find(r => r.modelId === catalogModel.id);
    const stabilityScore = healthResult?.available 
      ? calculateStabilityScore(healthResult.latency, 1.0)
      : 0;
    
    return {
      ...catalogModel,
      health: {
        lastSeen: healthResult?.timestamp || 0,
        p95Latency: healthResult?.latency || 0,
        jitter: 0,
        spikeRate: 0,
        reliability: healthResult?.available ? 1.0 : 0.0,
        stabilityScore,
        lastHealthCheck: Date.now(),
      },
    };
  });

  // Sort: working first (by latency), then non-working (by priority)
  rankedModels.sort((a, b) => {
    const aWorking = a.health.reliability > 0;
    const bWorking = b.health.reliability > 0;
    
    if (aWorking && !bWorking) return -1;
    if (!aWorking && bWorking) return 1;
    
    if (aWorking && bWorking) {
      return a.health.p95Latency - b.health.p95Latency;
    }
    
    return a.priority - b.priority;
  });

  // Update cache
  healthCache = {
    results,
    timestamp: Date.now(),
    rankedModels,
  };

  return rankedModels;
}

/**
 * Record a failure and refresh health if needed
 */
export function recordFailure(): void {
  consecutiveFailures++;
  
  if (consecutiveFailures >= MAX_FAILURES_BEFORE_REFRESH) {
    console.log(`[ModelHealthService] ${consecutiveFailures} consecutive failures, refreshing health...`);
    healthCache = null;
    consecutiveFailures = 0;
  }
}

/**
 * Record a success
 */
export function recordSuccess(): void {
  consecutiveFailures = 0;
}

/**
 * Get current cache status
 */
export function getCacheStatus(): { cached: boolean; age: number; models: number } {
  if (!healthCache) {
    return { cached: false, age: 0, models: 0 };
  }
  
  return {
    cached: true,
    age: Date.now() - healthCache.timestamp,
    models: healthCache.rankedModels.length,
  };
}

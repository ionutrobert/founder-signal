/**
 * Model Health Service - Uses nim-health-client for testing
 * 
 * Caches health results for 30 minutes.
 * Provides ranked model list for cascade execution.
 * 
 * OPTIMIZATION: Skip health checks on first request since we already know
 * which models work. Only run health checks after consecutive failures.
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
 * Get ranked models from cache or run fresh test
 * 
 * OPTIMIZATION: On first call, return catalog models immediately without health checks.
 * Health checks only run after failures or cache expiration.
 */
export async function getRankedModels(): Promise<ModelConfig[]> {
  // Use cache if fresh
  if (healthCache && !isCacheStale()) {
    return healthCache.rankedModels;
  }

  // First call: return catalog models immediately (skip health check)
  // This avoids 45s delay from testing 9 models
  if (!healthCache) {
    console.log('[ModelHealthService] First call, using catalog models (no health check)');
    const catalogModels = getModelCatalog();
    
    // Initialize cache with catalog models (no health data yet)
    healthCache = {
      results: [],
      timestamp: Date.now(),
      rankedModels: catalogModels,
    };
    
    return catalogModels;
  }

  // Cache expired: run fresh health test
  return refreshHealthTest();
}

/**
 * Run fresh health test on all models
 * Only called after cache expiration or consecutive failures
 */
export async function refreshHealthTest(): Promise<ModelConfig[]> {
  console.log('[ModelHealthService] Running fresh health test...');
  
  const results = await testAllModels();
  const workingResults = results.filter(r => r.available);
  
  console.log(`[ModelHealthService] Working models: ${workingResults.length}/${results.length}`);
  workingResults.forEach(r => {
    console.log(`  - ${r.modelId}: ${r.latency}ms`);
  });

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

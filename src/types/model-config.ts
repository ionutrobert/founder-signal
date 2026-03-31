/**
 * Model Configuration Types for 3-Phase Subrequest Validation
 * 
 * This module defines the type system for model rotation, health tracking,
 * and tier-based selection across NVIDIA NIM models.
 */

/**
 * Model tier classification with associated configuration
 */
export interface ModelTier {
  /** Tier identifier: S+ (highest), S, A, B, C (lowest) */
  tier: 'S+' | 'S' | 'A' | 'B' | 'C';
  /** Priority for selection (lower = higher priority) */
  priority: number;
  /** Maximum retry attempts before cascading to next tier */
  maxRetries: number;
  /** Request timeout in milliseconds */
  timeout: number;
}

/**
 * Health metrics tracked for each model
 */
export interface HealthMetrics {
  /** Timestamp of last successful interaction */
  lastSeen: number;
  /** 95th percentile latency in milliseconds */
  p95Latency: number;
  /** Latency jitter (standard deviation) in milliseconds */
  jitter: number;
  /** Rate of latency spikes (>2x p95) */
  spikeRate: number;
  /** Reliability score (0-1, higher = more reliable) */
  reliability: number;
  /** FCM-style stability score (0-100, higher = more stable) */
  stabilityScore: number;
  /** Timestamp of last health check */
  lastHealthCheck: number;
}

/**
 * Complete model configuration with tier and health tracking
 */
export interface ModelConfig {
  /** Unique model identifier */
  id: string;
  /** Tier configuration */
  tier: ModelTier;
  /** API endpoint URL */
  endpoint: string;
  /** Current health metrics */
  health: HealthMetrics;
  /** Context window size in tokens */
  contextWindow: number;
  /** Model priority for selection (lower = higher priority) */
  priority: number;
}

/**
 * Type guard to validate ModelConfig objects
 */
export function isModelConfig(obj: unknown): obj is ModelConfig {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const config = obj as Partial<ModelConfig>;

  return (
    typeof config.id === 'string' &&
    typeof config.tier === 'object' &&
    config.tier !== null &&
    typeof config.endpoint === 'string' &&
    typeof config.health === 'object' &&
    config.health !== null
  );
}

/**
 * Type guard to validate ModelTier objects
 */
export function isModelTier(obj: unknown): obj is ModelTier {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const tier = obj as Partial<ModelTier>;

  return (
    (tier.tier === 'S+' || tier.tier === 'S' || tier.tier === 'A' || tier.tier === 'B' || tier.tier === 'C') &&
    typeof tier.priority === 'number' &&
    typeof tier.maxRetries === 'number' &&
    typeof tier.timeout === 'number'
  );
}

/**
 * Type guard to validate HealthMetrics objects
 */
export function isHealthMetrics(obj: unknown): obj is HealthMetrics {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const metrics = obj as Partial<HealthMetrics>;

  return (
    typeof metrics.lastSeen === 'number' &&
    typeof metrics.p95Latency === 'number' &&
    typeof metrics.jitter === 'number' &&
    typeof metrics.spikeRate === 'number' &&
    typeof metrics.reliability === 'number'
  );
}

/**
 * Default health metrics for new models
 */
export const DEFAULT_HEALTH_METRICS: HealthMetrics = {
  lastSeen: 0,
  p95Latency: 0,
  jitter: 0,
  spikeRate: 0,
  reliability: 1.0,
};

/**
 * Tier configurations with default values
 */
export const TIER_CONFIGS: Record<ModelTier['tier'], ModelTier> = {
  'S+': {
    tier: 'S+',
    priority: 1,
    maxRetries: 5,
    timeout: 60000,
  },
  'S': {
    tier: 'S',
    priority: 2,
    maxRetries: 4,
    timeout: 90000,
  },
  'A': {
    tier: 'A',
    priority: 3,
    maxRetries: 3,
    timeout: 120000,
  },
  'B': {
    tier: 'B',
    priority: 4,
    maxRetries: 2,
    timeout: 150000,
  },
  'C': {
    tier: 'C',
    priority: 5,
    maxRetries: 1,
    timeout: 180000,
  },
};

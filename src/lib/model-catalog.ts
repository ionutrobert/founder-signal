import { ModelConfig, TIER_CONFIGS, DEFAULT_HEALTH_METRICS } from '../types/model-config';

const NIM_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';

/**
 * Model metadata interface for catalog entries
 */
export interface ModelMetadata {
  /** Unique model identifier */
  id: string;
  /** Tier classification: S+ (highest), S, A */
  tier: 'S+' | 'S' | 'A';
  /** Context window size in tokens */
  contextWindow: number;
  /** Priority for selection (lower = higher priority) */
  priority: number;
}

/**
 * S+ Tier Models - Highest quality coding models
 * These are the primary models for production use
 */
const S_PLUS_TIER_MODELS: ModelMetadata[] = [
  {
    id: 'moonshotai/kimi-k2.5',
    tier: 'S+',
    contextWindow: 200000,
    priority: 1,
  },
  {
    id: 'qwen/qwen3-coder-480b-a35b-instruct',
    tier: 'S+',
    contextWindow: 128000,
    priority: 2,
  },
  {
    id: 'z-ai/glm5',
    tier: 'S+',
    contextWindow: 128000,
    priority: 3,
  },
  {
    id: 'moonshotai/kimi-k2-thinking',
    tier: 'S+',
    contextWindow: 200000,
    priority: 4,
  },
  {
    id: 'z-ai/glm4.7',
    tier: 'S+',
    contextWindow: 128000,
    priority: 5,
  },
  {
    id: 'minimaxai/minimax-m2.5',
    tier: 'S+',
    contextWindow: 200000,
    priority: 6,
  },
];

/**
 * S Tier Models - Fallbacks when S+ models are unavailable
 * Solid performance, reliable for production
 */
const S_TIER_MODELS: ModelMetadata[] = [
  {
    id: 'anthropic/claude-3-5-sonnet',
    tier: 'S',
    contextWindow: 200000,
    priority: 1,
  },
  {
    id: 'google/gemini-1.5-pro',
    tier: 'S',
    contextWindow: 2000000,
    priority: 2,
  },
  {
    id: 'openai/gpt-4o',
    tier: 'S',
    contextWindow: 128000,
    priority: 3,
  },
  {
    id: 'qwen/qwen3-235b-a22b-instruct',
    tier: 'S',
    contextWindow: 128000,
    priority: 4,
  },
];

/**
 * A Tier Models - Last resort options
 * Acceptable quality when higher tiers exhausted
 */
const A_TIER_MODELS: ModelMetadata[] = [
  {
    id: 'mistralai/mistral-large',
    tier: 'A',
    contextWindow: 128000,
    priority: 1,
  },
  {
    id: 'meta/llama-3.1-405b-instruct',
    tier: 'A',
    contextWindow: 128000,
    priority: 2,
  },
  {
    id: 'deepseek/deepseek-v3',
    tier: 'A',
    contextWindow: 64000,
    priority: 3,
  },
];

/**
 * Complete model catalog with metadata
 * Exported for use by health service and other modules
 */
export const MODELS_WITH_METADATA: ModelMetadata[] = [
  ...S_PLUS_TIER_MODELS,
  ...S_TIER_MODELS,
  ...A_TIER_MODELS,
];

/**
 * Legacy S+ models array for backward compatibility
 * @deprecated Use MODELS_WITH_METADATA instead
 */
export const S_PLUS_MODELS: string[] = S_PLUS_TIER_MODELS.map(m => m.id);

function createModelConfig(metadata: ModelMetadata): ModelConfig {
  return {
    id: metadata.id,
    tier: TIER_CONFIGS[metadata.tier],
    endpoint: NIM_ENDPOINT,
    health: { ...DEFAULT_HEALTH_METRICS },
    contextWindow: metadata.contextWindow,
    priority: metadata.priority,
  };
}

let modelCatalog: ModelConfig[] | null = null;

export function getModelCatalog(): ModelConfig[] {
  if (modelCatalog !== null) {
    return modelCatalog;
  }

  modelCatalog = MODELS_WITH_METADATA.map(metadata => createModelConfig(metadata));

  return modelCatalog;
}

export function getModelById(id: string): ModelConfig | undefined {
  return getModelCatalog().find(model => model.id === id);
}

export function getModelsByTier(tier: 'S+' | 'S' | 'A'): ModelConfig[] {
  return getModelCatalog().filter(model => model.tier.tier === tier);
}

export function getAllModels(): ModelConfig[] {
  return getModelCatalog();
}

/**
 * @deprecated Use getModelsByTier('S+') instead
 */
export function getAllSPlusModels(): ModelConfig[] {
  return getModelsByTier('S+');
}

/**
 * @deprecated Use getModelsByTier('S') instead
 */
export function getAllSModels(): ModelConfig[] {
  return getModelsByTier('S');
}

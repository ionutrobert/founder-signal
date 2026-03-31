import { ModelConfig, TIER_CONFIGS, DEFAULT_HEALTH_METRICS } from '../types/model-config';

const NIM_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';

/**
 * Model metadata interface for catalog entries
 */
export interface ModelMetadata {
  id: string;
  tier: 'S+' | 'S' | 'A';
  contextWindow: number;
  priority: number;
}

/**
 * S+ Tier Models - VERIFIED WORKING on NVIDIA NIM
 * 
 * PERFORMANCE UPDATE (2026-03-31 14:30 UTC):
 * - mistralai/mistral-small-4-119b-2603: 1353ms (fastest now)
 * - qwen/qwen3.5-122b-a10b: 1773ms
 * - qwen/qwen3-coder-480b-a35b-instruct: 2265ms (slower than before)
 * 
 * INTERMITTENT/TIMING OUT:
 * - mistralai/mistral-large-3-675b-instruct-2512: 10s timeout (moved to S tier)
 */
const S_PLUS_TIER_MODELS: ModelMetadata[] = [
  // Primary models - consistently working
  { id: 'qwen/qwen3-coder-480b-a35b-instruct', tier: 'S+', contextWindow: 128000, priority: 1 },
  { id: 'mistralai/mistral-small-4-119b-2603', tier: 'S+', contextWindow: 128000, priority: 2 },
  { id: 'qwen/qwen3.5-122b-a10b', tier: 'S+', contextWindow: 128000, priority: 3 },
];

/**
 * S Tier Models - Intermittent, may recover
 * These models sometimes work, sometimes timeout or return empty
 */
const S_TIER_MODELS: ModelMetadata[] = [
  { id: 'mistralai/mistral-large-3-675b-instruct-2512', tier: 'S', contextWindow: 128000, priority: 4 },
  { id: 'z-ai/glm5', tier: 'S', contextWindow: 128000, priority: 5 },
  { id: 'moonshotai/kimi-k2.5', tier: 'S', contextWindow: 200000, priority: 6 },
  { id: 'z-ai/glm4.7', tier: 'S', contextWindow: 128000, priority: 7 },
  { id: 'moonshotai/kimi-k2-thinking', tier: 'S', contextWindow: 200000, priority: 8 },
];

/**
 * A Tier Models - Last resort
 */
const A_TIER_MODELS: ModelMetadata[] = [
  { id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', tier: 'A', contextWindow: 128000, priority: 9 },
];

/**
 * Complete model catalog with metadata
 */
export const MODELS_WITH_METADATA: ModelMetadata[] = [
  ...S_PLUS_TIER_MODELS,
  ...S_TIER_MODELS,
  ...A_TIER_MODELS,
];

/**
 * Legacy S+ models array for backward compatibility
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

export function getAllSPlusModels(): ModelConfig[] {
  return getModelsByTier('S+');
}

export function getAllSModels(): ModelConfig[] {
  return getModelsByTier('S');
}

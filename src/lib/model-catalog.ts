import { ModelConfig, TIER_CONFIGS, DEFAULT_HEALTH_METRICS } from '../types/model-config';

const NIM_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';

// Your confirmed models (S+ tier)
export const S_PLUS_MODELS = [
  'moonshotai/kimi-k2-thinking',
  'z-ai/glm4.7',
  'z-ai/glm5',
  'minimaxai/minimax-m2.5',
  'qwen/qwen3-coder-480b-a35b-instruct',
];

// Fallback models (S tier) - same models for rotation
const S_MODELS: string[] = [];

function createModelConfig(id: string, tier: 'S+' | 'S'): ModelConfig {
  return {
    id,
    tier: TIER_CONFIGS[tier],
    endpoint: NIM_ENDPOINT,
    health: { ...DEFAULT_HEALTH_METRICS },
  };
}

let modelCatalog: ModelConfig[] | null = null;

export function getModelCatalog(): ModelConfig[] {
  if (modelCatalog !== null) {
    return modelCatalog;
  }

  modelCatalog = [
    ...S_PLUS_MODELS.map(id => createModelConfig(id, 'S+')),
    ...S_MODELS.map(id => createModelConfig(id, 'S')),
  ];

  return modelCatalog;
}

export function getModelById(id: string): ModelConfig | undefined {
  return getModelCatalog().find(model => model.id === id);
}

export function getModelsByTier(tier: 'S+' | 'S'): ModelConfig[] {
  return getModelCatalog().filter(model => model.tier.tier === tier);
}

export function getAllSPlusModels(): ModelConfig[] {
  return getModelsByTier('S+');
}

export function getAllSModels(): ModelConfig[] {
  return getModelsByTier('S');
}

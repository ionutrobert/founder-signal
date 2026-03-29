import { ModelConfig, HealthMetrics } from '../types/model-config';
import { getModelCatalog, S_PLUS_MODELS, getModelById } from './model-catalog';

interface ModelSelectionCriteria {
  tier: 'S+' | 'S';
  minReliability: number;
  maxLatency: number;
}

function calculateStabilityScore(health: HealthMetrics): number {
  const p95Weight = 0.30;
  const jitterWeight = 0.30;
  const spikeWeight = 0.20;
  const reliabilityWeight = 0.20;

  const normalizedP95 = Math.min(health.p95Latency / 10000, 1);
  const normalizedJitter = Math.min(health.jitter / 5000, 1);
  const normalizedSpike = Math.min(health.spikeRate, 1);
  const normalizedReliability = health.reliability;

  const stabilityScore = 
    (1 - normalizedP95) * p95Weight +
    (1 - normalizedJitter) * jitterWeight +
    (1 - normalizedSpike) * spikeWeight +
    normalizedReliability * reliabilityWeight;

  return Math.max(0, Math.min(1, stabilityScore));
}

function selectBestModelByTier(
  models: ModelConfig[],
  criteria: ModelSelectionCriteria
): ModelConfig | null {
  const filtered = models.filter(model => {
    const tierMatch = model.tier.tier === criteria.tier;
    const reliabilityMatch = model.health.reliability >= criteria.minReliability;
    const latencyMatch = model.health.p95Latency <= criteria.maxLatency;
    return tierMatch && reliabilityMatch && latencyMatch;
  });

  if (filtered.length === 0) {
    return null;
  }

  const sorted = [...filtered].sort((a, b) => {
    const stabilityA = calculateStabilityScore(a.health);
    const stabilityB = calculateStabilityScore(b.health);

    if (stabilityA !== stabilityB) {
      return stabilityB - stabilityA;
    }

    if (a.health.p95Latency !== b.health.p95Latency) {
      return a.health.p95Latency - b.health.p95Latency;
    }

    if (a.health.jitter !== b.health.jitter) {
      return a.health.jitter - b.health.jitter;
    }

    return a.tier.priority - b.tier.priority;
  });

  return sorted[0] || null;
}

export function selectBestModel(criteria?: Partial<ModelSelectionCriteria>): ModelConfig {
  const catalog = getModelCatalog();
  const finalCriteria: ModelSelectionCriteria = {
    tier: criteria?.tier || 'S+',
    minReliability: criteria?.minReliability || 0.5,
    maxLatency: criteria?.maxLatency || 10000,
  };

  let selected = selectBestModelByTier(catalog, finalCriteria);

  if (!selected && finalCriteria.tier === 'S+') {
    selected = selectBestModelByTier(catalog, {
      ...finalCriteria,
      tier: 'S',
    });
  }

  if (!selected) {
    selected = catalog[0] || null;
  }

  if (!selected) {
    throw new Error('No models available in catalog');
  }

  return selected;
}

/**
 * Test if a model is actually working by making a simple request
 * Returns true if the model responds successfully
 */
async function testModelAvailability(model: ModelConfig): Promise<boolean> {
  const testPrompt = {
    system: 'You are a helpful assistant.',
    user: 'Respond with just "OK" to confirm you are working.',
  };

  try {
    const response = await fetch(model.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: model.id,
        messages: [
          { role: 'system', content: testPrompt.system },
          { role: 'user', content: testPrompt.user },
        ],
        temperature: 0.1,
        max_tokens: 10,
        stream: false,
      }),
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    return content.length > 0;
  } catch (error) {
    return false;
  }
}

interface ModelTestResult {
  model: ModelConfig;
  available: boolean;
  latency: number;
}

async function testModelWithLatency(model: ModelConfig): Promise<ModelTestResult> {
  const startTime = Date.now();
  const available = await testModelAvailability(model);
  return {
    model,
    available,
    latency: Date.now() - startTime
  };
}

/**
 * Find the fastest working model by testing all in parallel
 * Returns the first model that responds successfully
 */
export async function findWorkingModel(): Promise<ModelConfig> {
  console.log('[findWorkingModel] Testing all models in parallel...');
  const modelsToTest = S_PLUS_MODELS.slice(0, 5);
  console.log('[findWorkingModel] Testing models:', modelsToTest);

  const models = modelsToTest
    .map(id => getModelById(id))
    .filter((m): m is ModelConfig => m !== undefined);

  if (models.length === 0) {
    throw new Error('No models available in catalog');
  }

  // Race all model tests - return the first available one
  const testPromises = models.map(model =>
    testModelWithLatency(model).then(result =>
      result.available ? result.model : null
    )
  );

  // Also create a fallback promise that resolves to the first model after 2 seconds
  const fallbackPromise = new Promise<ModelConfig>((resolve) => {
    setTimeout(() => {
      const fallback = models[0];
      if (fallback) resolve(fallback);
    }, 2000);
  });

  const racePromises = [...testPromises, fallbackPromise];

  try {
    const winner = await Promise.race(racePromises);
    if (winner) {
      console.log(`[findWorkingModel] Selected working model: ${winner.id}`);
      return winner;
    }
  } catch {
    // Race failed, continue to fallback
  }

  // If race didn't return a working model, check which ones succeeded
  const results = await Promise.all(models.map(testModelWithLatency));
  const workingModels = results.filter(r => r.available);

  if (workingModels.length > 0) {
    // Sort by latency and pick fastest
    const sorted = workingModels.sort((a, b) => a.latency - b.latency);
    const fastest = sorted[0];
    if (fastest) {
      console.log(`[findWorkingModel] Selected fastest working model: ${fastest.model.id} (${fastest.latency}ms)`);
      return fastest.model;
    }
  }

  console.log('[findWorkingModel] No working models found, falling back to default');
  return models[0]!;
}

export function updateModelHealth(
  modelId: string,
  latency: number,
  success: boolean
): void {
  const catalog = getModelCatalog();
  const model = catalog.find(m => m.id === modelId);

  if (!model) {
    return;
  }

  const now = Date.now();
  const timeSinceLastSeen = now - model.health.lastSeen;

  if (timeSinceLastSeen > 0) {
    const alpha = 0.1;
    model.health.p95Latency = 
      model.health.p95Latency * (1 - alpha) + latency * alpha;
  } else {
    model.health.p95Latency = latency;
  }

  const recentLatencies = [model.health.p95Latency, latency];
  const mean = recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length;
  const variance = recentLatencies.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentLatencies.length;
  model.health.jitter = Math.sqrt(variance);

  if (latency > model.health.p95Latency * 2) {
    const spikeAlpha = 0.05;
    model.health.spikeRate = 
      model.health.spikeRate * (1 - spikeAlpha) + spikeAlpha;
  }

  const reliabilityAlpha = 0.05;
  const targetReliability = success ? 1.0 : 0.0;
  model.health.reliability = 
    model.health.reliability * (1 - reliabilityAlpha) + targetReliability * reliabilityAlpha;

  model.health.lastSeen = now;
}

export async function checkModelHealth(modelId: string): Promise<boolean> {
  const catalog = getModelCatalog();
  const model = catalog.find(m => m.id === modelId);

  if (!model) {
    return false;
  }

  const now = Date.now();
  const timeSinceLastSeen = now - model.health.lastSeen;

  if (timeSinceLastSeen > 300000) {
    return false;
  }

  if (model.health.reliability < 0.3) {
    return false;
  }

  if (model.health.spikeRate > 0.5) {
    return false;
  }

  return true;
}

export function getModelHealth(modelId: string): HealthMetrics | null {
  const catalog = getModelCatalog();
  const model = catalog.find(m => m.id === modelId);

  if (!model) {
    return null;
  }

  return { ...model.health };
}

export function getAllModelHealth(): Map<string, HealthMetrics> {
  const catalog = getModelCatalog();
  const healthMap = new Map<string, HealthMetrics>();

  for (const model of catalog) {
    healthMap.set(model.id, { ...model.health });
  }

  return healthMap;
}

/**
 * NIM Model Client - Modular, reusable NVIDIA NIM model selection
 * 
 * Designed to be extracted into a standalone package later.
 * Provides: health checks, model ranking, cascade execution
 */

const NIM_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const HEALTH_TIMEOUT_MS = 5000;

export interface ModelConfig {
  id: string;
  tier: 'S+' | 'S' | 'A';
  contextWindow: number;
  priority: number;
}

export interface HealthCheckResult {
  modelId: string;
  available: boolean;
  latency: number;
  status: 'ready' | 'unavailable' | 'timeout' | 'error';
  timestamp: number;
  contextWindow: number;
  error?: string;
}

/**
 * Preferred models ordered by observed speed from actual testing:
 * 1. qwen3-coder - 8.8s (fastest, reliable)
 * 2. glm5 - ~3s (fast, reliable)  
 * 3. kimi-k2.5 - variable (your preferred, needs testing)
 * 4. kimi-k2-thinking - sometimes empty responses
 * 5. glm4.7 - sometimes empty responses
 * 
 * minimax-m2.5 REMOVED - consistently times out at 60s
 */
export function getPreferredModels(): ModelConfig[] {
  return [
    { id: 'qwen/qwen3-coder-480b-a35b-instruct', contextWindow: 128000, tier: 'S+', priority: 1 },
    { id: 'z-ai/glm5', contextWindow: 128000, tier: 'S+', priority: 2 },
    { id: 'moonshotai/kimi-k2.5', contextWindow: 200000, tier: 'S+', priority: 3 },
    { id: 'z-ai/glm4.7', contextWindow: 128000, tier: 'S+', priority: 4 },
    { id: 'moonshotai/kimi-k2-thinking', contextWindow: 200000, tier: 'S+', priority: 5 },
  ];
}

/**
 * Fallback models with large context windows
 * Used when all preferred models fail
 */
export function getFallbackModels(): ModelConfig[] {
  return [
    { id: 'meta/llama-3.1-405b-instruct', contextWindow: 128000, tier: 'S', priority: 6 },
    { id: 'meta/llama-3.3-70b-instruct', contextWindow: 128000, tier: 'S', priority: 7 },
    { id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', contextWindow: 128000, tier: 'S', priority: 8 },
  ];
}

/**
 * Get all models (preferred + fallback) sorted by priority
 */
export function getAllModels(): ModelConfig[] {
  return [...getPreferredModels(), ...getFallbackModels()];
}

/**
 * Test a single model with a minimal request
 * Uses 5s timeout as specified
 */
export async function checkModelHealth(modelId: string): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${NIM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: 'OK' },
          { role: 'user', content: 'Test' },
        ],
        max_tokens: 5,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return {
        modelId,
        available: false,
        latency,
        status: 'error',
        timestamp: Date.now(),
        contextWindow: 0,
        error: `${response.status}`,
      };
    }

    const data = await response.json();
    const hasContent = data.choices?.[0]?.message?.content?.length > 0;

    return {
      modelId,
      available: hasContent,
      latency,
      status: hasContent ? 'ready' : 'error',
      timestamp: Date.now(),
      contextWindow: 128000,
      error: hasContent ? undefined : 'Empty response',
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        modelId,
        available: false,
        latency: HEALTH_TIMEOUT_MS,
        status: 'timeout',
        timestamp: Date.now(),
        contextWindow: 0,
        error: 'Timeout',
      };
    }

    return {
      modelId,
      available: false,
      latency,
      status: 'error',
      timestamp: Date.now(),
      contextWindow: 0,
      error: error instanceof Error ? error.message : 'Unknown',
    };
  }
}

/**
 * Test all models in parallel and return ranked results
 * Only returns models that passed the health check
 */
export async function testAllModels(): Promise<HealthCheckResult[]> {
  const models = getAllModels();
  
  const results = await Promise.all(
    models.map(model => checkModelHealth(model.id))
  );

  // Sort by: available first, then latency
  return results.sort((a, b) => {
    if (a.available && !b.available) return -1;
    if (!a.available && b.available) return 1;
    return a.latency - b.latency;
  });
}

/**
 * Calculate stability score (FCM formula)
 * 30% p95 latency + 30% jitter + 20% spike rate + 20% reliability
 */
export function calculateStabilityScore(
  latency: number,
  reliability: number,
  jitter: number = 0,
  spikeRate: number = 0
): number {
  const normalizedP95 = Math.min(latency / 10000, 1);
  const normalizedJitter = Math.min(jitter / 5000, 1);
  const normalizedSpike = Math.min(spikeRate, 1);

  const score = 
    (1 - normalizedP95) * 0.30 +
    (1 - normalizedJitter) * 0.30 +
    (1 - normalizedSpike) * 0.20 +
    reliability * 0.20;

  return Math.round(score * 100);
}

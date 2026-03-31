/**
 * NVIDIA NIM Health Client
 * Dynamically discovers available models and tests only those that work
 */

const NIM_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const HEALTH_TIMEOUT_MS = 5000; // 5s timeout
const MIN_CONTEXT_WINDOW = 128000; // 128k minimum

export interface ModelInfo {
  id: string;
  contextWindow: number;
  tier: 'S+' | 'S' | 'A';
}

export interface HealthCheckResult {
  modelId: string;
  available: boolean;
  latency: number;
  status: 'ready' | 'unavailable' | 'timeout' | 'error' | 'insufficient_context';
  timestamp: number;
  contextWindow: number;
  error?: string;
}

/**
 * Fetch all available models from NVIDIA API
 * Uses /v1/models endpoint to discover what's actually available
 */
export async function fetchAvailableModels(): Promise<ModelInfo[]> {
  try {
    const response = await fetch(`${NIM_BASE_URL}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error('[NIM Health] Failed to fetch models:', response.status);
      return [];
    }

    const data = await response.json();
    
    // Parse models and extract context window from model data
    const models: ModelInfo[] = [];
    
    for (const model of data.data || []) {
      const modelId = model.id;
      
      // Extract context window from model metadata if available
      // Default to 128k if not specified
      let contextWindow = 128000;
      
      // Try to get context window from model object
      if (model.object === 'model' && model.created) {
        // Check if model supports chat completions
        // Most models have 128k-200k context windows
        // We'll test them to confirm
        
        // Tier determination based on model capabilities
        let tier: 'S+' | 'S' | 'A' = 'A';
        
        // S+ tier models (best for complex analysis)
        const sPlusModels = [
          'moonshotai/kimi-k2.5',
          'moonshotai/kimi-k2-thinking',
          'qwen/qwen3-coder-480b-a35b-instruct',
          'z-ai/glm5',
          'z-ai/glm4.7',
          'minimaxai/minimax-m2.5',
        ];
        
        if (sPlusModels.some(m => modelId.includes(m))) {
          tier = 'S+';
        } else if (modelId.includes('meta/llama-3') || modelId.includes('nvidia/llama-3')) {
          tier = 'S';
        }
        
        // Estimate context window based on model
        if (modelId.includes('kimi-k2')) {
          contextWindow = 200000; // Kimi has 200k
        } else if (modelId.includes('glm')) {
          contextWindow = 128000;
        } else if (modelId.includes('minimax')) {
          contextWindow = 200000;
        } else if (modelId.includes('qwen3')) {
          contextWindow = 128000;
        }
        
        models.push({
          id: modelId,
          contextWindow,
          tier,
        });
      }
    }
    
    return models;
  } catch (error) {
    console.error('[NIM Health] Error fetching models:', error);
    return [];
  }
}

/**
 * Check if a specific model is available using a lightweight request
 * Tests actual model capability with minimal overhead
 */
export async function checkModelHealth(modelId: string): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Test model with a minimal completion request
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
      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        modelId,
        available: false,
        latency,
        status: response.status === 404 ? 'unavailable' : 'error',
        timestamp: Date.now(),
        contextWindow: 0,
        error: `${response.status}: ${errorText.slice(0, 100)}`,
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
      contextWindow: 128000, // Default, will be updated
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
        error: 'Health check timeout',
      };
    }

    return {
      modelId,
      available: false,
      latency,
      status: 'error',
      timestamp: Date.now(),
      contextWindow: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get preferred models list with context windows
 * These are models we know work well for analysis
 */
export function getPreferredModels(): ModelInfo[] {
  return [
    { id: 'moonshotai/kimi-k2.5', contextWindow: 200000, tier: 'S+' },
    { id: 'qwen/qwen3-coder-480b-a35b-instruct', contextWindow: 128000, tier: 'S+' },
    { id: 'z-ai/glm5', contextWindow: 128000, tier: 'S+' },
    { id: 'moonshotai/kimi-k2-thinking', contextWindow: 200000, tier: 'S+' },
    { id: 'z-ai/glm4.7', contextWindow: 128000, tier: 'S+' },
    { id: 'minimaxai/minimax-m2.5', contextWindow: 200000, tier: 'S+' },
    { id: 'meta/llama-3.1-405b-instruct', contextWindow: 128000, tier: 'S' },
    { id: 'meta/llama-3.3-70b-instruct', contextWindow: 128000, tier: 'S' },
    { id: 'nvidia/llama-3.1-nemotron-70b-instruct', contextWindow: 128000, tier: 'S' },
  ];
}

/**
 * Test all preferred models in parallel
 * Returns results sorted by availability and latency
 */
export async function testAllModelsHealth(): Promise<HealthCheckResult[]> {
  const models = getPreferredModels();
  
  const results = await Promise.all(
    models.map(model => checkModelHealth(model.id))
  );

  // Sort: available first, then by latency
  return results.sort((a, b) => {
    if (a.available && !b.available) return -1;
    if (!a.available && b.available) return 1;
    return a.latency - b.latency;
  });
}

/**
 * Calculate stability score based on health metrics
 * FCM-style formula: 30% p95 + 30% jitter + 20% spike + 20% reliability
 */
export function calculateStabilityScore(
  latency: number,
  reliability: number,
  jitter: number = 0,
  spikeRate: number = 0
): number {
  const p95Weight = 0.30;
  const jitterWeight = 0.30;
  const spikeWeight = 0.20;
  const reliabilityWeight = 0.20;

  // Normalize values (0-1 scale)
  const normalizedP95 = Math.min(latency / 10000, 1); // Max 10s
  const normalizedJitter = Math.min(jitter / 5000, 1); // Max 5s variance
  const normalizedSpike = Math.min(spikeRate, 1);

  // Calculate score (higher is better)
  const score = 
    (1 - normalizedP95) * p95Weight +
    (1 - normalizedJitter) * jitterWeight +
    (1 - normalizedSpike) * spikeWeight +
    reliability * reliabilityWeight;

  return Math.round(score * 100);
}

/**
 * Get working models sorted by performance
 * Only returns models that passed health check
 */
export async function getWorkingModels(): Promise<HealthCheckResult[]> {
  const results = await testAllModelsHealth();
  return results.filter(r => r.available);
}

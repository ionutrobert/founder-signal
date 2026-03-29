import { ModelConfig } from '../types/model-config';
import { getModelById, S_PLUS_MODELS } from './model-catalog';

interface TestResult {
  model: ModelConfig;
  available: boolean;
  latency: number;
}

let cachedWorkingModel: ModelConfig | null = null;
let lastTestTime = 0;
const CACHE_TTL = 30000; // 30 seconds

async function testSingleModel(model: ModelConfig): Promise<TestResult> {
  const start = Date.now();

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
          { role: 'system', content: 'Say OK' },
          { role: 'user', content: 'Test' },
        ],
        temperature: 0.1,
        max_tokens: 5,
        stream: false,
      }),
      signal: AbortSignal.timeout(2000),
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      return { model, available: false, latency };
    }

    const data = await response.json();
    const hasContent = data.choices?.[0]?.message?.content?.length > 0;

    return { model, available: hasContent, latency };
  } catch {
    return { model, available: false, latency: Date.now() - start };
  }
}

export async function refreshWorkingModel(): Promise<ModelConfig> {
  const now = Date.now();

  if (cachedWorkingModel && now - lastTestTime < CACHE_TTL) {
    return cachedWorkingModel;
  }

  const models = S_PLUS_MODELS
    .map(id => getModelById(id))
    .filter((m): m is ModelConfig => m !== undefined);

  if (models.length === 0) {
    throw new Error('No models available');
  }

  const results = await Promise.all(models.map(testSingleModel));
  const working = results.filter(r => r.available);

  if (working.length === 0) {
    cachedWorkingModel = models[0]!;
    lastTestTime = now;
    return cachedWorkingModel;
  }

  const fastest = working.sort((a, b) => a.latency - b.latency)[0];
  if (!fastest) {
    cachedWorkingModel = models[0]!;
    lastTestTime = now;
    return cachedWorkingModel;
  }
  cachedWorkingModel = fastest.model;
  lastTestTime = now;

  return cachedWorkingModel;
}

export function getCachedModel(): ModelConfig | null {
  return cachedWorkingModel;
}

export function invalidateCachedModel(): void {
  cachedWorkingModel = null;
}

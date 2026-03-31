/**
 * AI Provider Interface - Modular Multi-Provider Architecture
 * 
 * Designed to be extracted into a standalone package.
 * Supports multiple providers (NVIDIA, OpenCode Go, OpenCode Zen, etc.)
 * with automatic rotation, health checks, and failover.
 * 
 * Usage:
 * ```typescript
 * const manager = new ProviderManager([
 *   new NIMProvider({ apiKey: process.env.NVIDIA_API_KEY }),
 *   new OpenCodeGoProvider({ apiKey: process.env.OPENCODE_API_KEY }),
 *   new OpenCodeZenProvider({ apiKey: process.env.OPENCODE_API_KEY }),
 * ]);
 * 
 * const result = await manager.execute(prompt, { maxTokens: 4000 });
 * ```
 */

export interface ProviderModel {
  id: string;
  providerId: string;
  contextWindow: number;
  latency?: number;
  available?: boolean;
}

export interface HealthCheckResult {
  modelId: string;
  providerId: string;
  available: boolean;
  latency: number;
  status: 'ready' | 'timeout' | 'error';
  timestamp: number;
  contextWindow: number;
  error?: string;
}

export interface ProviderConfig {
  /** Provider identifier */
  id: string;
  /** API key for authentication */
  apiKey: string;
  /** Base URL for API */
  baseUrl: string;
  /** Health check timeout in ms */
  healthTimeout?: number;
  /** Request timeout in ms */
  requestTimeout?: number;
  /** Models available from this provider */
  models: ProviderModel[];
  /** Custom headers for API requests */
  headers?: Record<string, string>;
}

export interface CompletionRequest {
  /** Model ID to use */
  model: string;
  /** Messages to send */
  messages: Array<{ role: string; content: string }>;
  /** Temperature (0-1) */
  temperature?: number;
  /** Max tokens to generate */
  maxTokens?: number;
  /** Whether to stream */
  stream?: boolean;
}

export interface CompletionResponse {
  /** Generated content */
  content: string;
  /** Model ID used */
  model: string;
  /** Provider ID used */
  providerId: string;
  /** Latency in ms */
  latency: number;
  /** Token usage */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamingCallbacks {
  onChunk?: (chunk: string) => void | Promise<void>;
  onComplete?: () => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
}

/**
 * Abstract base class for AI providers
 * Extend this to add new providers (OpenCode Go, OpenCode Zen, etc.)
 */
export abstract class AIProvider {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  get id(): string {
    return this.config.id;
  }

  get models(): ProviderModel[] {
    return this.config.models;
  }

  /**
   * Check health of a single model
   */
  async checkModelHealth(modelId: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timeout = this.config.healthTimeout || 2000;

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...this.config.headers,
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
        signal: AbortSignal.timeout(timeout),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        return {
          modelId,
          providerId: this.id,
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
        providerId: this.id,
        available: hasContent,
        latency,
        status: hasContent ? 'ready' : 'error',
        timestamp: Date.now(),
        contextWindow: this.config.models.find(m => m.id === modelId)?.contextWindow || 128000,
        error: hasContent ? undefined : 'Empty response',
      };
    } catch (error) {
      const latency = Date.now() - startTime;

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          modelId,
          providerId: this.id,
          available: false,
          latency: timeout,
          status: 'timeout',
          timestamp: Date.now(),
          contextWindow: 0,
          error: 'Timeout',
        };
      }

      return {
        modelId,
        providerId: this.id,
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
   * Test all models in parallel
   */
  async testAllModels(): Promise<HealthCheckResult[]> {
    return Promise.all(
      this.config.models.map(model => this.checkModelHealth(model.id))
    );
  }

  /**
   * Execute a completion request
   */
  abstract execute(request: CompletionRequest): Promise<CompletionResponse>;

  /**
   * Execute a streaming completion request
   */
  abstract executeStreaming(
    request: CompletionRequest,
    callbacks: StreamingCallbacks,
    signal?: AbortSignal
  ): Promise<void>;
}

/**
 * NVIDIA NIM Provider Implementation
 */
export class NIMProvider extends AIProvider {
  constructor(config: Omit<ProviderConfig, 'baseUrl' | 'id'> & { id?: string; baseUrl?: string }) {
    super({
      ...config,
      id: config.id || 'nvidia-nim',
      baseUrl: config.baseUrl || 'https://integrate.api.nvidia.com/v1',
    });
  }

  async execute(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();
    const timeout = this.config.requestTimeout || 60000;

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...this.config.headers,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4000,
        stream: false,
      }),
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      throw new Error(`NIM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    return {
      content: data.choices?.[0]?.message?.content || '',
      model: request.model,
      providerId: this.id,
      latency,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  async executeStreaming(
    request: CompletionRequest,
    callbacks: StreamingCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...this.config.headers,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4000,
        stream: true,
      }),
      signal: signal || AbortSignal.timeout(this.config.requestTimeout || 60000),
    });

    if (!response.ok) {
      throw new Error(`NIM API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              await callbacks.onComplete?.();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const chunk = parsed.choices?.[0]?.delta?.content;
              if (chunk) {
                await callbacks.onChunk?.(chunk);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        await callbacks.onError?.(error as Error);
      }
    }
  }
}

/**
 * OpenCode Go Provider Implementation
 * Uses the same API structure as OpenCode Zen but different endpoint
 */
export class OpenCodeGoProvider extends AIProvider {
  constructor(config: Omit<ProviderConfig, 'baseUrl' | 'id'> & { id?: string; baseUrl?: string }) {
    super({
      ...config,
      id: config.id || 'opencode-go',
      baseUrl: config.baseUrl || 'https://api.opencode.ai/v1/go',
    });
  }

  async execute(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();
    const timeout = this.config.requestTimeout || 60000;

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...this.config.headers,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4000,
        stream: false,
      }),
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      throw new Error(`OpenCode Go API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    return {
      content: data.choices?.[0]?.message?.content || '',
      model: request.model,
      providerId: this.id,
      latency,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  async executeStreaming(
    request: CompletionRequest,
    callbacks: StreamingCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    // Same streaming implementation as NIM (OpenAI-compatible)
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...this.config.headers,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4000,
        stream: true,
      }),
      signal: signal || AbortSignal.timeout(this.config.requestTimeout || 60000),
    });

    if (!response.ok) {
      throw new Error(`OpenCode Go API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              await callbacks.onComplete?.();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const chunk = parsed.choices?.[0]?.delta?.content;
              if (chunk) await callbacks.onChunk?.(chunk);
            } catch {}
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        await callbacks.onError?.(error as Error);
      }
    }
  }
}

/**
 * OpenCode Zen Provider Implementation
 */
export class OpenCodeZenProvider extends OpenCodeGoProvider {
  constructor(config: Omit<ProviderConfig, 'baseUrl' | 'id'> & { id?: string; baseUrl?: string }) {
    super({
      ...config,
      id: config.id || 'opencode-zen',
      baseUrl: config.baseUrl || 'https://api.opencode.ai/v1/zen',
    });
  }
}

/**
 * Provider Manager - Orchestrates multiple providers
 * Handles health checks, model ranking, and failover across all providers
 */
export class ProviderManager {
  private providers: AIProvider[];
  private rankedModels: (ProviderModel & { provider: AIProvider })[] = [];
  private lastHealthCheck: number = 0;
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

  constructor(providers: AIProvider[]) {
    this.providers = providers;
  }

  /**
   * Get all available models across all providers
   */
  getAllModels(): (ProviderModel & { provider: AIProvider })[] {
    return this.providers.flatMap(provider =>
      provider.models.map(model => ({
        ...model,
        provider,
      }))
    );
  }

  /**
   * Run health checks across all providers and models
   */
  async runHealthChecks(): Promise<HealthCheckResult[]> {
    console.log(`[ProviderManager] Running health checks across ${this.providers.length} providers...`);
    const startTime = Date.now();

    const allResults = await Promise.all(
      this.providers.map(provider => provider.testAllModels())
    );

    const results = allResults.flat();
    const duration = Date.now() - startTime;

    console.log(`[ProviderManager] Health checks completed in ${duration}ms`);
    console.log(`[ProviderManager] Working models: ${results.filter(r => r.available).length}/${results.length}`);

    // Rank by: available first, then latency
    const working = results.filter(r => r.available);
    working.sort((a, b) => a.latency - b.latency);

    console.log('[ProviderManager] Top 5 fastest models:');
    working.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.providerId}/${r.modelId}: ${r.latency}ms`);
    });

    this.lastHealthCheck = Date.now();
    this.rankedModels = working.map(result => {
      const provider = this.providers.find(p => p.id === result.providerId)!;
      const model = provider.models.find(m => m.id === result.modelId)!;
      return { ...model, provider, latency: result.latency, available: true };
    });

    return results;
  }

  /**
   * Get ranked models (cached or fresh)
   */
  async getRankedModels(): Promise<(ProviderModel & { provider: AIProvider })[]> {
    if (this.rankedModels.length === 0 || Date.now() - this.lastHealthCheck > this.CACHE_TTL_MS) {
      await this.runHealthChecks();
    }
    return this.rankedModels;
  }

  /**
   * Execute a completion with automatic failover across all providers
   */
  async execute(
    request: Omit<CompletionRequest, 'model'>,
    options?: { maxAttempts?: number; minContextWindow?: number }
  ): Promise<CompletionResponse> {
    const models = await this.getRankedModels();
    const maxAttempts = options?.maxAttempts || models.length;
    const minContextWindow = options?.minContextWindow || 0;

    // Filter by context window requirement
    const eligibleModels = models.filter(m => m.contextWindow >= minContextWindow);

    let lastError: Error | null = null;

    for (let i = 0; i < Math.min(maxAttempts, eligibleModels.length); i++) {
      const model = eligibleModels[i]!;
      try {
        console.log(`[ProviderManager] Trying ${model.providerId}/${model.id} (attempt ${i + 1}/${maxAttempts})`);
        const result = await model.provider.execute({
          ...request,
          model: model.id,
        });
        console.log(`[ProviderManager] Success with ${model.providerId}/${model.id} (${result.latency}ms)`);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`[ProviderManager] ${model.providerId}/${model.id} failed: ${(error as Error).message}`);
      }
    }

    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
  }

  /**
   * Get provider statistics
   */
  getStats() {
    return {
      providers: this.providers.length,
      totalModels: this.getAllModels().length,
      workingModels: this.rankedModels.length,
      lastHealthCheck: this.lastHealthCheck,
      cacheAge: Date.now() - this.lastHealthCheck,
    };
  }
}

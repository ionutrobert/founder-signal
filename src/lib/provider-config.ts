/**
 * AI Provider Configuration
 * 
 * Supports multiple providers with automatic key rotation:
 * - NVIDIA NIM
 * - OpenCode Go
 * - OpenCode Zen
 * 
 * All providers use OpenAI-compatible API format.
 * Keys are loaded from environment variables.
 */

import { 
  ProviderManager, 
  NIMProvider, 
  OpenCodeGoProvider, 
  OpenCodeZenProvider,
  AIProvider 
} from './ai-providers';

/**
 * Create provider manager from environment variables
 * 
 * Supports:
 * - NVIDIA_API_KEY (required)
 * - OPENCODE_API_KEY (optional)
 * - OPENCODE_GO_BASE_URL (optional, defaults to https://api.opencode.ai/v1/go)
 * - OPENCODE_ZEN_BASE_URL (optional, defaults to https://api.opencode.ai/v1/zen)
 */
export function createProviderManager(): ProviderManager {
  const providers: AIProvider[] = [];

  // NVIDIA NIM Provider
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (nvidiaKey) {
    console.log('[ProviderConfig] Adding NVIDIA NIM provider');
    providers.push(new NIMProvider({
      apiKey: nvidiaKey,
      models: [
        { id: 'mistralai/mistral-small-4-119b-2603', providerId: 'nvidia-nim', contextWindow: 128000 },
        { id: 'z-ai/glm5', providerId: 'nvidia-nim', contextWindow: 128000 },
        { id: 'qwen/qwen3-coder-480b-a35b-instruct', providerId: 'nvidia-nim', contextWindow: 128000 },
        { id: 'mistralai/mistral-large-3-675b-instruct-2512', providerId: 'nvidia-nim', contextWindow: 128000 },
        { id: 'qwen/qwen3.5-122b-a10b', providerId: 'nvidia-nim', contextWindow: 128000 },
        { id: 'moonshotai/kimi-k2.5', providerId: 'nvidia-nim', contextWindow: 200000 },
        { id: 'moonshotai/kimi-k2-thinking', providerId: 'nvidia-nim', contextWindow: 200000 },
        { id: 'z-ai/glm4.7', providerId: 'nvidia-nim', contextWindow: 128000 },
        { id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', providerId: 'nvidia-nim', contextWindow: 128000 },
      ],
      healthTimeout: 2000,
      requestTimeout: 30000,
    }));
  }

  // OpenCode Go Provider
  const opencodeKey = process.env.OPENCODE_API_KEY;
  if (opencodeKey) {
    console.log('[ProviderConfig] Adding OpenCode Go provider');
    providers.push(new OpenCodeGoProvider({
      apiKey: opencodeKey,
      models: [
        { id: 'mistral-small', providerId: 'opencode-go', contextWindow: 128000 },
        { id: 'qwen-coder', providerId: 'opencode-go', contextWindow: 128000 },
        { id: 'glm-5', providerId: 'opencode-go', contextWindow: 128000 },
      ],
      healthTimeout: 2000,
      requestTimeout: 30000,
      baseUrl: process.env.OPENCODE_GO_BASE_URL || 'https://api.opencode.ai/v1/go',
    }));
  }

  // OpenCode Zen Provider
  if (opencodeKey) {
    console.log('[ProviderConfig] Adding OpenCode Zen provider');
    providers.push(new OpenCodeZenProvider({
      apiKey: opencodeKey,
      models: [
        { id: 'mistral-large', providerId: 'opencode-zen', contextWindow: 128000 },
        { id: 'qwen-max', providerId: 'opencode-zen', contextWindow: 128000 },
        { id: 'kimi-k2', providerId: 'opencode-zen', contextWindow: 200000 },
      ],
      healthTimeout: 2000,
      requestTimeout: 30000,
      baseUrl: process.env.OPENCODE_ZEN_BASE_URL || 'https://api.opencode.ai/v1/zen',
    }));
  }

  if (providers.length === 0) {
    throw new Error('No API keys configured. Set NVIDIA_API_KEY and/or OPENCODE_API_KEY');
  }

  console.log(`[ProviderConfig] Initialized ${providers.length} provider(s)`);
  return new ProviderManager(providers);
}

/**
 * Singleton provider manager instance
 */
let _providerManager: ProviderManager | null = null;

export function getProviderManager(): ProviderManager {
  if (!_providerManager) {
    _providerManager = createProviderManager();
  }
  return _providerManager;
}

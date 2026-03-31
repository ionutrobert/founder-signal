/**
 * AI Provider Configuration
 * 
 * Priority order:
 * 1. NVIDIA NIM (free, fastest)
 * 2. OpenCode Go (subscription, reliable backup)
 * 3. OpenCode Zen Free (limited, last resort)
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
 * Environment variables:
 * - NVIDIA_API_KEY - NVIDIA NIM API key
 * - OPENCODE_API_KEY - OpenCode API key (works for both Go and Zen)
 * - OPENCODE_GO_BASE_URL - OpenCode Go endpoint (default: https://opencode.ai/zen/go/v1)
 * - OPENCODE_ZEN_BASE_URL - OpenCode Zen endpoint (default: https://opencode.ai/zen/v1)
 */
export function createProviderManager(): ProviderManager {
  const providers: AIProvider[] = [];

  // 1. NVIDIA NIM Provider (FREE - highest priority)
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (nvidiaKey) {
    console.log('[ProviderConfig] Adding NVIDIA NIM provider (FREE)');
    providers.push(new NIMProvider({
      apiKey: nvidiaKey,
      models: [
        { id: 'mistralai/mistral-small-4-119b-2603', providerId: 'nvidia-nim', contextWindow: 128000 },
        { id: 'qwen/qwen3-coder-480b-a35b-instruct', providerId: 'nvidia-nim', contextWindow: 128000 },
        { id: 'mistralai/mistral-large-3-675b-instruct-2512', providerId: 'nvidia-nim', contextWindow: 128000 },
        { id: 'z-ai/glm5', providerId: 'nvidia-nim', contextWindow: 128000 },
        { id: 'qwen/qwen3.5-122b-a10b', providerId: 'nvidia-nim', contextWindow: 128000 },
        { id: 'moonshotai/kimi-k2.5', providerId: 'nvidia-nim', contextWindow: 200000 },
        { id: 'z-ai/glm4.7', providerId: 'nvidia-nim', contextWindow: 128000 },
        { id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', providerId: 'nvidia-nim', contextWindow: 128000 },
      ],
      healthTimeout: 3000,
      requestTimeout: 30000,
    }));
  }

  // 2. OpenCode Go Provider ($5-10/month - reliable backup)
  // These are big coding models that never error out
  const opencodeKey = process.env.OPENCODE_API_KEY;
  if (opencodeKey) {
    console.log('[ProviderConfig] Adding OpenCode Go provider (subscription backup)');
    providers.push(new OpenCodeGoProvider({
      apiKey: opencodeKey,
      models: [
        { id: 'minimax-m2.7', providerId: 'opencode-go', contextWindow: 128000 },
        { id: 'minimax-m2.5', providerId: 'opencode-go', contextWindow: 128000 },
        { id: 'kimi-k2.5', providerId: 'opencode-go', contextWindow: 200000 },
        { id: 'glm-5', providerId: 'opencode-go', contextWindow: 128000 },
      ],
      healthTimeout: 10000, // 10s - reasoning models need more time
      requestTimeout: 60000,
      baseUrl: process.env.OPENCODE_GO_BASE_URL || 'https://opencode.ai/zen/go/v1',
    }));

    // 3. OpenCode Zen Free Models (last resort)
    console.log('[ProviderConfig] Adding OpenCode Zen provider (free models)');
    providers.push(new OpenCodeZenProvider({
      apiKey: opencodeKey,
      models: [
        { id: 'minimax-m2.5-free', providerId: 'opencode-zen', contextWindow: 128000 },
        { id: 'qwen3.6-plus-free', providerId: 'opencode-zen', contextWindow: 128000 },
        { id: 'big-pickle', providerId: 'opencode-zen', contextWindow: 128000 },
        { id: 'mimo-v2-pro-free', providerId: 'opencode-zen', contextWindow: 128000 },
        { id: 'mimo-v2-omni-free', providerId: 'opencode-zen', contextWindow: 128000 },
        { id: 'nemotron-3-super-free', providerId: 'opencode-zen', contextWindow: 128000 },
      ],
      healthTimeout: 10000, // 10s - reasoning models need more time
      requestTimeout: 60000,
      baseUrl: process.env.OPENCODE_ZEN_BASE_URL || 'https://opencode.ai/zen/v1',
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

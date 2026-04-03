/**
 * NIM Client v2 - ModelConfig Integration
 *
 * This module provides a refactored NIM client that uses the ModelConfig system
 * with dynamic model rotation, health tracking, and tier-based selection.
 * 
 * Designed for future extraction into standalone package:
 * - Clean separation of concerns
 * - Configurable endpoints and timeouts
 * - Comprehensive error handling
 * - Performance tracking
 */

import { ModelConfig } from '../types/model-config';
import { selectBestModel, updateModelHealth } from './model-rotation';
import { getValidationPrompt, getStreamingValidationPrompt } from './prompts';
import { getModelCircuitBreaker, CircuitOpenError } from './circuit-breaker';

/**
 * Request options for NIM API calls
 */
export interface NimRequestOptions {
  /** Specific model to use (overrides automatic selection) */
  model?: ModelConfig;
  /** Request timeout in milliseconds (overrides tier default) */
  timeout?: number;
  /** Temperature for generation (0-1) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Whether to stream the response */
  stream?: boolean;
}

/**
 * Response from non-streaming NIM request
 */
export interface NimResponse {
  /** Generated content */
  content: string;
  /** Model ID used for generation */
  model: string;
  /** Request latency in milliseconds */
  latency: number;
  /** Token usage information */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Response from streaming NIM request
 */
export interface NimStreamResponse {
  /** Model ID used for generation */
  model: string;
  /** Request latency in milliseconds */
  latency: number;
  /** Token usage information */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Phase-specific prompt structure
 */
export interface PhasePrompt {
  /** System prompt */
  system: string;
  /** User prompt */
  user: string;
}

/**
 * Error class for NIM client errors
 */
export class NimClientError extends Error {
  constructor(
    message: string,
    public readonly modelId: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'NimClientError';
  }
}

/**
 * Custom error classes for different failure types
 */
export class ModelTimeoutError extends Error {
  constructor(modelId: string, timeout: number) {
    super(`Model ${modelId} timed out after ${timeout}ms`);
    this.name = 'ModelTimeoutError';
  }
}

export class ModelEmptyResponseError extends Error {
  constructor(modelId: string) {
    super(`Model ${modelId} returned empty response`);
    this.name = 'ModelEmptyResponseError';
  }
}

export class ModelRateLimitError extends Error {
  constructor(modelId: string) {
    super(`Model ${modelId} rate limited`);
    this.name = 'ModelRateLimitError';
  }
}

export class ModelServerError extends Error {
  constructor(modelId: string, status: number) {
    super(`Model ${modelId} server error: ${status}`);
    this.name = 'ModelServerError';
  }
}

/**
 * Check if an error is retryable
 * Retryable errors: timeouts, empty responses, server errors
 * Non-retryable: rate limits (need backoff), client errors
 */
export function isRetryableError(error: Error): boolean {
  return error instanceof ModelTimeoutError ||
         error instanceof ModelEmptyResponseError ||
         error instanceof ModelServerError;
}

/**
 * Check if error indicates model is overloaded vs broken
 */
export function isModelOverloaded(error: Error): boolean {
  return error instanceof ModelTimeoutError ||
         error instanceof ModelRateLimitError;
}

/**
 * Streaming callbacks for section detection
 */
export interface StreamingCallbacks {
  /** Called when a section is detected in the stream */
  onSection?: (key: string, data: unknown, index: number) => void | Promise<void>;
  /** Called when streaming is complete */
  onComplete?: () => void | Promise<void>;
  /** Called on error */
  onError?: (error: Error) => void | Promise<void>;
}

/**
 * Response from non-streaming NIM request
 */
export interface NimResponse {
  /** Generated content */
  content: string;
  /** Model ID used for generation */
  model: string;
  /** Request latency in milliseconds */
  latency: number;
}

/**
 * Response from streaming NIM request
 */
export interface NimStreamResponse {
  /** Model ID used for generation */
  model: string;
  /** Request latency in milliseconds */
  latency: number;
}

/**
 * Phase-specific prompt structure
 */
export interface PhasePrompt {
  /** System prompt */
  system: string;
  /** User prompt */
  user: string;
}

/**
 * Create an AbortSignal with timeout
 */
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

/**
 * Execute a non-streaming NIM request with model rotation
 *
 * @param idea - Startup idea to analyze
 * @param options - Request options
 * @returns Response with content, model, and latency
 */
export async function analyzeWithModel(
  idea: string,
  options: NimRequestOptions = {}
): Promise<NimResponse> {
  const startTime = Date.now();

  const model = options.model || selectBestModel({ tier: 'S+' });
  const timeout = options.timeout || model.tier.timeout;
  const prompt = getValidationPrompt(idea);

  const circuitBreaker = getModelCircuitBreaker(model.id);

  if (!circuitBreaker.canExecute()) {
    const state = circuitBreaker.getState();
    console.error(`[analyzeWithModel] Circuit breaker is ${state} for model ${model.id}`);
    throw new CircuitOpenError(model.id, state);
  }

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
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4000,
        stream: false,
      }),
      signal: createTimeoutSignal(timeout),
    });

    if (!response.ok) {
      const errorText = await response.text();
      circuitBreaker.recordFailure();
      throw new Error(`NIM API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    const latency = Date.now() - startTime;

    updateModelHealth(model.id, latency, true);
    circuitBreaker.recordSuccess();

    return {
      content,
      model: model.id,
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;

    if (error instanceof CircuitOpenError) {
      throw error;
    }

    circuitBreaker.recordFailure();
    updateModelHealth(model.id, latency, false);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new NimClientError(
          `Request timeout after ${timeout}ms`,
          model.id,
          error
        );
      }
      throw new NimClientError(
        `Request failed: ${error.message}`,
        model.id,
        error
      );
    }

    throw new NimClientError(
      'Unknown error occurred',
      model.id
    );
  }
}

/**
 * Execute a streaming NIM request with model rotation
 *
 * @param idea - Startup idea to analyze
 * @param onToken - Callback for each token received
 * @param options - Request options
 * @returns Response with model and latency after stream completes
 */
export async function streamWithModel(
  idea: string,
  onToken: (token: string) => void,
  options: NimRequestOptions = {}
): Promise<NimStreamResponse> {
  const startTime = Date.now();

  const model = options.model || selectBestModel({ tier: 'S+' });
  const timeout = options.timeout || model.tier.timeout;
  const prompt = getStreamingValidationPrompt(idea);

  const circuitBreaker = getModelCircuitBreaker(model.id);

  if (!circuitBreaker.canExecute()) {
    const state = circuitBreaker.getState();
    console.error(`[streamWithModel] Circuit breaker is ${state} for model ${model.id}`);
    throw new CircuitOpenError(model.id, state);
  }

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
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4000,
        stream: true,
      }),
      signal: createTimeoutSignal(timeout),
    });

    if (!response.ok) {
      const errorText = await response.text();
      circuitBreaker.recordFailure();
      throw new Error(`NIM API error: ${response.status} ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              onToken(token);
            }
          } catch (e) {
          }
        }
      }
    }

    const latency = Date.now() - startTime;

    updateModelHealth(model.id, latency, true);
    circuitBreaker.recordSuccess();

    return {
      model: model.id,
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;

    if (error instanceof CircuitOpenError) {
      throw error;
    }

    circuitBreaker.recordFailure();
    updateModelHealth(model.id, latency, false);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new NimClientError(
          `Stream timeout after ${timeout}ms`,
          model.id,
          error
        );
      }
      throw new NimClientError(
        `Stream failed: ${error.message}`,
        model.id,
        error
      );
    }

    throw new NimClientError(
      'Unknown error occurred',
      model.id
    );
  }
}

/**
 * Streaming callback for section checkpoints
 */
export interface StreamingCallbacks {
  onSection?: (key: string, data: unknown, index: number) => void | Promise<void>
  onToken?: (token: string) => void | Promise<void>
}

/**
 * Stream a phase request with real-time section parsing
 *
 * @param prompt - Phase prompt with system and user components
 * @param sectionKeys - Expected top-level section keys (e.g., ['problemClarity', 'targetAudience'])
 * @param callbacks - Callbacks for section completion and tokens
 * @param options - Request options
 * @returns Response with content, model, and latency
 */
export async function executePhaseRequestStreaming(
  prompt: PhasePrompt,
  sectionKeys: string[],
  callbacks: StreamingCallbacks,
  options: NimRequestOptions = {}
): Promise<NimResponse> {
  const startTime = Date.now()
  const model = options.model || selectBestModel({ tier: 'S+' })
  const timeout = options.timeout || model.tier.timeout

  console.log('[executePhaseRequestStreaming] Starting streaming request')
  console.log('[executePhaseRequestStreaming] Model:', model.id)
  console.log('[executePhaseRequestStreaming] Section keys:', sectionKeys)

  const circuitBreaker = getModelCircuitBreaker(model.id);

  if (!circuitBreaker.canExecute()) {
    const state = circuitBreaker.getState();
    console.error(`[executePhaseRequestStreaming] Circuit breaker is ${state} for model ${model.id}`);
    throw new CircuitOpenError(model.id, state);
  }

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
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4000,
        stream: true,
      }),
      signal: createTimeoutSignal(timeout),
    })

    if (!response.ok) {
      const errorText = await response.text()

      circuitBreaker.recordFailure();

      if (response.status === 429) {
        throw new ModelRateLimitError(model.id)
      } else if (response.status >= 500) {
        throw new ModelServerError(model.id, response.status)
      }

      throw new Error(`NIM API error: ${response.status} ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let fullContent = ''
    const completedSections = new Map<string, { data: unknown; index: number }>()
    let sectionIndex = 0
    let lastTokenTime = Date.now()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const now = Date.now()
      if (now - lastTokenTime > 10000) {
        circuitBreaker.recordFailure();
        throw new Error(`Token timeout: No tokens received for 10 seconds`)
      }

      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk

      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const token = parsed.choices?.[0]?.delta?.content
            if (token) {
              lastTokenTime = Date.now()
              fullContent += token
              await callbacks.onToken?.(token)

              for (const key of sectionKeys) {
                if (completedSections.has(key)) continue

                const checkpoint = tryExtractSection(fullContent, key)
                if (checkpoint) {
                  completedSections.set(key, { data: checkpoint.data, index: sectionIndex })
                  console.log(`[executePhaseRequestStreaming] Section ${key} detected, calling onSection`)
                  await callbacks.onSection?.(key, checkpoint.data, sectionIndex)
                  sectionIndex++
                }
              }
            }
          } catch {
          }
        }
      }
    }

    const latency = Date.now() - startTime
    updateModelHealth(model.id, latency, true)
    circuitBreaker.recordSuccess();

    console.log('[executePhaseRequestStreaming] Completed')
    console.log('[executePhaseRequestStreaming] Content length:', fullContent.length)
    console.log('[executePhaseRequestStreaming] Sections completed:', Array.from(completedSections.keys()))

    if (!fullContent || fullContent.trim().length === 0) {
      circuitBreaker.recordFailure();
      throw new ModelEmptyResponseError(model.id)
    }

    return {
      content: fullContent,
      model: model.id,
      latency,
    }
  } catch (error) {
    const latency = Date.now() - startTime
    updateModelHealth(model.id, latency, false)

    if (error instanceof CircuitOpenError) {
      throw error;
    }

    if (error instanceof ModelRateLimitError ||
        error instanceof ModelServerError ||
        error instanceof ModelEmptyResponseError) {
      circuitBreaker.recordFailure();
      throw error
    }

    circuitBreaker.recordFailure();

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ModelTimeoutError(model.id, timeout)
      }
      throw new NimClientError(
        `Phase request failed: ${error.message}`,
        model.id,
        error
      )
    }

    throw new NimClientError('Unknown error occurred', model.id)
  }
}

/**
 * Try to extract a complete section from partial JSON
 */
function tryExtractSection(buffer: string, key: string): { data: unknown } | null {
  const keyPattern = `"${key}"\\s*:\\s*`
  const keyMatch = buffer.match(new RegExp(keyPattern))
  if (!keyMatch) return null

  const valueStart = keyMatch.index! + keyMatch[0].length

  if (buffer[valueStart] !== '{') return null

  let depth = 0
  let valueEnd = valueStart
  for (let i = valueStart; i < buffer.length; i++) {
    if (buffer[i] === '{') depth++
    else if (buffer[i] === '}') {
      depth--
      if (depth === 0) {
        valueEnd = i + 1
        break
      }
    }
  }

  if (valueEnd <= valueStart) return null

  const jsonStr = buffer.slice(valueStart, valueEnd)
  try {
    const data = JSON.parse(jsonStr)
    return { data }
  } catch {
    return null
  }
}

/**
 * Execute a phase-specific request for 3-phase validation
 *
 * @param prompt - Phase prompt with system and user components
 * @param options - Request options
 * @returns Response with content, model, and latency
 */
export async function executePhaseRequest(
  prompt: PhasePrompt,
  options: NimRequestOptions = {}
): Promise<NimResponse> {
  const startTime = Date.now();

  const model = options.model || selectBestModel({ tier: 'S+' });
  const timeout = options.timeout || model.tier.timeout;

  console.log('[executePhaseRequest] Starting request');
  console.log('[executePhaseRequest] Model:', model.id);
  console.log('[executePhaseRequest] Endpoint:', model.endpoint);
  console.log('[executePhaseRequest] Timeout:', timeout);
  console.log('[executePhaseRequest] System prompt length:', prompt.system.length);
  console.log('[executePhaseRequest] User prompt length:', prompt.user.length);

  const circuitBreaker = getModelCircuitBreaker(model.id);

  if (!circuitBreaker.canExecute()) {
    const state = circuitBreaker.getState();
    console.error(`[executePhaseRequest] Circuit breaker is ${state} for model ${model.id}`);
    throw new CircuitOpenError(model.id, state);
  }

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
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4000,
        stream: options.stream ?? false,
      }),
      signal: createTimeoutSignal(timeout),
    });

    console.log('[executePhaseRequest] Response status:', response.status);
    console.log('[executePhaseRequest] Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[executePhaseRequest] Error response:', errorText);

      circuitBreaker.recordFailure();

      if (response.status === 429) {
        throw new ModelRateLimitError(model.id);
      } else if (response.status >= 500) {
        throw new ModelServerError(model.id, response.status);
      }

      throw new Error(`NIM API error: ${response.status} ${errorText}`);
    }

    if (options.stream) {
      const latency = Date.now() - startTime;
      updateModelHealth(model.id, latency, true);
      circuitBreaker.recordSuccess();

      return {
        content: '',
        model: model.id,
        latency,
      };
    }

    const data = await response.json();
    console.log('[executePhaseRequest] Response data keys:', Object.keys(data));
    console.log('[executePhaseRequest] Choices:', data.choices);
    const content = data.choices?.[0]?.message?.content || '';

    if (!content || content.trim().length === 0) {
      circuitBreaker.recordFailure();
      throw new ModelEmptyResponseError(model.id);
    }

    console.log('[executePhaseRequest] Content length:', content.length);
    console.log('[executePhaseRequest] Content preview:', content.substring(0, 200));

    const latency = Date.now() - startTime;
    console.log('[executePhaseRequest] Latency:', latency);

    updateModelHealth(model.id, latency, true);
    circuitBreaker.recordSuccess();

    return {
      content,
      model: model.id,
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('[executePhaseRequest] Error:', error);

    if (error instanceof CircuitOpenError) {
      throw error;
    }

    if (error instanceof ModelRateLimitError ||
        error instanceof ModelServerError ||
        error instanceof ModelEmptyResponseError) {
      circuitBreaker.recordFailure();
      throw error;
    }

    circuitBreaker.recordFailure();
    updateModelHealth(model.id, latency, false);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[executePhaseRequest] Timeout after', timeout, 'ms');
        throw new ModelTimeoutError(model.id, timeout);
      }
      console.error('[executePhaseRequest] Error message:', error.message);
      throw new NimClientError(
        `Phase request failed: ${error.message}`,
        model.id,
        error
      );
    }

    throw new NimClientError(
      'Unknown error occurred',
      model.id
    );
  }
}

/**
 * Get health metrics for a specific model
 *
 * @param modelId - Model identifier
 * @returns Health metrics or null if model not found
 */
export function getModelHealth(modelId: string) {
  const { getModelHealth } = require('./model-rotation');
  return getModelHealth(modelId);
}

/**
 * Get health metrics for all models
 *
 * @returns Map of model IDs to health metrics
 */
export function getAllModelHealth() {
  const { getAllModelHealth } = require('./model-rotation');
  return getAllModelHealth();
}

/**
 * Check if a model is healthy and available
 *
 * @param modelId - Model identifier
 * @returns True if model is healthy
 */
export async function checkModelHealth(modelId: string): Promise<boolean> {
  const { checkModelHealth } = require('./model-rotation');
  return checkModelHealth(modelId);
}

/**
 * Select the best model based on criteria
 *
 * @param criteria - Selection criteria
 * @returns Best model configuration
 */
export function selectBestModelForRequest(criteria?: {
  tier?: 'S+' | 'S';
  minReliability?: number;
  maxLatency?: number;
}): ModelConfig {
  return selectBestModel(criteria);
}

export const analyzeIdea = analyzeWithModel;
export const streamIdeaAnalysis = streamWithModel;

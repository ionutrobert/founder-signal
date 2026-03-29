/**
 * Retry logic with exponential backoff and jitter
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  jitterRange?: number;
  isRetryable?: (error: Error) => boolean;
  onRetry?: (attempt: number, delay: number, error: Error) => void;
}

export interface RetryResult<T> {
  result: T;
  attempts: number;
  totalDelay: number;
}

function defaultIsRetryable(error: Error): boolean {
  if (error.name === 'AbortError') return false;
  if (error.message.includes('timeout')) return true;
  if (error.message.includes('429')) return true;
  if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) return true;
  if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) return true;
  return false;
}

function calculateDelay(attempt: number, initialDelay: number, maxDelay: number, backoffFactor: number, jitterRange: number): number {
  const exponentialDelay = initialDelay * Math.pow(backoffFactor, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  const jitter = 1 - jitterRange / 2 + Math.random() * jitterRange;
  return Math.floor(cappedDelay * jitter);
}

export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<RetryResult<T>> {
  const {
    maxRetries = Infinity,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    jitterRange = 0.2,
    isRetryable = defaultIsRetryable,
    onRetry
  } = options || {};

  let attempts = 0;
  let totalDelay = 0;
  let lastError: Error | null = null;

  while (attempts < maxRetries) {
    attempts++;
    
    try {
      const result = await fn();
      return { result, attempts, totalDelay };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (!isRetryable(lastError) || attempts >= maxRetries) {
        throw lastError;
      }
      
      const delay = calculateDelay(attempts, initialDelay, maxDelay, backoffFactor, jitterRange);
      totalDelay += delay;
      
      onRetry?.(attempts, delay, lastError);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

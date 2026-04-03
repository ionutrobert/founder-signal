/**
 * Circuit breaker for model health
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  cooldownPeriod: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  cooldownPeriod: 60000,
};

class CircuitBreakerImpl {
  private state: CircuitState = 'CLOSED';
  private consecutiveFailures: number = 0;
  private consecutiveSuccesses: number = 0;
  private lastStateChange: number = Date.now();

  constructor(
    private modelId: string,
    private config: CircuitBreakerConfig = DEFAULT_CONFIG
  ) {
    console.log(`[circuit-breaker] Created for model ${modelId} with config: failureThreshold=${config.failureThreshold}, cooldownPeriod=${config.cooldownPeriod}ms`);
  }

  getState(): CircuitState {
    if (this.state === 'OPEN') {
      const elapsed = Date.now() - this.lastStateChange;
      if (elapsed >= this.config.cooldownPeriod) {
        const previousState = this.state;
        this.state = 'HALF_OPEN';
        this.lastStateChange = Date.now();
        console.log(`[circuit-breaker] ${this.modelId}: State transition ${previousState} → HALF_OPEN (cooldown elapsed)`);
      }
    }
    return this.state;
  }

  canExecute(): boolean {
    const state = this.getState();
    return state !== 'OPEN';
  }

  getModelId(): string {
    return this.modelId;
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;

    if (this.state === 'HALF_OPEN') {
      this.consecutiveSuccesses++;
      if (this.consecutiveSuccesses >= this.config.successThreshold) {
        const previousState = this.state;
        this.state = 'CLOSED';
        this.consecutiveSuccesses = 0;
        this.lastStateChange = Date.now();
        console.log(`[circuit-breaker] ${this.modelId}: State transition ${previousState} → CLOSED (success threshold reached)`);
      }
    }
  }

  recordFailure(): void {
    this.consecutiveSuccesses = 0;
    this.consecutiveFailures++;

    if (this.state === 'CLOSED' && this.consecutiveFailures >= this.config.failureThreshold) {
      const previousState = this.state;
      this.state = 'OPEN';
      this.lastStateChange = Date.now();
      console.log(`[circuit-breaker] ${this.modelId}: State transition ${previousState} → OPEN (${this.consecutiveFailures} consecutive failures)`);
    } else if (this.state === 'HALF_OPEN') {
      const previousState = this.state;
      this.state = 'OPEN';
      this.lastStateChange = Date.now();
      console.log(`[circuit-breaker] ${this.modelId}: State transition ${previousState} → OPEN (failure during half-open)`);
    }
  }

  reset(): void {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.lastStateChange = Date.now();
  }
}

const circuitBreakers = new Map<string, CircuitBreakerImpl>();

export function getModelCircuitBreaker(modelId: string): CircuitBreakerImpl {
  if (!circuitBreakers.has(modelId)) {
    circuitBreakers.set(modelId, new CircuitBreakerImpl(modelId));
  }
  return circuitBreakers.get(modelId)!;
}

export function isModelAvailable(modelId: string): boolean {
  return getModelCircuitBreaker(modelId).canExecute();
}

export function resetCircuitBreaker(modelId: string): void {
  getModelCircuitBreaker(modelId).reset();
}

export class CircuitOpenError extends Error {
  constructor(public readonly modelId: string, public readonly state: CircuitState) {
    super(`Circuit breaker is ${state} for model ${modelId}. Please try again later.`);
    this.name = 'CircuitOpenError';
  }
}

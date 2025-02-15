/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation, requests allowed
  OPEN = 'OPEN',        // Failure threshold exceeded, requests blocked
  HALF_OPEN = 'HALF_OPEN' // Testing if service has recovered
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;     // Number of failures before opening
  resetTimeout?: number;         // Time (ms) before attempting reset
  halfOpenMaxCalls?: number;     // Max calls allowed in half-open state
  monitorInterval?: number;      // Time (ms) to keep failure history
  minimumFailures?: number;      // Minimum failures before considering threshold
}

interface FailureRecord {
  timestamp: number;
  error: Error;
}

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 0.5,        // 50% failure rate
  resetTimeout: 30000,          // 30 seconds
  halfOpenMaxCalls: 3,          // Allow 3 test calls
  monitorInterval: 120000,      // 2 minutes
  minimumFailures: 5            // At least 5 failures
};

/**
 * Implements the Circuit Breaker pattern for handling distributed service failures
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: FailureRecord[] = [];
  private successes: number = 0;
  private halfOpenCalls: number = 0;
  private lastStateChange: number = Date.now();
  private readonly options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Executes a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.checkState();

    if (this.state === CircuitState.OPEN) {
      throw new Error('Circuit breaker is OPEN');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  /**
   * Gets the current state of the circuit breaker
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Gets the current failure rate
   */
  getFailureRate(): number {
    this.removeOldFailures();
    const totalCalls = this.failures.length + this.successes;
    if (totalCalls === 0) return 0;
    return this.failures.length / totalCalls;
  }

  /**
   * Resets the circuit breaker to its initial state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = [];
    this.successes = 0;
    this.halfOpenCalls = 0;
    this.lastStateChange = Date.now();
  }

  private checkState(): void {
    if (this.state === CircuitState.OPEN) {
      const timeInCurrentState = Date.now() - this.lastStateChange;
      if (timeInCurrentState >= this.options.resetTimeout) {
        this.setState(CircuitState.HALF_OPEN);
      }
    }
  }

  private setState(newState: CircuitState): void {
    this.state = newState;
    this.lastStateChange = Date.now();
    
    if (newState === CircuitState.HALF_OPEN) {
      this.halfOpenCalls = 0;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenCalls++;
      if (this.halfOpenCalls >= this.options.halfOpenMaxCalls) {
        this.setState(CircuitState.CLOSED);
        this.reset();
      }
    } else {
      this.successes++;
    }
  }

  private onFailure(error: Error): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.setState(CircuitState.OPEN);
    } else {
      this.failures.push({
        timestamp: Date.now(),
        error
      });
      this.removeOldFailures();

      if (this.shouldOpen()) {
        this.setState(CircuitState.OPEN);
      }
    }
  }

  private removeOldFailures(): void {
    const cutoff = Date.now() - this.options.monitorInterval;
    this.failures = this.failures.filter(f => f.timestamp > cutoff);
  }

  private shouldOpen(): boolean {
    if (this.failures.length < this.options.minimumFailures) {
      return false;
    }

    return this.getFailureRate() >= this.options.failureThreshold;
  }
}

// Circuit breaker registry to manage multiple circuit breakers
export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry;
  private breakers: Map<string, CircuitBreaker> = new Map();

  private constructor() {}

  static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    return CircuitBreakerRegistry.instance;
  }

  getBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(options));
    }
    return this.breakers.get(name)!;
  }

  reset(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
    }
  }

  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }
}

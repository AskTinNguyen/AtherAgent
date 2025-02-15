import { APIError } from '@/lib/api/response'
import { CircuitBreakerRegistry, CircuitBreakerOptions } from './circuit-breaker'

interface RetryConfig {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  shouldRetry?: (error: any) => boolean
  circuitBreaker?: {
    name: string
    options?: CircuitBreakerOptions
  }
}

const defaultConfig: Required<Omit<RetryConfig, 'circuitBreaker'>> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  shouldRetry: (error: any) => {
    if (error instanceof APIError) {
      const statusCode = error.statusCode || 500
      return statusCode >= 500 && statusCode < 600
    }
    return error.name === 'TypeError' || error.name === 'NetworkError'
  }
}

/**
 * Implements exponential backoff retry logic with circuit breaker pattern
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const { circuitBreaker, ...retryConfig } = config
  const finalConfig = { ...defaultConfig, ...retryConfig }
  let lastError: any
  
  // Get circuit breaker if configured
  const breaker = circuitBreaker 
    ? CircuitBreakerRegistry.getInstance().getBreaker(
        circuitBreaker.name,
        circuitBreaker.options
      )
    : null
  
  for (let attempt = 0; attempt < finalConfig.maxRetries; attempt++) {
    try {
      // Execute with circuit breaker if available
      const result = breaker 
        ? await breaker.execute(fn)
        : await fn()
      return result
    } catch (error) {
      lastError = error
      
      // Check if we should retry
      if (!finalConfig.shouldRetry(error)) {
        throw error
      }
      
      // Don't wait on the last attempt
      if (attempt === finalConfig.maxRetries - 1) {
        throw error
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(2, attempt),
        finalConfig.maxDelay
      )
      
      // Add some jitter to prevent thundering herd
      const jitter = Math.random() * 200
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, delay + jitter))
    }
  }
  
  throw lastError
}

/**
 * Creates a retry-enabled fetch function with circuit breaker support
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  retryConfig?: RetryConfig
): Promise<Response> {
  // Create a circuit breaker name based on the URL
  const url = typeof input === 'string' ? input : input.toString()
  const circuitBreakerName = `fetch_${new URL(url).pathname}`
  
  // Add circuit breaker config if not explicitly provided
  const config = {
    ...retryConfig,
    circuitBreaker: retryConfig?.circuitBreaker || {
      name: circuitBreakerName,
      options: {
        failureThreshold: 0.5,    // 50% failure rate
        resetTimeout: 30000,      // 30 seconds
        minimumFailures: 5        // At least 5 failures before opening
      }
    }
  }
  
  return withRetry(
    async () => {
      const response = await fetch(input, init)
      
      if (!response.ok) {
        const error = new APIError(
          `HTTP error! status: ${response.status}`,
          response.status
        )
        throw error
      }
      
      return response
    },
    config
  )
}

/**
 * HOC to add retry logic with circuit breaker to any API call
 */
export function withApiRetry<T extends (...args: any[]) => Promise<any>>(
  apiCall: T,
  retryConfig?: RetryConfig
): T {
  return (async (...args: Parameters<T>) => {
    // Create a circuit breaker name based on the function name
    const circuitBreakerName = `api_${apiCall.name || 'anonymous'}`
    
    // Add circuit breaker config if not explicitly provided
    const config = {
      ...retryConfig,
      circuitBreaker: retryConfig?.circuitBreaker || {
        name: circuitBreakerName,
        options: {
          failureThreshold: 0.5,    // 50% failure rate
          resetTimeout: 30000,      // 30 seconds
          minimumFailures: 5        // At least 5 failures before opening
        }
      }
    }
    
    return withRetry(() => apiCall(...args), config)
  }) as T
}

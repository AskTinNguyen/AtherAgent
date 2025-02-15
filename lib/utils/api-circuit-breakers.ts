import { CircuitBreaker, CircuitBreakerRegistry } from './circuit-breaker'

// Get the singleton registry instance
const registry = CircuitBreakerRegistry.getInstance()

// Circuit breaker for research API endpoints
export const researchCircuitBreaker = registry.getBreaker('research-api', {
  failureThreshold: 0.3,        // Open after 30% failure rate
  resetTimeout: 10000,          // Try to reset after 10 seconds
  halfOpenMaxCalls: 2,          // Allow 2 test calls in half-open state
  monitorInterval: 60000,       // Monitor failures over 1 minute
  minimumFailures: 3            // Require at least 3 failures
})

// Circuit breaker for search API endpoints
export const searchCircuitBreaker = registry.getBreaker('search-api', {
  failureThreshold: 0.4,        // Open after 40% failure rate
  resetTimeout: 15000,          // Try to reset after 15 seconds
  halfOpenMaxCalls: 2,          // Allow 2 test calls in half-open state
  monitorInterval: 60000,       // Monitor failures over 1 minute
  minimumFailures: 4            // Require at least 4 failures
})

// Helper function to wrap API calls with circuit breaker
export async function withCircuitBreaker<T>(
  breaker: CircuitBreaker,
  fn: () => Promise<T>
): Promise<T> {
  return breaker.execute(fn)
}

// Helper function to reset circuit breakers
export function resetCircuitBreakers() {
  registry.resetAll()
  console.log('[DEBUG] All circuit breakers have been reset')
}

// Helper to check circuit breaker states
export function getCircuitBreakerStates() {
  return {
    research: researchCircuitBreaker.getState(),
    search: searchCircuitBreaker.getState()
  }
} 
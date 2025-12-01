import { CircuitBreakerOptions } from '../../domain/interfaces/external-api.js'

interface CircuitBreakerState {
  failures: number
  state: 'closed' | 'open' | 'half-open'
  nextAttemptAt: number
  halfOpenAttempts: number
}

export class CircuitBreaker {
  private readonly options: Required<CircuitBreakerOptions>
  private state: CircuitBreakerState

  constructor(options?: CircuitBreakerOptions) {
    this.options = {
      failureThreshold: options?.failureThreshold ?? 3,
      cooldownMs: options?.cooldownMs ?? 5000,
      halfOpenAttempts: options?.halfOpenAttempts ?? 1,
    }

    this.state = {
      failures: 0,
      state: 'closed',
      nextAttemptAt: 0,
      halfOpenAttempts: 0,
    }
  }

  allowRequest(): boolean {
    if (this.state.state === 'open') {
      const now = Date.now()
      if (now < this.state.nextAttemptAt) {
        return false
      }

      this.state.state = 'half-open'
      this.state.halfOpenAttempts = 0
      return true
    }

    if (this.state.state === 'half-open') {
      if (this.state.halfOpenAttempts >= this.options.halfOpenAttempts) {
        return false
      }

      this.state.halfOpenAttempts += 1
    }

    return true
  }

  recordSuccess(): void {
    this.state = { failures: 0, state: 'closed', nextAttemptAt: 0, halfOpenAttempts: 0 }
  }

  recordFailure(): void {
    if (this.state.state === 'half-open') {
      this.tripBreaker()
      return
    }

    this.state.failures += 1
    if (this.state.failures >= this.options.failureThreshold) {
      this.tripBreaker()
    }
  }

  private tripBreaker(): void {
    this.state = {
      failures: this.options.failureThreshold,
      state: 'open',
      nextAttemptAt: Date.now() + this.options.cooldownMs,
      halfOpenAttempts: 0,
    }
  }
}

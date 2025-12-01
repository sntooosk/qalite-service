import { RetryPolicy } from '../../domain/interfaces/external-api.js'

export class RetryStrategy {
  constructor(private readonly defaultPolicy: Required<RetryPolicy> = { attempts: 1, backoffMs: 200 }) {}

  async execute<T>(operation: () => Promise<T>, policy?: RetryPolicy): Promise<T> {
    const settings = this.mergePolicy(policy)

    let lastError: unknown
    for (let attempt = 1; attempt <= settings.attempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        if (attempt === settings.attempts) {
          break
        }

        await this.delay(settings.backoffMs * attempt)
      }
    }

    throw lastError
  }

  private mergePolicy(policy?: RetryPolicy): Required<RetryPolicy> {
    return {
      attempts: policy?.attempts && policy.attempts > 0 ? policy.attempts : this.defaultPolicy.attempts,
      backoffMs:
        policy?.backoffMs && policy.backoffMs > 0 ? policy.backoffMs : this.defaultPolicy.backoffMs,
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

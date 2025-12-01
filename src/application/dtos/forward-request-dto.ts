import {
  CachePolicy,
  CircuitBreakerOptions,
  HttpMethod,
  RetryPolicy,
} from '../../domain/interfaces/external-api.js'

export interface ForwardRequestInput {
  url: string
  method: HttpMethod
  headers?: Record<string, string>
  queryParams?: Record<string, string | number | boolean>
  body?: unknown
  timeoutMs?: number
  cache?: CachePolicy
  retry?: RetryPolicy
  circuitBreaker?: CircuitBreakerOptions
}

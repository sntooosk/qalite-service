export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface CachePolicy {
  enabled?: boolean
  ttlMs?: number
  key?: string
}

export interface RetryPolicy {
  attempts?: number
  backoffMs?: number
}

export interface CircuitBreakerOptions {
  failureThreshold?: number
  cooldownMs?: number
  halfOpenAttempts?: number
}

export interface ExternalApiRequest<TBody = unknown> {
  url: string
  method: HttpMethod
  headers?: Record<string, string>
  queryParams?: Record<string, string | number | boolean>
  body?: TBody
  timeoutMs?: number
  cache?: CachePolicy
  retry?: RetryPolicy
  circuitBreaker?: CircuitBreakerOptions
}

export interface ExternalApiResponse<T = unknown> {
  status: number
  data: T
  headers: Record<string, string>
  fromCache: boolean
}

export interface IExternalApi {
  send<TResponse = unknown, TBody = unknown>(
    request: ExternalApiRequest<TBody>,
  ): Promise<ExternalApiResponse<TResponse>>
}

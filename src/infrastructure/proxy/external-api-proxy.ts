import { HttpError } from '../../errors.js'
import {
  ExternalApiRequest,
  ExternalApiResponse,
  IExternalApi,
} from '../../domain/interfaces/external-api.js'
import { HttpClient } from './http-client.js'
import { InMemoryCache } from './in-memory-cache.js'
import { RetryStrategy } from './retry-strategy.js'
import { CircuitBreaker } from './circuit-breaker.js'
import { StructuredLogger } from './structured-logger.js'

const DEFAULT_CACHE_TTL_MS = 1_000 * 30

export class ExternalApiProxy implements IExternalApi {
  private readonly cache = new InMemoryCache()
  private readonly retryStrategy = new RetryStrategy()
  private readonly circuitBreaker: CircuitBreaker
  private readonly logger = new StructuredLogger()

  constructor(
    private readonly httpClient = new HttpClient(),
    circuitBreaker: CircuitBreaker = new CircuitBreaker(),
  ) {
    this.circuitBreaker = circuitBreaker
  }

  async send<TResponse = unknown, TBody = unknown>(
    request: ExternalApiRequest<TBody>,
  ): Promise<ExternalApiResponse<TResponse>> {
    if (!this.circuitBreaker.allowRequest()) {
      this.logger.error('proxy.circuit.open', { url: request.url })
      throw new HttpError(503, 'External API temporarily unavailable.')
    }

    const cacheKey = this.resolveCacheKey(request)
    if (cacheKey) {
      const cached = this.cache.get<TResponse>(cacheKey)
      if (cached) {
        this.logger.info('proxy.cache.hit', { url: request.url, method: request.method })
        return { ...cached, fromCache: true }
      }
    }

    try {
      const response = await this.retryStrategy.execute(() => this.forwardRequest<TResponse>(request), request.retry)
      if (cacheKey && response.status >= 200 && response.status < 400) {
        const ttl = request.cache?.ttlMs ?? DEFAULT_CACHE_TTL_MS
        this.cache.set(cacheKey, response, ttl)
      }

      this.circuitBreaker.recordSuccess()
      return response
    } catch (error) {
      this.logger.error('proxy.forward.failed', {
        url: request.url,
        method: request.method,
        error: (error as Error).message,
      })
      this.circuitBreaker.recordFailure()
      throw error
    }
  }

  private async forwardRequest<TResponse>(request: ExternalApiRequest): Promise<ExternalApiResponse<TResponse>> {
    const url = this.buildUrlWithQuery(request)
    this.logger.info('proxy.forward.request', { url, method: request.method })

    const response = await this.httpClient.request<TResponse>({
      url,
      method: request.method,
      headers: request.headers,
      body: request.body,
      timeoutMs: request.timeoutMs,
    })

    this.logger.info('proxy.forward.response', {
      url,
      method: request.method,
      status: response.status,
    })

    return {
      status: response.status,
      data: response.data,
      headers: response.headers,
      fromCache: false,
    }
  }

  private resolveCacheKey(request: ExternalApiRequest): string | null {
    if (request.cache?.enabled === false) {
      return null
    }

    if (request.cache?.key) {
      return request.cache.key
    }

    if (!request.cache?.enabled) {
      return null
    }

    const serializedQuery = JSON.stringify(request.queryParams ?? {})
    const serializedBody = JSON.stringify(request.body ?? {})
    return `${request.method}:${request.url}:${serializedQuery}:${serializedBody}`
  }

  private buildUrlWithQuery(request: ExternalApiRequest): string {
    if (!request.queryParams) {
      return request.url
    }

    const url = new URL(request.url)
    Object.entries(request.queryParams).forEach(([key, value]) => {
      url.searchParams.set(key, String(value))
    })

    return url.toString()
  }
}

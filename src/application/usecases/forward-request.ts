import { HttpError } from '../../errors.js'
import { ForwardRequestInput } from '../dtos/forward-request-dto.js'
import { ExternalApiRequest, ExternalApiResponse, IExternalApi } from '../../domain/interfaces/external-api.js'

export class ForwardRequestUseCase {
  constructor(private readonly externalApi: IExternalApi) {}

  async execute<TResponse = unknown>(input: ForwardRequestInput): Promise<ExternalApiResponse<TResponse>> {
    const sanitizedUrl = input.url?.trim()
    if (!sanitizedUrl) {
      throw new HttpError(400, 'Destination URL is required.')
    }

    if (!input.method) {
      throw new HttpError(400, 'HTTP method is required.')
    }

    this.validateUrl(sanitizedUrl)

    const request: ExternalApiRequest = {
      url: sanitizedUrl,
      method: input.method,
      headers: input.headers,
      queryParams: input.queryParams,
      body: input.body,
      timeoutMs: input.timeoutMs,
      cache: input.cache,
      retry: input.retry,
      circuitBreaker: input.circuitBreaker,
    }

    return this.externalApi.send<TResponse>(request)
  }

  private validateUrl(url: string): void {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new HttpError(400, 'Only HTTP/HTTPS protocols are supported.')
    }
  }
}

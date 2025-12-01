import { HttpError } from '../../errors.js'
import { HttpMethod } from '../../domain/interfaces/external-api.js'

export interface HttpRequest {
  url: string
  method: HttpMethod
  headers?: Record<string, string>
  body?: unknown
  timeoutMs?: number
}

export interface HttpResponse<T = unknown> {
  status: number
  data: T
  headers: Record<string, string>
}

export class HttpClient {
  constructor(private readonly fetchFn: typeof fetch = fetch) {}

  async request<T>(request: HttpRequest): Promise<HttpResponse<T>> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs ?? 10_000)

    try {
      const response = await this.fetchFn(request.url, {
        method: request.method,
        headers: request.headers,
        body: this.serializeBody(request),
        signal: controller.signal,
      })

      const data = await this.parseBody<T>(response)
      const headers: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })

      return {
        status: response.status,
        data,
        headers,
      }
    } catch (error) {
      if (error instanceof DOMException || (error as Error).name === 'AbortError') {
        throw new HttpError(504, 'External request timed out.')
      }

      throw new HttpError(502, 'Failed to reach external API.')
    } finally {
      clearTimeout(timeout)
    }
  }

  private serializeBody(request: HttpRequest): BodyInit | undefined {
    if (request.body === undefined || request.body === null) {
      return undefined
    }

    const headers = Object.fromEntries(
      Object.entries(request.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value]),
    )

    if (headers['content-type']?.includes('application/json')) {
      return JSON.stringify(request.body)
    }

    return request.body as BodyInit
  }

  private async parseBody<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      return (await response.json()) as T
    }

    return (await response.text()) as unknown as T
  }
}

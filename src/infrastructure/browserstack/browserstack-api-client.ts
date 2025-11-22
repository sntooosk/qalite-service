import { HttpError } from '../../errors.js'
import { BrowserstackClient } from '../../application/ports/browserstack-client.js'
import { BrowserstackBuild, BrowserstackCredentials } from '../../domain/entities/browserstack.js'

type BrowserstackBuildResponse = {
  automation_build?: {
    hashed_id?: string
    name?: string
    status?: string
    duration?: number
    build_tag?: string
    public_url?: string
    devices?: unknown[]
    created_at?: string
    started_at?: string
  }
}

export class BrowserstackApiClient implements BrowserstackClient {
  constructor(private readonly fetchFn: typeof fetch = fetch) {}

  async listBuilds(credentials: BrowserstackCredentials): Promise<BrowserstackBuild[]> {
    const authorization = this.buildAuthorization(credentials)

    let response: Response
    try {
      response = await this.fetchFn('https://api.browserstack.com/automate/builds.json', {
        headers: { Authorization: authorization },
      })
    } catch (error) {
      console.error('[browserstack] fetch failed', error)
      throw new HttpError(502, 'Falha ao comunicar com a BrowserStack.')
    }

    if (response.status === 401) {
      throw new HttpError(401, 'Credenciais inválidas para BrowserStack.')
    }

    if (!response.ok) {
      throw new HttpError(502, 'Erro ao consultar builds na BrowserStack.')
    }

    const payload = await response.json()
    if (!Array.isArray(payload)) {
      throw new HttpError(502, 'Resposta inesperada da BrowserStack.')
    }

    return payload
      .map((entry: BrowserstackBuildResponse) => entry?.automation_build)
      .filter((build): build is NonNullable<BrowserstackBuildResponse['automation_build']> =>
        Boolean(build?.hashed_id),
      )
      .map((build) => ({
        id: build.hashed_id as string,
        name: build.name,
        status: build.status,
        duration: build.duration,
        buildTag: build.build_tag,
        publicUrl: build.public_url,
        devices: build.devices,
        createdAt: build.created_at,
        startedAt: build.started_at,
      }))
  }

  private buildAuthorization(credentials: BrowserstackCredentials): string {
    const username = credentials.username ?? ''
    const password = credentials.password ?? ''
    const token = Buffer.from(`${username}:${password}`).toString('base64')
    return `Basic ${token}`
  }
}

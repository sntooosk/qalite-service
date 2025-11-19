import type { BrowserstackCredentials } from '../../config'
import { HttpError } from '../../errors'
import { BrowserstackBuild } from '../../domain/entities/browserstack-build'
import { BrowserstackGateway } from '../../application/ports/browserstack-gateway'

const BASE_URL = 'https://api.browserstack.com/automate'

const buildAuthHeader = ({ username, accessKey }: BrowserstackCredentials): string => {
  const token = Buffer.from(`${username}:${accessKey}`).toString('base64')
  return `Basic ${token}`
}

export class BrowserstackApiGateway implements BrowserstackGateway {
  constructor(private readonly credentials: BrowserstackCredentials | undefined) {}

  async listBuilds(): Promise<BrowserstackBuild[]> {
    if (!this.credentials) {
      throw new HttpError(503, 'BrowserStack integration is not configured.')
    }

    const response = await fetch(`${BASE_URL}/builds.json`, {
      headers: { Authorization: buildAuthHeader(this.credentials) },
    })

    if (!response.ok) {
      throw new Error(`BrowserStack request failed with status ${response.status}`)
    }

    return (await response.json()) as BrowserstackBuild[]
  }
}

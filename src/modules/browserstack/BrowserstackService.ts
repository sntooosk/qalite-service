import type { BrowserstackConfig } from '../../config/environment'
import { ValidationError } from '../../shared/errors/ValidationError'

const AUTOMATE_BASE_URL = 'https://api.browserstack.com/automate'

export interface BrowserstackBuild {
  automation_build: Record<string, unknown>
}

export class BrowserstackService {
  constructor(private readonly config?: BrowserstackConfig) {}

  private getAuthorizationHeader(): string {
    if (!this.config) {
      throw new ValidationError('BrowserStack integration is not configured.', 503)
    }

    const token = Buffer.from(
      `${this.config.username}:${this.config.accessKey}`,
    ).toString('base64')

    return `Basic ${token}`
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const url = `${AUTOMATE_BASE_URL}${path}`

    const response = await fetch(url, {
      headers: { Authorization: this.getAuthorizationHeader() },
    })

    if (!response.ok) {
      throw new Error(`BrowserStack request failed with status ${response.status}`)
    }

    return (await response.json()) as T
  }

  async listAutomateBuilds(): Promise<BrowserstackBuild[]> {
    return this.fetchJson('/builds.json')
  }
}

import type { BrowserstackCredentials } from './config'
import { HttpError } from './errors'

const BASE_URL = 'https://api.browserstack.com/automate'

export interface BrowserstackBuild {
  automation_build: Record<string, unknown>
}

const buildAuthHeader = ({ username, accessKey }: BrowserstackCredentials): string => {
  const token = Buffer.from(`${username}:${accessKey}`).toString('base64')
  return `Basic ${token}`
}

export const listBrowserstackBuilds = async (
  credentials: BrowserstackCredentials | undefined,
): Promise<BrowserstackBuild[]> => {
  if (!credentials) {
    throw new HttpError(503, 'BrowserStack integration is not configured.')
  }

  const response = await fetch(`${BASE_URL}/builds.json`, {
    headers: { Authorization: buildAuthHeader(credentials) },
  })

  if (!response.ok) {
    throw new Error(`BrowserStack request failed with status ${response.status}`)
  }

  return (await response.json()) as BrowserstackBuild[]
}

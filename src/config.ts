import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const envPath = resolve(process.cwd(), '.env')

if (existsSync(envPath)) {
  const raw = readFileSync(envPath, 'utf8')
  raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .forEach((line) => {
      const [key, ...rest] = line.split('=')
      if (!key || process.env[key]) {
        return
      }

      const value = rest.join('=').trim().replace(/^['"]|['"]$/g, '')
      process.env[key] = value
    })
}

const parseList = (value: string | undefined, fallback: string[]): string[] => {
  if (!value) {
    return [...fallback]
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://qualitydigital-qamanager.vercel.app',
]

const normalize = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export interface BrowserstackCredentials {
  username: string
  accessKey: string
}

export interface AppConfig {
  allowedOrigins: string[]
  browserstack?: BrowserstackCredentials
  slackWebhookUrl?: string
  port: number
  isProduction: boolean
}

export const config: AppConfig = {
  allowedOrigins: parseList(process.env.ALLOWED_ORIGINS, DEFAULT_ALLOWED_ORIGINS),
  browserstack:
    normalize(process.env.BROWSERSTACK_USERNAME) &&
    normalize(process.env.BROWSERSTACK_ACCESS_KEY)
      ? {
          username: normalize(process.env.BROWSERSTACK_USERNAME) as string,
          accessKey: normalize(process.env.BROWSERSTACK_ACCESS_KEY) as string,
        }
      : undefined,
  slackWebhookUrl: normalize(process.env.SLACK_TASK_SUMMARY_WEBHOOK_URL),
  port: Number.parseInt(process.env.PORT ?? '3000', 10) || 3000,
  isProduction: process.env.NODE_ENV === 'production',
}

import fs from 'node:fs'
import path from 'node:path'

import { ValidationError } from '../shared/errors/ValidationError'

const loadEnvFile = (): void => {
  const envPath = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) {
    return
  }

  const rawContent = fs.readFileSync(envPath, 'utf8')
  rawContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .forEach((line) => {
      const [key, ...rest] = line.split('=')
      const value = rest.join('=').trim()

      if (!key || process.env[key]) {
        return
      }

      const sanitizedValue = value.replace(/^"|"$/g, '').replace(/^'|'$/g, '')
      process.env[key] = sanitizedValue
    })
}

loadEnvFile()

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://qualitydigital-qamanager.vercel.app',
]

const normalizeList = (value: unknown, fallback: string[] = []): string[] => {
  if (!value) {
    return [...fallback]
  }

  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  return [...fallback]
}

const requiredEnv = (value: string | undefined, label: string): string => {
  if (!value) {
    throw new ValidationError(`${label} is not configured.`)
  }

  return value
}

export interface BrowserstackConfig {
  username: string
  accessKey: string
}

export interface SlackConfig {
  webhookUrl: string
}

export interface ServerEnvironment {
  port: number
  isProduction: boolean
}

export interface ServerConfig {
  allowedOrigins: string[]
  browserstack?: BrowserstackConfig
  slack?: SlackConfig
  environment: ServerEnvironment
}

const allowedOrigins = normalizeList(
  process.env.ALLOWED_ORIGINS,
  DEFAULT_ALLOWED_ORIGINS,
)

const browserstackUsername = process.env.BROWSERSTACK_USERNAME
const browserstackAccessKey = process.env.BROWSERSTACK_ACCESS_KEY

const slackWebhookUrl = process.env.SLACK_TASK_SUMMARY_WEBHOOK_URL

export const hasBrowserstackCredentials = Boolean(
  browserstackUsername && browserstackAccessKey,
)

export const isSlackConfigured = Boolean(slackWebhookUrl)

const environment: ServerEnvironment = {
  isProduction: process.env.NODE_ENV === 'production',
  port: Number.parseInt(process.env.PORT || '3000', 10),
}

export const serverConfig: ServerConfig = {
  allowedOrigins,
  browserstack: hasBrowserstackCredentials
    ? {
        username: requiredEnv(
          browserstackUsername,
          'BROWSERSTACK_USERNAME',
        ),
        accessKey: requiredEnv(
          browserstackAccessKey,
          'BROWSERSTACK_ACCESS_KEY',
        ),
      }
    : undefined,
  slack: isSlackConfigured
    ? { webhookUrl: requiredEnv(slackWebhookUrl, 'SLACK_TASK_SUMMARY_WEBHOOK_URL') }
    : undefined,
  environment,
}

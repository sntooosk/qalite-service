import dotenv from 'dotenv'

dotenv.config()

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://qualitydigital-qamanager.vercel.app',
]

const toList = (value, fallback = []) => {
  if (!value) {
    return [...fallback]
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const allowedOrigins = toList(
  process.env.ALLOWED_ORIGINS,
  DEFAULT_ALLOWED_ORIGINS,
)

const browserstackUsername = process.env.BROWSERSTACK_USERNAME || ''
const browserstackAccessKey = process.env.BROWSERSTACK_ACCESS_KEY || ''

const slackWebhookUrl = process.env.SLACK_EVENT_SUMMARY_WEBHOOK_URL || ''
const slackEnvironmentWebhookUrl =
  process.env.SLACK_ENVIRONMENT_SUMMARY_WEBHOOK_URL || slackWebhookUrl

const isProduction = process.env.NODE_ENV === 'production'

export const serverConfig = {
  allowedOrigins,
  browserstack: {
    username: browserstackUsername,
    accessKey: browserstackAccessKey,
  },
  slack: {
    webhookUrl: slackWebhookUrl,
    environmentWebhookUrl: slackEnvironmentWebhookUrl,
  },
  environment: {
    isProduction,
    port: Number.parseInt(process.env.PORT || '3000', 10),
  },
}

export const hasBrowserstackCredentials =
  Boolean(browserstackUsername) && Boolean(browserstackAccessKey)

export const isSlackConfigured = Boolean(slackWebhookUrl)
export const isSlackEnvironmentConfigured = Boolean(slackEnvironmentWebhookUrl)

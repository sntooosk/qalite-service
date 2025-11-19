import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { URL } from 'node:url'

import { listBrowserstackBuilds } from './browserstack'
import { config } from './config'
import { HttpError } from './errors'
import { sendSlackTaskSummary, type TaskSummaryPayload } from './slack'

const json = (res: ServerResponse, statusCode: number, payload: unknown): void => {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

const readJsonBody = async <T>(req: IncomingMessage): Promise<T> => {
  const chunks: Buffer[] = []
  let total = 0
  const MAX_SIZE = 1024 * 1024

  for await (const chunk of req) {
    const buffer = Buffer.from(chunk)
    total += buffer.length
    if (total > MAX_SIZE) {
      throw new HttpError(413, 'Payload too large.')
    }

    chunks.push(buffer)
  }

  if (!chunks.length) {
    return {} as T
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T
  } catch {
    throw new HttpError(400, 'Invalid JSON payload.')
  }
}

const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) {
    return true
  }

  return config.allowedOrigins.includes(origin)
}

const applyCors = (req: IncomingMessage, res: ServerResponse): boolean => {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined
  if (!isOriginAllowed(origin)) {
    json(res, 403, { error: 'CORS origin not allowed.' })
    return false
  }

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }

  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return false
  }

  return true
}

const handleBrowserstack = async (_req: IncomingMessage, res: ServerResponse) => {
  const builds = await listBrowserstackBuilds(config.browserstack)
  json(res, 200, builds)
}

const handleSlackSummary = async (req: IncomingMessage, res: ServerResponse) => {
  const body = await readJsonBody<TaskSummaryPayload>(req)
  const scenarioTitle = body?.scenario?.title?.trim()

  if (!scenarioTitle) {
    throw new HttpError(400, 'Scenario title is required.')
  }

  await sendSlackTaskSummary(body, config.slackWebhookUrl)
  json(res, 200, { message: 'Slack task summary sent.' })
}

const routes: Record<string, Partial<Record<string, (req: IncomingMessage, res: ServerResponse) => Promise<void>>>> = {
  '/health': {
    GET: async (_req, res) => {
      json(res, 200, { status: 'ok' })
    },
  },
  '/browserstack/builds': {
    GET: handleBrowserstack,
  },
  '/slack/task-summary': {
    POST: handleSlackSummary,
  },
}

export const requestHandler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  try {
    if (!applyCors(req, res)) {
      return
    }

    const method = req.method ?? 'GET'
    const url = new URL(req.url ?? '/', 'http://localhost')
    const handlers = routes[url.pathname]

    if (!handlers) {
      json(res, 404, { error: 'Not found.' })
      return
    }

    const handler = handlers[method]
    if (!handler) {
      json(res, 405, { error: 'Method not allowed.' })
      return
    }

    await handler(req, res)
  } catch (error) {
    if (error instanceof HttpError) {
      json(res, error.statusCode, { error: error.message })
      return
    }

    console.error('[server] request failed', error)
    json(res, 500, { error: 'Internal server error.' })
  }
}

export const server = createServer((req, res) => {
  requestHandler(req, res).catch((error) => {
    console.error('[server] unhandled error', error)
    json(res, 500, { error: 'Internal server error.' })
  })
})

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { URL } from 'node:url'

import { serverConfig } from '../config/environment'
import { BrowserstackService } from '../modules/browserstack/BrowserstackService'
import { SlackService } from '../modules/slack/SlackService'
import { ValidationError } from '../shared/errors/ValidationError'

const browserstackService = new BrowserstackService(serverConfig.browserstack)
const slackService = new SlackService(serverConfig.slack)

const sendJson = (res: ServerResponse, statusCode: number, payload: unknown): void => {
  const body = JSON.stringify(payload)
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(body)
}

const parseJsonBody = (req: IncomingMessage): Promise<any> =>
  new Promise((resolve, reject) => {
    const chunks: string[] = []
    let totalLength = 0
    const MAX_SIZE = 1024 * 1024

    req.on('data', (chunk) => {
      const value = String(chunk)
      totalLength += value.length
      if (totalLength > MAX_SIZE) {
        reject(new ValidationError('Payload too large.', 413))
        return
      }

      chunks.push(value)
    })

    req.on('end', () => {
      if (!chunks.length) {
        resolve({})
        return
      }

      try {
        const raw = chunks.join('')
        resolve(JSON.parse(raw))
      } catch {
        reject(new ValidationError('Invalid JSON payload.'))
      }
    })
  })

const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) {
    return true
  }

  return serverConfig.allowedOrigins.includes(origin)
}

const applyCors = (req: IncomingMessage, res: ServerResponse): boolean => {
  const originHeader = typeof req.headers.origin === 'string' ? req.headers.origin : undefined

  if (!isAllowedOrigin(originHeader)) {
    sendJson(res, 403, { error: 'CORS origin not allowed.' })
    return false
  }

  if (originHeader) {
    res.setHeader('Access-Control-Allow-Origin', originHeader)
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

const handleBrowserstackBuilds = async (_req: IncomingMessage, res: ServerResponse) => {
  const builds = await browserstackService.listAutomateBuilds()
  sendJson(res, 200, builds)
}

const handleSlackTaskSummary = async (req: IncomingMessage, res: ServerResponse) => {
  const body = await parseJsonBody(req)
  const scenarioTitle = typeof body?.scenario?.title === 'string' ? body.scenario.title.trim() : ''

  if (!scenarioTitle) {
    throw new ValidationError('Scenario title is required.')
  }

  await slackService.sendTaskSummary(body)
  sendJson(res, 200, { message: 'Slack task summary sent.' })
}

const routes: Record<string, Record<string, (req: IncomingMessage, res: ServerResponse, url: URL) => Promise<void>>> = {
  '/health': {
    GET: async (_req, res) => {
      sendJson(res, 200, { status: 'ok' })
    },
  },
  '/browserstack/builds': {
    GET: handleBrowserstackBuilds,
  },
  '/slack/task-summary': {
    POST: handleSlackTaskSummary,
  },
}

export const requestHandler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  try {
    if (!applyCors(req, res)) {
      return
    }

    const method = req.method ?? 'GET'
    const url = new URL(req.url ?? '/', 'http://localhost')
    const methodHandlers = routes[url.pathname]

    if (!methodHandlers || !methodHandlers[method]) {
      sendJson(res, 404, { error: 'Not found.' })
      return
    }

    await methodHandlers[method](req, res, url)
  } catch (error) {
    console.error('[server] request failed', error)

    if (error instanceof ValidationError) {
      sendJson(res, error.statusCode, { error: error.message })
      return
    }

    sendJson(res, 500, { error: 'Internal server error.' })
  }
}

export const server = createServer((req, res) => {
  requestHandler(req, res).catch((error) => {
    console.error('[server] unhandled error', error)
    sendJson(res, 500, { error: 'Internal server error.' })
  })
})

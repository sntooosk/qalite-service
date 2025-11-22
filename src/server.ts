import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

import { config } from './config.js'
import { HttpError } from './errors.js'
import { SendTaskSummaryUseCase } from './application/usecases/send-task-summary.js'
import { ListBrowserstackBuildsUseCase } from './application/usecases/list-browserstack-builds.js'
import { TaskSummaryFormatter } from './domain/services/task-summary-formatter.js'
import { SlackWebhookNotifier } from './infrastructure/slack/slack-webhook-notifier.js'
import { BrowserstackApiClient } from './infrastructure/browserstack/browserstack-api-client.js'
import { applyCors } from './interfaces/http/cors.js'
import { json } from './interfaces/http/http-response.js'
import { HttpRouter } from './interfaces/http/router.js'
import { buildRouteTable } from './interfaces/http/routes.js'

const slackNotifier = new SlackWebhookNotifier()
const formatter = new TaskSummaryFormatter()
const browserstackClient = new BrowserstackApiClient()

const sendTaskSummaryUseCase = new SendTaskSummaryUseCase(formatter, slackNotifier)
const listBrowserstackBuildsUseCase = new ListBrowserstackBuildsUseCase(browserstackClient)

const router = new HttpRouter(
  buildRouteTable({
    sendTaskSummary: sendTaskSummaryUseCase,
    listBrowserstackBuilds: listBrowserstackBuildsUseCase,
  }),
)

export const requestHandler = async (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> => {
  try {
    if (!applyCors(req, res, config.allowedOrigins)) {
      return
    }

    await router.route(req, res)
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

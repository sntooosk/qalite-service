import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

import { config } from './config'
import { HttpError } from './errors'
import { ListBrowserstackBuildsUseCase } from './application/usecases/list-browserstack-builds'
import { SendTaskSummaryUseCase } from './application/usecases/send-task-summary'
import { TaskSummaryFormatter } from './domain/services/task-summary-formatter'
import { BrowserstackApiGateway } from './infrastructure/browserstack/browserstack-gateway'
import { SlackWebhookNotifier } from './infrastructure/slack/slack-webhook-notifier'
import { applyCors } from './interfaces/http/cors'
import { json } from './interfaces/http/http-response'
import { HttpRouter } from './interfaces/http/router'
import { buildRouteTable } from './interfaces/http/routes'

const browserstackGateway = new BrowserstackApiGateway(config.browserstack)
const slackNotifier = new SlackWebhookNotifier(config.slackWebhookUrl)
const formatter = new TaskSummaryFormatter()

const listBrowserstackBuildsUseCase = new ListBrowserstackBuildsUseCase(browserstackGateway)
const sendTaskSummaryUseCase = new SendTaskSummaryUseCase(formatter, slackNotifier)

const router = new HttpRouter(
  buildRouteTable({
    listBrowserstackBuilds: listBrowserstackBuildsUseCase,
    sendTaskSummary: sendTaskSummaryUseCase,
  }),
)

export const requestHandler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
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

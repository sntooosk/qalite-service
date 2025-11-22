import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

import { config } from './config.js'
import { HttpError } from './errors.js'
import { SendTaskSummaryUseCase } from './application/usecases/send-task-summary.js'
import { ListAutomationExecutionsUseCase } from './application/usecases/list-automation-executions.js'
import { RegisterAutomationExecutionUseCase, DefaultAutomationExecutionFactory } from './application/usecases/register-automation-execution.js'
import { TaskSummaryFormatter } from './domain/services/task-summary-formatter.js'
import { SlackWebhookNotifier } from './infrastructure/slack/slack-webhook-notifier.js'
import { InMemoryAutomationExecutionRepository } from './infrastructure/automation/in-memory-automation-execution-repository.js'
import { applyCors } from './interfaces/http/cors.js'
import { json } from './interfaces/http/http-response.js'
import { HttpRouter } from './interfaces/http/router.js'
import { buildRouteTable } from './interfaces/http/routes.js'

const slackNotifier = new SlackWebhookNotifier()
const formatter = new TaskSummaryFormatter()
const automationExecutionRepository = new InMemoryAutomationExecutionRepository()
const automationExecutionFactory = new DefaultAutomationExecutionFactory()

const sendTaskSummaryUseCase = new SendTaskSummaryUseCase(formatter, slackNotifier)
const registerAutomationExecutionUseCase = new RegisterAutomationExecutionUseCase(
  automationExecutionRepository,
  automationExecutionFactory,
)
const listAutomationExecutionsUseCase = new ListAutomationExecutionsUseCase(
  automationExecutionRepository,
)

const router = new HttpRouter(
  buildRouteTable({
    sendTaskSummary: sendTaskSummaryUseCase,
    registerAutomationExecution: registerAutomationExecutionUseCase,
    listAutomationExecutions: listAutomationExecutionsUseCase,
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

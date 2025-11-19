import { IncomingMessage, ServerResponse } from 'node:http'

import { SendTaskSummaryUseCase } from '../../application/usecases/send-task-summary.js'
import { TaskSummaryPayload } from '../../domain/entities/task-summary.js'
import { json } from './http-response.js'
import { readJsonBody } from './http-request.js'
import { RouteTable } from './router.js'

interface RouteDependencies {
  sendTaskSummary: SendTaskSummaryUseCase
}

const healthHandler = async (_req: IncomingMessage, res: ServerResponse): Promise<void> => {
  json(res, 200, { status: 'ok' })
}

const buildSlackSummaryHandler = (
  sendTaskSummary: SendTaskSummaryUseCase,
): ((req: IncomingMessage, res: ServerResponse) => Promise<void>) => {
  return async (req, res) => {
    const payload = await readJsonBody<TaskSummaryPayload>(req)
    await sendTaskSummary.execute(payload)
    json(res, 200, { message: 'Slack task summary sent.' })
  }
}

export const buildRouteTable = ({ sendTaskSummary }: RouteDependencies): RouteTable => ({
  '/health': {
    GET: healthHandler,
  },
  '/slack/task-summary': {
    POST: buildSlackSummaryHandler(sendTaskSummary),
  },
})

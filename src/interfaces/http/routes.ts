import { IncomingMessage, ServerResponse } from 'node:http'

import { ListBrowserstackBuildsUseCase } from '../../application/usecases/list-browserstack-builds.js'
import { SendTaskSummaryUseCase } from '../../application/usecases/send-task-summary.js'
import { TaskSummaryPayload } from '../../domain/entities/task-summary.js'
import { json } from './http-response.js'
import { readJsonBody } from './http-request.js'
import { RouteTable } from './router.js'

interface RouteDependencies {
  listBrowserstackBuilds: ListBrowserstackBuildsUseCase
  sendTaskSummary: SendTaskSummaryUseCase
}

const healthHandler = async (_req: IncomingMessage, res: ServerResponse): Promise<void> => {
  json(res, 200, { status: 'ok' })
}

const buildBrowserstackHandler = (
  listBrowserstackBuilds: ListBrowserstackBuildsUseCase,
): ((req: IncomingMessage, res: ServerResponse) => Promise<void>) => {
  return async (_req, res) => {
    const builds = await listBrowserstackBuilds.execute()
    json(res, 200, builds)
  }
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

export const buildRouteTable = ({
  listBrowserstackBuilds,
  sendTaskSummary,
}: RouteDependencies): RouteTable => ({
  '/health': {
    GET: healthHandler,
  },
  '/browserstack/builds': {
    GET: buildBrowserstackHandler(listBrowserstackBuilds),
  },
  '/slack/task-summary': {
    POST: buildSlackSummaryHandler(sendTaskSummary),
  },
})

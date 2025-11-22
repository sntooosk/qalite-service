import { IncomingMessage, ServerResponse } from 'node:http'

import { SendTaskSummaryUseCase } from '../../application/usecases/send-task-summary.js'
import { ListBrowserstackBuildsUseCase } from '../../application/usecases/list-browserstack-builds.js'
import { TaskSummaryPayload } from '../../domain/entities/task-summary.js'
import { BrowserstackCredentials } from '../../domain/entities/browserstack.js'
import { json } from './http-response.js'
import { readJsonBody } from './http-request.js'
import { RouteTable } from './router.js'

interface RouteDependencies {
  sendTaskSummary: SendTaskSummaryUseCase
  listBrowserstackBuilds: ListBrowserstackBuildsUseCase
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

const buildListBrowserstackBuildsHandler = (
  listBrowserstackBuilds: ListBrowserstackBuildsUseCase,
): ((req: IncomingMessage, res: ServerResponse) => Promise<void>) => {
  return async (req, res) => {
    const credentials = await readJsonBody<BrowserstackCredentials>(req)
    const builds = await listBrowserstackBuilds.execute(credentials)
    json(res, 200, { builds })
  }
}

export const buildRouteTable = ({
  sendTaskSummary,
  listBrowserstackBuilds,
}: RouteDependencies): RouteTable => ({
  '/slack/task-summary': {
    POST: buildSlackSummaryHandler(sendTaskSummary),
  },
  '/browserstack/builds': {
    POST: buildListBrowserstackBuildsHandler(listBrowserstackBuilds),
  },
})

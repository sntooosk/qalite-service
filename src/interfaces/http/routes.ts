import { IncomingMessage, ServerResponse } from 'node:http'

import { SendTaskSummaryUseCase } from '../../application/usecases/send-task-summary.js'
import { RegisterAutomationExecutionUseCase } from '../../application/usecases/register-automation-execution.js'
import { ListAutomationExecutionsUseCase } from '../../application/usecases/list-automation-executions.js'
import { TaskSummaryPayload } from '../../domain/entities/task-summary.js'
import { AutomationExecutionPayload } from '../../domain/entities/automation-execution.js'
import { json } from './http-response.js'
import { readJsonBody } from './http-request.js'
import { RouteTable } from './router.js'
import { handleOpenApiJson, handleSwaggerUi } from './swagger.js'

interface RouteDependencies {
  sendTaskSummary: SendTaskSummaryUseCase
  registerAutomationExecution: RegisterAutomationExecutionUseCase
  listAutomationExecutions: ListAutomationExecutionsUseCase
}

const healthHandler = async (
  _req: IncomingMessage,
  res: ServerResponse,
): Promise<void> => {
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

const buildRegisterAutomationExecutionHandler = (
  registerAutomationExecution: RegisterAutomationExecutionUseCase,
): ((req: IncomingMessage, res: ServerResponse) => Promise<void>) => {
  return async (req, res) => {
    const payload = await readJsonBody<AutomationExecutionPayload>(req)
    await registerAutomationExecution.execute(payload)
    json(res, 200, { message: 'Execução de automação registrada.' })
  }
}

const buildListAutomationExecutionsHandler = (
  listAutomationExecutions: ListAutomationExecutionsUseCase,
): ((req: IncomingMessage, res: ServerResponse) => Promise<void>) => {
  return async (_req, res) => {
    const executions = await listAutomationExecutions.execute()
    json(res, 200, { executions })
  }
}

export const buildRouteTable = ({
  sendTaskSummary,
  registerAutomationExecution,
  listAutomationExecutions,
}: RouteDependencies): RouteTable => ({
  '/health': {
    GET: healthHandler,
  },
  '/slack/task-summary': {
    POST: buildSlackSummaryHandler(sendTaskSummary),
  },
  '/automations/executions': {
    POST: buildRegisterAutomationExecutionHandler(registerAutomationExecution),
    GET: buildListAutomationExecutionsHandler(listAutomationExecutions),
  },
  '/openapi.json': {
    GET: handleOpenApiJson,
  },
  '/docs': {
    GET: handleSwaggerUi,
  },
})

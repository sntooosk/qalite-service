import { IncomingMessage, ServerResponse } from 'node:http'

import { SendTaskSummaryUseCase } from '../../../application/usecases/send-task-summary.js'
import { TaskSummaryPayload } from '../../../domain/entities/task-summary.js'
import { json } from '../http-response.js'
import { readJsonBody } from '../http-request.js'

export class TaskSummaryController {
  constructor(private readonly sendTaskSummary: SendTaskSummaryUseCase) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const payload = await readJsonBody<TaskSummaryPayload>(req)
    await this.sendTaskSummary.execute(payload)
    json(res, 200, { message: 'Slack task summary sent.' })
  }
}

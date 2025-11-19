import { HttpError } from '../../errors.js'
import { TaskSummaryPayload } from '../../domain/entities/task-summary.js'
import { TaskSummaryFormatter } from '../../domain/services/task-summary-formatter.js'
import { SlackNotifier } from '../ports/slack-notifier.js'

export class SendTaskSummaryUseCase {
  constructor(
    private readonly formatter: TaskSummaryFormatter,
    private readonly notifier: SlackNotifier,
  ) {}

  async execute(payload: TaskSummaryPayload): Promise<void> {
    const scenarioTitle = payload?.scenario?.title?.trim()
    if (!scenarioTitle) {
      throw new HttpError(400, 'Scenario title is required.')
    }

    const message = this.formatter.buildMessage(payload)
    await this.notifier.sendMessage(message)
  }
}

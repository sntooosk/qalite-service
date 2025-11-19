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
    const directMessage = payload?.message?.trim()
    if (directMessage) {
      await this.notifier.sendMessage(directMessage)
      return
    }

    if (!payload?.environmentSummary) {
      throw new HttpError(400, 'Environment summary is required.')
    }

    const formattedMessage = this.formatter.buildMessage(payload)
    await this.notifier.sendMessage(formattedMessage)
  }
}

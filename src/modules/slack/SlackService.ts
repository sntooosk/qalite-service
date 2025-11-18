import type { SlackConfig } from '../../config/environment'
import { ValidationError } from '../../shared/errors/ValidationError'
import {
  buildSlackTaskSummaryMessage,
  type TaskSummaryPayload,
} from './messageBuilder'

export class SlackService {
  constructor(private readonly config?: SlackConfig) {}

  private get webhookUrl(): string {
    if (!this.config?.webhookUrl) {
      throw new ValidationError('Slack integration is not configured.', 503)
    }

    return this.config.webhookUrl
  }

  async sendTaskSummary(payload: TaskSummaryPayload): Promise<void> {
    const message = buildSlackTaskSummaryMessage(payload)

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    })

    if (!response.ok) {
      throw new Error(`Slack webhook responded with status ${response.status}`)
    }
  }
}

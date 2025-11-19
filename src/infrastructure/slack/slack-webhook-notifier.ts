import { HttpError } from '../../errors.js'
import { SlackNotifier } from '../../application/ports/slack-notifier.js'

export class SlackWebhookNotifier implements SlackNotifier {
  constructor(private readonly webhookUrl: string | undefined) {}

  async sendMessage(message: string): Promise<void> {
    if (!this.webhookUrl) {
      throw new HttpError(503, 'Slack integration is not configured.')
    }

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

export interface SlackNotifier {
  sendMessage(message: string): Promise<void>
}

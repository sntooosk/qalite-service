export interface AutomationExecutionPayload {
  username?: string
  password?: string
  status?: string
  provider?: string
  executionId?: string
  startedAt?: string
  finishedAt?: string
  details?: Record<string, unknown>
}

export interface AutomationExecution extends AutomationExecutionPayload {
  id: string
  receivedAt: string
}

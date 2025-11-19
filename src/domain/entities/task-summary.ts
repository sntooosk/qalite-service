export interface TaskSummaryPayload {
  submittedBy?: { name?: string; email?: string } | string
  scenario?: { title?: string; stage?: string; category?: string }
  environment?: { label?: string; taskUrl?: string }
  test?: {
    platform?: string
    status?: string
    durationMs?: number
    completedAt?: number | string
  }
}

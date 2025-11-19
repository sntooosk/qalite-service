import { TaskSummaryPayload } from '../entities/task-summary.js'

type Primitive = string | number | boolean | undefined | null

const toText = (value: Primitive): string => {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return ''
}

const formatDuration = (milliseconds?: number): string => {
  if (!milliseconds || milliseconds <= 0) {
    return ''
  }

  if (milliseconds < 60000) {
    return `${Math.round(milliseconds / 1000)}s`
  }

  const totalMinutes = Math.round(milliseconds / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`
  }

  return `${totalMinutes}min`
}

const formatDateTime = (value?: number | string): string => {
  const timestamp = typeof value === 'string' ? Number(value) : value
  if (!timestamp || Number.isNaN(timestamp)) {
    return ''
  }

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

const formatPerson = (
  entry: TaskSummaryPayload['submittedBy'],
  fallback = 'Responsável não informado',
): string => {
  if (!entry) {
    return fallback
  }

  if (typeof entry === 'string') {
    const normalized = entry.trim()
    return normalized || fallback
  }

  const name = toText(entry.name)
  const email = toText(entry.email)

  if (name && email) {
    return `${name} (${email})`
  }

  return name || email || fallback
}

export class TaskSummaryFormatter {
  buildMessage({ scenario, submittedBy, environment, test }: TaskSummaryPayload): string {
    const lines = ['✅ *Tarefa concluída*']

    const scenarioTitle = toText(scenario?.title) || 'Cenário'
    lines.push(`🧪 Cenário: ${scenarioTitle}`)

    const stage = toText(scenario?.stage)
    if (stage) {
      lines.push(`🎯 Etapa: ${stage}`)
    }

    const category = toText(scenario?.category)
    if (category) {
      lines.push(`🗂️ Categoria: ${category}`)
    }

    lines.push(`👤 Responsável: ${formatPerson(submittedBy)}`)

    const platform = toText(test?.platform) || 'Execução'
    lines.push(`💻 Plataforma: ${platform}`)

    const status = toText(test?.status) || 'Concluído'
    lines.push(`📊 Status: ${status}`)

    const duration = formatDuration(test?.durationMs)
    if (duration) {
      lines.push(`⏱️ Duração: ${duration}`)
    }

    const completion = formatDateTime(test?.completedAt)
    if (completion) {
      lines.push(`🕒 Concluído em: ${completion}`)
    }

    const environmentLabel = toText(environment?.label)
    if (environmentLabel) {
      lines.push(`🏢 Ambiente: ${environmentLabel}`)
    }

    const taskUrl = toText(environment?.taskUrl)
    if (taskUrl) {
      lines.push(`📝 Tarefa: <${taskUrl}|Abrir tarefa>`)
    }

    return lines.join('\n')
  }
}

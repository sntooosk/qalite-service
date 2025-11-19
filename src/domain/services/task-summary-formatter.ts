import { EnvironmentSummaryPayload, TaskSummaryPayload } from '../entities/task-summary.js'

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

const formatDurationHMS = (milliseconds?: number): string => {
  if (typeof milliseconds !== 'number' || Number.isNaN(milliseconds) || milliseconds < 0) {
    return ''
  }

  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (value: number): string => value.toString().padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

type AttendeeEntry = NonNullable<EnvironmentSummaryPayload['attendees']>[number]

const formatAttendee = (entry?: AttendeeEntry): string => {
  if (typeof entry === 'string') {
    return entry.trim()
  }

  if (!entry) {
    return ''
  }

  const name = toText(entry.name)
  const email = toText(entry.email)

  if (name && email) {
    return `${name} (${email})`
  }

  return name || email
}

export class TaskSummaryFormatter {
  buildMessage({ environmentSummary }: TaskSummaryPayload): string {
    const summary = environmentSummary ?? {}
    const lines: string[] = ['✨ *Resumo de QA*', '']

    const pushField = (label: string, value: string): void => {
      const sanitized = value.trim() || 'Não informado'
      lines.push(`• *${label}:* ${sanitized}`)
    }

    const totalTime = toText(summary.totalTime) || formatDurationHMS(summary.totalTimeMs) || '00:00:00'
    pushField('Tempo total', totalTime)

    const scenariosCount =
      typeof summary.scenariosCount === 'number' && summary.scenariosCount >= 0
        ? String(summary.scenariosCount)
        : '0'
    pushField('Cenários', scenariosCount)

    const executedMessage =
      toText(summary.executedScenariosMessage) ||
      (typeof summary.executedScenariosCount === 'number'
        ? `${summary.executedScenariosCount} ${
            summary.executedScenariosCount === 1 ? 'cenário executado' : 'cenários executados'
          }`
        : '')
    if (executedMessage) {
      pushField('Execução', executedMessage)
    }

    const storyfixValue =
      typeof summary.storyfixCount === 'number' && summary.storyfixCount >= 0
        ? String(summary.storyfixCount)
        : '0'
    pushField('Storyfix registrados', storyfixValue)

    const jiraValue = toText(summary.jira) || 'Não informado'
    pushField('Jira', jiraValue)

    const suiteName = toText(summary.suiteName) || 'Não informado'
    const suiteDetails = toText(summary.suiteDetails)
    pushField('Suíte', suiteDetails ? `${suiteName} — ${suiteDetails}` : suiteName)

    const participantsCount =
      typeof summary.participantsCount === 'number' && summary.participantsCount >= 0
        ? String(summary.participantsCount)
        : '0'
    pushField('Participantes', participantsCount)

    const urls = summary.monitoredUrls?.map((url) => url?.trim()).filter(Boolean)
    if (urls && urls.length > 0) {
      lines.push('• *🌐 URLs monitoradas:*')
      urls.forEach((url) => lines.push(`  - ${url}`))
    } else {
      pushField('URLs monitoradas', 'Não informado')
    }

    const attendees = summary.attendees
      ?.map((person) => formatAttendee(person))
      .filter((value) => Boolean(value && value.trim()))

    lines.push('')
    lines.push('👥 *Quem está participando*')
    if (attendees && attendees.length > 0) {
      attendees.forEach((entry) => lines.push(`• ${entry}`))
    } else {
      lines.push('• Não informado')
    }

    return lines.join('\n')
  }
}

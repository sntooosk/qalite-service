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
    const lines: string[] = []

    const pushSection = (label: string, values: string[]): void => {
      lines.push(label)
      values.filter(Boolean).forEach((value) => lines.push(value))
    }

    const totalTime = toText(summary.totalTime) || formatDurationHMS(summary.totalTimeMs) || '00:00:00'
    pushSection('Tempo total', [totalTime])

    const scenariosCount =
      typeof summary.scenariosCount === 'number' && summary.scenariosCount >= 0
        ? String(summary.scenariosCount)
        : '0'
    pushSection('Cenários', [scenariosCount])

    const executedMessage =
      toText(summary.executedScenariosMessage) ||
      (typeof summary.executedScenariosCount === 'number'
        ? `${summary.executedScenariosCount} ${
            summary.executedScenariosCount === 1 ? 'cenário' : 'cenários'
          } executados`
        : '')
    if (executedMessage) {
      lines.push(executedMessage)
    }

    const storyfixValue =
      typeof summary.storyfixCount === 'number' && summary.storyfixCount >= 0
        ? String(summary.storyfixCount)
        : '0'
    pushSection('Storyfix registrados', [storyfixValue])

    const jiraValue = toText(summary.jira) || 'Não informado'
    pushSection('Jira', [jiraValue])

    const suiteName = toText(summary.suiteName) || 'Não informado'
    const suiteDetails = toText(summary.suiteDetails)
    pushSection('Suíte', suiteDetails ? [suiteName, suiteDetails] : [suiteName])

    const participantsCount =
      typeof summary.participantsCount === 'number' && summary.participantsCount >= 0
        ? String(summary.participantsCount)
        : '0'
    pushSection('Participantes', [participantsCount])

    const urls = summary.monitoredUrls?.map((url) => url?.trim()).filter(Boolean)
    pushSection('URLs monitoradas', urls && urls.length > 0 ? urls : ['Não informado'])

    const attendees = summary.attendees
      ?.map((person) => formatAttendee(person))
      .filter((value) => Boolean(value && value.trim()))

    lines.push('')
    lines.push('Quem está participando')
    if (attendees && attendees.length > 0) {
      attendees.forEach((entry) => lines.push(entry))
    } else {
      lines.push('Não informado')
    }

    return lines.join('\n')
  }
}

const toSingleLine = (value: unknown): string =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''

const extractSlackMentionId = (value: unknown): string => {
  const normalized = toSingleLine(value)
  if (!normalized) {
    return ''
  }

  const slackIdPattern = /^[A-Z][A-Z0-9]+$/
  if (slackIdPattern.test(normalized)) {
    return normalized
  }

  const mentionMatch = normalized.match(/<@([^>]+)>/)
  if (mentionMatch?.[1]) {
    return mentionMatch[1].trim()
  }

  const sanitized = normalized.replace(/<.*$/, '').trim()
  if (!sanitized) {
    return ''
  }

  const candidate = sanitized.replace(/^@+/, '').trim()
  if (!candidate || /\s/.test(candidate) || /[^@\s]+@[^@\s]+/.test(candidate)) {
    return ''
  }

  if (
    normalized.startsWith('@') ||
    normalized.startsWith('<@') ||
    normalized.includes('@') ||
    sanitized !== normalized
  ) {
    return candidate
  }

  return ''
}

export interface SlackPerson {
  name?: string
  email?: string
  label?: string
  mention?: string
  slack?: string
  slackId?: string
  handle?: string
  username?: string
  uid?: string
}

const buildSlackPersonLabel = (
  entry: unknown,
  {
    fallbackLabel = 'Usuário',
    requireEmailPlaceholder = false,
  }: { fallbackLabel?: string; requireEmailPlaceholder?: boolean } = {},
): string => {
  if (!entry) {
    return requireEmailPlaceholder
      ? `${fallbackLabel} (email não informado)`
      : fallbackLabel
  }

  if (typeof entry === 'string') {
    const normalized = toSingleLine(entry)
    if (!normalized) {
      return requireEmailPlaceholder
        ? `${fallbackLabel} (email não informado)`
        : fallbackLabel
    }

    const mentionId = extractSlackMentionId(normalized)
    if (mentionId) {
      return requireEmailPlaceholder
        ? `<@${mentionId}> (email não informado)`
        : `<@${mentionId}>`
    }

    if (requireEmailPlaceholder && !normalized.includes('@')) {
      return `${normalized} (email não informado)`
    }

    return normalized
  }

  const data = entry as SlackPerson
  const label = toSingleLine(data.label)
  const name = toSingleLine(data.name)
  const email = toSingleLine(data.email)

  const mentionCandidates = [
    data.mention,
    data.slack,
    data.slackId,
    data.handle,
    data.username,
    data.uid,
    label,
    name,
  ]

  const mentionId = mentionCandidates
    .map((candidate) => extractSlackMentionId(candidate))
    .find(Boolean)

  if (mentionId) {
    if (email || requireEmailPlaceholder) {
      const emailLabel = email || 'email não informado'
      return `<@${mentionId}> (${emailLabel})`
    }

    return `<@${mentionId}>`
  }

  if (email) {
    return name ? `${name} (${email})` : `<${email}>`
  }

  if (label) {
    return requireEmailPlaceholder ? `${label} (email não informado)` : label
  }

  if (name) {
    return requireEmailPlaceholder ? `${name} (email não informado)` : name
  }

  return fallbackLabel
}

const formatDurationMilliseconds = (value: unknown): string => {
  const milliseconds = Number(value)
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    return ''
  }

  if (milliseconds < 60000) {
    const seconds = Math.round(milliseconds / 1000)
    return seconds > 0 ? `${seconds}s` : ''
  }

  const totalMinutes = Math.round(milliseconds / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`
  }

  return `${totalMinutes}min`
}

const formatSlackDateTime = (timestamp: unknown): string => {
  const parsed = Number(timestamp)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return ''
  }

  const date = new Date(parsed)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  try {
    return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  } catch {
    return date.toISOString()
  }
}

export interface TaskSummaryPayload {
  submittedBy?: SlackPerson | string
  scenario?: {
    title?: string
    stage?: string
    category?: string
    automation?: string
    fingerprint?: string
  }
  environment?: {
    label?: string
    identifier?: string
    storeName?: string
    organizationName?: string
    status?: string
    momentLabel?: string
    testType?: string
    release?: string
    suiteName?: string
    taskUrl?: string
  }
  test?: {
    platform?: string
    status?: string
    durationLabel?: string
    durationMs?: number
    completedAt?: number | string
  }
}

export const buildSlackTaskSummaryMessage = ({
  submittedBy,
  scenario,
  environment,
  test,
}: TaskSummaryPayload): string => {
  const actor = buildSlackPersonLabel(submittedBy, {
    fallbackLabel: 'Responsável',
    requireEmailPlaceholder: true,
  })

  const scenarioTitle = toSingleLine(scenario?.title) || 'Cenário'
  const lines = [
    '✅ *Tarefa concluída*',
    `🧪 Cenário: ${scenarioTitle}`,
    `👤 Responsável: ${actor}`,
  ]

  const stageLabel = toSingleLine(scenario?.stage)
  if (stageLabel) {
    lines.push(`🎯 Etapa: ${stageLabel}`)
  }

  const categoryLabel = toSingleLine(scenario?.category)
  if (categoryLabel) {
    lines.push(`🗂️ Categoria: ${categoryLabel}`)
  }

  const automationLabel = toSingleLine(scenario?.automation)
  if (automationLabel) {
    lines.push(`🤖 Automação: ${automationLabel}`)
  }

  const fingerprint = toSingleLine(scenario?.fingerprint)
  if (fingerprint) {
    lines.push(`🆔 Referência: ${fingerprint}`)
  }

  const platformLabel = toSingleLine(test?.platform) || 'Execução'
  const statusLabel = toSingleLine(test?.status) || 'Concluído'
  lines.push(`💻 Plataforma: ${platformLabel}`)
  lines.push(`📊 Status: ${statusLabel}`)

  const durationLabel =
    toSingleLine(test?.durationLabel) || formatDurationMilliseconds(test?.durationMs)
  if (durationLabel) {
    lines.push(`⏱️ Duração: ${durationLabel}`)
  }

  const completionLabel = formatSlackDateTime(test?.completedAt)
  if (completionLabel) {
    lines.push(`🕒 Concluído em: ${completionLabel}`)
  }

  const environmentLabel =
    toSingleLine(environment?.label) ||
    toSingleLine(environment?.identifier) ||
    'Ambiente'

  const locationParts: string[] = []
  const storeName = toSingleLine(environment?.storeName)
  if (storeName) {
    locationParts.push(storeName)
  }

  const organizationName = toSingleLine(environment?.organizationName)
  if (organizationName) {
    locationParts.push(organizationName)
  }

  lines.push(`🏢 Ambiente: ${environmentLabel}`)
  if (locationParts.length) {
    lines.push(`📍 Local: ${locationParts.join(' • ')}`)
  }

  const contextParts: string[] = []
  const statusContext = toSingleLine(environment?.status)
  if (statusContext) {
    contextParts.push(`Status: ${statusContext}`)
  }

  const momentLabel = toSingleLine(environment?.momentLabel)
  if (momentLabel) {
    contextParts.push(`Momento: ${momentLabel}`)
  }

  const testTypeLabel = toSingleLine(environment?.testType)
  if (testTypeLabel) {
    contextParts.push(`Tipo de teste: ${testTypeLabel}`)
  }

  const releaseLabel = toSingleLine(environment?.release)
  if (releaseLabel) {
    contextParts.push(`Release: ${releaseLabel}`)
  }

  const suiteLabel = toSingleLine(environment?.suiteName)
  if (suiteLabel) {
    contextParts.push(`Suite: ${suiteLabel}`)
  }

  if (contextParts.length) {
    lines.push(`ℹ️ Contexto: ${contextParts.join(' • ')}`)
  }

  const taskUrl = toSingleLine(environment?.taskUrl)
  if (taskUrl) {
    lines.push(`📝 Tarefa: <${taskUrl}|Abrir tarefa>`)
  }

  return lines.join('\n')
}

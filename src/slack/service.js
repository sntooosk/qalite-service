const toSingleLine = (value) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''

const extractSlackMentionId = (value) => {
  const normalized = toSingleLine(value)
  if (!normalized) {
    return ''
  }

  const slackIdPattern = /^[A-Z][A-Z0-9]+$/
  if (slackIdPattern.test(normalized)) {
    return normalized
  }

  const mentionMatch = normalized.match(/<@([^>]+)>/)
  if (mentionMatch && mentionMatch[1]) {
    return mentionMatch[1].trim()
  }

  const sanitized = normalized.replace(/<.*$/, '').trim()
  if (!sanitized) {
    return ''
  }

  const candidate = sanitized.replace(/^@+/, '').trim()
  if (!candidate || /\s/.test(candidate)) {
    return ''
  }

  if (/^[^@\s]+@[^@\s]+$/.test(candidate)) {
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

const removeEmailAddresses = (value) => {
  const normalized = toSingleLine(value)
  if (!normalized) {
    return ''
  }

  const withoutAngleBrackets = normalized.replace(/<(?!@)[^>]+>/g, '').trim()
  const withoutEmails = withoutAngleBrackets
    .replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, '')
    .replace(/\(\s*\)/g, ' ')
    .replace(/\[\s*\]/g, ' ')

  return withoutEmails
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*[-–—,:|]\s*$/g, '')
    .trim()
}

const buildSlackPersonLabel = (
  entry,
  {
    fallbackLabel = 'Usuário',
    requireEmailPlaceholder = false,
    includeEmail = true,
  } = {},
) => {
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
      if (includeEmail && requireEmailPlaceholder) {
        return `<@${mentionId}> (email não informado)`
      }
      return `<@${mentionId}>`
    }

    if (!includeEmail) {
      const withoutEmail = removeEmailAddresses(normalized)
      if (withoutEmail) {
        return withoutEmail
      }
      return fallbackLabel
    }

    if (requireEmailPlaceholder) {
      const emailMatch = normalized.match(/<([^>]+@[^>]+)>/)
      if (emailMatch) {
        return normalized
      }
      return `${normalized} (email não informado)`
    }

    return normalized
  }

  const name = toSingleLine(entry.name)
  const email = toSingleLine(entry.email)
  const label = toSingleLine(entry.label)

  const mentionCandidates = [
    entry.mention,
    entry.slack,
    entry.slackId,
    entry.handle,
    entry.username,
    entry.uid,
    label,
    name,
  ]

  let mentionId = ''
  for (const candidate of mentionCandidates) {
    mentionId = extractSlackMentionId(candidate)
    if (mentionId) {
      break
    }
  }

  if (mentionId) {
    if (includeEmail) {
      const emailLabel =
        email || (requireEmailPlaceholder ? 'email não informado' : '')

      if (emailLabel) {
        return `<@${mentionId}> (${emailLabel})`
      }
    }

    return `<@${mentionId}>`
  }

  if (!includeEmail) {
    const sanitizedLabel = removeEmailAddresses(label)
    if (sanitizedLabel) {
      return sanitizedLabel
    }

    const sanitizedName = removeEmailAddresses(name)
    if (sanitizedName) {
      return sanitizedName
    }

    return fallbackLabel
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

  return requireEmailPlaceholder
    ? `${fallbackLabel} (email não informado)`
    : fallbackLabel
}

const buildResponsibleLabel = (responsible = {}) =>
  buildSlackPersonLabel(responsible, {
    fallbackLabel: 'Responsável',
    includeEmail: false,
  })

const dedupe = (items = []) => {
  const seen = new Set()
  const result = []
  items.forEach((item) => {
    const normalized = toSingleLine(item)
    if (!normalized || seen.has(normalized)) {
      return
    }
    seen.add(normalized)
    result.push(normalized)
  })
  return result
}

const formatSlackLink = (url, label) => {
  const normalizedUrl = typeof url === 'string' ? url.trim() : ''
  if (!normalizedUrl) {
    return ''
  }

  const normalizedLabel = toSingleLine(label) || normalizedUrl
  return `<${normalizedUrl}|${normalizedLabel}>`
}

const formatPercentageValue = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) {
    return ''
  }

  const rounded = Math.round(number * 10) / 10
  return `${rounded}%`
}

const formatDurationMilliseconds = (value) => {
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

const formatSlackDateTime = (timestamp) => {
  const parsed = Number(timestamp)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return ''
  }

  const date = new Date(parsed)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  try {
    return date.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    })
  } catch {
    return date.toISOString()
  }
}

const buildEnvironmentTaskLines = (store) => {
  const environments = Array.isArray(store?.environments)
    ? store.environments
    : []
  if (!environments.length) {
    return []
  }

  const toTaskLinks = (environment) => {
    const urlCandidates = []
    const pushCandidate = (candidate) => {
      const normalized = toSingleLine(candidate)
      if (normalized) {
        urlCandidates.push(normalized)
      }
    }

    pushCandidate(environment?.taskUrl)
    pushCandidate(environment?.jiraTaskUrl)
    pushCandidate(environment?.jiraUrl)

    if (Array.isArray(environment?.tasks)) {
      environment.tasks.forEach((task) => {
        if (typeof task === 'string') {
          pushCandidate(task)
        } else if (task?.url) {
          pushCandidate(task.url)
        }
      })
    }

    const uniqueUrls = dedupe(urlCandidates)
    if (!uniqueUrls.length) {
      return []
    }

    return uniqueUrls
      .map((url, index) =>
        formatSlackLink(
          url,
          uniqueUrls.length > 1 ? `Jira ${index + 1}` : 'Jira',
        ),
      )
      .filter(Boolean)
  }

  return environments
    .map((environment, envIndex) => {
      const taskLinks = toTaskLinks(environment)
      if (!taskLinks.length) {
        return ''
      }

      const label =
        toSingleLine(environment?.label) ||
        toSingleLine(environment?.name) ||
        toSingleLine(environment?.identifier) ||
        `Ambiente ${envIndex + 1}`

      return `   ↳ 🔗 ${label}: ${taskLinks.join(' | ')}`
    })
    .filter(Boolean)
}

export const buildSlackEventSummaryMessage = ({
  eventName,
  testTypes = [],
  executionWindow,
  stores = [],
}) => {
  const eventTitle = toSingleLine(eventName) || 'Evento de QA'
  const execution = toSingleLine(executionWindow)

  const uniqueTestTypes = dedupe(
    testTypes.map((item) => toSingleLine(item)),
  ).filter(Boolean)
  const testTypeLabel = uniqueTestTypes.length
    ? uniqueTestTypes.join(' / ')
    : ''

  const storeLines = stores
    .map((store) => {
      const name = toSingleLine(store?.name) || 'Loja'
      const responsibles = dedupe(
        (Array.isArray(store?.responsibles) ? store.responsibles : [])
          .map((responsible) => buildResponsibleLabel(responsible))
          .filter(Boolean),
      )

      const responsibleText = responsibles.length
        ? responsibles.join(', ')
        : 'Responsável não informado'

      const storeTasks = (Array.isArray(store?.tasks) ? store.tasks : [])
        .map((taskUrl, index) => formatSlackLink(taskUrl, `Jira ${index + 1}`))
        .filter(Boolean)

      const environmentTaskLines = buildEnvironmentTaskLines(store)

      const parts = [`• *${name}:* ${responsibleText}`]

      if (environmentTaskLines.length) {
        parts.push(...environmentTaskLines)
      } else if (storeTasks.length) {
        const taskLabel = storeTasks.length > 1 ? 'Tarefas' : 'Tarefa'
        parts.push(`   ↳ 🔗 ${taskLabel}: ${storeTasks.join(' | ')}`)
      }

      return parts.join('\n')
    })
    .filter(Boolean)

  if (!storeLines.length) {
    storeLines.push('• *Loja:* Responsável não informado')
  }

  const infoLine = execution
    ? `:mega: *INFORMATIVO ${execution}*`
    : ':mega: *INFORMATIVO*'

  const descriptionBase = testTypeLabel
    ? `*${eventTitle}* - _${testTypeLabel}_`
    : `*${eventTitle}*`
  const normalizedDescription = descriptionBase.endsWith('.')
    ? descriptionBase
    : `${descriptionBase}.`
  const descriptionLine = `🧪 ${normalizedDescription}`

  const lines = [
    infoLine,
    descriptionLine,
    '🧾 *Ambientes e responsáveis:*',
    ...storeLines,
  ]

  return lines.join('\n')
}

export const buildSlackTaskSummaryMessage = ({
  submittedBy,
  scenario,
  environment,
  test,
}) => {
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
    toSingleLine(test?.durationLabel) ||
    formatDurationMilliseconds(test?.durationMs)
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

  const locationParts = []
  const storeName = toSingleLine(environment?.storeName)
  if (storeName) {
    locationParts.push(storeName)
  }
  const organizationName = toSingleLine(environment?.organizationName)
  if (organizationName) {
    locationParts.push(organizationName)
  }

  if (locationParts.length) {
    lines.push(`🏢 Ambiente: ${environmentLabel}`)
    lines.push(`📍 Local: ${locationParts.join(' • ')}`)
  } else {
    lines.push(`🏢 Ambiente: ${environmentLabel}`)
  }

  const contextParts = []
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

export const buildSlackEnvironmentSummaryMessage = ({ environment }) => {
  if (!environment) {
    return ''
  }

  const label =
    toSingleLine(environment?.label) ||
    toSingleLine(environment?.identifier) ||
    'Ambiente'
  const statusLabel =
    toSingleLine(environment?.statusLabel) || toSingleLine(environment?.status)
  const stageLabel = toSingleLine(environment?.stageLabel)
  const momentLabel =
    toSingleLine(environment?.testMomentLabel) ||
    toSingleLine(environment?.momentLabel)
  const testType = toSingleLine(environment?.testType)
  const release = toSingleLine(environment?.release)
  const suiteName = toSingleLine(environment?.suiteName)
  const kind = toSingleLine(environment?.kind)

  const storeName = toSingleLine(environment?.storeName)
  const organizationName = toSingleLine(environment?.organizationName)
  const locationParts = []
  if (storeName) {
    locationParts.push(storeName)
  }
  if (organizationName) {
    locationParts.push(organizationName)
  }

  const metrics = environment?.scenarioMetrics || {}
  const totalTests = Number(metrics.totalTests) || 0
  const completedTests = Number(metrics.completedTests) || 0
  const inProgressTests = Number(metrics.inProgressTests) || 0
  const blockedTests = Number(metrics.blockedTests) || 0
  const pendingTests = Number(metrics.pendingTests) || 0
  const successRate = formatPercentageValue(metrics.successRate)
  const failureRate = formatPercentageValue(metrics.failureRate)

  const durationLabel =
    toSingleLine(environment?.testingDurationLabel) ||
    formatDurationMilliseconds(environment?.testingDurationMs)
  const startedAtLabel =
    toSingleLine(environment?.testingStartLabel) ||
    formatSlackDateTime(environment?.testingStartedAt)
  const completedAtLabel =
    toSingleLine(environment?.testingEndLabel) ||
    formatSlackDateTime(environment?.testingCompletedAt)

  const environmentParticipants = Array.isArray(environment?.participants)
    ? environment.participants
    : []
  const participantLabels = dedupe(
    environmentParticipants
      .map((participant) => {
        if (typeof participant === 'string') {
          return removeEmailAddresses(participant)
        }

        return removeEmailAddresses(
          participant?.label ??
            participant?.name ??
            participant?.displayName ??
            participant?.email,
        )
      })
      .filter(Boolean),
  )

  const urls = Array.isArray(environment?.urls) ? environment.urls : []
  const urlLinks = urls
    .map((url, index) => formatSlackLink(url, `URL de teste ${index + 1}`))
    .filter(Boolean)

  const bugCount = Number(environment?.bugCount)
  const bugLabel =
    bugCount === 1
      ? toSingleLine(environment?.bugLabel) || 'bug'
      : toSingleLine(environment?.bugLabelPlural) || 'bugs'

  const taskLink = formatSlackLink(environment?.taskUrl, 'Abrir tarefa')
  const lines = [`:white_check_mark: *Resumo do ambiente ${label}*`]

  if (kind) {
    lines.push(`🏷️ *Tipo:* ${kind}`)
  }
  if (locationParts.length) {
    lines.push(`📍 *Local:* ${locationParts.join(' • ')}`)
  }

  const contextParts = []
  if (statusLabel) {
    contextParts.push(`*Status:* ${statusLabel}`)
  }
  if (stageLabel) {
    contextParts.push(`*Etapa:* ${stageLabel}`)
  }
  if (testType) {
    contextParts.push(`*Tipo de teste:* ${testType}`)
  }
  if (momentLabel) {
    contextParts.push(`*Momento:* ${momentLabel}`)
  }
  if (release) {
    contextParts.push(`*Release:* ${release}`)
  }
  if (suiteName) {
    contextParts.push(`*Suite:* ${suiteName}`)
  }
  if (contextParts.length) {
    lines.push(`🧭 *Contexto:* ${contextParts.join(' • ')}`)
  }

  if (totalTests > 0) {
    const metricParts = [`*Concluídos:* ${completedTests}/${totalTests}`]
    if (inProgressTests > 0) {
      metricParts.push(`*Em andamento:* ${inProgressTests}`)
    }
    if (blockedTests > 0) {
      metricParts.push(`*Bloqueados:* ${blockedTests}`)
    }
    if (pendingTests > 0) {
      metricParts.push(`*Pendentes:* ${pendingTests}`)
    }

    lines.push(`📊 *Cenários:* ${metricParts.join(' • ')}`)
  }

  const rateParts = []
  if (successRate) {
    rateParts.push(`*Sucesso:* ${successRate}`)
  }
  if (failureRate) {
    rateParts.push(`*Falha:* ${failureRate}`)
  }
  if (rateParts.length) {
    lines.push(`📈 *Indicadores:* ${rateParts.join(' • ')}`)
  }

  if (Number.isFinite(bugCount) && bugCount >= 0) {
    lines.push(`🐞 *Bugs:* ${bugCount} ${bugLabel}`)
  }

  if (durationLabel) {
    lines.push(`⏱️ *Duração:* ${durationLabel}`)
  }

  const timelineParts = []
  if (startedAtLabel) {
    timelineParts.push(`*Início:* ${startedAtLabel}`)
  }
  if (completedAtLabel) {
    timelineParts.push(`*Conclusão:* ${completedAtLabel}`)
  }
  if (timelineParts.length) {
    lines.push(`🕒 *Linha do tempo:* ${timelineParts.join(' • ')}`)
  }

  if (participantLabels.length) {
    lines.push(`👥 *Participantes:* ${participantLabels.join(' • ')}`)
  }

  if (urlLinks.length) {
    lines.push(`🌐 *URLs de teste:* ${urlLinks.join(' · ')}`)
  }

  if (taskLink) {
    lines.push(`🗂️ *Tarefa:* ${taskLink}`)
  }

  return lines.join('\n')
}

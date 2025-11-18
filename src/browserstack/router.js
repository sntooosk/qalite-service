import { Router } from 'express'

import { browserstackService } from './service.js'
import { hasBrowserstackCredentials } from '../config.js'

const router = Router()

const ensureCredentials = (response) => {
  if (hasBrowserstackCredentials) {
    return true
  }

  response.status(503).json({
    error: 'BrowserStack integration is not configured.',
  })
  return false
}

const handle = (response, task) => {
  task()
    .then((result) => response.json(result))
    .catch((error) => {
      console.error('[browserstack] request failed', error)
      response.status(500).json({ error: 'Failed to fetch BrowserStack data.' })
    })
}

router.get('/builds', (request, response) => {
  if (!ensureCredentials(response)) return
  handle(response, () => browserstackService.listAutomateBuilds())
})

router.get('/builds/:buildId', (request, response) => {
  if (!ensureCredentials(response)) return
  const { buildId } = request.params
  handle(response, () => browserstackService.getAutomateBuild(buildId))
})

router.get('/builds/:buildId/sessions', (request, response) => {
  if (!ensureCredentials(response)) return
  const { buildId } = request.params
  handle(response, () => browserstackService.listAutomateSessions(buildId))
})

router.get('/sessions/:sessionId', (request, response) => {
  if (!ensureCredentials(response)) return
  const { sessionId } = request.params
  handle(response, () => browserstackService.getAutomateSession(sessionId))
})

router.get('/sessions/:sessionId/logs', (request, response) => {
  if (!ensureCredentials(response)) return
  const { sessionId } = request.params
  handle(response, () => browserstackService.getAutomateSessionLogs(sessionId))
})

router.get('/browsers', (request, response) => {
  if (!ensureCredentials(response)) return
  handle(response, () => browserstackService.listAutomateBrowsers())
})

router.get('/app-automate/builds', (request, response) => {
  if (!ensureCredentials(response)) return
  handle(response, () => browserstackService.listAppAutomateBuilds())
})

router.get('/app-automate/builds/:buildId/sessions', (request, response) => {
  if (!ensureCredentials(response)) return
  const { buildId } = request.params
  handle(response, () => browserstackService.listAppAutomateSessions(buildId))
})

router.get('/app-automate/sessions/:sessionId', (request, response) => {
  if (!ensureCredentials(response)) return
  const { sessionId } = request.params
  handle(response, () => browserstackService.getAppAutomateSession(sessionId))
})

router.get(
  '/app-automate/sessions/:sessionId/networklogs',
  (request, response) => {
    if (!ensureCredentials(response)) return
    const { sessionId } = request.params
    handle(response, () =>
      browserstackService.getAppAutomateSessionNetworkLogs(sessionId),
    )
  },
)

export default router

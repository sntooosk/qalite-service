import { Router } from 'express'
import fetch from 'node-fetch'

import {
  buildSlackEnvironmentSummaryMessage,
  buildSlackEventSummaryMessage,
  buildSlackTaskSummaryMessage,
} from './service.js'
import {
  isSlackConfigured,
  isSlackEnvironmentConfigured,
  serverConfig,
} from '../config.js'

const router = Router()

router.post('/event-summary', async (request, response) => {
  if (!isSlackConfigured) {
    response.status(503).json({ error: 'Slack integration is not configured.' })
    return
  }

  const { eventName, executionWindow, testTypes, stores } = request.body || {}

  if (!eventName) {
    response.status(400).json({ error: 'Event name is required.' })
    return
  }

  const message = buildSlackEventSummaryMessage({
    eventName,
    executionWindow,
    testTypes: Array.isArray(testTypes) ? testTypes : [],
    stores: Array.isArray(stores) ? stores : [],
  })

  try {
    const slackResponse = await fetch(serverConfig.slack.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    })

    if (!slackResponse.ok) {
      throw new Error(
        `Slack webhook responded with status ${slackResponse.status}`,
      )
    }

    response.json({ message: 'Slack event summary sent.' })
  } catch (error) {
    console.error('[slack] failed to send event summary', error)
    response.status(500).json({ error: 'Failed to send summary to Slack.' })
  }
})

router.post('/task-summary', async (request, response) => {
  if (!isSlackConfigured) {
    response.status(503).json({ error: 'Slack integration is not configured.' })
    return
  }

  const { submittedBy, scenario, environment, test } = request.body || {}
  const scenarioTitle =
    typeof scenario?.title === 'string' ? scenario.title.trim() : ''

  if (!scenarioTitle) {
    response.status(400).json({ error: 'Scenario title is required.' })
    return
  }

  const message = buildSlackTaskSummaryMessage({
    submittedBy,
    scenario,
    environment,
    test,
  })

  try {
    const slackResponse = await fetch(serverConfig.slack.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    })

    if (!slackResponse.ok) {
      throw new Error(
        `Slack webhook responded with status ${slackResponse.status}`,
      )
    }

    response.json({ message: 'Slack task summary sent.' })
  } catch (error) {
    console.error('[slack] failed to send task summary', error)
    response
      .status(500)
      .json({ error: 'Failed to send task summary to Slack.' })
  }
})

router.post('/environment-summary', async (request, response) => {
  if (!isSlackEnvironmentConfigured) {
    response.status(503).json({ error: 'Slack integration is not configured.' })
    return
  }

  const { environment } = request.body || {}

  if (!environment || !environment?.id) {
    response.status(400).json({ error: 'Environment data is required.' })
    return
  }

  const message = buildSlackEnvironmentSummaryMessage({
    environment,
  })

  if (!message) {
    response
      .status(400)
      .json({ error: 'Failed to build environment summary message.' })
    return
  }

  try {
    const slackResponse = await fetch(
      serverConfig.slack.environmentWebhookUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      },
    )

    if (!slackResponse.ok) {
      throw new Error(
        `Slack webhook responded with status ${slackResponse.status}`,
      )
    }

    response.json({ message: 'Slack environment summary sent.' })
  } catch (error) {
    console.error('[slack] failed to send environment summary', error)
    response
      .status(500)
      .json({ error: 'Failed to send environment summary to Slack.' })
  }
})

export default router

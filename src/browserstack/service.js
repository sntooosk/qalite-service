import fetch from 'node-fetch'

import { hasBrowserstackCredentials, serverConfig } from '../config.js'

const AUTOMATE_BASE_URL = 'https://api.browserstack.com/automate'
const APP_AUTOMATE_BASE_URL = 'https://api-cloud.browserstack.com/app-automate'

const getAuthorizationHeader = () => {
  if (!hasBrowserstackCredentials) {
    throw new Error('BrowserStack credentials are not configured.')
  }

  const { username, accessKey } = serverConfig.browserstack
  const token = Buffer.from(`${username}:${accessKey}`).toString('base64')
  return `Basic ${token}`
}

const fetchFromBrowserstack = async (url) => {
  const response = await fetch(url, {
    headers: {
      Authorization: getAuthorizationHeader(),
    },
  })

  if (!response.ok) {
    throw new Error(
      `BrowserStack request failed with status ${response.status}`,
    )
  }

  return response.json()
}

export const browserstackService = {
  async listAutomateBuilds() {
    return fetchFromBrowserstack(`${AUTOMATE_BASE_URL}/builds.json`)
  },

  async getAutomateBuild(buildId) {
    return fetchFromBrowserstack(`${AUTOMATE_BASE_URL}/builds/${buildId}.json`)
  },

  async listAutomateSessions(buildId) {
    return fetchFromBrowserstack(
      `${AUTOMATE_BASE_URL}/builds/${buildId}/sessions.json`,
    )
  },

  async getAutomateSession(sessionId) {
    return fetchFromBrowserstack(
      `${AUTOMATE_BASE_URL}/sessions/${sessionId}.json`,
    )
  },

  async getAutomateSessionLogs(sessionId) {
    return fetchFromBrowserstack(
      `${AUTOMATE_BASE_URL}/sessions/${sessionId}/logs`,
    )
  },

  async listAutomateBrowsers() {
    return fetchFromBrowserstack(`${AUTOMATE_BASE_URL}/browsers.json`)
  },

  async listAppAutomateBuilds() {
    return fetchFromBrowserstack(`${APP_AUTOMATE_BASE_URL}/builds.json`)
  },

  async listAppAutomateSessions(buildId) {
    return fetchFromBrowserstack(
      `${APP_AUTOMATE_BASE_URL}/builds/${buildId}/sessions.json`,
    )
  },

  async getAppAutomateSession(sessionId) {
    return fetchFromBrowserstack(
      `${APP_AUTOMATE_BASE_URL}/sessions/${sessionId}.json`,
    )
  },

  async getAppAutomateSessionNetworkLogs(sessionId) {
    return fetchFromBrowserstack(
      `${APP_AUTOMATE_BASE_URL}/sessions/${sessionId}/networklogs`,
    )
  },
}

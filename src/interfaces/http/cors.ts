import { IncomingMessage, ServerResponse } from 'node:http'

import { json } from './http-response'

const isOriginAllowed = (origin: string | undefined, allowedOrigins: string[]): boolean => {
  if (!origin) {
    return true
  }

  return allowedOrigins.includes(origin)
}

export const applyCors = (
  req: IncomingMessage,
  res: ServerResponse,
  allowedOrigins: string[],
): boolean => {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined
  if (!isOriginAllowed(origin, allowedOrigins)) {
    json(res, 403, { error: 'CORS origin not allowed.' })
    return false
  }

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }

  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return false
  }

  return true
}

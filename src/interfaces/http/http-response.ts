import { ServerResponse } from 'node:http'

export const json = (res: ServerResponse, statusCode: number, payload: unknown): void => {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

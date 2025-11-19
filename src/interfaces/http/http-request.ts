import { IncomingMessage } from 'node:http'

import { HttpError } from '../../errors'

export const readJsonBody = async <T>(req: IncomingMessage): Promise<T> => {
  const chunks: Buffer[] = []
  let total = 0
  const MAX_SIZE = 1024 * 1024

  for await (const chunk of req) {
    const buffer = Buffer.from(chunk)
    total += buffer.length
    if (total > MAX_SIZE) {
      throw new HttpError(413, 'Payload too large.')
    }

    chunks.push(buffer)
  }

  if (!chunks.length) {
    return {} as T
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T
  } catch {
    throw new HttpError(400, 'Invalid JSON payload.')
  }
}

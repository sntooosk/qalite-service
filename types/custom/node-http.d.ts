declare module 'node:http' {
  import { EventEmitter } from 'events'

  interface IncomingMessage extends EventEmitter {
    headers: Record<string, string | string[] | undefined>
    method?: string
    url?: string
    on(event: 'data', listener: (chunk: any) => void): this
    on(event: 'end', listener: () => void): this
  }

  interface ServerResponse extends EventEmitter {
    statusCode: number
    setHeader(name: string, value: string): void
    end(data?: any): void
    write(data: any): void
  }

  type RequestListener = (req: IncomingMessage, res: ServerResponse) => void

  function createServer(listener: RequestListener): Server

  interface Server extends EventEmitter {
    listen(port: number, callback?: () => void): void
  }
}

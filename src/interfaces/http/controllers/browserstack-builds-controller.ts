import { IncomingMessage, ServerResponse } from 'node:http'

import { ListBrowserstackBuildsUseCase } from '../../../application/usecases/list-browserstack-builds.js'
import { BrowserstackCredentials } from '../../../domain/entities/browserstack.js'
import { json } from '../http-response.js'
import { readJsonBody } from '../http-request.js'

export class BrowserstackBuildsController {
  constructor(private readonly listBuilds: ListBrowserstackBuildsUseCase) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const credentials = await readJsonBody<BrowserstackCredentials>(req)
    const builds = await this.listBuilds.execute(credentials)
    json(res, 200, { builds })
  }
}

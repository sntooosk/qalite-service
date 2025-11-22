import { HttpError } from '../../errors.js'
import { BrowserstackBuild, BrowserstackCredentials } from '../../domain/entities/browserstack.js'
import { BrowserstackClient } from '../ports/browserstack-client.js'

export class ListBrowserstackBuildsUseCase {
  constructor(private readonly client: BrowserstackClient) {}

  async execute(credentials: BrowserstackCredentials): Promise<BrowserstackBuild[]> {
    const username = credentials.username?.trim()
    const accessKey = credentials.accessKey?.trim() ?? credentials.acessKey?.trim()

    if (!username || !accessKey) {
      throw new HttpError(400, 'Username e accessKey são obrigatórios.')
    }

    return this.client.listBuilds({ username, accessKey })
  }
}

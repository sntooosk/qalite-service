import { HttpError } from '../../errors.js'
import { BrowserstackBuild, BrowserstackCredentials } from '../../domain/entities/browserstack.js'
import { BrowserstackClient } from '../ports/browserstack-client.js'

export class ListBrowserstackBuildsUseCase {
  constructor(private readonly client: BrowserstackClient) {}

  async execute(credentials: BrowserstackCredentials): Promise<BrowserstackBuild[]> {
    const username = credentials.username?.trim()
    const password = credentials.password?.trim()

    if (!username || !password) {
      throw new HttpError(400, 'Username e password são obrigatórios.')
    }

    return this.client.listBuilds({ username, password })
  }
}

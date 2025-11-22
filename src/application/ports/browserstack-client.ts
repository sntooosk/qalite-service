import { BrowserstackBuild, BrowserstackCredentials } from '../../domain/entities/browserstack.js'

export interface BrowserstackClient {
  listBuilds(credentials: BrowserstackCredentials): Promise<BrowserstackBuild[]>
}

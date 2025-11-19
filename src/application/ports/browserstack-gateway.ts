import { BrowserstackBuild } from '../../domain/entities/browserstack-build.js'

export interface BrowserstackGateway {
  listBuilds(): Promise<BrowserstackBuild[]>
}

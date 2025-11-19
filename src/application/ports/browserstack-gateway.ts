import { BrowserstackBuild } from '../../domain/entities/browserstack-build'

export interface BrowserstackGateway {
  listBuilds(): Promise<BrowserstackBuild[]>
}

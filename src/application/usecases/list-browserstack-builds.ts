import { BrowserstackBuild } from '../../domain/entities/browserstack-build.js'
import { BrowserstackGateway } from '../ports/browserstack-gateway.js'

export class ListBrowserstackBuildsUseCase {
  constructor(private readonly gateway: BrowserstackGateway) {}

  async execute(): Promise<BrowserstackBuild[]> {
    return this.gateway.listBuilds()
  }
}

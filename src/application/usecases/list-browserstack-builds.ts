import { BrowserstackBuild } from '../../domain/entities/browserstack-build'
import { BrowserstackGateway } from '../ports/browserstack-gateway'

export class ListBrowserstackBuildsUseCase {
  constructor(private readonly gateway: BrowserstackGateway) {}

  async execute(): Promise<BrowserstackBuild[]> {
    return this.gateway.listBuilds()
  }
}

import crypto from 'node:crypto'

import { HttpError } from '../../errors.js'
import { AutomationExecutionPayload } from '../../domain/entities/automation-execution.js'
import {
  AutomationExecutionFactory,
  AutomationExecutionRepository,
} from '../ports/automation-execution-repository.js'

export class DefaultAutomationExecutionFactory
  implements AutomationExecutionFactory
{
  buildFromPayload(payload: AutomationExecutionPayload) {
    const username = payload.username?.trim()
    const password = payload.password?.trim()

    if (!username || !password) {
      throw new HttpError(400, 'Username e password são obrigatórios.')
    }

    return {
      ...payload,
      username,
      password,
      id: crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
    }
  }
}

export class RegisterAutomationExecutionUseCase {
  constructor(
    private readonly repository: AutomationExecutionRepository,
    private readonly factory: AutomationExecutionFactory,
  ) {}

  async execute(payload: AutomationExecutionPayload): Promise<void> {
    const execution = this.factory.buildFromPayload(payload)
    await this.repository.save(execution)
  }
}

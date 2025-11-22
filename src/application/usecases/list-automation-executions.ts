import { AutomationExecution } from '../../domain/entities/automation-execution.js'
import { AutomationExecutionRepository } from '../ports/automation-execution-repository.js'

export class ListAutomationExecutionsUseCase {
  constructor(private readonly repository: AutomationExecutionRepository) {}

  async execute(): Promise<AutomationExecution[]> {
    return this.repository.list()
  }
}

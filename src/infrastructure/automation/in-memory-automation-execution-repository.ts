import { AutomationExecution } from '../../domain/entities/automation-execution.js'
import { AutomationExecutionRepository } from '../../application/ports/automation-execution-repository.js'

export class InMemoryAutomationExecutionRepository
  implements AutomationExecutionRepository
{
  private executions: AutomationExecution[] = []

  async save(payload: AutomationExecution): Promise<void> {
    this.executions.push(payload)
  }

  async list(): Promise<AutomationExecution[]> {
    return [...this.executions]
  }
}

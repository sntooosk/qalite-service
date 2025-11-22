import {
  AutomationExecution,
  AutomationExecutionPayload,
} from '../../domain/entities/automation-execution.js'

export interface AutomationExecutionRepository {
  save(payload: AutomationExecution): Promise<void>
  list(): Promise<AutomationExecution[]>
}

export interface AutomationExecutionFactory {
  buildFromPayload(payload: AutomationExecutionPayload): AutomationExecution
}

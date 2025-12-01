export interface StructuredLogPayload {
  message: string
  context?: Record<string, unknown>
}

export class StructuredLogger {
  info(message: string, context?: Record<string, unknown>): void {
    this.write('info', { message, context })
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.write('error', { message, context })
  }

  private write(level: 'info' | 'error', payload: StructuredLogPayload): void {
    const logEntry = {
      level,
      timestamp: new Date().toISOString(),
      message: payload.message,
      ...(payload.context ? { context: payload.context } : {}),
    }

    console[level](JSON.stringify(logEntry))
  }
}

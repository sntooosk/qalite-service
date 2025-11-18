export class ValidationError extends Error {
  public readonly statusCode: number

  constructor(message: string, statusCode = 400) {
    super(message)
    this.name = 'ValidationError'
    this.statusCode = statusCode
  }
}

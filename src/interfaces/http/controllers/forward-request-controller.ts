import { ServerResponse } from 'node:http'

import { ForwardRequestUseCase } from '../../../application/usecases/forward-request.js'
import { ForwardRequestInput } from '../../../application/dtos/forward-request-dto.js'
import { json } from '../http-response.js'

export class ForwardRequestController {
  constructor(private readonly useCase: ForwardRequestUseCase) {}

  async handle(payload: ForwardRequestInput, res: ServerResponse): Promise<void> {
    const response = await this.useCase.execute(payload)

    json(res, response.status, {
      data: response.data,
      headers: response.headers,
      fromCache: response.fromCache,
    })
  }
}

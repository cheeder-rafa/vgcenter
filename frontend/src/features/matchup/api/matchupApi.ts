import { requestJson } from '../../../lib/api-client'
import type { ThreatMatrixRequest, ThreatMatrixResponse } from '../types'

export function buildThreatMatrix(request: ThreatMatrixRequest): Promise<ThreatMatrixResponse> {
  return requestJson<ThreatMatrixResponse>('/matchup/matrix', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

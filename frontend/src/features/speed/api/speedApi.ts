import { requestJson } from '../../../lib/api-client'
import type { SpeedTiersRequest, SpeedTiersResponse } from '../types'

export function buildSpeedTiers(
  request: SpeedTiersRequest,
): Promise<SpeedTiersResponse> {
  return requestJson<SpeedTiersResponse>('/preview/speed-tiers', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

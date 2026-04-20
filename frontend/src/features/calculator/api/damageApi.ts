import { requestJson } from '../../../lib/api-client'
import type {
  CalculateDamageResponse,
  DamageCalculationRequest,
} from '../types/api'

export function calculateDamage(
  request: DamageCalculationRequest,
): Promise<CalculateDamageResponse> {
  return requestJson<CalculateDamageResponse>('/damage/calculate', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

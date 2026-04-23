import { requestJson } from '../../../lib/api-client'
import type {
  EvaluateMatchupRequest,
  EvaluateMatchupResponse,
} from '../types/api'

export function evaluateMatchup(
  request: EvaluateMatchupRequest,
): Promise<EvaluateMatchupResponse> {
  return requestJson<EvaluateMatchupResponse>('/gameplan/evaluate', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

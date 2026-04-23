import { requestJson } from '../../../lib/api-client'
import type {
  EvaluateMatchupRequest,
  EvaluateMatchupResponse,
  RecommendLineupRequest,
  RecommendLineupResponse,
} from '../types/api'

export function evaluateMatchup(
  request: EvaluateMatchupRequest,
): Promise<EvaluateMatchupResponse> {
  return requestJson<EvaluateMatchupResponse>('/gameplan/evaluate', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function recommendLineups(
  request: RecommendLineupRequest,
): Promise<RecommendLineupResponse> {
  return requestJson<RecommendLineupResponse>('/gameplan/recommend', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

import { requestJson } from '../../../lib/api-client'
import type {
  LeadEvaluationRequest,
  LeadEvaluationResult,
  RecommendPlansRequest,
  RecommendPlansResult,
} from '../types'

export function evaluateLeads(
  request: LeadEvaluationRequest,
): Promise<LeadEvaluationResult> {
  return requestJson<LeadEvaluationResult>('/preview/leads/evaluate', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function recommendPlans(
  request: RecommendPlansRequest,
  signal?: AbortSignal,
): Promise<RecommendPlansResult> {
  return requestJson<RecommendPlansResult>('/preview/plans/recommend', {
    method: 'POST',
    body: JSON.stringify(request),
    signal,
  })
}

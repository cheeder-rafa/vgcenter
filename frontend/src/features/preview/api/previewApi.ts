import { requestJson } from '../../../lib/api-client'
import type { LeadEvaluationRequest, LeadEvaluationResult } from '../types'

export function evaluateLeads(
  request: LeadEvaluationRequest,
): Promise<LeadEvaluationResult> {
  return requestJson<LeadEvaluationResult>('/preview/leads/evaluate', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

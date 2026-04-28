import { requestJson } from '../../../lib/api-client'
import type {
  ReplayEvaluateRequest,
  ReplayEvaluateResponse,
  ReplayParseRequest,
  ReplayTimeline,
} from '../types'

export function parseReplay(
  request: ReplayParseRequest,
  signal?: AbortSignal,
): Promise<ReplayTimeline> {
  return requestJson<ReplayTimeline>('/replay/parse', {
    method: 'POST',
    body: JSON.stringify(request),
    signal,
  })
}

export function evaluateReplay(
  request: ReplayEvaluateRequest,
  signal?: AbortSignal,
): Promise<ReplayEvaluateResponse> {
  return requestJson<ReplayEvaluateResponse>('/replay/evaluate', {
    method: 'POST',
    body: JSON.stringify(request),
    signal,
  })
}

import type { ProblemDetails } from '../features/calculator/types/api'
import { getApiBaseUrl } from './app-config'

export async function requestJson<TResponse>(
  path: string,
  init: RequestInit = {},
): Promise<TResponse> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return (await response.json()) as TResponse
}

export type ApiError = Error & {
  status: number
  problem?: ProblemDetails
}

async function parseError(response: Response): Promise<ApiError> {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('json')) {
    try {
      const problem = (await response.json()) as ProblemDetails
      const detail = problem.detail ?? problem.title ?? response.statusText
      const err = new Error(`[${response.status}] ${detail}`) as ApiError
      err.status = response.status
      err.problem = problem
      return err
    } catch {
      /* fall through */
    }
  }
  const text = await response.text().catch(() => '')
  const err = new Error(
    `[${response.status}] ${text || response.statusText || 'request failed'}`,
  ) as ApiError
  err.status = response.status
  return err
}

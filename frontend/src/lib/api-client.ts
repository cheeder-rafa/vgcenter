import type { ProblemDetails } from '../features/calculator/types/api'

export const apiBaseUrl = '/api/v1'

export async function requestJson<TResponse>(
  path: string,
  init: RequestInit = {},
): Promise<TResponse> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
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

async function parseError(response: Response): Promise<Error> {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('json')) {
    try {
      const problem = (await response.json()) as ProblemDetails
      const detail = problem.detail ?? problem.title ?? response.statusText
      return new Error(`[${response.status}] ${detail}`)
    } catch {
      /* fall through */
    }
  }
  const text = await response.text().catch(() => '')
  return new Error(
    `[${response.status}] ${text || response.statusText || 'request failed'}`,
  )
}

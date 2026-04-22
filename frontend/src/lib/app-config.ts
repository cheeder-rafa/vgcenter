function normalizeApiBaseUrl(value: string | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) {
    return '/api/v1'
  }
  return trimmed.replace(/\/+$/, '')
}

function normalizeFeedbackUrl(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function getApiBaseUrl(): string {
  return normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)
}

export function getFeedbackUrl(): string | null {
  return normalizeFeedbackUrl(import.meta.env.VITE_FEEDBACK_URL)
}

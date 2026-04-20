import { requestJson } from '../../../lib/api-client'
import type { ImportedTeamResponse } from '../types/api'

export function importShowdown(text: string): Promise<ImportedTeamResponse> {
  return requestJson<ImportedTeamResponse>('/import/showdown', {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}

export function importPokepaste(url: string): Promise<ImportedTeamResponse> {
  return requestJson<ImportedTeamResponse>('/import/pokepaste', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
}

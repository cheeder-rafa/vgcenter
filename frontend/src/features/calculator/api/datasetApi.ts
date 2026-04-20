import { requestJson } from '../../../lib/api-client'
import type {
  NamedDatasetEntry,
  NatureResponse,
  PokedexEntry,
  Regulation,
} from '../types/api'

function datasetUrl(resource: string, regulation: Regulation) {
  return `/dataset/${resource}?regulation=${encodeURIComponent(regulation)}`
}

export function fetchPokedex(regulation: Regulation): Promise<PokedexEntry[]> {
  return requestJson<PokedexEntry[]>(datasetUrl('pokedex', regulation), { method: 'GET' })
}

export function fetchMoves(regulation: Regulation): Promise<NamedDatasetEntry[]> {
  return requestJson<NamedDatasetEntry[]>(datasetUrl('moves', regulation), { method: 'GET' })
}

export function fetchAbilities(regulation: Regulation): Promise<NamedDatasetEntry[]> {
  return requestJson<NamedDatasetEntry[]>(datasetUrl('abilities', regulation), { method: 'GET' })
}

export function fetchItems(regulation: Regulation): Promise<NamedDatasetEntry[]> {
  return requestJson<NamedDatasetEntry[]>(datasetUrl('items', regulation), { method: 'GET' })
}

export function fetchNatures(regulation: Regulation): Promise<NatureResponse[]> {
  return requestJson<NatureResponse[]>(datasetUrl('natures', regulation), { method: 'GET' })
}

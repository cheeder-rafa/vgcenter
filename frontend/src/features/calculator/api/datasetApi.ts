import { requestJson } from '../../../lib/api-client'
import { resolveSpriteId } from '../components/spriteBadgeSources'
import type {
  BuildStatsRequest,
  BuildStatsResponse,
  MoveDefinition,
  NamedDatasetEntry,
  NatureResponse,
  PokedexEntry,
  Regulation,
} from '../types/api'

function datasetUrl(resource: string, regulation: Regulation) {
  return `/dataset/${resource}?regulation=${encodeURIComponent(regulation)}`
}

export function fetchPokedex(regulation: Regulation): Promise<PokedexEntry[]> {
  return requestJson<Omit<PokedexEntry, 'imageUrl'>[]>(
    datasetUrl('pokedex', regulation),
    {
      method: 'GET',
    },
  ).then((entries) =>
    entries.map((entry) => ({
      ...entry,
      imageUrl: `/sprites/${resolveSpriteId(entry.id) ?? entry.id}.png`,
    })),
  )
}

export function fetchMoves(regulation: Regulation): Promise<MoveDefinition[]> {
  return requestJson<MoveDefinition[]>(datasetUrl('moves', regulation), {
    method: 'GET',
  })
}

export function fetchAbilities(
  regulation: Regulation,
): Promise<NamedDatasetEntry[]> {
  return requestJson<NamedDatasetEntry[]>(datasetUrl('abilities', regulation), {
    method: 'GET',
  })
}

export function fetchItems(
  regulation: Regulation,
): Promise<NamedDatasetEntry[]> {
  return requestJson<NamedDatasetEntry[]>(datasetUrl('items', regulation), {
    method: 'GET',
  })
}

export function fetchNatures(
  regulation: Regulation,
): Promise<NatureResponse[]> {
  return requestJson<NatureResponse[]>(datasetUrl('natures', regulation), {
    method: 'GET',
  })
}

export function buildStats(
  request: BuildStatsRequest,
): Promise<BuildStatsResponse> {
  return requestJson<BuildStatsResponse>('/dataset/build-stats', {
    method: 'POST',
    body: JSON.stringify({
      speciesId: request.speciesId,
      natureId: request.natureId,
      megaActive: request.megaActive,
      megaFormId: request.megaFormId,
      sp: {
        hp: request.sp.hp,
        attack: request.sp.atk,
        defense: request.sp.def,
        specialAttack: request.sp.spa,
        specialDefense: request.sp.spd,
        speed: request.sp.spe,
      },
    }),
  })
}

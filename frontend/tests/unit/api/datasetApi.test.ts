import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildStats,
  fetchAbilities,
  fetchItems,
  fetchMoves,
  fetchNatures,
  fetchPokedex,
} from '../../../src/features/calculator/api/datasetApi'

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

describe('datasetApi', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches the pokedex for a regulation and decorates imageUrl client-side', async () => {
    fetchMock.mockResolvedValue(
      okJson([
        {
          id: 'charizard',
          name: 'Charizard',
          types: ['FIRE', 'FLYING'],
          baseStats: {
            hp: 78,
            attack: 84,
            defense: 78,
            specialAttack: 109,
            specialDefense: 85,
            speed: 100,
          },
          abilityIds: ['blaze'],
          moveIds: ['heat-wave'],
          megaForms: [],
        },
      ]),
    )

    const result = await fetchPokedex('M-A')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/dataset/pokedex?regulation=M-A',
      expect.objectContaining({ method: 'GET' }),
    )
    expect(result[0]?.imageUrl).toBe('/sprites/charizard.png')
  })

  it('fetches moves, abilities, items, natures with the right query', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(okJson([])))

    await fetchMoves('M-A')
    await fetchAbilities('M-A')
    await fetchItems('M-A')
    await fetchNatures('M-A')

    const urls = fetchMock.mock.calls.map((call) => call[0] as string)
    expect(urls).toEqual([
      '/api/v1/dataset/moves?regulation=M-A',
      '/api/v1/dataset/abilities?regulation=M-A',
      '/api/v1/dataset/items?regulation=M-A',
      '/api/v1/dataset/natures?regulation=M-A',
    ])
  })

  it('returns move metadata from the dataset moves endpoint', async () => {
    fetchMock.mockResolvedValue(
      okJson([
        {
          id: 'moonblast',
          name: 'Moonblast',
          type: 'FAIRY',
          category: 'SPECIAL',
          basePower: 95,
          spread: false,
          contact: false,
          doublePowerWhenUserStatused: false,
          ignoreBurnPenaltyWhenUserStatused: false,
        },
      ]),
    )

    const result = await fetchMoves('M-A')

    expect(result).toEqual([
      expect.objectContaining({
        id: 'moonblast',
        type: 'FAIRY',
        category: 'SPECIAL',
        basePower: 95,
      }),
    ])
  })

  it('POSTs build-stats with frontend spread keys mapped to the backend dto', async () => {
    fetchMock.mockResolvedValue(
      okJson({
        baseStats: {
          hp: 78,
          attack: 84,
          defense: 78,
          specialAttack: 109,
          specialDefense: 85,
          speed: 100,
        },
        finalStats: {
          hp: 153,
          attack: 104,
          defense: 99,
          specialAttack: 177,
          specialDefense: 105,
          speed: 132,
        },
      }),
    )

    await buildStats({
      speciesId: 'charizard',
      natureId: 'timid',
      megaActive: false,
      megaFormId: null,
      sp: { hp: 12, atk: 0, def: 4, spa: 32, spd: 0, spe: 32 },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/dataset/build-stats',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          speciesId: 'charizard',
          natureId: 'timid',
          megaActive: false,
          megaFormId: null,
          sp: {
            hp: 12,
            attack: 0,
            defense: 4,
            specialAttack: 32,
            specialDefense: 0,
            speed: 32,
          },
        }),
      }),
    )
  })
})

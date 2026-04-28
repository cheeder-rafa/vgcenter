import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  optimizeAgainstThreats,
  type OptimizeAgainstThreatsRequest,
} from '../../../src/features/calculator/api/optimizerApi'

describe('optimizerApi', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('POSTs multi-threat optimizer requests to the calc endpoint', async () => {
    const request: OptimizeAgainstThreatsRequest = {
      regulation: 'M-A',
      defender: {
        speciesId: 'snorlax',
        natureId: 'HARDY',
        abilityId: 'thick-fat',
        itemId: null,
      },
      threats: [
        {
          attackerSpeciesId: 'garchomp',
          attackerNatureId: 'JOLLY',
          attackerSp: {
            hp: 0,
            attack: 32,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            speed: 32,
          },
          attackerAbilityId: 'rough-skin',
          attackerItemId: null,
          moveId: 'earthquake',
        },
      ],
      goal: 'EXPECTED_DAMAGE_SUM',
      field: { weather: 'CLEAR', terrain: 'NONE', room: 'NONE' },
      attackerSide: {
        reflect: false,
        lightScreen: false,
        auroraVeil: false,
        friendGuard: false,
        helpingHand: false,
        tailwind: false,
        protect: false,
      },
      defenderSide: {
        reflect: false,
        lightScreen: false,
        auroraVeil: false,
        friendGuard: false,
        helpingHand: false,
        tailwind: false,
        protect: false,
      },
      criticalHit: false,
    }
    const response = { best: null, threats: [] }
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const result = await optimizeAgainstThreats(request)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/calc/optimize-against-threats',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(request),
      }),
    )
    expect(result).toEqual(response)
  })
})

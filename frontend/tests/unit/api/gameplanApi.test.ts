import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { evaluateMatchup } from '../../../src/features/gameplan/api/gameplanApi'
import type {
  EvaluateMatchupRequest,
  EvaluateMatchupResponse,
} from '../../../src/features/gameplan/types/api'
import type { CombatantRequest } from '../../../src/features/calculator/types/api'

const baseCombatant: CombatantRequest = {
  level: 50,
  stats: {
    hp: 175,
    attack: 120,
    defense: 100,
    specialAttack: 140,
    specialDefense: 100,
    speed: 110,
  },
  types: ['FIRE'],
  abilityId: null,
  itemId: null,
  status: 'NONE',
  stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  grounded: true,
  currentHp: 175,
}

function makePokemon(speciesId: string) {
  return {
    speciesId,
    combatant: baseCombatant,
    moveIds: ['a', 'b', 'c', 'd'] as [string, string, string, string],
    assumedForms: [] as string[],
  }
}

const sampleRequest: EvaluateMatchupRequest = {
  regulation: 'M-A',
  mine: {
    lineup: [
      makePokemon('m1'),
      makePokemon('m2'),
      makePokemon('m3'),
      makePokemon('m4'),
    ],
    winConditionIndex: 0,
  },
  opponent: [
    makePokemon('o1'),
    makePokemon('o2'),
    makePokemon('o3'),
    makePokemon('o4'),
    makePokemon('o5'),
    makePokemon('o6'),
  ],
}

const sampleResponse: EvaluateMatchupResponse = { cells: [] }

describe('evaluateMatchup', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('POSTs JSON to /api/v1/gameplan/evaluate and returns the response', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(sampleResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const result = await evaluateMatchup(sampleRequest)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/gameplan/evaluate')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' })
    expect(JSON.parse(init?.body as string)).toEqual(sampleRequest)
    expect(result).toEqual(sampleResponse)
  })

  it('throws with ProblemDetails detail on 4xx', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ title: 'Bad Request', detail: 'opponent size must be 6' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/problem+json' },
        },
      ),
    )

    await expect(evaluateMatchup(sampleRequest)).rejects.toThrow(
      /opponent size must be 6/,
    )
  })
})

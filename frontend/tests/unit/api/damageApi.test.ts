import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { calculateDamage } from '../../../src/features/calculator/api/damageApi'
import type {
  CalculateDamageResponse,
  DamageCalculationRequest,
} from '../../../src/features/calculator/types/api'

const sampleRequest: DamageCalculationRequest = {
  regulation: 'M-A',
  attacker: {
    level: 50,
    stats: {
      hp: 175,
      attack: 182,
      defense: 120,
      specialAttack: 100,
      specialDefense: 120,
      speed: 110,
    },
    types: ['FIRE'],
    abilityId: 'blaze',
    itemId: 'life-orb',
    status: 'NONE',
    grounded: true,
    fullHp: true,
  },
  defender: {
    level: 50,
    stats: {
      hp: 180,
      attack: 110,
      defense: 130,
      specialAttack: 120,
      specialDefense: 130,
      speed: 100,
    },
    types: ['GRASS', 'POISON'],
    abilityId: 'overgrow',
    itemId: null,
    status: 'NONE',
    grounded: true,
    fullHp: true,
  },
  move: {
    type: 'FIRE',
    category: 'PHYSICAL',
    basePower: 120,
    spread: false,
    contact: true,
    doublePowerWhenUserStatused: false,
    ignoreBurnPenaltyWhenUserStatused: false,
  },
  field: { weather: 'NONE', terrain: 'NONE', room: 'NONE' },
  attackerSide: {
    reflect: false,
    lightScreen: false,
    auroraVeil: false,
    friendGuard: false,
    helpingHand: false,
  },
  defenderSide: {
    reflect: false,
    lightScreen: false,
    auroraVeil: false,
    friendGuard: false,
    helpingHand: false,
  },
  criticalHit: false,
  targets: 1,
}

const sampleResponse: CalculateDamageResponse = {
  rolls: [
    168, 170, 172, 174, 176, 178, 180, 182, 184, 186, 188, 190, 192, 194, 196,
    200,
  ],
  min: 168,
  max: 200,
  minPct: 87.0,
  maxPct: 103.6,
  koChance: { description: 'Possible OHKO', probability: 0.6875, hits: 1 },
}

describe('calculateDamage', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('POSTs JSON to /api/v1/damage/calculate and returns the response', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(sampleResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const result = await calculateDamage(sampleRequest)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/damage/calculate')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' })
    expect(JSON.parse(init?.body as string)).toEqual(sampleRequest)
    expect(result).toEqual(sampleResponse)
  })

  it('throws with the ProblemDetails title when the server responds 4xx', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          type: 'about:blank',
          title: 'Bad Request',
          status: 400,
          detail: 'attacker.level must be <= 100',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/problem+json' },
        },
      ),
    )

    await expect(calculateDamage(sampleRequest)).rejects.toThrow(
      /attacker\.level must be <= 100/,
    )
  })

  it('throws a generic error when the server returns an opaque failure', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 500 }))

    await expect(calculateDamage(sampleRequest)).rejects.toThrow(/500/)
  })
})

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  recommendPlans: vi.fn(),
}))

vi.mock('../../../src/features/preview/api/previewApi', () => ({
  evaluateLeads: vi.fn(),
  recommendPlans: mocks.recommendPlans,
}))

import { usePlanRecommendation } from '../../../src/features/preview/hooks/usePlanRecommendation'
import { useTeamsStore } from '../../../src/store/useTeamsStore'
import type { SavedPokemon } from '../../../src/store/useTeamsStore'
import type { MoveDefinition } from '../../../src/features/calculator/types/api'

const moves: MoveDefinition[] = [
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
]

const stubPlan = {
  bringIndices: [0, 1, 2, 3],
  leadIndices: [0, 1],
  summary: 'Lead Flutter Mane + Incineroar. Strong into most of the field.',
  verdict: {
    headline: 'Lead Flutter Mane + Incineroar',
    subline: 'Strong into Opponent 1 + Opponent 2.',
    callout: null,
  },
  modesCovered: ['Opponent 1 + Opponent 2'],
  modesAtRisk: [],
  winConditionSupported: false,
  leftOutRationale: ['Palafin: left out — coverage handled by the core four.'],
  predictionBurden: 'low' as const,
}

describe('usePlanRecommendation', () => {
  beforeEach(() => {
    useTeamsStore.getState().reset()
    mocks.recommendPlans.mockReset()
    mocks.recommendPlans.mockResolvedValue({ plans: [stubPlan] })
  })

  it('starts in idle state with no plans', () => {
    const { result } = renderHook(() =>
      usePlanRecommendation({ moves, winConditionIndex: null }),
    )

    expect(result.current.status).toBe('idle')
    expect(result.current.result).toBeNull()
  })

  it('returns idle when either team has fewer than 6 Pokémon', async () => {
    seedTeam('mine', 3)
    seedTeam('opponent', 6)

    const { result } = renderHook(() =>
      usePlanRecommendation({ moves, winConditionIndex: null }),
    )

    await act(() => result.current.recommend())

    expect(mocks.recommendPlans).not.toHaveBeenCalled()
    expect(result.current.status).toBe('idle')
  })

  it('calls recommendPlans and returns plans when both teams are full', async () => {
    seedTeam('mine', 6)
    seedTeam('opponent', 6)

    const { result } = renderHook(() =>
      usePlanRecommendation({ moves, winConditionIndex: null }),
    )

    await act(() => result.current.recommend())

    expect(mocks.recommendPlans).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe('success')
    expect(result.current.result?.plans).toHaveLength(1)
    expect(result.current.result?.plans[0].summary).toContain('Flutter Mane')
  })

  it('passes winConditionIndex to the API call', async () => {
    seedTeam('mine', 6)
    seedTeam('opponent', 6)

    const { result } = renderHook(() =>
      usePlanRecommendation({ moves, winConditionIndex: 2 }),
    )

    await act(() => result.current.recommend())

    const call = mocks.recommendPlans.mock.calls[0][0]
    expect(call.winConditionIndex).toBe(2)
  })

  it('surfaces an error state on API failure', async () => {
    seedTeam('mine', 6)
    seedTeam('opponent', 6)
    mocks.recommendPlans.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() =>
      usePlanRecommendation({ moves, winConditionIndex: null }),
    )

    await act(() => result.current.recommend())

    expect(result.current.status).toBe('error')
    expect(result.current.error).not.toBeNull()
    expect(result.current.error?.detail).toMatch(/network error/i)
  })
})

function savedPokemon(speciesId: string): SavedPokemon {
  return {
    speciesId,
    speciesName: speciesId,
    spriteId: speciesId,
    nature: 'serious',
    sp: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    abilityId: null,
    itemId: null,
    status: 'NONE',
    megaActive: false,
    megaFormId: null,
    moves: [
      { moveId: 'moonblast' },
      { moveId: null },
      { moveId: null },
      { moveId: null },
    ],
    baseStats: {
      hp: 155,
      attack: 120,
      defense: 100,
      specialAttack: 140,
      specialDefense: 100,
      speed: 135,
    },
    finalStats: {
      hp: 155,
      attack: 120,
      defense: 100,
      specialAttack: 140,
      specialDefense: 100,
      speed: 135,
    },
    types: ['FAIRY', null],
    grounded: true,
    currentHp: 155,
  }
}

function seedTeam(side: 'mine' | 'opponent', count: number) {
  const team = Array.from({ length: count }, (_, i) =>
    savedPokemon(`species-${side}-${i}`),
  )
  useTeamsStore
    .getState()
    .importTeam(side === 'mine' ? 'attacker' : 'defender', team)
}

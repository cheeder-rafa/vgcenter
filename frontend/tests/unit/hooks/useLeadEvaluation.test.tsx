import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  evaluateLeads: vi.fn(),
}))

vi.mock('../../../src/features/preview/api/previewApi', () => ({
  evaluateLeads: mocks.evaluateLeads,
}))

import { useLeadEvaluation } from '../../../src/features/preview/hooks/useLeadEvaluation'
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

describe('useLeadEvaluation', () => {
  beforeEach(() => {
    useTeamsStore.getState().reset()
    mocks.evaluateLeads.mockReset()
    mocks.evaluateLeads.mockResolvedValue({
      matchups: [
        {
          opponentLeadIds: ['opponent-1', 'opponent-2'],
          opponentLeadNames: ['Opponent 1', 'Opponent 2'],
          koPressure: { label: 'KO pressure', value: 2, tone: 'high' },
          twoHitKoPressure: { label: '2HKO pressure', value: 4, tone: 'high' },
          doubleUpPressure: {
            label: 'Double-up live',
            value: 1,
            tone: 'medium',
          },
          incomingDanger: {
            label: 'Incoming danger',
            value: 1,
            tone: 'medium',
          },
          speedComparison: { label: 'Speed control', value: 2, tone: 'high' },
          mustReactLabels: ['Cover immediate KO'],
          turnOneAnnotations: ['Moonblast threatens Opponent 1'],
        },
      ],
    })
  })

  it('evaluates selected leads into a six-Pokemon opponent rail', async () => {
    useTeamsStore
      .getState()
      .importTeam('attacker', [
        savedPokemon('flutter-mane', 'Flutter Mane', 205),
        savedPokemon('incineroar', 'Incineroar', 80),
      ])
    useTeamsStore.getState().importTeam(
      'defender',
      Array.from({ length: 6 }, (_, index) =>
        savedPokemon(`opponent-${index + 1}`, `Opponent ${index + 1}`, 100),
      ),
    )

    const { result } = renderHook(() =>
      useLeadEvaluation({
        selectedLeadIds: ['flutter-mane', 'incineroar'],
        moves,
      }),
    )

    await act(async () => {
      await result.current.evaluate()
    })

    expect(mocks.evaluateLeads).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedLeads: expect.arrayContaining([
          expect.objectContaining({ pokemonId: 'flutter-mane' }),
          expect.objectContaining({ pokemonId: 'incineroar' }),
        ]),
        opponentTeam: expect.arrayContaining([
          expect.objectContaining({ pokemonId: 'opponent-1' }),
        ]),
      }),
    )
    expect(result.current.status).toBe('success')
    expect(result.current.result?.matchups).toHaveLength(1)
  })

  it('does not call the API until two player leads and six opponents exist', async () => {
    useTeamsStore
      .getState()
      .importTeam('attacker', [
        savedPokemon('flutter-mane', 'Flutter Mane', 205),
      ])

    const { result } = renderHook(() =>
      useLeadEvaluation({
        selectedLeadIds: ['flutter-mane', 'incineroar'],
        moves,
      }),
    )

    await act(async () => {
      await result.current.evaluate()
    })

    expect(mocks.evaluateLeads).not.toHaveBeenCalled()
    expect(result.current.status).toBe('idle')
  })
})

function savedPokemon(
  speciesId: string,
  speciesName: string,
  speed: number,
): SavedPokemon {
  return {
    speciesId,
    speciesName,
    spriteId: speciesId,
    natureId: 'serious',
    sp: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    abilityId: 'none',
    itemId: 'none',
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
      hp: 100,
      attack: 100,
      defense: 100,
      specialAttack: 100,
      specialDefense: 100,
      speed,
    },
    finalStats: {
      hp: 100,
      attack: 100,
      defense: 100,
      specialAttack: 100,
      specialDefense: 100,
      speed,
    },
    types: ['FAIRY', null],
    grounded: true,
    currentHp: 100,
  }
}

import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  buildStats: vi.fn(),
  calculateDamage: vi.fn(),
}))

vi.mock('../../src/features/calculator/api/datasetApi', () => ({
  buildStats: mocks.buildStats,
}))

vi.mock('../../src/features/calculator/api/damageApi', () => ({
  calculateDamage: mocks.calculateDamage,
}))

import { useBuildStatsSync } from '../../src/features/calculator/hooks/useBuildStatsSync'
import { useReactiveDamage } from '../../src/features/calculator/hooks/useReactiveDamage'
import { useCalculatorStore } from '../../src/features/calculator/store/useCalculatorStore'
import type { PokedexEntry } from '../../src/features/calculator/types/api'

const pokedex: PokedexEntry[] = [
  {
    id: 'charizard',
    name: 'Charizard',
    imageUrl: '/sprites/charizard.png',
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
    megaForms: [
      {
        id: 'charizard-mega-x',
        name: 'Mega Charizard X',
        types: ['FIRE', 'DRAGON'],
        baseStats: {
          hp: 78,
          attack: 130,
          defense: 111,
          specialAttack: 130,
          specialDefense: 85,
          speed: 100,
        },
        abilityId: 'tough-claws',
      },
      {
        id: 'charizard-mega-y',
        name: 'Mega Charizard Y',
        types: ['FIRE', 'FLYING'],
        baseStats: {
          hp: 78,
          attack: 104,
          defense: 78,
          specialAttack: 159,
          specialDefense: 115,
          speed: 100,
        },
        abilityId: 'drought',
      },
    ],
  },
  {
    id: 'amoonguss',
    name: 'Amoonguss',
    imageUrl: '/sprites/amoonguss.png',
    types: ['GRASS', 'POISON'],
    baseStats: {
      hp: 114,
      attack: 85,
      defense: 70,
      specialAttack: 85,
      specialDefense: 80,
      speed: 30,
    },
    abilityIds: ['regenerator'],
    moveIds: ['spore'],
    megaForms: [],
  },
]

describe('useBuildStatsSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useCalculatorStore.getState().reset()
    mocks.buildStats.mockReset()
    mocks.calculateDamage.mockReset()
    mocks.buildStats.mockResolvedValue({
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
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('syncs one populated side without waiting for the opposite side', async () => {
    renderHook(() => useBuildStatsSync('attacker', pokedex))

    act(() => {
      useCalculatorStore.getState().setAttacker({
        speciesId: 'charizard',
        natureId: 'timid',
        sp: {
          spa: 32,
          spe: 32,
        },
        baseStats: null,
        finalStats: null,
        types: null,
      })
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })

    expect(mocks.buildStats).toHaveBeenCalledWith({
      speciesId: 'charizard',
      natureId: 'timid',
      megaActive: false,
      megaFormId: null,
      sp: {
        hp: 0,
        atk: 0,
        def: 0,
        spa: 32,
        spd: 0,
        spe: 32,
      },
    })

    expect(useCalculatorStore.getState().attacker).toEqual(
      expect.objectContaining({
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
        types: ['FIRE', 'FLYING'],
      }),
    )

    expect(mocks.buildStats).toHaveBeenCalledTimes(1)
  })

  it('sendsMegaFormIdInBuildStatsRequest', async () => {
    renderHook(() => useBuildStatsSync('attacker', pokedex))

    act(() => {
      useCalculatorStore.getState().setAttacker({
        speciesId: 'charizard',
        natureId: 'timid',
        megaActive: true,
        megaFormId: 'charizard-mega-x',
        sp: {
          spa: 32,
          spe: 32,
        },
        baseStats: null,
        finalStats: null,
        types: null,
      })
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })

    expect(mocks.buildStats).toHaveBeenCalledWith({
      speciesId: 'charizard',
      natureId: 'timid',
      megaActive: true,
      megaFormId: 'charizard-mega-x',
      sp: {
        hp: 0,
        atk: 0,
        def: 0,
        spa: 32,
        spd: 0,
        spe: 32,
      },
    })
  })
})

describe('useReactiveDamage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useCalculatorStore.getState().reset()
    mocks.calculateDamage.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stays idle when only one side is populated', async () => {
    renderHook(() => useReactiveDamage())

    act(() => {
      useCalculatorStore.getState().setMoveCatalog([
        {
          id: 'heat-wave',
          name: 'Heat Wave',
          type: 'FIRE',
          category: 'SPECIAL',
          basePower: 95,
          spread: true,
          contact: false,
          doublePowerWhenUserStatused: false,
          ignoreBurnPenaltyWhenUserStatused: false,
        },
      ])
      useCalculatorStore.getState().setAttacker({
        speciesId: 'charizard',
        finalStats: {
          hp: 153,
          attack: 104,
          defense: 99,
          specialAttack: 177,
          specialDefense: 105,
          speed: 132,
        },
        types: ['FIRE', 'FLYING'],
        moves: [
          { moveId: 'heat-wave' },
          { moveId: null },
          { moveId: null },
          { moveId: null },
        ],
      })
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })

    expect(useCalculatorStore.getState().resultsStatus).toBe('idle')
    expect(mocks.calculateDamage).not.toHaveBeenCalled()
    expect(useCalculatorStore.getState().results).toEqual({
      attackerMoves: [null, null, null, null],
      defenderMoves: [null, null, null, null],
    })
  })

  it('does not recalculate damage when only speed changes for an existing special move result', async () => {
    mocks.calculateDamage
      .mockResolvedValueOnce({
        rolls: Array.from({ length: 16 }, (_, index) => 40 + index),
        min: 40,
        max: 55,
        minPct: 20,
        maxPct: 27.5,
        koChance: { description: 'Never OHKO', probability: 0, hits: 2 },
      })

    renderHook(() => useReactiveDamage())

    act(() => {
      useCalculatorStore.getState().setMoveCatalog([
        {
          id: 'heat-wave',
          name: 'Heat Wave',
          type: 'FIRE',
          category: 'SPECIAL',
          basePower: 95,
          spread: true,
          contact: false,
          doublePowerWhenUserStatused: false,
          ignoreBurnPenaltyWhenUserStatused: false,
        },
      ])
      useCalculatorStore.getState().setAttacker({
        speciesId: 'charizard',
        finalStats: {
          hp: 153,
          attack: 104,
          defense: 99,
          specialAttack: 177,
          specialDefense: 105,
          speed: 132,
        },
        types: ['FIRE', 'FLYING'],
        currentHp: 153,
        moves: [
          { moveId: 'heat-wave' },
          { moveId: null },
          { moveId: null },
          { moveId: null },
        ],
      })
      useCalculatorStore.getState().setDefender({
        speciesId: 'amoonguss',
        finalStats: {
          hp: 189,
          attack: 105,
          defense: 90,
          specialAttack: 105,
          specialDefense: 100,
          speed: 50,
        },
        types: ['GRASS', 'POISON'],
        currentHp: 189,
      })
    })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(mocks.calculateDamage).toHaveBeenCalledTimes(1)

    act(() => {
      useCalculatorStore.getState().setAttacker({
        sp: { spe: 1 },
        finalStats: {
          hp: 153,
          attack: 104,
          defense: 99,
          specialAttack: 177,
          specialDefense: 105,
          speed: 133,
        },
      })
    })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(mocks.calculateDamage).toHaveBeenCalledTimes(1)
  })

  it('recalculates only the edited side move slots and preserves the opposite side results', async () => {
    mocks.calculateDamage
      .mockResolvedValueOnce({
        rolls: Array.from({ length: 16 }, (_, index) => 60 + index),
        min: 60,
        max: 75,
        minPct: 30,
        maxPct: 37.5,
        koChance: { description: 'Never OHKO', probability: 0, hits: 2 },
      })
      .mockResolvedValueOnce({
        rolls: Array.from({ length: 16 }, (_, index) => 20 + index),
        min: 20,
        max: 35,
        minPct: 10,
        maxPct: 17.5,
        koChance: { description: 'Never OHKO', probability: 0, hits: 3 },
      })
      .mockResolvedValueOnce({
        rolls: Array.from({ length: 16 }, (_, index) => 80 + index),
        min: 80,
        max: 95,
        minPct: 40,
        maxPct: 47.5,
        koChance: { description: 'Possible 2HKO', probability: 0.5, hits: 2 },
      })

    renderHook(() => useReactiveDamage())

    act(() => {
      useCalculatorStore.getState().setMoveCatalog([
        {
          id: 'heat-wave',
          name: 'Heat Wave',
          type: 'FIRE',
          category: 'SPECIAL',
          basePower: 95,
          spread: true,
          contact: false,
          doublePowerWhenUserStatused: false,
          ignoreBurnPenaltyWhenUserStatused: false,
        },
        {
          id: 'air-slash',
          name: 'Air Slash',
          type: 'FLYING',
          category: 'SPECIAL',
          basePower: 75,
          spread: false,
          contact: false,
          doublePowerWhenUserStatused: false,
          ignoreBurnPenaltyWhenUserStatused: false,
        },
      ])
      useCalculatorStore.getState().setAttacker({
        speciesId: 'charizard',
        finalStats: {
          hp: 153,
          attack: 104,
          defense: 99,
          specialAttack: 177,
          specialDefense: 105,
          speed: 132,
        },
        types: ['FIRE', 'FLYING'],
        currentHp: 153,
        moves: [
          { moveId: 'heat-wave' },
          { moveId: null },
          { moveId: null },
          { moveId: null },
        ],
      })
      useCalculatorStore.getState().setDefender({
        speciesId: 'amoonguss',
        finalStats: {
          hp: 189,
          attack: 105,
          defense: 90,
          specialAttack: 105,
          specialDefense: 100,
          speed: 50,
        },
        types: ['GRASS', 'POISON'],
        currentHp: 189,
        moves: [
          { moveId: 'air-slash' },
          { moveId: null },
          { moveId: null },
          { moveId: null },
        ],
      })
    })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(mocks.calculateDamage).toHaveBeenCalledTimes(2)
    expect(useCalculatorStore.getState().results.attackerMoves[0]).toEqual(
      expect.objectContaining({ min: 60, max: 75 }),
    )
    expect(useCalculatorStore.getState().results.defenderMoves[0]).toEqual(
      expect.objectContaining({ min: 20, max: 35 }),
    )

    act(() => {
      useCalculatorStore.getState().setAttacker({
        sp: { spa: 2 },
        finalStats: {
          hp: 153,
          attack: 104,
          defense: 99,
          specialAttack: 179,
          specialDefense: 105,
          speed: 132,
        },
      })
    })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(mocks.calculateDamage).toHaveBeenCalledTimes(3)
    expect(useCalculatorStore.getState().results.attackerMoves[0]).toEqual(
      expect.objectContaining({ min: 80, max: 95 }),
    )
    expect(useCalculatorStore.getState().results.defenderMoves[0]).toEqual(
      expect.objectContaining({ min: 20, max: 35 }),
    )
  })
})

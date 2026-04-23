import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  buildStats: vi.fn(),
  calculateDamage: vi.fn(),
}))

vi.mock('../../../src/features/calculator/api/datasetApi', async () => {
  const actual = await vi.importActual<
    typeof import('../../../src/features/calculator/api/datasetApi')
  >('../../../src/features/calculator/api/datasetApi')

  return {
    ...actual,
    buildStats: mocks.buildStats,
  }
})

vi.mock('../../../src/features/calculator/api/damageApi', () => ({
  calculateDamage: mocks.calculateDamage,
}))

import { useReactiveDamage } from '../../../src/features/calculator/hooks/useReactiveDamage'
import { useBuildStatsSync } from '../../../src/features/calculator/hooks/useBuildStatsSync'
import { useCalculatorStore } from '../../../src/features/calculator/store/useCalculatorStore'
import type { PokedexEntry } from '../../../src/features/calculator/types/api'

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
    megaForms: [],
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

const moveCatalog = [
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
    id: 'protect',
    name: 'Protect',
    type: 'NORMAL',
    category: 'STATUS',
    basePower: 0,
    spread: false,
    contact: false,
    doublePowerWhenUserStatused: false,
    ignoreBurnPenaltyWhenUserStatused: false,
  },
] as const

function Harness() {
  useBuildStatsSync('attacker', pokedex)
  useBuildStatsSync('defender', pokedex)
  useReactiveDamage()
  return null
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

describe('useReactiveDamage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useCalculatorStore.getState().reset()
    useCalculatorStore.getState().setMoveCatalog([...moveCatalog])
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

  it('debounces recalculation and stores the settled result under the correct move slot', async () => {
    mocks.calculateDamage.mockResolvedValue({
      rolls: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
      min: 10,
      max: 25,
      minPct: 10,
      maxPct: 25,
      koChance: { description: 'Never OHKO', probability: 0, hits: 2 },
    })

    render(<Harness />)

    act(() => {
      const store = useCalculatorStore.getState()
      store.setAttacker({
        speciesId: 'charizard',
        natureId: 'timid',
        sp: { hp: 0, atk: 0, def: 4, spa: 32, spd: 0, spe: 32 },
        finalStats: null,
        moves: [
          { moveId: 'heat-wave' },
          { moveId: null },
          { moveId: null },
          { moveId: null },
        ],
      })
      store.setDefender({
        speciesId: 'amoonguss',
        natureId: 'bold',
        sp: { hp: 32, atk: 0, def: 32, spa: 0, spd: 32, spe: 0 },
        finalStats: null,
        moves: [
          { moveId: null },
          { moveId: null },
          { moveId: null },
          { moveId: null },
        ],
      })
    })

    expect(mocks.buildStats).not.toHaveBeenCalled()
    expect(mocks.calculateDamage).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(199)
    })

    expect(mocks.buildStats).not.toHaveBeenCalled()

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(mocks.buildStats).toHaveBeenCalledTimes(2)
    expect(mocks.calculateDamage).toHaveBeenCalledTimes(1)
    expect(useCalculatorStore.getState().results.attackerMoves[0]).toEqual(
      expect.objectContaining({
        min: 10,
        max: 25,
      }),
    )
    expect(useCalculatorStore.getState().resultsStatus).toBe('success')

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(mocks.calculateDamage).toHaveBeenCalledTimes(1)
  })

  it('drops stale responses when a newer recalculation finishes later', async () => {
    const firstDamage = createDeferred<{
      rolls: number[]
      min: number
      max: number
      minPct: number
      maxPct: number
      koChance: { description: string; probability: number; hits: number }
    }>()

    mocks.calculateDamage
      .mockImplementationOnce(() => firstDamage.promise)
      .mockResolvedValueOnce({
        rolls: [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55],
        min: 40,
        max: 55,
        minPct: 40,
        maxPct: 55,
        koChance: { description: 'Possible 2HKO', probability: 0.5, hits: 2 },
      })

    render(<Harness />)

    act(() => {
      const store = useCalculatorStore.getState()
      store.setAttacker({
        speciesId: 'charizard',
        natureId: 'timid',
        sp: { hp: 0, atk: 0, def: 4, spa: 32, spd: 0, spe: 32 },
        finalStats: null,
        moves: [
          { moveId: 'heat-wave' },
          { moveId: null },
          { moveId: null },
          { moveId: null },
        ],
      })
      store.setDefender({
        speciesId: 'amoonguss',
        natureId: 'bold',
        sp: { hp: 32, atk: 0, def: 32, spa: 0, spd: 32, spe: 0 },
        finalStats: null,
        moves: [
          { moveId: null },
          { moveId: null },
          { moveId: null },
          { moveId: null },
        ],
      })
    })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    act(() => {
      useCalculatorStore.getState().setField({ weather: 'SUN' })
    })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(mocks.calculateDamage).toHaveBeenCalledTimes(2)
    expect(useCalculatorStore.getState().results.attackerMoves[0]).toEqual(
      expect.objectContaining({
        min: 40,
        max: 55,
      }),
    )

    await act(async () => {
      firstDamage.resolve({
        rolls: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        min: 1,
        max: 1,
        minPct: 1,
        maxPct: 1,
        koChance: { description: 'Never OHKO', probability: 0, hits: 4 },
      })
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(useCalculatorStore.getState().results.attackerMoves[0]).toEqual(
      expect.objectContaining({
        min: 40,
        max: 55,
      }),
    )
  })

  it('uses selected move metadata and still calculates with no field modifiers active', async () => {
    mocks.calculateDamage.mockResolvedValue({
      rolls: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
      min: 20,
      max: 35,
      minPct: 20,
      maxPct: 35,
      koChance: { description: 'Never OHKO', probability: 0, hits: 2 },
    })

    render(<Harness />)

    act(() => {
      const store = useCalculatorStore.getState()
      store.setAttacker({
        speciesId: 'charizard',
        natureId: 'timid',
        sp: { hp: 0, atk: 0, def: 4, spa: 32, spd: 0, spe: 32 },
        finalStats: null,
        moves: [
          { moveId: 'protect' },
          { moveId: 'heat-wave' },
          { moveId: null },
          { moveId: null },
        ],
      })
      store.setDefender({
        speciesId: 'amoonguss',
        natureId: 'bold',
        sp: { hp: 32, atk: 0, def: 32, spa: 0, spd: 32, spe: 0 },
        finalStats: null,
        moves: [
          { moveId: null },
          { moveId: null },
          { moveId: null },
          { moveId: null },
        ],
      })
    })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(mocks.calculateDamage).toHaveBeenCalledTimes(1)
    expect(mocks.calculateDamage).toHaveBeenCalledWith(
      expect.objectContaining({
        move: expect.objectContaining({
          type: 'FIRE',
          category: 'SPECIAL',
          basePower: 95,
        }),
        field: expect.objectContaining({
          weather: 'CLEAR',
          terrain: 'NONE',
          room: 'NONE',
        }),
      }),
    )
  })

  it('recalculates damage when the active move category stat stage changes', async () => {
    mocks.calculateDamage
      .mockResolvedValueOnce({
        rolls: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
        min: 20,
        max: 20,
        minPct: 20,
        maxPct: 20,
        koChance: { description: 'Never OHKO', probability: 0, hits: 2 },
      })
      .mockResolvedValueOnce({
        rolls: [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
        min: 30,
        max: 30,
        minPct: 30,
        maxPct: 30,
        koChance: { description: 'Never OHKO', probability: 0, hits: 2 },
      })

    render(<Harness />)

    act(() => {
      const store = useCalculatorStore.getState()
      store.setAttacker({
        speciesId: 'charizard',
        natureId: 'timid',
        sp: { hp: 0, atk: 0, def: 4, spa: 32, spd: 0, spe: 32 },
        finalStats: null,
        moves: [
          { moveId: 'heat-wave' },
          { moveId: null },
          { moveId: null },
          { moveId: null },
        ],
      })
      store.setDefender({
        speciesId: 'amoonguss',
        natureId: 'bold',
        sp: { hp: 32, atk: 0, def: 32, spa: 0, spd: 32, spe: 0 },
        finalStats: null,
        moves: [
          { moveId: null },
          { moveId: null },
          { moveId: null },
          { moveId: null },
        ],
      })
    })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(mocks.calculateDamage).toHaveBeenCalledTimes(1)
    expect(mocks.calculateDamage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        attacker: expect.objectContaining({
          stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        }),
      }),
    )

    act(() => {
      useCalculatorStore.getState().setAttacker({
        stages: { spa: 1 },
      })
    })

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(mocks.calculateDamage).toHaveBeenCalledTimes(2)
    expect(mocks.calculateDamage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        attacker: expect.objectContaining({
          stages: { atk: 0, def: 0, spa: 1, spd: 0, spe: 0 },
        }),
      }),
    )
    expect(useCalculatorStore.getState().results.attackerMoves[0]).toEqual(
      expect.objectContaining({
        min: 30,
        max: 30,
      }),
    )
  })
})

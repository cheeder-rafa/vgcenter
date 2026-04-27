import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCalculatorStore } from '../../../src/features/calculator/store/useCalculatorStore'
import { useCalcHistoryStore } from '../../../src/features/calculator/store/useCalcHistoryStore'
import { useCalcHistorySync } from '../../../src/features/calculator/hooks/useCalcHistorySync'

vi.mock('../../../src/features/calculator/api/damageApi', () => ({
  calculateDamage: vi.fn().mockResolvedValue({ rolls: [], minPct: 0, maxPct: 0, koChance: 0 }),
}))

function seedCalcStore() {
  const store = useCalculatorStore.getState()
  store.setAttacker({
    speciesId: 'garchomp',
    speciesName: 'Garchomp',
    types: ['dragon', 'ground'],
    baseStats: { hp: 108, atk: 130, def: 95, spa: 80, spd: 85, spe: 102 },
  })
  store.setDefender({
    speciesId: 'gliscor',
    speciesName: 'Gliscor',
    types: ['ground', 'flying'],
    baseStats: { hp: 75, atk: 95, def: 125, spa: 45, spd: 75, spe: 95 },
  })
}

describe('useCalcHistorySync', () => {
  beforeEach(() => {
    useCalcHistoryStore.getState().clear()
    useCalculatorStore.getState().clearResults()
    useCalculatorStore.getState().setResultsStatus('idle')
    useCalculatorStore.getState().setAttacker({ speciesId: null })
    useCalculatorStore.getState().setDefender({ speciesId: null })
  })

  it('pushes an entry when resultsStatus transitions to success', async () => {
    seedCalcStore()
    renderHook(() => useCalcHistorySync())

    act(() => {
      useCalculatorStore.getState().setResultsStatus('success')
    })

    const { entries } = useCalcHistoryStore.getState()
    expect(entries).toHaveLength(1)
    expect(entries[0].attackerSpeciesId).toBe('garchomp')
    expect(entries[0].defenderSpeciesId).toBe('gliscor')
  })

  it('does not push when status is loading', () => {
    seedCalcStore()
    renderHook(() => useCalcHistorySync())

    act(() => {
      useCalculatorStore.getState().setResultsStatus('loading')
    })

    expect(useCalcHistoryStore.getState().entries).toHaveLength(0)
  })

  it('does not push when attacker or defender has no speciesId', () => {
    renderHook(() => useCalcHistorySync())

    act(() => {
      useCalculatorStore.getState().setResultsStatus('success')
    })

    expect(useCalcHistoryStore.getState().entries).toHaveLength(0)
  })

  it('does not push duplicate entries on repeated success without input change', () => {
    seedCalcStore()
    renderHook(() => useCalcHistorySync())

    act(() => {
      useCalculatorStore.getState().setResultsStatus('success')
    })
    act(() => {
      useCalculatorStore.getState().setResultsStatus('success')
    })

    expect(useCalcHistoryStore.getState().entries).toHaveLength(1)
  })
})

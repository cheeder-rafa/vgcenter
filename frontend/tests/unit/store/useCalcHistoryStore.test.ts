import { beforeEach, describe, expect, it } from 'vitest'

import {
  useCalcHistoryStore,
  type HistoryEntry,
} from '../../../src/features/calculator/store/useCalcHistoryStore'

function makeEntry(id: number): HistoryEntry {
  return {
    id,
    timestamp: Date.now() + id,
    attackerSpeciesId: `species-${id}`,
    defenderSpeciesId: `defender-${id}`,
    attackerName: `Attacker ${id}`,
    defenderName: `Defender ${id}`,
    snapshot: {
      attacker: null as unknown as HistoryEntry['snapshot']['attacker'],
      defender: null as unknown as HistoryEntry['snapshot']['defender'],
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
      targets: 1,
    },
    summary: { topMoveId: 'tackle', topMoveMaxPercent: 55 },
  }
}

describe('useCalcHistoryStore', () => {
  beforeEach(() => {
    useCalcHistoryStore.getState().clear()
  })

  it('starts empty', () => {
    expect(useCalcHistoryStore.getState().entries).toHaveLength(0)
  })

  it('pushes entries with descending order (newest first)', () => {
    const store = useCalcHistoryStore.getState()
    store.push(makeEntry(1))
    store.push(makeEntry(2))

    const { entries } = useCalcHistoryStore.getState()
    expect(entries).toHaveLength(2)
    expect(entries[0].id).toBe(2) // newest first
    expect(entries[1].id).toBe(1)
  })

  it('caps at MAX_ENTRIES (10) and drops oldest', () => {
    const store = useCalcHistoryStore.getState()
    for (let i = 1; i <= 12; i++) store.push(makeEntry(i))

    const { entries } = useCalcHistoryStore.getState()
    expect(entries).toHaveLength(10)
    expect(entries[0].id).toBe(12) // newest
    expect(entries[9].id).toBe(3) // oldest kept
  })

  it('clear removes all entries', () => {
    const store = useCalcHistoryStore.getState()
    store.push(makeEntry(1))
    store.push(makeEntry(2))
    store.clear()

    expect(useCalcHistoryStore.getState().entries).toHaveLength(0)
  })

  it('does NOT persist between test runs (session-only, no localStorage)', () => {
    // Verify the store has no persist middleware by checking there's no .persist property
    const storeAny = useCalcHistoryStore as unknown as { persist?: object }
    expect(storeAny.persist).toBeUndefined()
  })
})

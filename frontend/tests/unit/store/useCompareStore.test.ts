import { beforeEach, describe, expect, it } from 'vitest'

import {
  useCompareStore,
  type PinnedDefender,
} from '../../../src/features/calculator/store/useCompareStore'
import type { CombatantBuild } from '../../../src/features/calculator/types/api'

function makeBuild(speciesId: string): CombatantBuild {
  return {
    speciesId,
    natureId: 'hardy',
    sp: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    abilityId: null,
    itemId: null,
    status: 'NONE',
    megaActive: false,
    megaFormId: null,
    moves: [
      { moveId: null },
      { moveId: null },
      { moveId: null },
      { moveId: null },
    ],
    baseStats: null,
    finalStats: {
      hp: 175,
      attack: 110,
      defense: 110,
      specialAttack: 110,
      specialDefense: 110,
      speed: 110,
    },
    types: ['NORMAL', null],
    grounded: true,
    currentHp: 175,
  }
}

function makePin(id: string, label = id): PinnedDefender {
  return { id, label, build: makeBuild(id) }
}

describe('useCompareStore', () => {
  beforeEach(() => {
    useCompareStore.getState().clear()
  })

  it('starts empty', () => {
    expect(useCompareStore.getState().pins).toEqual([])
  })

  it('pins a defender newest-first', () => {
    useCompareStore.getState().pin(makePin('a'))
    useCompareStore.getState().pin(makePin('b'))
    const { pins } = useCompareStore.getState()
    expect(pins).toHaveLength(2)
    expect(pins[0].id).toBe('b')
    expect(pins[1].id).toBe('a')
  })

  it('ignores duplicate id', () => {
    useCompareStore.getState().pin(makePin('a'))
    useCompareStore.getState().pin(makePin('a'))
    expect(useCompareStore.getState().pins).toHaveLength(1)
  })

  it('rejects a 5th pin when at max capacity', () => {
    for (let i = 0; i < 4; i++) useCompareStore.getState().pin(makePin(`p${i}`))
    useCompareStore.getState().pin(makePin('overflow'))
    expect(useCompareStore.getState().pins).toHaveLength(4)
    expect(useCompareStore.getState().pins.some((p) => p.id === 'overflow')).toBe(false)
  })

  it('unpins by id', () => {
    useCompareStore.getState().pin(makePin('a'))
    useCompareStore.getState().pin(makePin('b'))
    useCompareStore.getState().unpin('a')
    const { pins } = useCompareStore.getState()
    expect(pins).toHaveLength(1)
    expect(pins[0].id).toBe('b')
  })

  it('clears all pins', () => {
    useCompareStore.getState().pin(makePin('a'))
    useCompareStore.getState().pin(makePin('b'))
    useCompareStore.getState().clear()
    expect(useCompareStore.getState().pins).toEqual([])
  })

  it('has no persist middleware (session-only)', () => {
    const storeAny = useCompareStore as unknown as { persist?: unknown }
    expect(storeAny.persist).toBeUndefined()
  })
})

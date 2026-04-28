import { beforeEach, describe, expect, it } from 'vitest'

import {
  EMPTY_PINNED_THREATS,
  usePinnedThreatsStore,
  type PinnedThreat,
} from '../../../src/features/calculator/store/usePinnedThreatsStore'
import type { CombatantBuild } from '../../../src/features/calculator/types/api'

function makeBuild(speciesId: string): CombatantBuild {
  return {
    speciesId,
    natureId: 'jolly',
    sp: { hp: 0, atk: 32, def: 0, spa: 0, spd: 0, spe: 32 },
    stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    abilityId: null,
    itemId: null,
    status: 'NONE',
    megaActive: false,
    megaFormId: null,
    moves: [
      { moveId: 'earthquake' },
      { moveId: null },
      { moveId: null },
      { moveId: null },
    ],
    baseStats: null,
    finalStats: {
      hp: 183,
      attack: 182,
      defense: 115,
      specialAttack: 90,
      specialDefense: 105,
      speed: 154,
    },
    types: ['DRAGON', 'GROUND'],
    grounded: true,
    currentHp: 183,
  }
}

function makeThreat(id: string, moveId = 'earthquake'): PinnedThreat {
  return { id, label: id, build: makeBuild(id), moveId }
}

describe('usePinnedThreatsStore', () => {
  beforeEach(() => {
    usePinnedThreatsStore.getState().clear()
  })

  it('starts empty and exposes a stable empty selector fallback', () => {
    expect(usePinnedThreatsStore.getState().threats).toEqual([])
    expect(EMPTY_PINNED_THREATS).toBe(EMPTY_PINNED_THREATS)
  })

  it('pins attackers newest-first', () => {
    usePinnedThreatsStore.getState().pin(makeThreat('a'))
    usePinnedThreatsStore.getState().pin(makeThreat('b', 'shadow-ball'))

    expect(usePinnedThreatsStore.getState().threats.map((p) => p.id)).toEqual([
      'b',
      'a',
    ])
  })

  it('ignores duplicate ids and caps at four threats', () => {
    usePinnedThreatsStore.getState().pin(makeThreat('a'))
    usePinnedThreatsStore.getState().pin(makeThreat('a'))
    for (let i = 0; i < 5; i++) {
      usePinnedThreatsStore.getState().pin(makeThreat(`p${i}`))
    }

    expect(usePinnedThreatsStore.getState().threats).toHaveLength(4)
    expect(
      usePinnedThreatsStore.getState().threats.some((p) => p.id === 'p4'),
    ).toBe(false)
  })

  it('removes and clears threats without persist middleware', () => {
    usePinnedThreatsStore.getState().pin(makeThreat('a'))
    usePinnedThreatsStore.getState().pin(makeThreat('b'))
    usePinnedThreatsStore.getState().unpin('a')
    expect(usePinnedThreatsStore.getState().threats.map((p) => p.id)).toEqual([
      'b',
    ])

    usePinnedThreatsStore.getState().clear()
    expect(usePinnedThreatsStore.getState().threats).toEqual([])
    expect(
      (usePinnedThreatsStore as unknown as { persist?: unknown }).persist,
    ).toBeUndefined()
  })
})

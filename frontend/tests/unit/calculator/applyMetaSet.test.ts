import { describe, expect, it } from 'vitest'

import { applyMetaSet } from '../../../src/features/calculator/lib/applyMetaSet'
import type { MetaSet } from '../../../src/features/calculator/data/metaSets'
import { META_SETS, PIKALYTICS_SOURCE } from '../../../src/features/calculator/data/metaSets'

const sneaslerSet: MetaSet = {
  speciesId: 'sneasler',
  abilityId: 'unburden',
  itemId: 'sitrus-berry',
  moveIds: ['poison-jab', 'dire-claw', 'close-combat', 'protect'],
  ...PIKALYTICS_SOURCE,
}

describe('applyMetaSet', () => {
  it('returns a patch with ability, item, and all four move slots', () => {
    const patch = applyMetaSet(sneaslerSet)
    expect(patch.abilityId).toBe('unburden')
    expect(patch.itemId).toBe('sitrus-berry')
    expect(patch.moves).toHaveLength(4)
    expect(patch.moves?.[0]).toEqual({ moveId: 'poison-jab' })
    expect(patch.moves?.[1]).toEqual({ moveId: 'dire-claw' })
    expect(patch.moves?.[2]).toEqual({ moveId: 'close-combat' })
    expect(patch.moves?.[3]).toEqual({ moveId: 'protect' })
  })

  it('accepts a set with null item and maps it correctly', () => {
    const noItem: MetaSet = { ...sneaslerSet, itemId: null }
    const patch = applyMetaSet(noItem)
    expect(patch.itemId).toBeNull()
  })

  it('does not include speciesId or stats in the returned patch', () => {
    const patch = applyMetaSet(sneaslerSet)
    expect(patch).not.toHaveProperty('speciesId')
    expect(patch).not.toHaveProperty('baseStats')
    expect(patch).not.toHaveProperty('finalStats')
  })
})

describe('META_SETS', () => {
  it('has an entry for sneasler', () => {
    expect(META_SETS['sneasler']).toBeDefined()
    expect(META_SETS['sneasler'].moveIds).toHaveLength(4)
  })

  it('has an entry for incineroar', () => {
    expect(META_SETS['incineroar']).toBeDefined()
    expect(META_SETS['incineroar'].abilityId).toBe('intimidate')
  })

  it('has an entry for garchomp', () => {
    expect(META_SETS['garchomp']).toBeDefined()
    expect(META_SETS['garchomp'].moveIds).toContain('earthquake')
  })

  it('every entry has a sourceName and sourceUrl', () => {
    for (const [id, set] of Object.entries(META_SETS)) {
      expect(set.sourceName, `${id} missing sourceName`).toBeTruthy()
      expect(set.sourceUrl, `${id} missing sourceUrl`).toContain('pikalytics')
    }
  })

  it('every entry has exactly four moveIds', () => {
    for (const [id, set] of Object.entries(META_SETS)) {
      expect(set.moveIds, `${id} moveIds length`).toHaveLength(4)
    }
  })
})

describe('PIKALYTICS_SOURCE', () => {
  it('includes required source credit fields', () => {
    expect(PIKALYTICS_SOURCE.sourceName).toBe('Pikalytics Champions Tournaments')
    expect(PIKALYTICS_SOURCE.sourceUrl).toContain('pikalytics.com')
    expect(PIKALYTICS_SOURCE.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

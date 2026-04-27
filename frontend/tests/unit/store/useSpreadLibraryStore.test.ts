import { beforeEach, describe, expect, it } from 'vitest'

import {
  useSpreadLibraryStore,
  type NamedSpread,
} from '../../../src/features/calculator/store/useSpreadLibraryStore'

function makeSpread(name: string): NamedSpread {
  return {
    id: `id-${name}`,
    name,
    sp: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    natureId: 'hardy',
    abilityId: null,
    itemId: null,
    moves: [
      { moveId: null },
      { moveId: null },
      { moveId: null },
      { moveId: null },
    ] as NamedSpread['moves'],
  }
}

describe('useSpreadLibraryStore', () => {
  beforeEach(() => {
    useSpreadLibraryStore.getState().clearAll()
  })

  it('starts with no spreads for any species', () => {
    expect(useSpreadLibraryStore.getState().getSpreads('garchomp')).toEqual([])
  })

  it('saves a spread for a species', () => {
    useSpreadLibraryStore.getState().saveSpread('garchomp', makeSpread('Sash Lead'))
    const spreads = useSpreadLibraryStore.getState().getSpreads('garchomp')
    expect(spreads).toHaveLength(1)
    expect(spreads[0].name).toBe('Sash Lead')
  })

  it('accumulates multiple spreads per species', () => {
    const store = useSpreadLibraryStore.getState()
    store.saveSpread('garchomp', makeSpread('Sash Lead'))
    store.saveSpread('garchomp', makeSpread('Lum Sweeper'))
    expect(useSpreadLibraryStore.getState().getSpreads('garchomp')).toHaveLength(2)
  })

  it('keeps spreads per species isolated', () => {
    useSpreadLibraryStore.getState().saveSpread('garchomp', makeSpread('Sash Lead'))
    expect(useSpreadLibraryStore.getState().getSpreads('gliscor')).toHaveLength(0)
  })

  it('deletes a specific spread by id', () => {
    const store = useSpreadLibraryStore.getState()
    store.saveSpread('garchomp', makeSpread('Sash Lead'))
    store.saveSpread('garchomp', makeSpread('Lum Sweeper'))
    const [first] = useSpreadLibraryStore.getState().getSpreads('garchomp')
    store.deleteSpread('garchomp', first.id)
    expect(useSpreadLibraryStore.getState().getSpreads('garchomp')).toHaveLength(1)
  })

  it('persists via localStorage (persist key present)', () => {
    const storeAny = useSpreadLibraryStore as unknown as { persist?: { getOptions?: () => { name?: string } } }
    expect(storeAny.persist?.getOptions?.()?.name).toBe('vgcenter.spreadLibrary.v1')
  })
})

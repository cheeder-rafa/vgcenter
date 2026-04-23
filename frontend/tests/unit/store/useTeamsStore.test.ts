import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CombatantBuild } from '../../../src/features/calculator/types/api'

const savedPokemonFactory = (
  overrides: Partial<CombatantBuild> & {
    speciesName?: string
    spriteId?: string | null
  } = {},
) => ({
  speciesId: 'charizard',
  natureId: 'timid',
  sp: { hp: 0, atk: 0, def: 0, spa: 32, spd: 0, spe: 32 },
  abilityId: 'blaze',
  itemId: 'life-orb',
  status: 'NONE' as const,
  megaActive: false,
  megaFormId: null,
  moves: [
    { moveId: 'heat-wave' },
    { moveId: 'protect' },
    { moveId: null },
    { moveId: null },
  ] as CombatantBuild['moves'],
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
  types: ['FIRE', 'FLYING'] as CombatantBuild['types'],
  grounded: false,
  currentHp: 153,
  speciesName: 'Charizard',
  spriteId: 'charizard',
  ...overrides,
})

function createLocalStorageStub() {
  const storage = new Map<string, string>()

  return {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    removeItem: vi.fn((key: string) => storage.delete(key)),
    clear: vi.fn(() => storage.clear()),
  }
}

describe('useTeamsStore', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('has mine and opponent rails in the initial state', async () => {
    const ls = createLocalStorageStub()
    vi.stubGlobal('localStorage', ls)

    const { useTeamsStore } = await import('../../../src/store/useTeamsStore')

    expect(useTeamsStore.getState().mine).toHaveLength(6)
    expect(useTeamsStore.getState().opponent).toHaveLength(6)
    expect(useTeamsStore.getState().mine.every((s) => s === null)).toBe(true)
    expect(useTeamsStore.getState().opponent.every((s) => s === null)).toBe(
      true,
    )
  })

  it('saves into mine rail via side=attacker', async () => {
    const ls = createLocalStorageStub()
    vi.stubGlobal('localStorage', ls)

    const { useTeamsStore } = await import('../../../src/store/useTeamsStore')

    useTeamsStore.getState().save('attacker', savedPokemonFactory())

    expect(useTeamsStore.getState().mine[0]).toEqual(
      expect.objectContaining({ speciesId: 'charizard' }),
    )
    expect(useTeamsStore.getState().opponent[0]).toBeNull()
  })

  it('saves into opponent rail via side=defender', async () => {
    const ls = createLocalStorageStub()
    vi.stubGlobal('localStorage', ls)

    const { useTeamsStore } = await import('../../../src/store/useTeamsStore')

    useTeamsStore.getState().save('defender', savedPokemonFactory())

    expect(useTeamsStore.getState().opponent[0]).toEqual(
      expect.objectContaining({ speciesId: 'charizard' }),
    )
    expect(useTeamsStore.getState().mine[0]).toBeNull()
  })

  it('loads a build from the mine rail', async () => {
    const ls = createLocalStorageStub()
    vi.stubGlobal('localStorage', ls)

    const { useTeamsStore } = await import('../../../src/store/useTeamsStore')

    useTeamsStore.getState().save('attacker', savedPokemonFactory())

    const build = useTeamsStore.getState().load('attacker', 0)
    expect(build).toEqual(
      expect.objectContaining({ speciesId: 'charizard', abilityId: 'blaze' }),
    )
  })

  it('removes a slot from the opponent rail', async () => {
    const ls = createLocalStorageStub()
    vi.stubGlobal('localStorage', ls)

    const { useTeamsStore } = await import('../../../src/store/useTeamsStore')

    useTeamsStore.getState().save('defender', savedPokemonFactory())
    useTeamsStore.getState().remove('defender', 0)

    expect(useTeamsStore.getState().opponent[0]).toBeNull()
  })

  it('migrates old vgcenter.savedTeams.v1 into mine/opponent on first load', async () => {
    const ls = createLocalStorageStub()
    ls.setItem(
      'vgcenter.savedTeams.v1',
      JSON.stringify({
        state: {
          attackerSaved: [savedPokemonFactory(), null, null, null, null, null],
          defenderSaved: [
            savedPokemonFactory({ speciesId: 'amoonguss' }),
            null,
            null,
            null,
            null,
            null,
          ],
        },
        version: 1,
      }),
    )
    vi.stubGlobal('localStorage', ls)

    const { useTeamsStore } = await import('../../../src/store/useTeamsStore')

    // Zustand hydrates synchronously from localStorage
    await vi.waitFor(() => {
      expect(useTeamsStore.getState().mine[0]).toEqual(
        expect.objectContaining({ speciesId: 'charizard' }),
      )
    })

    expect(useTeamsStore.getState().opponent[0]).toEqual(
      expect.objectContaining({ speciesId: 'amoonguss' }),
    )
    expect(ls.removeItem).toHaveBeenCalledWith('vgcenter.savedTeams.v1')
  })

  it('does not migrate when the new store already has data', async () => {
    const ls = createLocalStorageStub()
    ls.setItem(
      'vgcenter.teamsStore.v1',
      JSON.stringify({
        state: {
          mine: [savedPokemonFactory({ speciesId: 'incineroar' }), null, null, null, null, null],
          opponent: [null, null, null, null, null, null],
        },
        version: 1,
      }),
    )
    ls.setItem(
      'vgcenter.savedTeams.v1',
      JSON.stringify({
        state: {
          attackerSaved: [savedPokemonFactory(), null, null, null, null, null],
          defenderSaved: [null, null, null, null, null, null],
        },
        version: 1,
      }),
    )
    vi.stubGlobal('localStorage', ls)

    const { useTeamsStore } = await import('../../../src/store/useTeamsStore')

    await vi.waitFor(() => {
      // The existing new-store data wins; old key is removed but data not overwritten
      expect(useTeamsStore.getState().mine[0]).toEqual(
        expect.objectContaining({ speciesId: 'incineroar' }),
      )
    })
  })

  it('enqueues a toast when migration occurs', async () => {
    const ls = createLocalStorageStub()
    ls.setItem(
      'vgcenter.savedTeams.v1',
      JSON.stringify({
        state: {
          attackerSaved: [savedPokemonFactory(), null, null, null, null, null],
          defenderSaved: [null, null, null, null, null, null],
        },
        version: 1,
      }),
    )
    vi.stubGlobal('localStorage', ls)

    const [{ useTeamsStore }, { useToastStore }] = await Promise.all([
      import('../../../src/store/useTeamsStore'),
      import('../../../src/features/calculator/store/useToastStore'),
    ])

    await vi.waitFor(() => {
      expect(useTeamsStore.getState().mine[0]).not.toBeNull()
    })

    expect(
      useToastStore.getState().toasts.some((t) => /migrat|upgrad/i.test(t.message)),
    ).toBe(true)
  })

  it('importTeam replaces the mine rail wholesale', async () => {
    const ls = createLocalStorageStub()
    vi.stubGlobal('localStorage', ls)

    const { useTeamsStore } = await import('../../../src/store/useTeamsStore')

    useTeamsStore.getState().importTeam('attacker', [
      savedPokemonFactory({ speciesId: 'amoonguss', speciesName: 'Amoonguss' }),
      savedPokemonFactory({ speciesId: 'incineroar', speciesName: 'Incineroar' }),
    ])

    expect(useTeamsStore.getState().mine).toEqual([
      expect.objectContaining({ speciesId: 'amoonguss' }),
      expect.objectContaining({ speciesId: 'incineroar' }),
      null,
      null,
      null,
      null,
    ])
  })
})

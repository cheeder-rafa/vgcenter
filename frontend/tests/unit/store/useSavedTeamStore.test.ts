// These tests cover the backward-compat alias. The canonical store is useTeamsStore.
// The alias re-exports useTeamsStore directly, so behaviour is identical.
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
  sp: {
    hp: 0,
    atk: 0,
    def: 0,
    spa: 32,
    spd: 0,
    spe: 32,
  },
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
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      storage.delete(key)
    }),
    clear: vi.fn(() => {
      storage.clear()
    }),
  }
}

describe('useSavedTeamStore (backward-compat alias)', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('saves into the first empty slot and loads the stored build', async () => {
    const localStorage = createLocalStorageStub()
    vi.stubGlobal('localStorage', localStorage)

    const { useSavedTeamStore } =
      await import('../../../src/features/calculator/store/useSavedTeamStore')

    useSavedTeamStore.getState().save('attacker', savedPokemonFactory())

    expect(useSavedTeamStore.getState().mine[0]).toEqual(
      expect.objectContaining({
        speciesId: 'charizard',
        speciesName: 'Charizard',
        spriteId: 'charizard',
      }),
    )

    expect(useSavedTeamStore.getState().load('attacker', 0)).toEqual(
      expect.objectContaining({
        speciesId: 'charizard',
        natureId: 'timid',
        abilityId: 'blaze',
        itemId: 'life-orb',
      }),
    )
  })

  it('removes a saved pokemon from the requested slot', async () => {
    const localStorage = createLocalStorageStub()
    vi.stubGlobal('localStorage', localStorage)

    const { useSavedTeamStore } =
      await import('../../../src/features/calculator/store/useSavedTeamStore')

    useSavedTeamStore.getState().save('defender', savedPokemonFactory())
    useSavedTeamStore.getState().remove('defender', 0)

    expect(useSavedTeamStore.getState().opponent[0]).toBeNull()
    expect(useSavedTeamStore.getState().load('defender', 0)).toBeNull()
  })

  it('refuses to save when the rail is full and enqueues a toast', async () => {
    const localStorage = createLocalStorageStub()
    vi.stubGlobal('localStorage', localStorage)

    const [{ useSavedTeamStore }, { useToastStore }] = await Promise.all([
      import('../../../src/features/calculator/store/useSavedTeamStore'),
      import('../../../src/features/calculator/store/useToastStore'),
    ])

    for (let index = 0; index < 6; index += 1) {
      useSavedTeamStore.getState().save(
        'attacker',
        savedPokemonFactory({
          speciesId: `charizard-${index}`,
          speciesName: `Charizard ${index}`,
          spriteId: `charizard-${index}`,
        }),
      )
    }

    useSavedTeamStore.getState().save(
      'attacker',
      savedPokemonFactory({
        speciesId: 'amoonguss',
        speciesName: 'Amoonguss',
        spriteId: 'amoonguss',
      }),
    )

    expect(
      useSavedTeamStore
        .getState()
        .mine.filter((entry) => entry !== null),
    ).toHaveLength(6)
    expect(useSavedTeamStore.getState().mine[5]?.speciesId).toBe(
      'charizard-5',
    )
    expect(useToastStore.getState().toasts.at(-1)?.message).toMatch(/full/i)
  })

  it('rehydrates saved rails from localStorage', async () => {
    const localStorage = createLocalStorageStub()
    localStorage.setItem(
      'vgcenter.teamsStore.v1',
      JSON.stringify({
        state: {
          mine: [savedPokemonFactory(), null, null, null, null, null],
          opponent: [null, null, null, null, null, null],
        },
        version: 1,
      }),
    )
    vi.stubGlobal('localStorage', localStorage)

    const { useSavedTeamStore } =
      await import('../../../src/features/calculator/store/useSavedTeamStore')

    expect(useSavedTeamStore.getState().mine[0]).toEqual(
      expect.objectContaining({
        speciesId: 'charizard',
        speciesName: 'Charizard',
      }),
    )
  })

  it('importTeam replaces rail with provided entries', async () => {
    const localStorage = createLocalStorageStub()
    vi.stubGlobal('localStorage', localStorage)

    const { useSavedTeamStore } =
      await import('../../../src/features/calculator/store/useSavedTeamStore')

    useSavedTeamStore.getState().save(
      'attacker',
      savedPokemonFactory({
        speciesId: 'old-one',
        speciesName: 'Old One',
        spriteId: 'old-one',
      }),
    )
    useSavedTeamStore.getState().save(
      'attacker',
      savedPokemonFactory({
        speciesId: 'old-two',
        speciesName: 'Old Two',
        spriteId: 'old-two',
      }),
    )

    useSavedTeamStore.getState().importTeam('attacker', [
      savedPokemonFactory({
        speciesId: 'amoonguss',
        speciesName: 'Amoonguss',
        spriteId: 'amoonguss',
      }),
      savedPokemonFactory({
        speciesId: 'incineroar',
        speciesName: 'Incineroar',
        spriteId: 'incineroar',
      }),
    ])

    expect(useSavedTeamStore.getState().mine).toEqual([
      expect.objectContaining({ speciesId: 'amoonguss' }),
      expect.objectContaining({ speciesId: 'incineroar' }),
      null,
      null,
      null,
      null,
    ])
  })
})

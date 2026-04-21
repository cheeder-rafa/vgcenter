import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  calculateDamage: vi.fn(),
  fetchPokedex: vi.fn(),
  fetchAbilities: vi.fn(),
  fetchItems: vi.fn(),
  fetchMoves: vi.fn(),
  fetchNatures: vi.fn(),
  buildStats: vi.fn(),
  importShowdown: vi.fn(),
  importPokepaste: vi.fn(),
}))

vi.mock('../../src/features/calculator/api/damageApi', () => ({
  calculateDamage: mocks.calculateDamage,
}))

vi.mock('../../src/features/calculator/api/datasetApi', () => ({
  fetchPokedex: mocks.fetchPokedex,
  fetchAbilities: mocks.fetchAbilities,
  fetchItems: mocks.fetchItems,
  fetchMoves: mocks.fetchMoves,
  fetchNatures: mocks.fetchNatures,
  buildStats: mocks.buildStats,
}))

vi.mock('../../src/features/calculator/api/importApi', () => ({
  importShowdown: mocks.importShowdown,
  importPokepaste: mocks.importPokepaste,
}))

import { CalculatorPage } from '../../src/pages/CalculatorPage'
import { useCalculatorStore } from '../../src/features/calculator/store/useCalculatorStore'
import { useSavedTeamStore } from '../../src/features/calculator/store/useSavedTeamStore'
import { useToastStore } from '../../src/features/calculator/store/useToastStore'

describe('CalculatorPage', () => {
  beforeEach(() => {
    useCalculatorStore.getState().reset()
    useSavedTeamStore.getState().reset()
    useSavedTeamStore.persist.clearStorage()
    useToastStore.getState().clear()
    Object.values(mocks).forEach((fn) => fn.mockReset?.())
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
    mocks.calculateDamage.mockResolvedValue({
      rolls: Array.from({ length: 16 }, (_, i) => 168 + i * 2),
      min: 168,
      max: 198,
      minPct: 87.0,
      maxPct: 103.6,
      koChance: { description: 'Possible OHKO', probability: 0.6875, hits: 1 },
    })
    mocks.fetchPokedex.mockResolvedValue([
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
        moveIds: ['heat-wave', 'protect'],
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
    ])
    mocks.fetchAbilities.mockResolvedValue([
      { id: 'blaze', name: 'Blaze' },
      { id: 'regenerator', name: 'Regenerator' },
    ])
    mocks.fetchItems.mockResolvedValue([
      { id: 'life-orb', name: 'Life Orb' },
      { id: 'sitrus-berry', name: 'Sitrus Berry' },
    ])
    mocks.fetchMoves.mockResolvedValue([
      { id: 'heat-wave', name: 'Heat Wave' },
      { id: 'protect', name: 'Protect' },
      { id: 'spore', name: 'Spore' },
    ])
    mocks.fetchNatures.mockResolvedValue([
      {
        id: 'timid',
        name: 'Timid',
        increasedStat: 'SPEED',
        decreasedStat: 'ATTACK',
      },
      {
        id: 'serious',
        name: 'Serious',
        increasedStat: null,
        decreasedStat: null,
      },
    ])
  })

  it('renders the compact header and the three-column arena', async () => {
    render(<CalculatorPage />)

    expect(
      screen.getByRole('heading', {
        name: /vgcenter damage calculator/i,
        level: 1,
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/regulation m-a/i).length).toBeGreaterThan(0)
    // Field panel still in the middle
    expect(
      screen.getByRole('heading', { name: /^field$/i }),
    ).toBeInTheDocument()
    // Both sides start with default headers (Attacker/Defender until species chosen)
    expect(
      screen.getByRole('heading', { name: /attacker/i, level: 2 }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /defender/i, level: 2 }),
    ).toBeInTheDocument()

    await waitFor(() => expect(mocks.fetchPokedex).toHaveBeenCalled())
  })

  it('exposes the Showdown and Pokepaste import entry points', () => {
    render(<CalculatorPage />)

    expect(
      screen.getByRole('button', { name: /showdown/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /pokepaste/i }),
    ).toBeInTheDocument()
  })

  it('does not render the obsolete Calculate Damage button', () => {
    render(<CalculatorPage />)
    expect(
      screen.queryByRole('button', { name: /calculate damage/i }),
    ).not.toBeInTheDocument()
  })

  it('imports a Showdown team into the active side and saves the remaining members to the rail', async () => {
    mocks.importShowdown.mockResolvedValue({
      team: [
        {
          speciesId: 'charizard',
          speciesName: 'Charizard',
          nickname: 'Solaris',
          level: 50,
          gender: 'M',
          abilityId: 'blaze',
          itemId: 'charizardite-y',
          natureId: 'timid',
          sp: {
            hp: 1,
            attack: 0,
            defense: 0,
            specialAttack: 32,
            specialDefense: 0,
            speed: 32,
          },
          stats: {
            hp: 138,
            attack: 80,
            defense: 83,
            specialAttack: 157,
            specialDefense: 105,
            speed: 132,
          },
          moveIds: ['heat-wave', 'protect'],
        },
        {
          speciesId: 'amoonguss',
          speciesName: 'Amoonguss',
          nickname: null,
          level: 50,
          gender: 'F',
          abilityId: 'regenerator',
          itemId: 'sitrus-berry',
          natureId: 'serious',
          sp: {
            hp: 32,
            attack: 0,
            defense: 12,
            specialAttack: 0,
            specialDefense: 12,
            speed: 0,
          },
          stats: {
            hp: 221,
            attack: 105,
            defense: 91,
            specialAttack: 105,
            specialDefense: 111,
            speed: 50,
          },
          moveIds: ['spore'],
        },
        {
          speciesId: 'incineroar',
          speciesName: 'Incineroar',
          nickname: null,
          level: 50,
          gender: 'M',
          abilityId: 'intimidate',
          itemId: 'safety-goggles',
          natureId: 'careful',
          sp: {
            hp: 32,
            attack: 8,
            defense: 12,
            specialAttack: 0,
            specialDefense: 12,
            speed: 0,
          },
          stats: {
            hp: 202,
            attack: 137,
            defense: 117,
            specialAttack: 110,
            specialDefense: 143,
            speed: 80,
          },
          moveIds: ['fake-out'],
        },
        {
          speciesId: 'rillaboom',
          speciesName: 'Rillaboom',
          nickname: null,
          level: 50,
          gender: 'M',
          abilityId: 'grassy-surge',
          itemId: 'assault-vest',
          natureId: 'adamant',
          sp: {
            hp: 28,
            attack: 32,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            speed: 0,
          },
          stats: {
            hp: 207,
            attack: 177,
            defense: 110,
            specialAttack: 80,
            specialDefense: 90,
            speed: 105,
          },
          moveIds: ['wood-hammer'],
        },
        {
          speciesId: 'ursaluna-bloodmoon',
          speciesName: 'Ursaluna-Bloodmoon',
          nickname: null,
          level: 50,
          gender: 'M',
          abilityId: 'mind-s-eye',
          itemId: 'life-orb',
          natureId: 'modest',
          sp: {
            hp: 28,
            attack: 0,
            defense: 0,
            specialAttack: 32,
            specialDefense: 0,
            speed: 0,
          },
          stats: {
            hp: 219,
            attack: 120,
            defense: 126,
            specialAttack: 205,
            specialDefense: 101,
            speed: 72,
          },
          moveIds: ['blood-moon'],
        },
        {
          speciesId: 'pelipper',
          speciesName: 'Pelipper',
          nickname: null,
          level: 50,
          gender: 'M',
          abilityId: 'drizzle',
          itemId: 'focus-sash',
          natureId: 'bold',
          sp: {
            hp: 20,
            attack: 0,
            defense: 32,
            specialAttack: 0,
            specialDefense: 12,
            speed: 0,
          },
          stats: {
            hp: 167,
            attack: 70,
            defense: 133,
            specialAttack: 115,
            specialDefense: 102,
            speed: 85,
          },
          moveIds: ['hurricane'],
        },
      ],
    })

    render(<CalculatorPage />)
    const user = userEvent.setup()

    await waitFor(() => expect(mocks.fetchPokedex).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: /import showdown/i }))
    await user.type(
      screen.getByLabelText(/showdown paste/i),
      'Charizard @ Charizardite Y',
    )
    await user.click(screen.getByRole('button', { name: /import team/i }))

    await waitFor(() =>
      expect(useCalculatorStore.getState().attacker).toEqual(
        expect.objectContaining({
          speciesId: 'charizard',
          natureId: 'timid',
          abilityId: 'blaze',
          itemId: 'charizardite-y',
          types: ['FIRE', 'FLYING'],
          grounded: false,
          moves: expect.arrayContaining([{ moveId: 'heat-wave' }]),
        }),
      ),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: /load amoonguss for attacker/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /load incineroar for attacker/i }),
    ).toBeInTheDocument()
    expect(useSavedTeamStore.getState().attackerSaved[4]?.speciesId).toBe(
      'pelipper',
    )

    await user.click(
      screen.getByRole('button', { name: /load amoonguss for attacker/i }),
    )

    await waitFor(() =>
      expect(useCalculatorStore.getState().attacker).toEqual(
        expect.objectContaining({
          speciesId: 'amoonguss',
          abilityId: 'regenerator',
          itemId: 'sitrus-berry',
          moves: expect.arrayContaining([{ moveId: 'spore' }]),
        }),
      ),
    )
  })

  it('all five pokemon appear on rail after import', async () => {
    mocks.importShowdown.mockResolvedValue({
      team: [
        {
          speciesId: 'charizard',
          speciesName: 'Charizard',
          nickname: 'Solaris',
          level: 50,
          gender: 'M',
          abilityId: 'blaze',
          itemId: 'charizardite-y',
          natureId: 'timid',
          sp: {
            hp: 1,
            attack: 0,
            defense: 0,
            specialAttack: 32,
            specialDefense: 0,
            speed: 32,
          },
          stats: {
            hp: 138,
            attack: 80,
            defense: 83,
            specialAttack: 157,
            specialDefense: 105,
            speed: 132,
          },
          moveIds: ['heat-wave', 'protect'],
        },
        {
          speciesId: 'amoonguss',
          speciesName: 'Amoonguss',
          nickname: null,
          level: 50,
          gender: 'F',
          abilityId: 'regenerator',
          itemId: 'sitrus-berry',
          natureId: 'serious',
          sp: {
            hp: 32,
            attack: 0,
            defense: 12,
            specialAttack: 0,
            specialDefense: 12,
            speed: 0,
          },
          stats: {
            hp: 221,
            attack: 105,
            defense: 91,
            specialAttack: 105,
            specialDefense: 111,
            speed: 50,
          },
          moveIds: ['spore'],
        },
        {
          speciesId: 'incineroar',
          speciesName: 'Incineroar',
          nickname: null,
          level: 50,
          gender: 'M',
          abilityId: 'intimidate',
          itemId: 'safety-goggles',
          natureId: 'careful',
          sp: {
            hp: 32,
            attack: 8,
            defense: 12,
            specialAttack: 0,
            specialDefense: 12,
            speed: 0,
          },
          stats: {
            hp: 202,
            attack: 137,
            defense: 117,
            specialAttack: 110,
            specialDefense: 143,
            speed: 80,
          },
          moveIds: ['fake-out'],
        },
        {
          speciesId: 'rillaboom',
          speciesName: 'Rillaboom',
          nickname: null,
          level: 50,
          gender: 'M',
          abilityId: 'grassy-surge',
          itemId: 'assault-vest',
          natureId: 'adamant',
          sp: {
            hp: 28,
            attack: 32,
            defense: 0,
            specialAttack: 0,
            specialDefense: 0,
            speed: 0,
          },
          stats: {
            hp: 207,
            attack: 177,
            defense: 110,
            specialAttack: 80,
            specialDefense: 90,
            speed: 105,
          },
          moveIds: ['wood-hammer'],
        },
        {
          speciesId: 'ursaluna-bloodmoon',
          speciesName: 'Ursaluna-Bloodmoon',
          nickname: null,
          level: 50,
          gender: 'M',
          abilityId: 'mind-s-eye',
          itemId: 'life-orb',
          natureId: 'modest',
          sp: {
            hp: 28,
            attack: 0,
            defense: 0,
            specialAttack: 32,
            specialDefense: 0,
            speed: 0,
          },
          stats: {
            hp: 219,
            attack: 120,
            defense: 126,
            specialAttack: 205,
            specialDefense: 101,
            speed: 72,
          },
          moveIds: ['blood-moon'],
        },
        {
          speciesId: 'pelipper',
          speciesName: 'Pelipper',
          nickname: null,
          level: 50,
          gender: 'M',
          abilityId: 'drizzle',
          itemId: 'focus-sash',
          natureId: 'bold',
          sp: {
            hp: 20,
            attack: 0,
            defense: 32,
            specialAttack: 0,
            specialDefense: 12,
            speed: 0,
          },
          stats: {
            hp: 167,
            attack: 70,
            defense: 133,
            specialAttack: 115,
            specialDefense: 102,
            speed: 85,
          },
          moveIds: ['hurricane'],
        },
      ],
    })

    useSavedTeamStore.getState().save('attacker', {
      ...useSavedTeamStore.getState().attackerSaved[0],
      ...{
        speciesId: 'stale-one',
        speciesName: 'Stale One',
        spriteId: 'stale-one',
        natureId: 'serious',
        sp: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        abilityId: null,
        itemId: null,
        status: 'NONE',
        megaActive: false,
        moves: [
          { moveId: null },
          { moveId: null },
          { moveId: null },
          { moveId: null },
        ],
        baseStats: null,
        finalStats: null,
        types: null,
        grounded: true,
        fullHp: true,
      },
    } as never)
    useSavedTeamStore.getState().save('attacker', {
      ...useSavedTeamStore.getState().attackerSaved[0],
      ...{
        speciesId: 'stale-two',
        speciesName: 'Stale Two',
        spriteId: 'stale-two',
        natureId: 'serious',
        sp: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        abilityId: null,
        itemId: null,
        status: 'NONE',
        megaActive: false,
        moves: [
          { moveId: null },
          { moveId: null },
          { moveId: null },
          { moveId: null },
        ],
        baseStats: null,
        finalStats: null,
        types: null,
        grounded: true,
        fullHp: true,
      },
    } as never)

    render(<CalculatorPage />)
    const user = userEvent.setup()

    await waitFor(() => expect(mocks.fetchPokedex).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: /import showdown/i }))
    await user.type(
      screen.getByLabelText(/showdown paste/i),
      'Charizard @ Charizardite Y',
    )
    await user.click(screen.getByRole('button', { name: /import team/i }))

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /load pelipper for attacker/i }),
      ).toBeInTheDocument(),
    )

    expect(
      screen.queryByRole('button', { name: /load stale one for attacker/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /load stale two for attacker/i }),
    ).not.toBeInTheDocument()
    expect(useSavedTeamStore.getState().attackerSaved[0]?.speciesId).toBe(
      'amoonguss',
    )
    expect(useSavedTeamStore.getState().attackerSaved[4]?.speciesId).toBe(
      'pelipper',
    )
  })
})

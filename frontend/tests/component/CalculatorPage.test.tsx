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

describe('CalculatorPage', () => {
  beforeEach(() => {
    useCalculatorStore.getState().reset()
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

  it('imports a Showdown team and applies the selected entry to the attacker', async () => {
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

    expect(await screen.findByText(/solaris/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /load attacker/i }))

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
  })
})

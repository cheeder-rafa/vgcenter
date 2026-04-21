import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  calculateDamage: vi.fn(),
  fetchPokedex: vi.fn(),
  buildStats: vi.fn(),
  importShowdown: vi.fn(),
  importPokepaste: vi.fn(),
}))

vi.mock('../../src/features/calculator/api/damageApi', () => ({
  calculateDamage: mocks.calculateDamage,
}))

vi.mock('../../src/features/calculator/api/datasetApi', () => ({
  fetchPokedex: mocks.fetchPokedex,
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
    mocks.calculateDamage.mockReset()
    mocks.fetchPokedex.mockReset()
    mocks.buildStats.mockReset()
    mocks.importShowdown.mockReset()
    mocks.importPokepaste.mockReset()
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
      rolls: [
        168, 170, 172, 174, 176, 178, 180, 182, 184, 186, 188, 190, 192, 194,
        196, 200,
      ],
      min: 168,
      max: 200,
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
  })

  it('renders the app title, the three input panels, and the result panel', () => {
    render(<CalculatorPage />)

    expect(
      screen.getByRole('heading', { name: /vgcenter damage calculator/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /attacker/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /field/i })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /defender/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /result/i })).toBeInTheDocument()
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

  it('advertises the active regulation', () => {
    render(<CalculatorPage />)

    expect(screen.getByText(/^regulation m-a$/i)).toBeInTheDocument()
  })

  it('submits the current calculator state to the damage API and renders the range result', async () => {
    render(<CalculatorPage />)
    const user = userEvent.setup()

    const attackerAttack = screen.getByLabelText(/^attack$/i)
    fireEvent.change(attackerAttack, { target: { value: '175' } })
    await user.click(screen.getByRole('button', { name: /calculate damage/i }))

    await waitFor(() => expect(mocks.calculateDamage).toHaveBeenCalledTimes(1))
    expect(mocks.calculateDamage).toHaveBeenCalledWith(
      expect.objectContaining({
        attacker: expect.objectContaining({
          level: 50,
          stats: expect.objectContaining({ attack: 175 }),
        }),
      }),
    )
    expect(await screen.findByText(/possible ohko/i)).toBeInTheDocument()
    expect(screen.getByText(/168\s*[–-]\s*200/)).toBeInTheDocument()
  })

  it('imports a Showdown team and applies a selected entry to the attacker state', async () => {
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

  it('imports a Pokepaste URL and applies a selected entry to the defender state', async () => {
    mocks.importPokepaste.mockResolvedValue({
      team: [
        {
          speciesId: 'amoonguss',
          speciesName: 'Amoonguss',
          nickname: null,
          level: 50,
          gender: 'F',
          abilityId: 'regenerator',
          itemId: 'sitrus-berry',
          natureId: 'bold',
          sp: {
            hp: 32,
            attack: 0,
            defense: 32,
            specialAttack: 0,
            specialDefense: 32,
            speed: 0,
          },
          stats: {
            hp: 221,
            attack: 85,
            defense: 134,
            specialAttack: 105,
            specialDefense: 132,
            speed: 50,
          },
          moveIds: ['spore', 'rage-powder'],
        },
      ],
    })

    render(<CalculatorPage />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /import pokepaste/i }))
    await user.type(
      screen.getByLabelText(/pokepaste url/i),
      'https://pokepast.es/abc123',
    )
    await user.click(screen.getByRole('button', { name: /import team/i }))

    expect(await screen.findByText(/^amoonguss$/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /load defender/i }))

    await waitFor(() =>
      expect(useCalculatorStore.getState().defender).toEqual(
        expect.objectContaining({
          speciesId: 'amoonguss',
          natureId: 'bold',
          abilityId: 'regenerator',
          itemId: 'sitrus-berry',
          types: ['GRASS', 'POISON'],
          grounded: true,
          moves: expect.arrayContaining([{ moveId: 'spore' }]),
        }),
      ),
    )
  })
})

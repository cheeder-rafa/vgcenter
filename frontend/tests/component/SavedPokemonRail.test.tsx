import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  calculateDamage: vi.fn(),
  fetchPokedex: vi.fn(),
  fetchAbilities: vi.fn(),
  fetchItems: vi.fn(),
  fetchMoves: vi.fn(),
  fetchNatures: vi.fn(),
  buildStats: vi.fn(),
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

import { CalculatorPage } from '../../src/pages/CalculatorPage'
import { useCalculatorStore } from '../../src/features/calculator/store/useCalculatorStore'
import { useSavedTeamStore } from '../../src/features/calculator/store/useSavedTeamStore'
import { useToastStore } from '../../src/features/calculator/store/useToastStore'

function renderCalc() {
  return render(
    <MemoryRouter>
      <CalculatorPage />
    </MemoryRouter>,
  )
}

describe('SavedPokemonRail', () => {
  beforeEach(() => {
    useCalculatorStore.getState().reset()
    useSavedTeamStore.getState().reset()
    useSavedTeamStore.persist.clearStorage()
    useToastStore.getState().clear()
    Object.values(mocks).forEach((fn) => fn.mockReset?.())
    mocks.fetchPokedex.mockResolvedValue([])
    mocks.fetchAbilities.mockResolvedValue([])
    mocks.fetchItems.mockResolvedValue([])
    mocks.fetchMoves.mockResolvedValue([])
    mocks.fetchNatures.mockResolvedValue([])
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
  })

  it('saves the current side and loads it back into the panel when a card is clicked', async () => {
    renderCalc()
    const user = userEvent.setup()
    const attackerRail = screen.getByLabelText(/attacker saved rail/i)

    act(() => {
      useCalculatorStore.getState().setAttacker({
        speciesId: 'charizard',
        natureId: 'timid',
        abilityId: 'blaze',
        itemId: 'life-orb',
        status: 'BURN',
        megaActive: false,
        moves: [
          { moveId: 'heat-wave' },
          { moveId: 'protect' },
          { moveId: null },
          { moveId: null },
        ],
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
        types: ['FIRE', 'FLYING'],
        grounded: false,
        currentHp: 120,
      })
    })

    await user.click(
      within(attackerRail).getByRole('button', { name: /^save$/i }),
    )

    act(() => {
      useCalculatorStore.getState().setAttacker({
        speciesId: 'amoonguss',
        natureId: 'serious',
        abilityId: 'regenerator',
        itemId: 'sitrus-berry',
        status: 'NONE',
        megaActive: false,
        moves: [
          { moveId: 'spore' },
          { moveId: null },
          { moveId: null },
          { moveId: null },
        ],
        baseStats: {
          hp: 114,
          attack: 85,
          defense: 70,
          specialAttack: 85,
          specialDefense: 80,
          speed: 30,
        },
        finalStats: {
          hp: 189,
          attack: 105,
          defense: 90,
          specialAttack: 105,
          specialDefense: 100,
          speed: 50,
        },
        types: ['GRASS', 'POISON'],
        grounded: true,
        currentHp: 189,
      })
    })

    await user.click(screen.getByRole('button', { name: /load charizard/i }))

    await waitFor(() =>
      expect(useCalculatorStore.getState().attacker).toEqual(
        expect.objectContaining({
          speciesId: 'charizard',
          natureId: 'timid',
          abilityId: 'blaze',
          itemId: 'life-orb',
          status: 'BURN',
          grounded: false,
          currentHp: 120,
          moves: expect.arrayContaining([{ moveId: 'heat-wave' }]),
        }),
      ),
    )
  })

  it('saveButtonLabelFitsWithoutClip', async () => {
    renderCalc()
    const attackerRail = screen.getByLabelText(/attacker saved rail/i)

    const button = within(attackerRail).getByRole('button', { name: /^save$/i })

    expect(button).toHaveTextContent(/^save$/i)
    expect(button.className).toContain('whitespace-nowrap')
  })

  it('keeps saved rails visible as a horizontal tray on mobile', () => {
    renderCalc()

    const attackerRail = screen.getByLabelText(/attacker saved rail/i)

    expect(attackerRail.className).not.toContain('hidden')
    expect(attackerRail.className).toContain('flex')
    expect(attackerRail.className).toContain('gap-2')
  })
})

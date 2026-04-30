import { render, screen, waitFor } from '@testing-library/react'
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

describe('CalculatorPage keyboard shortcuts', () => {
  beforeEach(() => {
    useCalculatorStore.getState().reset()
    Object.values(mocks).forEach((fn) => fn.mockReset?.())
    mocks.fetchPokedex.mockResolvedValue([])
    mocks.fetchAbilities.mockResolvedValue([])
    mocks.fetchItems.mockResolvedValue([])
    mocks.fetchMoves.mockResolvedValue([])
    mocks.fetchNatures.mockResolvedValue([])
    mocks.calculateDamage.mockResolvedValue(null)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('focuses species search with slash shortcut', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <CalculatorPage />
      </MemoryRouter>,
    )

    await user.keyboard('/')

    await waitFor(() => {
      expect(screen.getAllByRole('combobox', { name: /^species$/i })[0]).toHaveFocus()
    })
  })

  it('resets field with r shortcut', async () => {
    const user = userEvent.setup()
    useCalculatorStore.getState().setField({ weather: 'SUN' })
    render(
      <MemoryRouter>
        <CalculatorPage />
      </MemoryRouter>,
    )

    await user.keyboard('r')

    expect(useCalculatorStore.getState().field.weather).toBe('CLEAR')
  })

  it('swaps sides with x shortcut', async () => {
    const user = userEvent.setup()
    const store = useCalculatorStore.getState()
    store.setAttacker({ speciesId: 'charizard' })
    store.setDefender({ speciesId: 'amoonguss' })
    render(
      <MemoryRouter>
        <CalculatorPage />
      </MemoryRouter>,
    )

    await user.keyboard('x')

    expect(useCalculatorStore.getState().attacker.speciesId).toBe('amoonguss')
    expect(useCalculatorStore.getState().defender.speciesId).toBe('charizard')
  })

})

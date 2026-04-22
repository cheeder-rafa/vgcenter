import { render, screen } from '@testing-library/react'
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

describe('PatchNotesModal', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    useCalculatorStore.getState().reset()
    useSavedTeamStore.getState().reset()
    useSavedTeamStore.persist.clearStorage()
    useToastStore.getState().clear()
    Object.values(mocks).forEach((fn) => fn.mockReset?.())
    mocks.buildStats.mockResolvedValue({
      baseStats: { hp: 78, attack: 84, defense: 78, specialAttack: 109, specialDefense: 85, speed: 100 },
      finalStats: { hp: 155, attack: 104, defense: 99, specialAttack: 132, specialDefense: 105, speed: 120 },
    })
    mocks.fetchPokedex.mockResolvedValue([])
    mocks.fetchAbilities.mockResolvedValue([])
    mocks.fetchItems.mockResolvedValue([])
    mocks.fetchMoves.mockResolvedValue([])
    mocks.fetchNatures.mockResolvedValue([{ id: 'serious', name: 'Serious', increasedStat: null, decreasedStat: null }])
  })

  it('renders a "Patch Notes" button in the header next to the regulation chip', () => {
    render(<CalculatorPage />)
    expect(screen.getByRole('button', { name: /patch notes/i })).toBeInTheDocument()
  })

  it('the regulation chip itself is not a button (is a span)', () => {
    render(<CalculatorPage />)
    const chip = screen.getByTestId('regulation-chip')
    expect(chip.tagName.toLowerCase()).toBe('span')
  })

  it('clicking the Patch Notes button opens a dialog', async () => {
    const user = userEvent.setup()
    render(<CalculatorPage />)

    await user.click(screen.getByRole('button', { name: /patch notes/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('the dialog contains a "What\'s New" section', async () => {
    const user = userEvent.setup()
    render(<CalculatorPage />)

    await user.click(screen.getByRole('button', { name: /patch notes/i }))

    expect(screen.getByText(/what'?s new/i)).toBeInTheDocument()
  })

  it('the dialog contains a "Known Issues" section', async () => {
    const user = userEvent.setup()
    render(<CalculatorPage />)

    await user.click(screen.getByRole('button', { name: /patch notes/i }))

    expect(screen.getAllByText(/known issues/i).length).toBeGreaterThan(0)
  })

  it('clicking the close button dismisses the dialog', async () => {
    const user = userEvent.setup()
    render(<CalculatorPage />)

    await user.click(screen.getByRole('button', { name: /patch notes/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

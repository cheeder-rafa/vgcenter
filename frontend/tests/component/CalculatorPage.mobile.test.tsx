import { render, screen } from '@testing-library/react'
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

function renderCalcMobile() {
  return render(
    <MemoryRouter>
      <CalculatorPage />
    </MemoryRouter>,
  )
}

describe('CalculatorPage — mobile layout (≤375px)', () => {
  beforeEach(() => {
    useCalculatorStore.getState().reset()
    Object.values(mocks).forEach((fn) => fn.mockReset?.())
    mocks.fetchPokedex.mockResolvedValue([])
    mocks.fetchAbilities.mockResolvedValue([])
    mocks.fetchItems.mockResolvedValue([])
    mocks.fetchMoves.mockResolvedValue([])
    mocks.fetchNatures.mockResolvedValue([])
    mocks.calculateDamage.mockResolvedValue(null)
  })

  it('Share Link button has min-h-[44px] tap target', () => {
    renderCalcMobile()
    const btn = screen.getByRole('button', {
      name: /copy shareable link to clipboard/i,
    })
    expect(btn.className).toContain('min-h-[44px]')
  })

  it('Discord export button has min-h-[44px] tap target', () => {
    renderCalcMobile()
    const btn = screen.getByRole('button', {
      name: /copy damage report for discord/i,
    })
    expect(btn.className).toContain('min-h-[44px]')
  })

  it('Export PNG button has min-h-[44px] tap target', () => {
    renderCalcMobile()
    const btn = screen.getByRole('button', {
      name: /export result panel as png/i,
    })
    expect(btn.className).toContain('min-h-[44px]')
  })

  it('main grid stacks to single column below desktop breakpoint', () => {
    renderCalcMobile()
    const mainGrid = screen.getByTestId('calculator-main-grid')
    expect(mainGrid.className).toContain('grid-cols-1')
  })
})

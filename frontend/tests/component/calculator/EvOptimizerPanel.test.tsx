import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as optimizerApi from '../../../src/features/calculator/api/optimizerApi'
import { EvOptimizerPanel } from '../../../src/features/calculator/components/EvOptimizerPanel'
import { useCalculatorStore } from '../../../src/features/calculator/store/useCalculatorStore'

vi.mock('../../../src/features/calculator/api/optimizerApi')

const mockCandidate = {
  spHp: 4,
  spDef: 0,
  spSpd: 0,
  totalSp: 4,
  remainingSp: 28,
  minDamagePct: 82.5,
  maxDamagePct: 95.0,
  koChanceProbability: 0.0,
  koChanceDescription: 'guaranteed survival',
}

function renderPanel() {
  return render(
    <MemoryRouter>
      <EvOptimizerPanel />
    </MemoryRouter>,
  )
}

describe('EvOptimizerPanel', () => {
  beforeEach(() => {
    vi.mocked(optimizerApi.optimizeDefense).mockResolvedValue({
      candidates: [mockCandidate],
    })
    useCalculatorStore.setState({
      defender: {
        ...useCalculatorStore.getState().defender,
        speciesId: 'snorlax',
        natureId: 'hardy',
      },
      attacker: {
        ...useCalculatorStore.getState().attacker,
        speciesId: 'garchomp',
        natureId: 'jolly',
      },
    })
  })

  it('renders heading and optimize button', () => {
    renderPanel()
    expect(screen.getByText(/ev optimizer/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /optimize/i })).toBeInTheDocument()
  })

  it('requires a move selection before optimizing', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: /optimize/i })).toBeDisabled()
  })

  it('shows results after clicking optimize', async () => {
    const user = userEvent.setup()
    renderPanel()

    const moveInput = screen.getByPlaceholderText(/move id/i)
    await user.type(moveInput, 'earthquake')

    await user.click(screen.getByRole('button', { name: /optimize/i }))

    await waitFor(() => {
      expect(screen.getByText(/4 SP/i)).toBeInTheDocument()
    })
  })

  it('shows empty state when no candidates returned', async () => {
    vi.mocked(optimizerApi.optimizeDefense).mockResolvedValue({ candidates: [] })
    const user = userEvent.setup()
    renderPanel()

    const moveInput = screen.getByPlaceholderText(/move id/i)
    await user.type(moveInput, 'flare-blitz')

    await user.click(screen.getByRole('button', { name: /optimize/i }))

    await waitFor(() => {
      expect(screen.getByText(/no spread found/i)).toBeInTheDocument()
    })
  })

  it('calls applyDefensiveSpread on the store when apply button clicked', async () => {
    const user = userEvent.setup()
    renderPanel()

    const moveInput = screen.getByPlaceholderText(/move id/i)
    await user.type(moveInput, 'earthquake')
    await user.click(screen.getByRole('button', { name: /optimize/i }))

    await waitFor(() => screen.getByText(/4 SP/i))

    await user.click(screen.getByRole('button', { name: /apply/i }))

    const defender = useCalculatorStore.getState().defender
    expect(defender.sp.hp).toBe(4)
    expect(defender.sp.def).toBe(0)
    expect(defender.sp.spd).toBe(0)
  })
})

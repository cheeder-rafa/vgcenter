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

function setAttackerWithMoves(...moveIds: string[]) {
  const slots = [null, null, null, null].map((_, i) => ({
    moveId: moveIds[i] ?? null,
  })) as [{ moveId: string | null }, { moveId: string | null }, { moveId: string | null }, { moveId: string | null }]
  useCalculatorStore.setState({
    attacker: { ...useCalculatorStore.getState().attacker, speciesId: 'garchomp', natureId: 'jolly', moves: slots },
    defender: { ...useCalculatorStore.getState().defender, speciesId: 'snorlax', natureId: 'hardy' },
  })
}

function renderPanel() {
  return render(
    <MemoryRouter>
      <EvOptimizerPanel />
    </MemoryRouter>,
  )
}

describe('EvOptimizerPanel', () => {
  const nullMoves: [{ moveId: string | null }, { moveId: string | null }, { moveId: string | null }, { moveId: string | null }] = [
    { moveId: null }, { moveId: null }, { moveId: null }, { moveId: null },
  ]

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
        moves: nullMoves,
      },
    })
  })

  it('renders heading and optimize button', () => {
    renderPanel()
    expect(screen.getByText(/ev optimizer/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /optimize/i }),
    ).toBeInTheDocument()
  })

  it('requires a move selection before optimizing', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: /optimize/i })).toBeDisabled()
  })

  it('shows move dropdown with attacker moves', () => {
    setAttackerWithMoves('earthquake', 'protect')
    renderPanel()

    const select = screen.getByRole('combobox', { name: /move/i })
    expect(select).not.toBeDisabled()
    expect(screen.getByRole('option', { name: 'earthquake' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'protect' })).toBeInTheDocument()
  })

  it('shows disabled select with hint when attacker has no moves', () => {
    renderPanel()
    const select = screen.getByRole('combobox', { name: /move/i })
    expect(select).toBeDisabled()
    expect(screen.getByRole('option', { name: /select moves on the attacker first/i })).toBeInTheDocument()
  })

  it('shows results after selecting a move and clicking optimize', async () => {
    setAttackerWithMoves('earthquake', 'protect')
    const user = userEvent.setup()
    renderPanel()

    await user.selectOptions(screen.getByRole('combobox', { name: /move/i }), 'earthquake')

    await user.click(screen.getByRole('button', { name: /optimize/i }))

    await waitFor(() => {
      expect(screen.getByText(/4 SP/i)).toBeInTheDocument()
    })
  })

  it('shows empty state when no candidates returned', async () => {
    vi.mocked(optimizerApi.optimizeDefense).mockResolvedValue({
      candidates: [],
    })
    setAttackerWithMoves('flare-blitz')
    const user = userEvent.setup()
    renderPanel()

    await user.selectOptions(screen.getByRole('combobox', { name: /move/i }), 'flare-blitz')

    await user.click(screen.getByRole('button', { name: /optimize/i }))

    await waitFor(() => {
      expect(screen.getByText(/no spread found/i)).toBeInTheDocument()
    })
  })

  it('calls applyDefensiveSpread on the store when apply button clicked', async () => {
    setAttackerWithMoves('earthquake')
    const user = userEvent.setup()
    renderPanel()

    await user.selectOptions(screen.getByRole('combobox', { name: /move/i }), 'earthquake')
    await user.click(screen.getByRole('button', { name: /optimize/i }))

    await waitFor(() => screen.getByText(/4 SP/i))

    await user.click(screen.getByRole('button', { name: /apply/i }))

    const defender = useCalculatorStore.getState().defender
    expect(defender.sp.hp).toBe(4)
    expect(defender.sp.def).toBe(0)
    expect(defender.sp.spd).toBe(0)
  })
})

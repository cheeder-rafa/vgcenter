import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as optimizerApi from '../../../src/features/calculator/api/optimizerApi'
import { SpreadOptimizerPanel } from '../../../src/features/calculator/components/SpreadOptimizerPanel'
import { useCalculatorStore } from '../../../src/features/calculator/store/useCalculatorStore'

vi.mock('../../../src/features/calculator/api/optimizerApi')

const mockNatures = [
  { id: 'hardy', name: 'Hardy', increasedStat: null, decreasedStat: null },
  { id: 'bold', name: 'Bold', increasedStat: 'DEFENSE', decreasedStat: 'ATTACK' },
  { id: 'jolly', name: 'Jolly', increasedStat: 'SPEED', decreasedStat: 'SPECIAL_ATTACK' },
]

const mockCandidate = {
  spHp: 4,
  spDef: 0,
  spSpd: 0,
  totalSp: 4,
  remainingSp: 62,
  minDamagePct: 82.5,
  maxDamagePct: 95.0,
  koChanceProbability: 0.0,
  koChanceDescription: 'guaranteed survival',
  suggestedNatureId: null,
}

const mockCandidateWithNature = {
  ...mockCandidate,
  suggestedNatureId: 'BOLD',
}

function renderPanel() {
  return render(
    <MemoryRouter>
      <SpreadOptimizerPanel natures={mockNatures} />
    </MemoryRouter>,
  )
}

describe('SpreadOptimizerPanel', () => {
  beforeEach(() => {
    vi.mocked(optimizerApi.optimizeDefense).mockResolvedValue({
      candidates: [mockCandidate],
    })
    useCalculatorStore.setState({
      defender: {
        ...useCalculatorStore.getState().defender,
        speciesId: 'snorlax',
        natureId: 'hardy',
        baseStats: { hp: 160, attack: 110, defense: 65, specialAttack: 65, specialDefense: 110, speed: 30 },
        finalStats: { hp: 235, attack: 130, defense: 85, specialAttack: 85, specialDefense: 130, speed: 50 },
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
    expect(screen.getByText(/spread optimizer/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /optimize/i }),
    ).toBeInTheDocument()
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
    vi.mocked(optimizerApi.optimizeDefense).mockResolvedValue({
      candidates: [],
    })
    const user = userEvent.setup()
    renderPanel()

    const moveInput = screen.getByPlaceholderText(/move id/i)
    await user.type(moveInput, 'flare-blitz')

    await user.click(screen.getByRole('button', { name: /optimize/i }))

    await waitFor(() => {
      expect(screen.getByText(/no spread found/i)).toBeInTheDocument()
    })
  })

  it('applies spread and recomputes finalStats via setDefender when apply clicked', async () => {
    const user = userEvent.setup()
    renderPanel()

    const moveInput = screen.getByPlaceholderText(/move id/i)
    await user.type(moveInput, 'earthquake')
    await user.click(screen.getByRole('button', { name: /optimize/i }))

    await waitFor(() => screen.getByText(/4 SP/i))

    await user.click(screen.getByRole('button', { name: /^apply$/i }))

    const defender = useCalculatorStore.getState().defender
    expect(defender.sp.hp).toBe(4)
    expect(defender.sp.def).toBe(0)
    expect(defender.sp.spd).toBe(0)
    expect(defender.finalStats).not.toBeNull()
  })

  it('shows Nature column and Apply + Nature button when suggestedNatureId present', async () => {
    vi.mocked(optimizerApi.optimizeDefense).mockResolvedValue({
      candidates: [mockCandidateWithNature],
    })
    const user = userEvent.setup()
    renderPanel()

    const moveInput = screen.getByPlaceholderText(/move id/i)
    await user.type(moveInput, 'blizzard')
    await user.click(screen.getByRole('button', { name: /optimize/i }))

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: /nature/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /apply with nature/i })).toBeInTheDocument()
    })
  })

  it('applies nature to defender when Apply + Nature clicked', async () => {
    vi.mocked(optimizerApi.optimizeDefense).mockResolvedValue({
      candidates: [mockCandidateWithNature],
    })
    const user = userEvent.setup()
    renderPanel()

    const moveInput = screen.getByPlaceholderText(/move id/i)
    await user.type(moveInput, 'blizzard')
    await user.click(screen.getByRole('button', { name: /optimize/i }))

    await waitFor(() => screen.getByRole('button', { name: /apply with nature/i }))
    await user.click(screen.getByRole('button', { name: /apply with nature/i }))

    const defender = useCalculatorStore.getState().defender
    expect(defender.natureId).toBe('bold')
    expect(defender.sp.hp).toBe(4)
  })
})

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as optimizerApi from '../../../src/features/calculator/api/optimizerApi'
import { SpreadOptimizerPanel } from '../../../src/features/calculator/components/SpreadOptimizerPanel'
import { useCalculatorStore } from '../../../src/features/calculator/store/useCalculatorStore'
import { usePinnedThreatsStore } from '../../../src/features/calculator/store/usePinnedThreatsStore'

vi.mock('../../../src/features/calculator/api/optimizerApi')

const MOCK_MOVES = [
  {
    id: 'earthquake',
    name: 'Earthquake',
    type: 'GROUND',
    category: 'PHYSICAL' as const,
    basePower: 100,
    spread: true,
    contact: false,
    doublePowerWhenUserStatused: false,
    ignoreBurnPenaltyWhenUserStatused: false,
  },
  {
    id: 'ice-punch',
    name: 'Ice Punch',
    type: 'ICE',
    category: 'PHYSICAL' as const,
    basePower: 75,
    spread: false,
    contact: true,
    doublePowerWhenUserStatused: false,
    ignoreBurnPenaltyWhenUserStatused: false,
  },
]

const mockNatures = [
  { id: 'hardy', name: 'Hardy', increasedStat: null, decreasedStat: null },
  {
    id: 'bold',
    name: 'Bold',
    increasedStat: 'DEFENSE',
    decreasedStat: 'ATTACK',
  },
  {
    id: 'jolly',
    name: 'Jolly',
    increasedStat: 'SPEED',
    decreasedStat: 'SPECIAL_ATTACK',
  },
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
    vi.mocked(optimizerApi.optimizeAgainstThreats).mockResolvedValue({
      best: mockCandidate,
      threats: [
        {
          attackerSpeciesId: 'garchomp',
          moveId: 'earthquake',
          minDamagePct: 44,
          maxDamagePct: 62,
          expectedDamagePct: 53,
          koChanceProbability: 0,
          koChanceDescription: 'guaranteed survival',
        },
      ],
    })
    usePinnedThreatsStore.getState().clear()
    useCalculatorStore.setState({
      defender: {
        ...useCalculatorStore.getState().defender,
        speciesId: 'snorlax',
        natureId: 'hardy',
        baseStats: {
          hp: 160,
          attack: 110,
          defense: 65,
          specialAttack: 65,
          specialDefense: 110,
          speed: 30,
        },
        finalStats: {
          hp: 235,
          attack: 130,
          defense: 85,
          specialAttack: 85,
          specialDefense: 130,
          speed: 50,
        },
      },
      attacker: {
        ...useCalculatorStore.getState().attacker,
        speciesId: 'garchomp',
        natureId: 'jolly',
        abilityId: 'rough-skin',
        itemId: null,
        sp: { hp: 0, atk: 32, def: 0, spa: 0, spd: 0, spe: 32 },
        moves: [
          { moveId: 'earthquake' },
          { moveId: 'ice-punch' },
          { moveId: null },
          { moveId: null },
        ],
      },
      moveCatalog: MOCK_MOVES,
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

  it('renders a select dropdown populated with attacker moves', () => {
    renderPanel()
    const select = screen.getByRole('combobox', { name: /move id/i })
    expect(select.tagName).toBe('SELECT')
    expect(
      screen.getByRole('option', { name: /earthquake/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: /ice punch/i }),
    ).toBeInTheDocument()
  })

  it('select is disabled with placeholder when attacker has no moves', () => {
    useCalculatorStore.setState({
      attacker: {
        ...useCalculatorStore.getState().attacker,
        moves: [
          { moveId: null },
          { moveId: null },
          { moveId: null },
          { moveId: null },
        ],
      },
    })
    renderPanel()
    const select = screen.getByRole('combobox', { name: /move id/i })
    expect(select).toBeDisabled()
    expect(
      screen.getByRole('option', { name: /no moves set/i }),
    ).toBeInTheDocument()
  })

  it('shows results after selecting move and clicking optimize', async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /move id/i }),
      'earthquake',
    )
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

    await user.selectOptions(
      screen.getByRole('combobox', { name: /move id/i }),
      'earthquake',
    )
    await user.click(screen.getByRole('button', { name: /optimize/i }))

    await waitFor(() => {
      expect(screen.getByText(/no spread found/i)).toBeInTheDocument()
    })
  })

  it('applies spread and recomputes finalStats via setDefender when apply clicked', async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /move id/i }),
      'earthquake',
    )
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

    await user.selectOptions(
      screen.getByRole('combobox', { name: /move id/i }),
      'earthquake',
    )
    await user.click(screen.getByRole('button', { name: /optimize/i }))

    await waitFor(() => {
      expect(
        screen.getByRole('columnheader', { name: /nature/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /apply with nature/i }),
      ).toBeInTheDocument()
    })
  })

  it('applies nature to defender when Apply + Nature clicked', async () => {
    vi.mocked(optimizerApi.optimizeDefense).mockResolvedValue({
      candidates: [mockCandidateWithNature],
    })
    const user = userEvent.setup()
    renderPanel()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /move id/i }),
      'earthquake',
    )
    await user.click(screen.getByRole('button', { name: /optimize/i }))

    await waitFor(() =>
      screen.getByRole('button', { name: /apply with nature/i }),
    )
    await user.click(screen.getByRole('button', { name: /apply with nature/i }))

    const defender = useCalculatorStore.getState().defender
    expect(defender.natureId).toBe('bold')
    expect(defender.sp.hp).toBe(4)
  })

  it('resets selected move when attacker changes and move no longer available', async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /move id/i }),
      'earthquake',
    )
    // earthquake selected — optimize button should be enabled
    expect(screen.getByRole('button', { name: /optimize/i })).not.toBeDisabled()

    // Remove earthquake from attacker
    useCalculatorStore.setState({
      attacker: {
        ...useCalculatorStore.getState().attacker,
        moves: [
          { moveId: 'ice-punch' },
          { moveId: null },
          { moveId: null },
          { moveId: null },
        ],
      },
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /optimize/i })).toBeDisabled()
    })
  })

  it('pins the current attacker as a multi-threat target', async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.click(screen.getByRole('tab', { name: /multi-threat/i }))
    await user.click(
      screen.getByRole('button', { name: /add current attacker as threat/i }),
    )

    expect(usePinnedThreatsStore.getState().threats).toHaveLength(1)
    expect(screen.getByText(/garchomp/i)).toBeInTheDocument()
  })

  it('submits pinned threats and renders per-threat damage table', async () => {
    const user = userEvent.setup()
    usePinnedThreatsStore.getState().pin({
      id: 'garchomp-earthquake',
      label: 'Garchomp',
      build: { ...useCalculatorStore.getState().attacker },
      moveId: 'earthquake',
    })
    renderPanel()

    await user.click(screen.getByRole('tab', { name: /multi-threat/i }))
    await user.click(screen.getByRole('button', { name: /optimize threats/i }))

    await waitFor(() => {
      expect(optimizerApi.optimizeAgainstThreats).toHaveBeenCalledWith(
        expect.objectContaining({
          goal: 'EXPECTED_DAMAGE_SUM',
          threats: [
            expect.objectContaining({
              attackerSpeciesId: 'garchomp',
              moveId: 'earthquake',
            }),
          ],
        }),
      )
    })
    expect(screen.getByText(/per-threat damage/i)).toBeInTheDocument()
    expect(screen.getByText(/53\.0%/i)).toBeInTheDocument()
  })
})

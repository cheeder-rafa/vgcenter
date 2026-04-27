import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SpreadComparePanel } from '../../../src/features/calculator/components/SpreadComparePanel'
import { useCompareStore } from '../../../src/features/calculator/store/useCompareStore'
import { useCalculatorStore } from '../../../src/features/calculator/store/useCalculatorStore'

vi.mock('../../../src/features/calculator/api/damageApi', () => ({
  calculateDamage: vi.fn().mockResolvedValue({
    rolls: [80, 85, 90, 95],
    min: 80,
    max: 95,
    minPct: 44.4,
    maxPct: 52.8,
    koChance: { description: '2HKO', probability: 1.0, hits: 2 },
  }),
}))

const MOCK_MOVE = {
  id: 'wood-hammer',
  name: 'Wood Hammer',
  type: 'GRASS',
  category: 'PHYSICAL' as const,
  basePower: 120,
  spread: false,
  contact: true,
  doublePowerWhenUserStatused: false,
  ignoreBurnPenaltyWhenUserStatused: false,
}

describe('SpreadComparePanel', () => {
  beforeEach(() => {
    useCompareStore.getState().clear()
    useCalculatorStore.setState({
      attacker: {
        ...useCalculatorStore.getState().attacker,
        speciesId: 'rillaboom',
        moves: [
          { moveId: 'wood-hammer' },
          { moveId: null },
          { moveId: null },
          { moveId: null },
        ],
        finalStats: {
          hp: 175,
          attack: 160,
          defense: 110,
          specialAttack: 110,
          specialDefense: 110,
          speed: 110,
        },
        types: ['GRASS', null],
      },
      defender: {
        ...useCalculatorStore.getState().defender,
        speciesId: 'garchomp',
        finalStats: {
          hp: 183,
          attack: 130,
          defense: 95,
          specialAttack: 80,
          specialDefense: 85,
          speed: 102,
        },
        types: ['DRAGON', 'GROUND'],
      },
      moveCatalog: [MOCK_MOVE],
    })
  })

  it('renders the Pin current defender button', () => {
    render(<SpreadComparePanel defenderName="Garchomp" />)
    expect(
      screen.getByRole('button', { name: /pin current defender/i }),
    ).toBeInTheDocument()
  })

  it('adds a column with species name when pinning', async () => {
    render(<SpreadComparePanel defenderName="Garchomp" />)
    fireEvent.click(screen.getByRole('button', { name: /pin current defender/i }))
    await waitFor(() => {
      expect(screen.getByText('Garchomp')).toBeInTheDocument()
    })
  })

  it('shows damage range in pinned column', async () => {
    render(<SpreadComparePanel defenderName="Garchomp" />)
    fireEvent.click(screen.getByRole('button', { name: /pin current defender/i }))
    await waitFor(() => {
      expect(screen.getByText(/44\.4.+52\.8%/)).toBeInTheDocument()
    })
  })

  it('removes column when unpinned', async () => {
    render(<SpreadComparePanel defenderName="Garchomp" />)
    fireEvent.click(screen.getByRole('button', { name: /pin current defender/i }))
    await waitFor(() => {
      expect(screen.getByText('Garchomp')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /unpin Garchomp/i }))
    await waitFor(() => {
      expect(screen.queryByText('Garchomp')).not.toBeInTheDocument()
    })
  })

  it('shows multiple columns for multiple pins', async () => {
    const { rerender } = render(<SpreadComparePanel defenderName="Garchomp" />)
    fireEvent.click(screen.getByRole('button', { name: /pin current defender/i }))
    await waitFor(() => expect(screen.getByText('Garchomp')).toBeInTheDocument())

    useCalculatorStore.setState({
      defender: {
        ...useCalculatorStore.getState().defender,
        speciesId: 'gliscor',
        finalStats: {
          hp: 177,
          attack: 95,
          defense: 125,
          specialAttack: 45,
          specialDefense: 95,
          speed: 95,
        },
        types: ['GROUND', 'FLYING'],
      },
    })
    rerender(<SpreadComparePanel defenderName="Gliscor" />)
    fireEvent.click(screen.getByRole('button', { name: /pin current defender/i }))
    await waitFor(() => expect(screen.getByText('Gliscor')).toBeInTheDocument())
  })
})

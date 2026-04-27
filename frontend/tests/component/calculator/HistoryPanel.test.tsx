import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HistoryPanel } from '../../../src/features/calculator/components/HistoryPanel'
import { useCalcHistoryStore, type HistoryEntry } from '../../../src/features/calculator/store/useCalcHistoryStore'
import { useCalculatorStore } from '../../../src/features/calculator/store/useCalculatorStore'

vi.mock('../../../src/features/calculator/api/damageApi', () => ({
  calculateDamage: vi.fn().mockResolvedValue({ rolls: [], minPct: 0, maxPct: 0, koChance: 0 }),
}))

function makeEntry(id: number, atkName = 'Garchomp', defName = 'Gliscor'): HistoryEntry {
  const baseAttacker = useCalculatorStore.getState().attacker
  const baseDefender = useCalculatorStore.getState().defender
  return {
    id,
    timestamp: 1_000_000 + id,
    attackerSpeciesId: `atk-${id}`,
    defenderSpeciesId: `def-${id}`,
    attackerName: atkName,
    defenderName: defName,
    snapshot: {
      attacker: { ...baseAttacker, speciesId: `atk-${id}`, speciesName: atkName },
      defender: { ...baseDefender, speciesId: `def-${id}`, speciesName: defName },
      field: { weather: 'CLEAR', terrain: 'NONE', room: 'NONE' },
      attackerSide: { reflect: false, lightScreen: false, auroraVeil: false, friendGuard: false, helpingHand: false, tailwind: false, protect: false },
      defenderSide: { reflect: false, lightScreen: false, auroraVeil: false, friendGuard: false, helpingHand: false, tailwind: false, protect: false },
      criticalHit: false,
      targets: 1,
    },
    summary: { topMoveId: 'tackle', topMoveMaxPercent: 55.2 },
  }
}

describe('HistoryPanel', () => {
  beforeEach(() => {
    useCalcHistoryStore.getState().clear()
  })

  it('renders nothing visible when history is empty', () => {
    render(<HistoryPanel />)
    expect(screen.queryByRole('list')).toBeNull()
  })

  function openPanel() {
    fireEvent.click(screen.getByRole('button', { name: /calcs/i }))
  }

  it('shows entry count and attacker/defender names when entries exist', () => {
    useCalcHistoryStore.getState().push(makeEntry(1))
    useCalcHistoryStore.getState().push(makeEntry(2, 'Metagross', 'Landorus'))
    render(<HistoryPanel />)
    expect(screen.getByText(/2 calcs/i)).toBeInTheDocument()
    openPanel()
    expect(screen.getByText(/Metagross/)).toBeInTheDocument()
    expect(screen.getByText(/Garchomp/)).toBeInTheDocument()
  })

  it('calls setAttacker and setDefender when an entry row is clicked', () => {
    useCalcHistoryStore.getState().push(makeEntry(1))
    render(<HistoryPanel />)
    openPanel()

    const row = screen.getByRole('button', { name: /Garchomp.*Gliscor/i })
    fireEvent.click(row)

    const state = useCalculatorStore.getState()
    expect(state.attacker.speciesId).toBe('atk-1')
    expect(state.defender.speciesId).toBe('def-1')
  })

  it('shows the top move max percent in summary', () => {
    useCalcHistoryStore.getState().push(makeEntry(1))
    render(<HistoryPanel />)
    openPanel()
    expect(screen.getByText(/55\.2%/)).toBeInTheDocument()
  })

  it('clears all entries when clear button is clicked', () => {
    useCalcHistoryStore.getState().push(makeEntry(1))
    useCalcHistoryStore.getState().push(makeEntry(2))
    render(<HistoryPanel />)
    openPanel()

    fireEvent.click(screen.getByRole('button', { name: /clear/i }))
    expect(useCalcHistoryStore.getState().entries).toHaveLength(0)
  })
})

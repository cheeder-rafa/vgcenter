import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MatchupDrilldown } from '../../../src/features/gameplan/components/MatchupDrilldown'
import type {
  GameplanDamageOption,
  GameplanMatchupCell,
  TurnOneFlags,
} from '../../../src/features/gameplan/types/api'

const EMPTY_FLAGS: TurnOneFlags = {
  protect: false,
  redirection: false,
  fakeOut: false,
  priority: false,
  speedControl: 'NONE',
}

function option(
  moveId: string,
  attackerIndex: number,
  defenderIndex: number,
  minPct: number,
  maxPct: number,
): GameplanDamageOption {
  return {
    attackerIndex,
    defenderIndex,
    moveId,
    damage: {
      rolls: Array.from({ length: 16 }, (_, i) => 80 + i),
      min: 80,
      max: 95,
      minPct,
      maxPct,
      koChance: { description: 'Possible 2HKO', probability: 0.5, hits: 2 },
    },
  }
}

const SAMPLE_CELL: GameplanMatchupCell = {
  firstOpponentIndex: 0,
  secondOpponentIndex: 1,
  opponentLeadSpeciesIds: ['charizard', 'amoonguss'],
  score: { total: 42, offense: 12, defense: 8, speed: 15, immunity: 7 },
  mineFlags: { ...EMPTY_FLAGS, fakeOut: true },
  opponentFlags: EMPTY_FLAGS,
  outgoing: [option('flamethrower', 0, 0, 45, 55)],
  incoming: [option('sludge-bomb', 1, 0, 20, 25)],
}

describe('MatchupDrilldown', () => {
  it('shows a placeholder when no cell is selected', () => {
    render(
      <MatchupDrilldown
        cell={null}
        mineNameById={{}}
        opponentNameById={{}}
      />,
    )
    expect(screen.getByText(/select a cell/i)).toBeInTheDocument()
  })

  it('renders score component breakdown with all four components and total', () => {
    render(
      <MatchupDrilldown
        cell={SAMPLE_CELL}
        mineNameById={{}}
        opponentNameById={{ charizard: 'Charizard', amoonguss: 'Amoonguss' }}
      />,
    )
    expect(screen.getByText(/total/i)).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText(/offense/i)).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText(/defense/i)).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText(/speed/i)).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText(/immunity/i)).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('renders outgoing and incoming damage options with KO descriptions', () => {
    render(
      <MatchupDrilldown
        cell={SAMPLE_CELL}
        mineNameById={{}}
        opponentNameById={{ charizard: 'Charizard', amoonguss: 'Amoonguss' }}
      />,
    )
    expect(screen.getByText(/flamethrower/i)).toBeInTheDocument()
    expect(screen.getByText(/sludge-bomb/i)).toBeInTheDocument()
    expect(screen.getAllByText(/possible 2hko/i).length).toBeGreaterThanOrEqual(2)
  })

  it('shows the opponent lead pair header', () => {
    render(
      <MatchupDrilldown
        cell={SAMPLE_CELL}
        mineNameById={{}}
        opponentNameById={{ charizard: 'Charizard', amoonguss: 'Amoonguss' }}
      />,
    )
    expect(screen.getByText(/Charizard.*Amoonguss/)).toBeInTheDocument()
  })
})

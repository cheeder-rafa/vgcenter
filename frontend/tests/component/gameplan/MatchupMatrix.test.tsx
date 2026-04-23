import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { MatchupMatrix } from '../../../src/features/gameplan/components/MatchupMatrix'
import type {
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

function makeCell(
  firstIdx: number,
  secondIdx: number,
  total: number,
  overrides: Partial<GameplanMatchupCell> = {},
): GameplanMatchupCell {
  return {
    firstOpponentIndex: firstIdx,
    secondOpponentIndex: secondIdx,
    opponentLeadSpeciesIds: [`o${firstIdx}`, `o${secondIdx}`],
    score: { total, offense: 10, defense: 10, speed: 10, immunity: 10 },
    mineFlags: EMPTY_FLAGS,
    opponentFlags: EMPTY_FLAGS,
    outgoing: [],
    incoming: [],
    ...overrides,
  }
}

function makeCells(): GameplanMatchupCell[] {
  const cells: GameplanMatchupCell[] = []
  for (let i = 0; i < 6; i += 1) {
    for (let j = i + 1; j < 6; j += 1) {
      cells.push(makeCell(i, j, (i + 1) * 10 + j))
    }
  }
  return cells
}

describe('MatchupMatrix', () => {
  it('renders 15 cells for 6 opponent Pokémon', () => {
    render(
      <MatchupMatrix
        cells={makeCells()}
        selectedCellIndex={null}
        onSelectCell={() => {}}
        opponentNameById={{}}
      />,
    )
    expect(screen.getAllByRole('button')).toHaveLength(15)
  })

  it('shows the score number on each cell', () => {
    const cells = [makeCell(0, 1, 42), makeCell(0, 2, -17)]
    render(
      <MatchupMatrix
        cells={cells}
        selectedCellIndex={null}
        onSelectCell={() => {}}
        opponentNameById={{}}
      />,
    )
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('-17')).toBeInTheDocument()
  })

  it('renders flag badges when a turn-1 flag is active', () => {
    const cell = makeCell(0, 1, 5, {
      mineFlags: { ...EMPTY_FLAGS, fakeOut: true, priority: true },
      opponentFlags: { ...EMPTY_FLAGS, speedControl: 'TRICK_ROOM' },
    })
    render(
      <MatchupMatrix
        cells={[cell]}
        selectedCellIndex={null}
        onSelectCell={() => {}}
        opponentNameById={{}}
      />,
    )
    expect(screen.getByTitle(/fake out/i)).toBeInTheDocument()
    expect(screen.getByTitle(/priority/i)).toBeInTheDocument()
    expect(screen.getByTitle(/trick room/i)).toBeInTheDocument()
  })

  it('fires onSelectCell with the cell index on click', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const cells = makeCells()
    render(
      <MatchupMatrix
        cells={cells}
        selectedCellIndex={null}
        onSelectCell={onSelect}
        opponentNameById={{}}
      />,
    )
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[3])
    expect(onSelect).toHaveBeenCalledWith(3)
  })

  it('marks the selected cell via aria-pressed', () => {
    const cells = makeCells()
    render(
      <MatchupMatrix
        cells={cells}
        selectedCellIndex={2}
        onSelectCell={() => {}}
        opponentNameById={{}}
      />,
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons[2]).toHaveAttribute('aria-pressed', 'true')
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders a non-colour severity label on each cell', () => {
    const cells = [
      makeCell(0, 1, 80), // strong positive
      makeCell(0, 2, 3), // even
      makeCell(0, 3, -80), // strong negative
    ]
    render(
      <MatchupMatrix
        cells={cells}
        selectedCellIndex={null}
        onSelectCell={() => {}}
        opponentNameById={{}}
      />,
    )
    // severity indicator exposed via aria-label on each button
    const buttons = screen.getAllByRole('button')
    expect(buttons[0].getAttribute('aria-label')).toMatch(/strong advantage/i)
    expect(buttons[1].getAttribute('aria-label')).toMatch(/even/i)
    expect(buttons[2].getAttribute('aria-label')).toMatch(/strong disadvantage/i)
  })
})

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  copyDamageReport: vi.fn(),
}))

vi.mock('../../../src/features/calculator/components/copyDamageReport', () => ({
  copyDamageReport: mocks.copyDamageReport,
}))

import { DualMoveReadout } from '../../../src/features/calculator/components/DualMoveReadout'

const RESULT = {
  rolls: [
    108, 108, 108, 110, 110, 114, 114, 116, 116, 116, 120, 120, 122, 122, 126,
    126,
  ],
  min: 108,
  max: 126,
  minPct: 64.6,
  maxPct: 75.4,
  koChance: {
    description: 'guaranteed 2HKO',
    probability: 1,
    hits: 2,
  },
}

const ATTACKER_MOVES = [
  { moveName: 'Poltergeist', moveType: 'GHOST', result: RESULT },
  { moveName: 'Shadow Sneak', moveType: 'GHOST', result: null },
  { moveName: null, moveType: null, result: null },
  { moveName: null, moveType: null, result: null },
]

const DEFENDER_MOVES = [
  { moveName: 'Iron Head', moveType: 'STEEL', result: null },
  { moveName: null, moveType: null, result: null },
  { moveName: null, moveType: null, result: null },
  { moveName: null, moveType: null, result: null },
]

describe('DualMoveReadout', () => {
  beforeEach(() => {
    mocks.copyDamageReport.mockReset()
    mocks.copyDamageReport.mockResolvedValue(undefined)
  })

  it('renders both side columns with move names and damage readouts', () => {
    render(
      <DualMoveReadout
        attackerName="Aegislash-Shield"
        defenderName="Aegislash-Shield"
        attackerMoves={ATTACKER_MOVES}
        defenderMoves={DEFENDER_MOVES}
      />,
    )

    expect(screen.getByText('Poltergeist')).toBeInTheDocument()
    expect(screen.getByText('64.6–75.4%')).toBeInTheDocument()
    expect(screen.getByText('Shadow Sneak')).toBeInTheDocument()
    expect(screen.getByText('Iron Head')).toBeInTheDocument()
  })

  it('does not show roll detail before any move is clicked', () => {
    render(
      <DualMoveReadout
        attackerName="Aegislash-Shield"
        defenderName="Aegislash-Shield"
        attackerMoves={ATTACKER_MOVES}
        defenderMoves={DEFENDER_MOVES}
      />,
    )

    expect(screen.queryByTestId('move-detail-panel')).not.toBeInTheDocument()
  })

  it('expands roll detail when a move row with a result is clicked', async () => {
    const user = userEvent.setup()

    render(
      <DualMoveReadout
        attackerName="Aegislash-Shield"
        defenderName="Aegislash-Shield"
        attackerMoves={ATTACKER_MOVES}
        defenderMoves={DEFENDER_MOVES}
      />,
    )

    await user.click(screen.getByTestId('overview-move-attacker-0'))

    expect(screen.getByTestId('move-detail-panel')).toBeInTheDocument()
  })

  it('shows rolls text in expanded detail panel', async () => {
    const user = userEvent.setup()

    render(
      <DualMoveReadout
        attackerName="Aegislash-Shield"
        defenderName="Aegislash-Shield"
        attackerMoves={ATTACKER_MOVES}
        defenderMoves={DEFENDER_MOVES}
      />,
    )

    await user.click(screen.getByTestId('overview-move-attacker-0'))

    expect(screen.getByTestId('overview-rolls-text')).toBeInTheDocument()
    expect(screen.getByTestId('overview-rolls-text').textContent).toContain(
      '108',
    )
  })

  it('shows copy button in expanded detail panel', async () => {
    const user = userEvent.setup()

    render(
      <DualMoveReadout
        attackerName="Aegislash-Shield"
        defenderName="Aegislash-Shield"
        attackerMoves={ATTACKER_MOVES}
        defenderMoves={DEFENDER_MOVES}
      />,
    )

    await user.click(screen.getByTestId('overview-move-attacker-0'))

    expect(
      screen.getByRole('button', { name: /copy damage report/i }),
    ).toBeInTheDocument()
  })

  it('copies formatted damage report to clipboard when copy button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <DualMoveReadout
        attackerName="Aegislash-Shield"
        defenderName="Aegislash-Shield"
        attackerMoves={ATTACKER_MOVES}
        defenderMoves={DEFENDER_MOVES}
      />,
    )

    await user.click(screen.getByTestId('overview-move-attacker-0'))
    await user.click(screen.getByRole('button', { name: /copy damage report/i }))

    await waitFor(() =>
      expect(mocks.copyDamageReport).toHaveBeenCalledWith(
        expect.stringContaining('Aegislash-Shield'),
      ),
    )
    await waitFor(() =>
      expect(mocks.copyDamageReport).toHaveBeenCalledWith(
        expect.stringContaining('Poltergeist'),
      ),
    )
  })

  it('collapses roll detail when the same move row is clicked again', async () => {
    const user = userEvent.setup()

    render(
      <DualMoveReadout
        attackerName="Aegislash-Shield"
        defenderName="Aegislash-Shield"
        attackerMoves={ATTACKER_MOVES}
        defenderMoves={DEFENDER_MOVES}
      />,
    )

    await user.click(screen.getByTestId('overview-move-attacker-0'))
    expect(screen.getByTestId('move-detail-panel')).toBeInTheDocument()

    await user.click(screen.getByTestId('overview-move-attacker-0'))
    expect(screen.queryByTestId('move-detail-panel')).not.toBeInTheDocument()
  })

  it('switches expanded move when a different row is clicked', async () => {
    const MOVES_TWO_RESULTS = [
      { moveName: 'Poltergeist', moveType: 'GHOST', result: RESULT },
      {
        moveName: 'Shadow Sneak',
        moveType: 'GHOST',
        result: { ...RESULT, minPct: 22.7, maxPct: 28.7 },
      },
      { moveName: null, moveType: null, result: null },
      { moveName: null, moveType: null, result: null },
    ]

    const user = userEvent.setup()

    render(
      <DualMoveReadout
        attackerName="Aegislash-Shield"
        defenderName="Aegislash-Shield"
        attackerMoves={MOVES_TWO_RESULTS}
        defenderMoves={DEFENDER_MOVES}
      />,
    )

    await user.click(screen.getByTestId('overview-move-attacker-0'))
    expect(screen.getByTestId('move-detail-panel')).toBeInTheDocument()

    // Click second move — panel should update (still visible, different content)
    await user.click(screen.getByTestId('overview-move-attacker-1'))
    expect(screen.getByTestId('move-detail-panel')).toBeInTheDocument()
  })

  it('does not expand for move rows without a result', async () => {
    const user = userEvent.setup()

    render(
      <DualMoveReadout
        attackerName="Aegislash-Shield"
        defenderName="Aegislash-Shield"
        attackerMoves={ATTACKER_MOVES}
        defenderMoves={DEFENDER_MOVES}
      />,
    )

    // M2 has no result — clicking it should not open the panel
    await user.click(screen.getByTestId('overview-move-attacker-1'))

    expect(screen.queryByTestId('move-detail-panel')).not.toBeInTheDocument()
  })
})

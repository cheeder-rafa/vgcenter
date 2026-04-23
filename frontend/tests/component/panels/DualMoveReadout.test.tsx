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
import { useCalculatorStore } from '../../../src/features/calculator/store/useCalculatorStore'

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
    useCalculatorStore.getState().reset()
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
    const article = screen.getByText(/damage overview/i).closest('article')
    expect(article?.className).toContain('px-2.5')
    expect(article?.textContent).toContain('Damage Overview')
  })

  it('keeps the overview stacked until desktop, then aligns to editor columns', () => {
    render(
      <DualMoveReadout
        attackerName="Aegislash-Shield"
        defenderName="Aegislash-Shield"
        attackerMoves={ATTACKER_MOVES}
        defenderMoves={DEFENDER_MOVES}
      />,
    )

    const row = screen.getByTestId('damage-overview-columns')
    expect(row.className).toContain('grid')
    expect(row.className).toContain(
      'xl:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.7fr)_minmax(0,1.1fr)]',
    )
  })

  it('renders a dedicated focus lane for desktop alignment and selected-roll detail', async () => {
    const user = userEvent.setup()

    render(
      <DualMoveReadout
        attackerName="Aegislash-Shield"
        defenderName="Aegislash-Shield"
        attackerMoves={ATTACKER_MOVES}
        defenderMoves={DEFENDER_MOVES}
      />,
    )

    const focusLane = screen.getByTestId('overview-focus-lane')

    expect(focusLane).toHaveTextContent(/select a move/i)

    await user.click(screen.getByTestId('overview-move-attacker-0'))

    expect(focusLane).toContainElement(screen.getByTestId('move-detail-panel'))
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
    expect(screen.getByTestId('overview-roll-summary')).toHaveTextContent(
      '0 lethal',
    )
    expect(screen.getByTestId('overview-roll-summary')).toHaveTextContent(
      '16 safe',
    )
    expect(screen.queryByTestId('heatmap-hp-label')).not.toBeInTheDocument()
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
    await user.click(
      screen.getByRole('button', { name: /copy damage report/i }),
    )

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

  it('colors the damage readout based on KO category', () => {
    const OHKO_RESULT = {
      rolls: [
        324, 324, 336, 336, 348, 348, 348, 348, 352, 360, 368, 360, 368, 372,
        376, 384,
      ],
      min: 324,
      max: 384,
      minPct: 177.0,
      maxPct: 209.8,
      koChance: { description: 'guaranteed OHKO', probability: 1, hits: 1 },
    }
    const TWOHKO_RESULT = {
      rolls: [
        108, 108, 108, 110, 110, 114, 114, 116, 116, 116, 120, 120, 122, 122,
        126, 126,
      ],
      min: 108,
      max: 126,
      minPct: 64.6,
      maxPct: 75.4,
      koChance: { description: 'guaranteed 2HKO', probability: 1, hits: 2 },
    }
    const SAFE_RESULT = {
      rolls: [40, 40, 42, 42, 44, 44, 44, 44, 46, 46, 48, 48, 48, 50, 50, 52],
      min: 40,
      max: 52,
      minPct: 22.0,
      maxPct: 28.4,
      koChance: { description: 'no 5HKO', probability: 0, hits: 5 },
    }
    const MOVES_MIXED = [
      { moveName: 'Close Combat', moveType: 'FIGHTING', result: OHKO_RESULT },
      { moveName: 'Poltergeist', moveType: 'GHOST', result: TWOHKO_RESULT },
      { moveName: 'Shadow Sneak', moveType: 'GHOST', result: SAFE_RESULT },
      { moveName: null, moveType: null, result: null },
    ]

    render(
      <DualMoveReadout
        attackerName="Sneasler"
        defenderName="Kingambit"
        attackerMoves={MOVES_MIXED}
        defenderMoves={DEFENDER_MOVES}
      />,
    )

    const ohkoReadout = screen.getByTestId('overview-readout-attacker-0')
    const twohkoReadout = screen.getByTestId('overview-readout-attacker-1')
    const safeReadout = screen.getByTestId('overview-readout-attacker-2')

    // OHKO guaranteed → red
    expect(ohkoReadout).toHaveAttribute('data-ko-tier', 'ohko')
    // 2HKO guaranteed → amber
    expect(twohkoReadout).toHaveAttribute('data-ko-tier', '2hko')
    // no KO → safe
    expect(safeReadout).toHaveAttribute('data-ko-tier', 'safe')
  })

  it('uses the actual defender HP when counting lethal rolls in detail', async () => {
    const user = userEvent.setup()
    const OHKO_RESULT = {
      rolls: [
        324, 324, 336, 336, 348, 348, 348, 348, 352, 360, 368, 360, 368, 372,
        376, 384,
      ],
      min: 324,
      max: 384,
      minPct: 177.0,
      maxPct: 209.8,
      koChance: {
        description: 'guaranteed OHKO',
        probability: 1,
        hits: 1,
      },
    }
    const ATTACKER_MOVES_OHKO = [
      { moveName: 'Close Combat', moveType: 'FIGHTING', result: OHKO_RESULT },
      { moveName: null, moveType: null, result: null },
      { moveName: null, moveType: null, result: null },
      { moveName: null, moveType: null, result: null },
    ]

    render(
      <DualMoveReadout
        attackerName="Sneasler"
        defenderName="Kingambit"
        attackerMoves={ATTACKER_MOVES_OHKO}
        defenderMoves={DEFENDER_MOVES}
        defenderHp={183}
      />,
    )

    await user.click(screen.getByTestId('overview-move-attacker-0'))

    expect(screen.getByTestId('overview-roll-summary')).toHaveTextContent(
      '16 lethal',
    )
    expect(screen.getByTestId('overview-roll-summary')).toHaveTextContent(
      '0 safe',
    )
  })

  it('shows lethal and safe counts in expanded detail without a heatmap', async () => {
    const user = userEvent.setup()
    const MIXED_RESULT = {
      rolls: [
        90, 94, 96, 98, 100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120,
        122,
      ],
      min: 90,
      max: 122,
      minPct: 50,
      maxPct: 67.8,
      koChance: { description: 'possible OHKO', probability: 0.25, hits: 1 },
    }

    render(
      <DualMoveReadout
        attackerName="Flutter Mane"
        defenderName="Amoonguss"
        attackerMoves={[
          { moveName: 'Moonblast', moveType: 'FAIRY', result: MIXED_RESULT },
          { moveName: null, moveType: null, result: null },
          { moveName: null, moveType: null, result: null },
          { moveName: null, moveType: null, result: null },
        ]}
        defenderMoves={DEFENDER_MOVES}
        defenderHp={110}
      />,
    )

    await user.click(screen.getByTestId('overview-move-attacker-0'))

    expect(screen.getByTestId('overview-roll-summary')).toHaveTextContent(
      '7 lethal',
    )
    expect(screen.getByTestId('overview-roll-summary')).toHaveTextContent(
      '9 safe',
    )
    expect(screen.queryByTestId('heatmap-hp-label')).not.toBeInTheDocument()
  })

  it('shows Mega species names in the damage detail text when mega evolution is active', async () => {
    const user = userEvent.setup()

    render(
      <DualMoveReadout
        attackerName="Charizard"
        defenderName="Venusaur"
        attackerMoves={[
          {
            moveName: 'Flamethrower',
            moveType: 'FIRE',
            moveCategory: 'SPECIAL',
            result: RESULT,
          },
          { moveName: null, moveType: null, result: null },
          { moveName: null, moveType: null, result: null },
          { moveName: null, moveType: null, result: null },
        ]}
        defenderMoves={DEFENDER_MOVES}
      />,
    )

    useCalculatorStore.getState().setAttacker({ megaActive: true })

    await user.click(screen.getByTestId('overview-move-attacker-0'))

    expect(screen.getByTestId('move-detail-panel')).toHaveTextContent(
      'Mega Charizard Flamethrower vs. Venusaur',
    )
  })

  it('adds stage and SP context to the detail text when modifiers are active', async () => {
    const user = userEvent.setup()

    useCalculatorStore.getState().setAttacker({
      sp: { hp: 0, atk: 32, def: 0, spa: 0, spd: 0, spe: 0 },
      stages: { atk: 1, def: 0, spa: 0, spd: 0, spe: 0 },
    })
    useCalculatorStore.getState().setDefender({
      sp: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      stages: { atk: 0, def: -1, spa: 0, spd: 0, spe: 0 },
    })

    render(
      <DualMoveReadout
        attackerName="Sneasler"
        defenderName="Absol"
        attackerMoves={[
          {
            moveName: 'Close Combat',
            moveType: 'FIGHTING',
            moveCategory: 'PHYSICAL',
            result: {
              rolls: [
                702, 702, 702, 710, 710, 718, 718, 726, 726, 726, 734, 734, 742,
                742, 818, 818,
              ],
              min: 702,
              max: 818,
              minPct: 501.4,
              maxPct: 584.2,
              koChance: {
                description: 'guaranteed OHKO',
                probability: 1,
                hits: 1,
              },
            },
          },
          { moveName: null, moveType: null, result: null },
          { moveName: null, moveType: null, result: null },
          { moveName: null, moveType: null, result: null },
        ]}
        defenderMoves={DEFENDER_MOVES}
      />,
    )

    await user.click(screen.getByTestId('overview-move-attacker-0'))

    expect(screen.getByTestId('move-detail-panel')).toHaveTextContent(
      '+1 32 Atk Sneasler Close Combat vs. -1 0 HP / 0 Def Absol',
    )
  })
})

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DamagePlanView } from '../../../src/features/calculator/components/DamagePlanView'

const RESULT = {
  rolls: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
  min: 24,
  max: 39,
  minPct: 12,
  maxPct: 19.5,
  koChance: { description: 'Never OHKO', probability: 0, hits: 2 },
}

describe('DamagePlanView', () => {
  it('renders a turn-by-turn sequence with delta chips and running HP', () => {
    render(
      <DamagePlanView
        attackerName="Sneasler"
        defenderName="Amoonguss"
        attackerHp={160}
        defenderHp={180}
        attackerMoves={[
          {
            moveName: 'Close Combat',
            moveType: 'FIGHTING',
            result: RESULT,
            previousResult: { ...RESULT, minPct: 9, maxPct: 16.5 },
          },
          {
            moveName: 'Feint',
            moveType: 'NORMAL',
            result: { ...RESULT, minPct: 6, maxPct: 8.5 },
            previousResult: { ...RESULT, minPct: 7, maxPct: 9.5 },
          },
          { moveName: null, moveType: null, result: null },
          { moveName: null, moveType: null, result: null },
        ]}
        defenderMoves={[
          { moveName: 'Pollen Puff', moveType: 'BUG', result: null },
          { moveName: null, moveType: null, result: null },
          { moveName: null, moveType: null, result: null },
          { moveName: null, moveType: null, result: null },
        ]}
      />,
    )

    expect(screen.getByTestId('damage-plan-view')).toBeInTheDocument()
    expect(screen.getByTestId('damage-plan-line-sneasler')).toHaveTextContent(
      'Close Combat',
    )
    expect(screen.getByTestId('plan-delta-0')).toHaveTextContent('Δ +3.0%')
    expect(screen.getByTestId('plan-delta-1')).toHaveTextContent('Δ -1.0%')
    expect(screen.getByTestId('damage-plan-line-sneasler')).toHaveTextContent(
      '141–156 HP after step',
    )
  })
})

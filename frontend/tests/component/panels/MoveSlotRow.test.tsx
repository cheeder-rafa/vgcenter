import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MoveSlotRow } from '../../../src/features/calculator/components/MoveSlotRow'

describe('MoveSlotRow', () => {
  it('rendersConsistentGridTemplateAcrossSlots', () => {
    render(
      <MoveSlotRow
        index={0}
        moveId="heat-wave"
        legalMoveIds={['heat-wave']}
        allMoves={[
          {
            id: 'heat-wave',
            name: 'Heat Wave',
            type: 'FIRE',
            category: 'SPECIAL',
            basePower: 95,
            spread: true,
            contact: false,
            doublePowerWhenUserStatused: false,
            ignoreBurnPenaltyWhenUserStatused: false,
          },
        ]}
        result={{
          rolls: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
          min: 10,
          max: 25,
          minPct: 10,
          maxPct: 25,
          koChance: { description: 'Never OHKO', probability: 0, hits: 2 },
        }}
        previousResult={{
          rolls: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
          min: 8,
          max: 23,
          minPct: 8,
          maxPct: 23,
          koChance: { description: 'Never OHKO', probability: 0, hits: 2 },
        }}
        focused={false}
        onMoveChange={vi.fn()}
        onFocus={vi.fn()}
      />,
    )

    // Root is a flex column wrapper; the inner grid row contains the move select
    expect(screen.getByTestId('move-slot-0').className).toContain('flex')
    expect(screen.getByTestId('move-slot-0').className).toContain('px-2.5')
    expect(screen.getByTestId('move-slot-type-0').className).toContain(
      'whitespace-nowrap',
    )
    expect(screen.getByTestId('move-slot-type-0').className).toContain(
      'sm:w-[8ch]',
    )
    expect(screen.getByTestId('move-slot-readout-0').className).toContain(
      'whitespace-nowrap',
    )
    expect(screen.getByTestId('move-slot-readout-0').className).toContain(
      'col-start-2',
    )
    expect(screen.getByTestId('move-slot-delta-0')).toHaveTextContent('Δ')
  })
})

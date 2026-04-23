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
        result={null}
        delta={{
          minPctDelta: 2,
          maxPctDelta: 4,
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
    expect(screen.getByTestId('move-slot-delta-0')).toHaveTextContent(
      '+2.0 / +4.0 pp',
    )
  })
})

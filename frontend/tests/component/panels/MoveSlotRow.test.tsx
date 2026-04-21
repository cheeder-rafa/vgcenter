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
        focused={false}
        onMoveChange={vi.fn()}
        onFocus={vi.fn()}
      />,
    )

    expect(screen.getByTestId('move-slot-0').className).toContain(
      'grid-cols-[auto_minmax(0,1fr)_7.5ch_10ch]',
    )
    expect(screen.getByTestId('move-slot-type-0').className).toContain(
      'whitespace-nowrap',
    )
    expect(screen.getByTestId('move-slot-readout-0').className).toContain(
      'whitespace-nowrap',
    )
  })
})

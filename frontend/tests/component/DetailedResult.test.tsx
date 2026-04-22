import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  copyDamageReport: vi.fn(),
}))

vi.mock('../../src/features/calculator/components/copyDamageReport', () => ({
  copyDamageReport: mocks.copyDamageReport,
}))

import { DetailedResult } from '../../src/features/calculator/components/DetailedResult'

describe('DetailedResult', () => {
  beforeEach(() => {
    mocks.copyDamageReport.mockReset()
    mocks.copyDamageReport.mockResolvedValue(undefined)
  })

  it('doesNotRenderInlineCopiedIndicator', async () => {
    const user = userEvent.setup()

    render(
      <DetailedResult
        focusedSide="attacker"
        focusedIndex={0}
        status="success"
        attackerName="Aegislash-Shield"
        defenderName="Aegislash-Shield"
        moveName="Poltergeist"
        result={{
          rolls: [108, 108, 108, 110, 110, 114, 114, 116, 116, 116, 120, 120, 122, 122, 126, 126],
          min: 108,
          max: 126,
          minPct: 64.6,
          maxPct: 75.4,
          koChance: {
            description: 'guaranteed 2HKO',
            probability: 1,
            hits: 2,
          },
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: /copy damage report/i }))

    await waitFor(() =>
      expect(mocks.copyDamageReport).toHaveBeenCalledWith(
        'Aegislash-Shield Poltergeist vs. Aegislash-Shield: 108-126 (64.6 - 75.4%) -- guaranteed 2HKO',
      ),
    )
    expect(screen.queryByText(/copied damage report/i)).not.toBeInTheDocument()
    expect(screen.getByText(/guaranteed 2hko/i)).toBeInTheDocument()
  })
})

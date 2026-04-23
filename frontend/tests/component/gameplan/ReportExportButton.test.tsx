import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ReportExportButton } from '../../../src/features/gameplan/components/ReportExportButton'
import type { GameplanMatchupCell } from '../../../src/features/gameplan/types/api'

vi.mock('../../../src/features/calculator/components/copyDamageReport', () => ({
  copyDamageReport: vi.fn().mockResolvedValue(undefined),
}))

const { copyDamageReport } =
  await import('../../../src/features/calculator/components/copyDamageReport')

const cell: GameplanMatchupCell = {
  firstOpponentIndex: 0,
  secondOpponentIndex: 1,
  opponentLeadSpeciesIds: ['blastoise', 'venusaur'],
  score: { total: 24, offense: 30, defense: -10, speed: 0, immunity: 4 },
  mineFlags: {
    protect: true,
    redirection: false,
    fakeOut: false,
    priority: false,
    speedControl: 'TAILWIND',
  },
  opponentFlags: {
    protect: true,
    redirection: true,
    fakeOut: true,
    priority: true,
    speedControl: 'TRICK_ROOM',
  },
  outgoing: [],
  incoming: [],
}

describe('ReportExportButton', () => {
  beforeEach(() => {
    vi.mocked(copyDamageReport).mockClear()
  })

  it('copies markdown and JSON with note, tags, legend, heatmap, and forms', async () => {
    const user = userEvent.setup()

    render(
      <ReportExportButton
        cells={[cell]}
        gamePlanNote="Keep Farigiraf healthy."
        opponentArchetypeTag="Trick Room"
        winConditionSpeciesId="farigiraf"
        mineAssumedForms={{ farigiraf: ['mega'] }}
        opponentAssumedForms={{ blastoise: ['mega'] }}
        mineNameById={{ farigiraf: 'Farigiraf' }}
        opponentNameById={{ blastoise: 'Blastoise', venusaur: 'Venusaur' }}
      />,
    )

    await user.click(screen.getByRole('button', { name: /export report/i }))

    await waitFor(() => expect(copyDamageReport).toHaveBeenCalled())
    const copied = vi.mocked(copyDamageReport).mock.calls[0][0]
    expect(copied).toContain('Keep Farigiraf healthy.')
    expect(copied).toContain('Trick Room')
    expect(copied).toContain('Flags legend')
    expect(copied).toContain('| Blastoise + Venusaur | 24 |')
    expect(copied).toContain('"assumedForms"')
    expect(copied).toContain('"farigiraf"')
  })
})

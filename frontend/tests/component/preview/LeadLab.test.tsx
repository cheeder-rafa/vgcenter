import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { LeadLab } from '../../../src/features/preview/components/LeadLab'
import type { LeadEvaluationResult } from '../../../src/features/preview/types'

const DEFAULT_FIELD = {
  field: { weather: 'CLEAR', terrain: 'NONE', room: 'NONE' },
  selectedSide: {
    reflect: false,
    lightScreen: false,
    auroraVeil: false,
    friendGuard: false,
    helpingHand: false,
    tailwind: false,
    protect: false,
  },
  opponentSide: {
    reflect: false,
    lightScreen: false,
    auroraVeil: false,
    friendGuard: false,
    helpingHand: false,
    tailwind: false,
    protect: false,
  },
  criticalHit: false,
  targets: 1,
} as const

describe('LeadLab', () => {
  it('renders compact matrix and drilldown labels', async () => {
    const user = userEvent.setup()
    const result: LeadEvaluationResult = {
      matchups: [
        matchup(['opponent-1', 'opponent-2'], ['Opponent 1', 'Opponent 2']),
        matchup(['opponent-3', 'opponent-4'], ['Opponent 3', 'Opponent 4']),
      ],
    }

    render(
      <MemoryRouter>
        <LeadLab
          selectedLeadIds={['flutter-mane', 'incineroar']}
          onSelectedLeadIdsChange={vi.fn()}
          mine={[
            option('flutter-mane', 'Flutter Mane'),
            option('incineroar', 'Incineroar'),
          ]}
          opponentCount={6}
          result={result}
          status="success"
          onEvaluate={vi.fn()}
          field={DEFAULT_FIELD}
        />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /lead lab/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('grid', { name: /lead matchup matrix/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/ko pressure/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/incoming danger/i).length).toBeGreaterThan(0)

    await user.click(
      screen.getByRole('button', { name: /opponent 3 \+ opponent 4/i }),
    )

    expect(screen.getByText(/cover immediate ko/i)).toBeInTheDocument()
    expect(
      screen.getByText(/moonblast threatens opponent 1/i),
    ).toBeInTheDocument()
  })
})

function option(speciesId: string, speciesName: string) {
  return {
    speciesId,
    speciesName,
    spriteId: speciesId,
  }
}

function matchup(ids: [string, string], names: [string, string]) {
  return {
    opponentLeadIds: ids,
    opponentLeadNames: names,
    koPressure: { label: 'KO pressure', value: 2, tone: 'high' },
    twoHitKoPressure: { label: '2HKO pressure', value: 4, tone: 'high' },
    doubleUpPressure: { label: 'Double-up live', value: 1, tone: 'medium' },
    incomingDanger: { label: 'Incoming danger', value: 1, tone: 'medium' },
    speedComparison: { label: 'Speed control', value: 2, tone: 'high' },
    mustReactLabels: ['Cover immediate KO'],
    turnOneAnnotations: ['Moonblast threatens Opponent 1'],
    outgoingEvidence: [],
    incomingEvidence: [],
  } satisfies LeadEvaluationResult['matchups'][number]
}

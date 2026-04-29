import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ThreatMatrix } from '../../../src/features/matchup/components/ThreatMatrix'
import type { ThreatMatrixResponse } from '../../../src/features/matchup/types'

function makeCell(bestMoveId: string, minPct: number, maxPct: number) {
  return {
    bestMoveId,
    minPct,
    maxPct,
    rolls: Array(16).fill(100),
    koChance: { description: 'guaranteed OHKO', probability: 1.0, hits: 1 },
  }
}

const oneByOneMatrix: ThreatMatrixResponse = {
  deal: [[makeCell('earthquake', 85, 100)]],
  take: [[makeCell('surf', 45, 55)]],
}

const labelsA = ['Garchomp']
const labelsB = ['Milotic']

describe('ThreatMatrix', () => {
  function renderMatrix(direction: 'deal' | 'take' = 'deal') {
    return render(
      <MemoryRouter>
        <ThreatMatrix
          matrix={oneByOneMatrix}
          labelsA={labelsA}
          labelsB={labelsB}
          direction={direction}
          onDirectionChange={vi.fn()}
          regulation="M-A"
          field={{ weather: 'CLEAR', terrain: 'NONE', room: 'NONE' }}
          sideA={{
            reflect: false,
            lightScreen: false,
            auroraVeil: false,
            friendGuard: false,
            helpingHand: false,
            tailwind: false,
            protect: false,
          }}
          sideB={{
            reflect: false,
            lightScreen: false,
            auroraVeil: false,
            friendGuard: false,
            helpingHand: false,
            tailwind: false,
            protect: false,
          }}
        />
      </MemoryRouter>,
    )
  }

  it('renders row and column labels', () => {
    renderMatrix()
    expect(screen.getByText('Garchomp')).toBeInTheDocument()
    expect(screen.getByText('Milotic')).toBeInTheDocument()
  })

  it('shows deal direction cells by default', () => {
    renderMatrix('deal')
    expect(screen.getByText(/earthquake/i)).toBeInTheDocument()
  })

  it('shows take direction cells when toggled', () => {
    renderMatrix('take')
    expect(screen.getByText(/surf/i)).toBeInTheDocument()
  })

  it('calls onDirectionChange when toggle button is clicked', async () => {
    const onDirectionChange = vi.fn()
    render(
      <MemoryRouter>
        <ThreatMatrix
          matrix={oneByOneMatrix}
          labelsA={labelsA}
          labelsB={labelsB}
          direction="deal"
          onDirectionChange={onDirectionChange}
          regulation="M-A"
          field={{ weather: 'CLEAR', terrain: 'NONE', room: 'NONE' }}
          sideA={{
            reflect: false,
            lightScreen: false,
            auroraVeil: false,
            friendGuard: false,
            helpingHand: false,
            tailwind: false,
            protect: false,
          }}
          sideB={{
            reflect: false,
            lightScreen: false,
            auroraVeil: false,
            friendGuard: false,
            helpingHand: false,
            tailwind: false,
            protect: false,
          }}
        />
      </MemoryRouter>,
    )
    await userEvent.setup().click(screen.getByRole('button', { name: /damage i take/i }))
    expect(onDirectionChange).toHaveBeenCalledWith('take')
  })

  it('renders a link for each cell that goes to /calc', () => {
    renderMatrix('deal')
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(links[0]).toHaveAttribute('href', expect.stringContaining('/calc'))
  })
})

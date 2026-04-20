import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ResultPanel } from '../../../src/features/calculator/components/ResultPanel'

describe('ResultPanel', () => {
  it('renders the static placeholder values when no result is present', () => {
    render(<ResultPanel result={null} />)

    expect(screen.getByRole('heading', { name: /result/i })).toBeInTheDocument()
    expect(screen.getByText(/awaiting calculation/i)).toBeInTheDocument()
  })

  it('renders damage range, percentages, and KO chance when a result is supplied', () => {
    render(
      <ResultPanel
        result={{
          rolls: [168, 170, 172, 174, 176, 178, 180, 182, 184, 186, 188, 190, 192, 194, 196, 200],
          min: 168,
          max: 200,
          minPct: 87.0,
          maxPct: 103.6,
          koChance: { description: 'Possible OHKO', probability: 0.6875, hits: 1 },
        }}
      />,
    )

    expect(screen.getByText(/168\s*[–-]\s*200/)).toBeInTheDocument()
    expect(screen.getByText(/87\.0%/)).toBeInTheDocument()
    expect(screen.getByText(/103\.6%/)).toBeInTheDocument()
    expect(screen.getByText(/possible ohko/i)).toBeInTheDocument()
  })
})

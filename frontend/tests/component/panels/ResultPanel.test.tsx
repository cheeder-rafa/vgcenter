import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { ResultPanel } from '../../../src/features/calculator/components/ResultPanel'

function ResultPanelHarness() {
  const [mode, setMode] = useState<'range' | 'rolls'>('range')

  return (
    <ResultPanel
      mode={mode}
      onModeChange={setMode}
      result={{
        rolls: [
          168, 170, 172, 174, 176, 178, 180, 182, 184, 186, 188, 190, 192, 194,
          196, 200,
        ],
        min: 168,
        max: 200,
        minPct: 87.0,
        maxPct: 103.6,
        koChance: {
          description: 'Possible OHKO',
          probability: 0.6875,
          hits: 1,
        },
      }}
      status="success"
      errorMessage={null}
    />
  )
}

describe('ResultPanel', () => {
  it('renders the static placeholder values when no result is present', () => {
    render(
      <ResultPanel
        mode="range"
        onModeChange={() => {}}
        result={null}
        status="idle"
        errorMessage={null}
      />,
    )

    expect(screen.getByRole('heading', { name: /result/i })).toBeInTheDocument()
    expect(screen.getByText(/awaiting calculation/i)).toBeInTheDocument()
  })

  it('renders a compact range view by default and switches to the full 16-roll view', async () => {
    render(<ResultPanelHarness />)
    const user = userEvent.setup()

    expect(screen.getByText(/168\s*[–-]\s*200/)).toBeInTheDocument()
    expect(screen.getAllByText(/87\.0%/)).toHaveLength(2)
    expect(screen.getAllByText(/103\.6%/)).toHaveLength(2)
    expect(screen.getByText(/possible ohko/i)).toBeInTheDocument()
    expect(screen.queryByText(/damage rolls/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /full 16 rolls/i }))

    expect(screen.getByText(/damage rolls/i)).toBeInTheDocument()
    expect(screen.getByText(/^roll 1$/i)).toBeInTheDocument()
    expect(screen.getByText(/^200$/i)).toBeInTheDocument()
  })
})

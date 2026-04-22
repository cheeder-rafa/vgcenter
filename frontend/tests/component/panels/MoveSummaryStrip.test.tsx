import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MoveSummaryStrip } from '../../../src/features/calculator/components/MoveSummaryStrip'
import type { DamageResult } from '../../../src/features/calculator/types/api'

function makeResult(overrides: Partial<DamageResult> = {}): DamageResult {
  return {
    rolls: [100],
    minRoll: 100,
    maxRoll: 100,
    minPct: 50,
    maxPct: 75,
    koChance: 0,
    ...overrides,
  }
}

describe('MoveSummaryStrip', () => {
  it('renders a full-width range fill when maxPct exceeds 100', () => {
    const results = [makeResult({ minPct: 85, maxPct: 103.6 }), null, null, null]
    render(<MoveSummaryStrip results={results} accent="plasma" />)

    const rangeFills = document.querySelectorAll<HTMLElement>('[data-testid="range-fill"]')
    expect(rangeFills).toHaveLength(1)
    expect(rangeFills[0].style.left).toBe('0%')
    expect(rangeFills[0].style.width).toBe('100%')
  })

  it('renders a partial range fill for sub-100% damage', () => {
    const results = [makeResult({ minPct: 45, maxPct: 70 }), null, null, null]
    render(<MoveSummaryStrip results={results} accent="plasma" />)

    const rangeFills = document.querySelectorAll<HTMLElement>('[data-testid="range-fill"]')
    expect(rangeFills).toHaveLength(1)
    expect(rangeFills[0].style.left).toBe('45%')
    expect(rangeFills[0].style.width).toBe('25%')
  })

  it('applies a more vivid track color for lethal results than the accent track', () => {
    const results = [makeResult({ minPct: 85, maxPct: 110 }), null, null, null]
    render(<MoveSummaryStrip results={results} accent="plasma" />)

    const rangeFills = document.querySelectorAll<HTMLElement>('[data-testid="range-fill"]')
    // Vivid fill — opacity > 0.3 to distinguish from the faint 0.18 track
    // Browser may normalize spacing in rgba(), so match flexibly
    const bg = rangeFills[0].style.background
    expect(bg).toMatch(/rgba\(255,\s*75,\s*75/)
    const match = bg.match(/rgba\(255,\s*75,\s*75,\s*([\d.]+)\)/)
    const opacity = match ? parseFloat(match[1]) : 0
    expect(opacity).toBeGreaterThan(0.3)
  })

  it('renders a placeholder slot for a null result with no range fill', () => {
    const results = [null, null, null, null]
    render(<MoveSummaryStrip results={results} accent="plasma" />)

    const rangeFills = document.querySelectorAll('[data-testid="range-fill"]')
    expect(rangeFills).toHaveLength(0)
  })

  it('returns null when all results are null', () => {
    const { container } = render(
      <MoveSummaryStrip results={[null, null, null, null]} accent="cyan" />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders exactly 4 slots for a 4-result array with mixed null/non-null entries', () => {
    const results = [
      makeResult({ minPct: 30, maxPct: 40 }),
      null,
      makeResult({ minPct: 60, maxPct: 80 }),
      null,
    ]
    render(<MoveSummaryStrip results={results} accent="cyan" />)
    const strip = screen.getByLabelText('Move damage summary')
    expect(strip.children).toHaveLength(4)
  })
})

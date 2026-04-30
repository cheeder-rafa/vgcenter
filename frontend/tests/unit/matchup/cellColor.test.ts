import { describe, expect, it } from 'vitest'

import { cellColorClass } from '../../../src/features/matchup/lib/cellColor'

describe('cellColorClass', () => {
  it('returns dim class for zero damage (no damage)', () => {
    const cls = cellColorClass(0, 0)
    expect(cls).toContain('dim')
  })

  it('returns low class for damage under 25%', () => {
    const cls = cellColorClass(20, 24)
    expect(cls).toContain('low')
  })

  it('returns mid class for damage 25-50%', () => {
    const cls = cellColorClass(30, 45)
    expect(cls).toContain('mid')
  })

  it('returns high class for damage 50-75%', () => {
    const cls = cellColorClass(55, 70)
    expect(cls).toContain('high')
  })

  it('returns ko class for damage >= 75%', () => {
    const cls = cellColorClass(75, 100)
    expect(cls).toContain('ko')
  })

  it('returns ohko class for damage >= 100%', () => {
    const cls = cellColorClass(100, 120)
    expect(cls).toContain('ohko')
  })

  it('uses maxPct for threshold classification', () => {
    // maxPct drives the color bucket
    expect(cellColorClass(10, 76)).toContain('ko')
    expect(cellColorClass(10, 49)).toContain('mid')
    expect(cellColorClass(10, 100)).toContain('ohko')
  })
})

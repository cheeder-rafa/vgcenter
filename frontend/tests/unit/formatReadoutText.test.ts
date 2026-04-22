import { describe, expect, it } from 'vitest'

import { formatReadoutText } from '../../src/features/calculator/components/formatReadoutText'
import type { DamageResult } from '../../src/features/calculator/types/api'

const result: DamageResult = {
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
}

describe('formatReadoutText', () => {
  it('rendersGuaranteed2HKO', () => {
    expect(
      formatReadoutText({
        attackerName: 'Aegislash-Shield',
        defenderName: 'Aegislash-Shield',
        moveName: 'Poltergeist',
        result,
      }),
    ).toBe(
      'Aegislash-Shield Poltergeist vs. Aegislash-Shield: 108-126 (64.6 - 75.4%) -- guaranteed 2HKO\n(108, 108, 108, 110, 110, 114, 114, 116, 116, 116, 120, 120, 122, 122, 126, 126)',
    )
  })

  it('rendersPercentChanceToNHKO', () => {
    expect(
      formatReadoutText({
        attackerName: 'Charizard',
        defenderName: 'Milotic',
        moveName: 'Solar Beam',
        result: {
          ...result,
          koChance: {
            description: 'Possible 2HKO',
            probability: 0.3111,
            hits: 2,
          },
        },
      }),
    ).toContain('-- 31.11% chance to 2HKO')
  })

  it('appendsSitrusRecoveryWhenApplicable', () => {
    expect(
      formatReadoutText({
        attackerName: 'Rillaboom',
        defenderName: 'Milotic',
        moveName: 'Wood Hammer',
        result: {
          ...result,
          koChance: {
            description: 'guaranteed 2HKO after Sitrus Berry recovery',
            probability: 1,
            hits: 2,
          },
        },
      }),
    ).toContain('-- guaranteed 2HKO after Sitrus Berry recovery')
  })

  it('falls back to em dashes when the labels are missing', () => {
    expect(
      formatReadoutText({
        attackerName: null,
        defenderName: null,
        moveName: null,
        result,
      }),
    ).toContain('— — vs. —:')
  })

  it('inserts through Protect after the defender name when flagged', () => {
    expect(
      formatReadoutText({
        attackerName: 'Golurk',
        defenderName: 'Excadrill',
        moveName: 'Giga Impact',
        result,
        throughProtect: true,
      }),
    ).toContain('Golurk Giga Impact vs. Excadrill through Protect:')
  })
})

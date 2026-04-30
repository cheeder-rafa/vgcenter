import { describe, expect, it } from 'vitest'

import { classifyReplayFinding } from '../../../src/features/replay/lib/classifyReplayFinding'
import type { TurnReview } from '../../../src/features/replay/types'

function review(overrides: Partial<TurnReview>): TurnReview {
  return {
    turnNumber: 4,
    played: {
      choices: [],
      score: 8,
      expectedDamageDealt: 20,
      expectedDamageTaken: 20,
      expectedKos: 0,
      expectedFaints: 0,
    },
    rankedAlternatives: [],
    delta: 1,
    verdict: 'ACCEPTABLE',
    narrative: 'note',
    ...overrides,
  }
}

describe('classifyReplayFinding', () => {
  it('classifies missed ko', () => {
    expect(
      classifyReplayFinding(
        review({
          delta: 4,
          played: {
            choices: [],
            score: 6,
            expectedDamageDealt: 20,
            expectedDamageTaken: 10,
            expectedKos: 0,
            expectedFaints: 0,
          },
          rankedAlternatives: [
            {
              choices: [],
              score: 12,
              expectedDamageDealt: 50,
              expectedDamageTaken: 10,
              expectedKos: 1,
              expectedFaints: 0,
            },
          ],
        }),
      ),
    ).toBe('missed-ko')
  })

  it('classifies turning point', () => {
    expect(
      classifyReplayFinding(
        review({
          verdict: 'SUBOPTIMAL',
          delta: 4,
        }),
      ),
    ).toBe('turning-point')
  })

  it('classifies risky line', () => {
    expect(
      classifyReplayFinding(
        review({
          played: {
            choices: [],
            score: 8,
            expectedDamageDealt: 20,
            expectedDamageTaken: 55,
            expectedKos: 0,
            expectedFaints: 1,
          },
        }),
      ),
    ).toBe('risky-line')
  })

  it('falls back to adaptation note', () => {
    expect(classifyReplayFinding(review({}))).toBe('adaptation-note')
  })
})

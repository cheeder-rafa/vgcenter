import { describe, expect, it } from 'vitest'

import { classifyAdaptation } from '../../../src/features/preview/lib/bo3Guidance'
import type { GameRecord } from '../../../src/features/preview/types'

function makeGame(overrides: Partial<GameRecord> = {}): GameRecord {
  return {
    gameNumber: 1,
    result: null,
    myLeads: '',
    opponentLeads: '',
    myBrought: '',
    opponentBrought: '',
    scoutedInfo: '',
    unrevealedInfo: '',
    resultNotes: '',
    opponentBehavior: null,
    ...overrides,
  }
}

describe('classifyAdaptation', () => {
  it('returns empty when no completed games', () => {
    const result = classifyAdaptation([makeGame()])
    expect(result.suggestions).toHaveLength(0)
    expect(result.reasoning).toHaveLength(0)
  })

  it('suggests run-it-back after win with opponent running it back', () => {
    const result = classifyAdaptation([
      makeGame({ gameNumber: 1, result: 'win', opponentBehavior: 'ran-it-back' }),
    ])
    expect(result.suggestions).toContain('run-it-back')
  })

  it('suggests change-lead-only after win with opponent adjusted', () => {
    const result = classifyAdaptation([
      makeGame({ gameNumber: 1, result: 'win', opponentBehavior: 'adjusted' }),
    ])
    expect(result.suggestions).toContain('change-lead-only')
  })

  it('suggests change-backline after win with opponent showing new mode', () => {
    const result = classifyAdaptation([
      makeGame({ gameNumber: 1, result: 'win', opponentBehavior: 'new-mode' }),
    ])
    expect(result.suggestions).toContain('change-backline')
  })

  it('defaults to run-it-back after win with no behavior noted', () => {
    const result = classifyAdaptation([
      makeGame({ gameNumber: 1, result: 'win', opponentBehavior: null }),
    ])
    expect(result.suggestions).toContain('run-it-back')
  })

  it('suggests change-lead-only and change-win-condition after loss with opponent running it back', () => {
    const result = classifyAdaptation([
      makeGame({ gameNumber: 1, result: 'loss', opponentBehavior: 'ran-it-back' }),
    ])
    expect(result.suggestions).toContain('change-lead-only')
    expect(result.suggestions).toContain('change-win-condition')
  })

  it('suggests change-backline after loss with opponent adjusted', () => {
    const result = classifyAdaptation([
      makeGame({ gameNumber: 1, result: 'loss', opponentBehavior: 'adjusted' }),
    ])
    expect(result.suggestions).toContain('change-backline')
  })

  it('suggests change-win-condition after loss with opponent showing new mode', () => {
    const result = classifyAdaptation([
      makeGame({ gameNumber: 1, result: 'loss', opponentBehavior: 'new-mode' }),
    ])
    expect(result.suggestions).toContain('change-win-condition')
  })

  it('suggests preserve-unrevealed when unrevealed info is present', () => {
    const result = classifyAdaptation([
      makeGame({ gameNumber: 1, result: 'win', unrevealedInfo: 'Rillaboom' }),
    ])
    expect(result.suggestions).toContain('preserve-unrevealed')
  })

  it('does not suggest preserve-unrevealed when unrevealed info is empty', () => {
    const result = classifyAdaptation([
      makeGame({ gameNumber: 1, result: 'win', unrevealedInfo: '   ' }),
    ])
    expect(result.suggestions).not.toContain('preserve-unrevealed')
  })

  it('suggests calculated-risk when both games are losses', () => {
    const result = classifyAdaptation([
      makeGame({ gameNumber: 1, result: 'loss' }),
      makeGame({ gameNumber: 2, result: 'loss' }),
    ])
    expect(result.suggestions).toContain('calculated-risk')
    expect(result.suggestions).toHaveLength(1)
  })

  it('generates non-empty reasoning for each suggestion', () => {
    const result = classifyAdaptation([
      makeGame({ gameNumber: 1, result: 'loss', opponentBehavior: 'adjusted' }),
    ])
    expect(result.reasoning.length).toBeGreaterThan(0)
    result.reasoning.forEach((r) => expect(r.length).toBeGreaterThan(0))
  })

  it('handles 1-1 tiebreak going into game 3', () => {
    const result = classifyAdaptation([
      makeGame({ gameNumber: 1, result: 'win', opponentBehavior: 'ran-it-back' }),
      makeGame({ gameNumber: 2, result: 'loss', opponentBehavior: 'adjusted' }),
    ])
    expect(result.suggestions.length).toBeGreaterThan(0)
    const allText = result.reasoning.join(' ')
    expect(allText.toLowerCase()).toMatch(/game 3|g3|leverage|unrevealed/)
  })
})

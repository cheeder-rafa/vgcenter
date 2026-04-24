import { describe, expect, it } from 'vitest'

import { exportAsJson, exportAsMarkdown } from '../../../src/features/preview/lib/bo3Export'
import type { AdaptationGuidance, GameRecord } from '../../../src/features/preview/types'

function makeGame(overrides: Partial<GameRecord> = {}): GameRecord {
  return {
    gameNumber: 1,
    result: 'win',
    myLeads: 'Tornadus + Urshifu',
    opponentLeads: 'Rillaboom + Flutter Mane',
    myBrought: 'Tornadus, Urshifu, Iron Hands, Landorus',
    opponentBrought: 'Rillaboom, Flutter Mane, Incineroar, Cresselia',
    scoutedInfo: 'Flutter Mane: Timid / Rillaboom: Choice Band',
    unrevealedInfo: 'Landorus unrevealed',
    resultNotes: 'Urshifu swept after Tornadus set up Tailwind',
    opponentBehavior: 'ran-it-back',
    ...overrides,
  }
}

const guidance: AdaptationGuidance = {
  suggestions: ['run-it-back', 'preserve-unrevealed'],
  reasoning: ['Opponent ran it back.', 'Landorus still hidden.'],
}

describe('exportAsMarkdown', () => {
  it('includes the game number', () => {
    const md = exportAsMarkdown([makeGame()], guidance)
    expect(md).toMatch(/game 1/i)
  })

  it('includes result', () => {
    const md = exportAsMarkdown([makeGame({ result: 'loss' })], null)
    expect(md).toMatch(/loss/i)
  })

  it('includes my leads', () => {
    const md = exportAsMarkdown([makeGame()], guidance)
    expect(md).toContain('Tornadus + Urshifu')
  })

  it('includes scouted info', () => {
    const md = exportAsMarkdown([makeGame()], guidance)
    expect(md).toContain('Flutter Mane: Timid')
  })

  it('includes unrevealed info', () => {
    const md = exportAsMarkdown([makeGame()], guidance)
    expect(md).toContain('Landorus unrevealed')
  })

  it('includes result notes', () => {
    const md = exportAsMarkdown([makeGame()], guidance)
    expect(md).toContain('Tailwind')
  })

  it('includes adaptation suggestions when guidance provided', () => {
    const md = exportAsMarkdown([makeGame()], guidance)
    expect(md).toMatch(/run.it.back/i)
    expect(md).toMatch(/preserve.unrevealed/i)
  })

  it('includes reasoning text', () => {
    const md = exportAsMarkdown([makeGame()], guidance)
    expect(md).toContain('Opponent ran it back.')
  })

  it('omits adaptation guidance section when guidance is null', () => {
    const md = exportAsMarkdown([makeGame()], null)
    expect(md).not.toContain('## Adaptation Guidance')
  })

  it('handles multiple games', () => {
    const md = exportAsMarkdown(
      [makeGame({ gameNumber: 1 }), makeGame({ gameNumber: 2, result: 'loss' })],
      guidance,
    )
    expect(md).toMatch(/game 1/i)
    expect(md).toMatch(/game 2/i)
  })
})

describe('exportAsJson', () => {
  it('is valid JSON', () => {
    const json = exportAsJson([makeGame()], guidance)
    expect(() => JSON.parse(json)).not.toThrow()
  })

  it('includes games array', () => {
    const json = exportAsJson([makeGame()], guidance)
    const parsed = JSON.parse(json) as { games: GameRecord[] }
    expect(Array.isArray(parsed.games)).toBe(true)
    expect(parsed.games).toHaveLength(1)
  })

  it('includes guidance when provided', () => {
    const json = exportAsJson([makeGame()], guidance)
    const parsed = JSON.parse(json) as { guidance: AdaptationGuidance }
    expect(parsed.guidance).toBeDefined()
    expect(parsed.guidance.suggestions).toContain('run-it-back')
  })

  it('sets guidance to null when not provided', () => {
    const json = exportAsJson([makeGame()], null)
    const parsed = JSON.parse(json) as { guidance: null }
    expect(parsed.guidance).toBeNull()
  })

  it('preserves all game fields', () => {
    const game = makeGame({ scoutedInfo: 'Rillaboom: Grassy Glide' })
    const json = exportAsJson([game], null)
    const parsed = JSON.parse(json) as { games: GameRecord[] }
    expect(parsed.games[0].scoutedInfo).toBe('Rillaboom: Grassy Glide')
  })
})

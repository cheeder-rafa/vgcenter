import { describe, expect, it } from 'vitest'

import { parseReplayInputs } from '../../../src/features/replay/lib/parseReplayInputs'

describe('parseReplayInputs', () => {
  it('detects single Reg-MA URL', () => {
    const result = parseReplayInputs(
      'https://replay.pokemonshowdown.com/gen9championsvgc2026regma-2593988469-abc',
    )
    expect(result.mode).toBe('single')
    expect(result.items).toEqual([
      {
        kind: 'url',
        value:
          'https://replay.pokemonshowdown.com/gen9championsvgc2026regma-2593988469-abc',
      },
    ])
    expect(result.errors).toEqual([])
  })

  it('detects BO3 from regmabo3 slug across two URLs', () => {
    const raw = `
      https://replay.pokemonshowdown.com/gen9championsvgc2026regmabo3-2586638266-aaa
      https://replay.pokemonshowdown.com/gen9championsvgc2026regmabo3-2586642583-bbb
    `
    const result = parseReplayInputs(raw)
    expect(result.mode).toBe('bo3')
    expect(result.items).toHaveLength(2)
  })

  it('caps BO3 mode at three URLs', () => {
    const raw = [1, 2, 3, 4]
      .map(
        (i) =>
          `https://replay.pokemonshowdown.com/gen9championsvgc2026regmabo3-${i}-x`,
      )
      .join('\n')
    const result = parseReplayInputs(raw)
    expect(result.mode).toBe('bo3')
    expect(result.items).toHaveLength(3)
    expect(result.errors[0]).toMatch(/at most 3/i)
  })

  it('passes raw protocol log through as a log item', () => {
    const raw = '|player|p1|Foo|\n|move|p1a: Inteleon|Surf|p2a: Test\n|turn|1'
    const result = parseReplayInputs(raw)
    expect(result.mode).toBe('single')
    expect(result.items).toEqual([{ kind: 'log', value: raw }])
  })

  it('rejects empty input', () => {
    const result = parseReplayInputs('   ')
    expect(result.items).toEqual([])
    expect(result.errors).toHaveLength(1)
  })

  it('flags non-Showdown URL', () => {
    const result = parseReplayInputs('https://example.com/foo')
    expect(result.items).toHaveLength(0)
    expect(result.errors[0]).toMatch(/Showdown/i)
  })
})

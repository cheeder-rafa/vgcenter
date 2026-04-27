import { describe, expect, it } from 'vitest'

import { formatDiscordReport } from '../../src/features/calculator/share/exportDiscord'
import type { DamageResult } from '../../src/features/calculator/types/api'

function makeResult(overrides?: Partial<DamageResult>): DamageResult {
  return {
    rolls: [
      100, 102, 104, 104, 106, 106, 108, 108, 110, 110, 112, 114, 116, 118, 120,
      122,
    ],
    min: 100,
    max: 122,
    minPct: 60.2,
    maxPct: 73.5,
    koChance: { description: 'guaranteed 2HKO', probability: 1, hits: 2 },
    ...overrides,
  }
}

const ohkoResult: DamageResult = makeResult({
  minPct: 98.5,
  maxPct: 116.0,
  koChance: { description: 'guaranteed OHKO', probability: 1, hits: 1 },
})

describe('formatDiscordReport', () => {
  it('wraps output in a discord code block', () => {
    const out = formatDiscordReport({
      attackerName: 'Garchomp',
      defenderName: 'Metagross',
      attackerMoves: [
        { moveName: 'Earthquake', moveType: 'Ground', result: ohkoResult },
      ],
      defenderMoves: [],
    })
    expect(out).toContain('```')
    const firstTick = out.indexOf('```')
    const lastTick = out.lastIndexOf('```')
    expect(firstTick).not.toBe(lastTick)
  })

  it('includes bold attacker→defender heading before the code block', () => {
    const out = formatDiscordReport({
      attackerName: 'Garchomp',
      defenderName: 'Metagross',
      attackerMoves: [
        { moveName: 'Earthquake', moveType: 'Ground', result: ohkoResult },
      ],
      defenderMoves: [],
    })
    expect(out).toContain('**Garchomp → Metagross**')
    const boldIdx = out.indexOf('**Garchomp → Metagross**')
    const codeIdx = out.indexOf('```')
    expect(boldIdx).toBeLessThan(codeIdx)
  })

  it('shows attacker move with percent range and ko description', () => {
    const out = formatDiscordReport({
      attackerName: 'Garchomp',
      defenderName: 'Metagross',
      attackerMoves: [
        { moveName: 'Earthquake', moveType: 'Ground', result: ohkoResult },
      ],
      defenderMoves: [],
    })
    expect(out).toContain('Earthquake')
    expect(out).toContain('98.5%')
    expect(out).toContain('116.0%')
    expect(out).toContain('guaranteed OHKO')
  })

  it('shows 16 rolls for attacker move', () => {
    const out = formatDiscordReport({
      attackerName: 'Garchomp',
      defenderName: 'Metagross',
      attackerMoves: [
        { moveName: 'Earthquake', moveType: 'Ground', result: ohkoResult },
      ],
      defenderMoves: [],
    })
    expect(out).toContain(ohkoResult.rolls.join(', '))
  })

  it('attacker-only: no defender section when defender has no results', () => {
    const out = formatDiscordReport({
      attackerName: 'Garchomp',
      defenderName: 'Metagross',
      attackerMoves: [
        { moveName: 'Earthquake', moveType: 'Ground', result: ohkoResult },
      ],
      defenderMoves: [
        { moveName: null, moveType: null, result: null },
        { moveName: 'Meteor Mash', moveType: 'Steel', result: null },
      ],
    })
    expect(out).toContain('Earthquake')
    expect(out).not.toContain('Meteor Mash')
    expect(out).not.toContain('Metagross attacking')
  })

  it('defender-only: shows defender section when only defender has results', () => {
    const result2hko = makeResult()
    const out = formatDiscordReport({
      attackerName: 'Garchomp',
      defenderName: 'Metagross',
      attackerMoves: [
        { moveName: null, moveType: null, result: null },
        { moveName: 'Rock Slide', moveType: 'Rock', result: null },
      ],
      defenderMoves: [
        { moveName: 'Meteor Mash', moveType: 'Steel', result: result2hko },
      ],
    })
    expect(out).toContain('Meteor Mash')
    expect(out).toContain('guaranteed 2HKO')
    expect(out).not.toContain('Garchomp attacking')
    expect(out).not.toContain('Rock Slide')
  })

  it('skips null move slots entirely', () => {
    const out = formatDiscordReport({
      attackerName: 'Garchomp',
      defenderName: 'Metagross',
      attackerMoves: [
        { moveName: 'Earthquake', moveType: 'Ground', result: ohkoResult },
        { moveName: null, moveType: null, result: null },
        { moveName: 'Rock Slide', moveType: 'Rock', result: null },
        { moveName: null, moveType: null, result: null },
      ],
      defenderMoves: [],
    })
    expect(out).toContain('Earthquake')
    expect(out).not.toContain('Rock Slide')
    expect(out).not.toContain('null')
    expect(out).not.toContain('undefined')
  })

  it('handles special characters in species names', () => {
    const out = formatDiscordReport({
      attackerName: "Farfetch'd",
      defenderName: 'Mime Jr.',
      attackerMoves: [
        { moveName: 'Slash', moveType: 'Normal', result: ohkoResult },
      ],
      defenderMoves: [],
    })
    expect(out).toContain("**Farfetch'd → Mime Jr.**")
    expect(out).toContain('Slash')
  })

  it('handles null species names with em dash fallback', () => {
    const out = formatDiscordReport({
      attackerName: null,
      defenderName: null,
      attackerMoves: [
        { moveName: 'Tackle', moveType: 'Normal', result: ohkoResult },
      ],
      defenderMoves: [],
    })
    expect(out).toContain('**— → —**')
  })

  it('includes both attacker and defender sections when both have moves', () => {
    const defResult = makeResult({
      minPct: 45.1,
      maxPct: 53.6,
      koChance: {
        description: '87.5% chance to 2HKO',
        probability: 0.875,
        hits: 2,
      },
    })
    const out = formatDiscordReport({
      attackerName: 'Garchomp',
      defenderName: 'Metagross',
      attackerMoves: [
        { moveName: 'Earthquake', moveType: 'Ground', result: ohkoResult },
      ],
      defenderMoves: [
        { moveName: 'Meteor Mash', moveType: 'Steel', result: defResult },
      ],
    })
    expect(out).toContain('Earthquake')
    expect(out).toContain('Meteor Mash')
    expect(out).toContain('87.5% chance to 2HKO')
  })

  it('returns empty code block when no moves have results', () => {
    const out = formatDiscordReport({
      attackerName: 'Garchomp',
      defenderName: 'Metagross',
      attackerMoves: [{ moveName: null, moveType: null, result: null }],
      defenderMoves: [],
    })
    expect(out).toContain('**Garchomp → Metagross**')
    expect(out).toContain('```')
  })
})

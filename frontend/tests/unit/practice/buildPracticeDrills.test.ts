import { describe, expect, it } from 'vitest'

import { buildPracticeDrills } from '../../../src/features/practice/lib/buildPracticeDrills'
import type { ReplayPrepFinding } from '../../../src/features/prep/store/usePrepNotebookStore'
import type { SavedPokemon } from '../../../src/store/useTeamsStore'

function savedPokemon(name: string, speed: number, attack = 120): SavedPokemon {
  return {
    speciesId: name.toLowerCase(),
    speciesName: name,
    spriteId: name.toLowerCase(),
    natureId: 'serious',
    sp: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    abilityId: null,
    itemId: null,
    status: 'NONE',
    megaActive: false,
    megaFormId: null,
    moves: [
      { moveId: 'protect' },
      { moveId: 'heat-wave' },
      { moveId: null },
      { moveId: null },
    ],
    baseStats: {
      hp: 150,
      attack,
      defense: 100,
      specialAttack: 100,
      specialDefense: 100,
      speed,
    },
    finalStats: {
      hp: 150,
      attack,
      defense: 100,
      specialAttack: 100,
      specialDefense: 100,
      speed,
    },
    types: ['FIRE', null],
    grounded: true,
    currentHp: 150,
  }
}

describe('buildPracticeDrills', () => {
  it('builds all drill types using team, watched threats, meta, and replay findings', () => {
    const replayFindings: ReplayPrepFinding[] = [
      {
        id: 'finding-1',
        type: 'turning-point',
        title: 'Turn 4 swing',
        note: 'Lost board after missing KO line.',
        source: 'https://replay.pokemonshowdown.com/test-1',
        gameNumber: 1,
        turnNumber: 4,
        createdAt: '2026-04-29T10:00:00.000Z',
      },
    ]

    const drills = buildPracticeDrills({
      mine: [savedPokemon('Charizard', 132), savedPokemon('Amoonguss', 30)],
      opponent: [savedPokemon('Dragonite', 145, 204)],
      watchedThreatIds: ['dragonite'],
      replayFindings,
    })

    expect(drills).toHaveLength(3)
    expect(drills.map((drill) => drill.type)).toEqual([
      'survival-check',
      'best-ko-move',
      'safest-lead',
    ])
    drills.forEach((drill) => {
      expect(drill.answer.length).toBeGreaterThan(0)
      expect(drill.explanation).toMatch(/calc/i)
      expect(drill.calcHref).toContain('/calc?s=')
    })
    expect(drills[0]?.prompt).toMatch(/dragonite/i)
    expect(drills[0]?.explanation).toMatch(/turn 4 swing/i)
    expect(drills[1]?.sources.some((source) => /pikalytics/i.test(source))).toBe(
      true,
    )
  })
})

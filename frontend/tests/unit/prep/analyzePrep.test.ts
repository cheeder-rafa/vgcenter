import { describe, expect, it } from 'vitest'

import { analyzePrep } from '../../../src/features/prep/lib/analyzePrep'
import type { SavedPokemon } from '../../../src/store/useTeamsStore'

function pokemon(
  speciesName: string,
  stats: { attack: number; specialAttack: number; speed: number },
  types: [string, string | null],
): SavedPokemon {
  return {
    speciesId: speciesName.toLowerCase().replaceAll(' ', '-'),
    speciesName,
    spriteId: speciesName.toLowerCase().replaceAll(' ', '-'),
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
      { moveId: null },
      { moveId: null },
      { moveId: null },
    ],
    baseStats: {
      hp: 150,
      defense: 100,
      specialDefense: 100,
      ...stats,
    },
    finalStats: {
      hp: 150,
      defense: 100,
      specialDefense: 100,
      ...stats,
    },
    types,
    grounded: true,
    currentHp: 150,
  }
}

describe('analyzePrep', () => {
  it('reports readiness gaps when no teams are saved', () => {
    const report = analyzePrep({
      mine: [null, null, null, null, null, null],
      opponent: [null, null, null, null, null, null],
      watchedThreatIds: [],
    })

    expect(report.readinessLevel).toBe('empty')
    expect(report.nextAction).toMatch(/import your team/i)
    expect(report.prepChecks.length).toBeGreaterThan(0)
  })

  it('summarizes saved teams and ranks opponent threats', () => {
    const report = analyzePrep({
      mine: [
        pokemon('Charizard', { attack: 104, specialAttack: 177, speed: 132 }, [
          'FIRE',
          'FLYING',
        ]),
        pokemon('Amoonguss', { attack: 90, specialAttack: 105, speed: 31 }, [
          'GRASS',
          'POISON',
        ]),
        null,
        null,
        null,
        null,
      ],
      opponent: [
        pokemon('Dragonite', { attack: 204, specialAttack: 110, speed: 145 }, [
          'DRAGON',
          'FLYING',
        ]),
        pokemon('Incineroar', { attack: 160, specialAttack: 90, speed: 80 }, [
          'FIRE',
          'DARK',
        ]),
        null,
        null,
        null,
        null,
      ],
      watchedThreatIds: ['dragonite'],
    })

    expect(report.readinessLevel).toBe('partial')
    expect(report.myCount).toBe(2)
    expect(report.opponentCount).toBe(2)
    expect(report.fastestMine?.speciesName).toBe('Charizard')
    expect(report.threats[0]).toEqual(
      expect.objectContaining({
        speciesName: 'Dragonite',
        watched: true,
      }),
    )
    expect(report.typeTags).toEqual([
      'DARK',
      'DRAGON',
      'FIRE',
      'FLYING',
      'GRASS',
      'POISON',
    ])
    expect(
      report.prepChecks.some((prompt) => prompt.href === '/calc'),
    ).toBe(true)
    expect(report.counterfinder.spreads.length).toBeGreaterThan(0)
    expect(report.counterfinder.techMoves.length).toBeGreaterThan(0)
    expect(report.counterfinder.replacements.length).toBeGreaterThan(0)
    expect(report.counterfinder.spreads[0]?.reason.length).toBeGreaterThan(8)
    expect(report.counterfinder.spreads[0]?.evidence.href).toContain('/calc?s=')
    expect(report.counterfinder.techMoves[0]?.evidence.sourceName).toMatch(
      /pikalytics/i,
    )
    expect(report.counterfinder.replacements[0]?.evidence.sourceName).toMatch(
      /pikalytics/i,
    )
  })
})

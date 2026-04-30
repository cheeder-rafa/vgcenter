import { describe, expect, it } from 'vitest'

import {
  formatReadoutText,
  formatSummaryText,
} from '../../src/features/calculator/components/formatReadoutText'
import type {
  DamageResult,
  Spread,
  StatStages,
} from '../../src/features/calculator/types/api'

const result: DamageResult = {
  rolls: [
    108, 108, 108, 110, 110, 114, 114, 116, 116, 116, 120, 120, 122, 122, 126,
    126,
  ],
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

const zeroSpread: Spread = {
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
}

const zeroStages: StatStages = {
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
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

  it('uses the Mega species prefix in the summary text when mega evolution is active', () => {
    expect(
      formatReadoutText({
        attackerName: 'Charizard',
        defenderName: 'Venusaur',
        moveName: 'Flamethrower',
        result,
        attackerMegaActive: true,
      }),
    ).toContain('Mega Charizard Flamethrower vs. Venusaur:')
  })
})

describe('formatSummaryText', () => {
  it('includes stage and relevant SP context when physical modifiers are active', () => {
    expect(
      formatSummaryText({
        attackerName: 'Sneasler',
        defenderName: 'Absol',
        moveName: 'Close Combat',
        result: {
          rolls: [
            702, 702, 702, 710, 710, 718, 718, 726, 726, 726, 734, 734, 742,
            742, 818, 818,
          ],
          min: 702,
          max: 818,
          minPct: 501.4,
          maxPct: 584.2,
          koChance: {
            description: 'guaranteed OHKO',
            probability: 1,
            hits: 1,
          },
        },
        moveCategory: 'PHYSICAL',
        attackerSp: { ...zeroSpread, atk: 32 },
        defenderSp: zeroSpread,
        attackerNatureId: 'adamant',
        defenderNatureId: 'serious',
        attackerStages: { ...zeroStages, atk: 1 },
        defenderStages: { ...zeroStages, def: -1 },
      }),
    ).toBe(
      '32+ Atk Sneasler (+1 Atk) Close Combat vs. 0 HP / 0 Def Absol (-1 Def): 702-818 (501.4 - 584.2%) -- guaranteed OHKO',
    )
  })

  it('includes special attack and special defense context for special moves', () => {
    expect(
      formatSummaryText({
        attackerName: 'Flutter Mane',
        defenderName: 'Goodra',
        moveName: 'Moonblast',
        result,
        moveCategory: 'SPECIAL',
        attackerSp: { ...zeroSpread, spa: 24 },
        defenderSp: { ...zeroSpread, hp: 12, spd: 20 },
        attackerNatureId: 'modest',
        defenderNatureId: 'calm',
        attackerStages: { ...zeroStages, spa: 2 },
        defenderStages: { ...zeroStages, spd: 1 },
      }),
    ).toContain(
      '24+ SpA Flutter Mane (+2 SpA) Moonblast vs. 12 HP / 20+ SpD Goodra (+1 SpD):',
    )
  })

  it('includes SP and nature context even when stages are neutral', () => {
    expect(
      formatSummaryText({
        attackerName: 'Sneasler',
        defenderName: 'Tyranitar',
        moveName: 'Close Combat',
        result: {
          rolls: [340, 344, 348, 352, 356, 360, 364, 368, 372, 376, 380, 384, 388, 392, 400, 408],
          min: 340,
          max: 408,
          minPct: 165.0,
          maxPct: 198.1,
          koChance: {
            description: 'guaranteed OHKO',
            probability: 1,
            hits: 1,
          },
        },
        moveCategory: 'PHYSICAL',
        attackerSp: { ...zeroSpread, atk: 1 },
        defenderSp: { ...zeroSpread, hp: 31, def: 1 },
        attackerNatureId: 'adamant',
        defenderNatureId: 'serious',
        attackerStages: zeroStages,
        defenderStages: zeroStages,
      }),
    ).toBe(
      '1+ Atk Sneasler Close Combat vs. 31 HP / 1 Def Tyranitar: 340-408 (165.0 - 198.1%) -- guaranteed OHKO',
    )
  })
})

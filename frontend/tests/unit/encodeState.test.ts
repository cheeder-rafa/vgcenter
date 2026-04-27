import { describe, expect, it } from 'vitest'

import { decodeCalcState, encodeCalcState, type ShareableState } from '../../src/features/calculator/share/encodeState'

const MINIMAL_COMBATANT = {
  speciesId: 'incineroar',
  natureId: 'adamant',
  sp: { hp: 4, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  abilityId: 'intimidate',
  itemId: 'assault-vest',
  status: 'NONE' as const,
  megaActive: false,
  megaFormId: null,
  moves: [
    { moveId: 'fake-out' },
    { moveId: 'knock-off' },
    { moveId: null },
    { moveId: null },
  ] as [{ moveId: string | null }, { moveId: string | null }, { moveId: string | null }, { moveId: string | null }],
  baseStats: { hp: 95, attack: 115, defense: 90, specialAttack: 70, specialDefense: 90, speed: 60 },
  finalStats: { hp: 175, attack: 192, defense: 110, specialAttack: 82, specialDefense: 110, speed: 71 },
  types: ['FIRE', 'DARK'] as ['FIRE', 'DARK'],
  grounded: true,
  currentHp: 175,
}

const SAMPLE_STATE: ShareableState = {
  regulation: 'M-A',
  attacker: { ...MINIMAL_COMBATANT },
  defender: { ...MINIMAL_COMBATANT, speciesId: 'flutter-mane', natureId: 'timid' },
  field: { weather: 'SUN', terrain: 'NONE', room: 'NONE' },
  attackerSide: {
    reflect: false,
    lightScreen: false,
    auroraVeil: false,
    friendGuard: false,
    helpingHand: true,
    tailwind: false,
    protect: false,
  },
  defenderSide: {
    reflect: true,
    lightScreen: false,
    auroraVeil: false,
    friendGuard: false,
    helpingHand: false,
    tailwind: false,
    protect: false,
  },
  criticalHit: false,
  targets: 1,
}

describe('encodeCalcState / decodeCalcState', () => {
  it('round-trips a full state', () => {
    const encoded = encodeCalcState(SAMPLE_STATE)
    const decoded = decodeCalcState(encoded)

    expect(decoded).not.toBeNull()
    expect(decoded!.regulation).toBe('M-A')
    expect(decoded!.attacker.speciesId).toBe('incineroar')
    expect(decoded!.defender.speciesId).toBe('flutter-mane')
    expect(decoded!.field.weather).toBe('SUN')
    expect(decoded!.attackerSide.helpingHand).toBe(true)
    expect(decoded!.defenderSide.reflect).toBe(true)
    expect(decoded!.criticalHit).toBe(false)
    expect(decoded!.targets).toBe(1)
  })

  it('strips baseStats and finalStats from encoded payload (they are derived)', () => {
    const encoded = encodeCalcState(SAMPLE_STATE)
    // The raw encoded string should not contain the decoded stats values in plaintext;
    // more importantly, the decoded combatant should have null for both
    const decoded = decodeCalcState(encoded)!
    expect(decoded.attacker.baseStats).toBeNull()
    expect(decoded.attacker.finalStats).toBeNull()
    expect(decoded.defender.baseStats).toBeNull()
    expect(decoded.defender.finalStats).toBeNull()
  })

  it('preserves all SP allocation fields', () => {
    const encoded = encodeCalcState({
      ...SAMPLE_STATE,
      attacker: { ...MINIMAL_COMBATANT, sp: { hp: 4, atk: 20, def: 8, spa: 0, spd: 0, spe: 0 } },
    })
    const decoded = decodeCalcState(encoded)!
    expect(decoded.attacker.sp).toEqual({ hp: 4, atk: 20, def: 8, spa: 0, spd: 0, spe: 0 })
  })

  it('preserves move slots including nulls', () => {
    const encoded = encodeCalcState(SAMPLE_STATE)
    const decoded = decodeCalcState(encoded)!
    expect(decoded.attacker.moves[0]).toEqual({ moveId: 'fake-out' })
    expect(decoded.attacker.moves[2]).toEqual({ moveId: null })
  })

  it('returns null for corrupted input', () => {
    expect(decodeCalcState('not-valid-base64!!!')).toBeNull()
    expect(decodeCalcState('')).toBeNull()
    expect(decodeCalcState('YWJj')).toBeNull() // valid base64 but not our shape
  })

  it('returns null for wrong version', () => {
    // Manually craft a v:0 payload
    const payload = JSON.stringify({ v: 0, reg: 'M-A' })
    const fakeEncoded = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(decodeCalcState(fakeEncoded)).toBeNull()
  })

  it('produces a URL-safe string (no +, /, or = characters)', () => {
    const encoded = encodeCalcState(SAMPLE_STATE)
    expect(encoded).not.toContain('+')
    expect(encoded).not.toContain('/')
    expect(encoded).not.toContain('=')
  })
})

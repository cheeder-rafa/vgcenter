import type { NatureResponse, Stats } from '../types/api'

const NATURE_BOOST = 1.1
const NATURE_DROP = 0.9

export function computeBattleStats(
  baseStats: Stats,
  sp: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number },
  nature: NatureResponse | null,
): Stats {
  const hp = baseStats.hp + sp.hp + 75

  function nonHp(base: number, spValue: number, apiKey: string): number {
    const raw = base + spValue + 20
    if (!nature) return raw
    if (nature.increasedStat?.toUpperCase() === apiKey) return Math.floor(raw * NATURE_BOOST)
    if (nature.decreasedStat?.toUpperCase() === apiKey) return Math.floor(raw * NATURE_DROP)
    return raw
  }

  return {
    hp,
    attack: nonHp(baseStats.attack, sp.atk, 'ATTACK'),
    defense: nonHp(baseStats.defense, sp.def, 'DEFENSE'),
    specialAttack: nonHp(baseStats.specialAttack, sp.spa, 'SPECIAL_ATTACK'),
    specialDefense: nonHp(baseStats.specialDefense, sp.spd, 'SPECIAL_DEFENSE'),
    speed: nonHp(baseStats.speed, sp.spe, 'SPEED'),
  }
}

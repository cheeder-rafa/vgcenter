import { requestJson } from '../../../lib/api-client'
import type { FieldRequest, SideConditions, Spread } from '../types/api'

export type OptimizeDefenseRequest = {
  regulation: string
  defenderSpeciesId: string
  defenderNatureId: string
  defenderAbilityId: string | null
  defenderItemId: string | null
  attackerSpeciesId: string
  attackerNatureId: string
  attackerSp: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
  }
  attackerAbilityId: string | null
  attackerItemId: string | null
  moveId: string
  goal: 'ALWAYS_SURVIVE' | 'SURVIVE_87_5' | 'SURVIVE_FULL_HP'
  field: FieldRequest
  attackerSide: SideConditions
  defenderSide: SideConditions
  criticalHit: boolean
}

export type OptimizeAgainstThreatsGoal =
  | 'WORST_CASE_KO'
  | 'EXPECTED_DAMAGE_SUM'
  | 'SURVIVE_ALL'

export type OptimizeAgainstThreatRequest = {
  attackerSpeciesId: string
  attackerNatureId: string
  attackerSp: OptimizeDefenseRequest['attackerSp']
  attackerAbilityId: string | null
  attackerItemId: string | null
  moveId: string
  attackerMegaActive: boolean
  attackerMegaFormId: string | null
}

export type OptimizeAgainstThreatsRequest = {
  regulation: string
  defender: {
    speciesId: string
    natureId: string
    abilityId: string | null
    itemId: string | null
    megaActive: boolean
    megaFormId: string | null
  }
  threats: OptimizeAgainstThreatRequest[]
  goal: OptimizeAgainstThreatsGoal
  field: FieldRequest
  attackerSide: SideConditions
  defenderSide: SideConditions
  criticalHit: boolean
}

export type DefenseSpreadCandidate = {
  spHp: number
  spDef: number
  spSpd: number
  totalSp: number
  remainingSp: number
  minDamagePct: number
  maxDamagePct: number
  ohkoProbability: number
  nearKoMargin: number
  koChanceDescription: string
  suggestedNatureId: string | null
}

export type OptimizeDefenseResponse = {
  candidates: DefenseSpreadCandidate[]
}

export type OptimizeAgainstThreatResult = {
  attackerSpeciesId: string
  moveId: string
  minDamagePct: number
  maxDamagePct: number
  expectedDamagePct: number
  ohkoProbability: number
  nearKoMargin: number
  koChanceDescription: string
}

export type OptimizeAgainstThreatsResponse = {
  best: DefenseSpreadCandidate | null
  candidates: DefenseSpreadCandidate[]
  threats: OptimizeAgainstThreatResult[]
}

export function optimizeDefense(
  request: OptimizeDefenseRequest,
): Promise<OptimizeDefenseResponse> {
  return requestJson<OptimizeDefenseResponse>('/calc/optimize-defense', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function optimizeAgainstThreats(
  request: OptimizeAgainstThreatsRequest,
): Promise<OptimizeAgainstThreatsResponse> {
  return requestJson<OptimizeAgainstThreatsResponse>(
    '/calc/optimize-against-threats',
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
  )
}

export function spreadToApiSp(
  sp: Spread,
): OptimizeDefenseRequest['attackerSp'] {
  return {
    hp: sp.hp,
    attack: sp.atk,
    defense: sp.def,
    specialAttack: sp.spa,
    specialDefense: sp.spd,
    speed: sp.spe,
  }
}

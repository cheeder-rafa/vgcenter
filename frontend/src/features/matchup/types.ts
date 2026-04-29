import type { FieldRequest, SideConditions } from '../calculator/types/api'

export type KoChance = {
  description: string
  probability: number
  hits: number
}

export type MatrixCell = {
  bestMoveId: string | null
  minPct: number
  maxPct: number
  rolls: number[]
  koChance: KoChance
}

export type ThreatMatrixResponse = {
  deal: MatrixCell[][]
  take: MatrixCell[][]
}

export type ResolvedMoveInput = {
  moveId: string
  move: {
    type: string
    category: string
    basePower: number
    spread: boolean
    contact: boolean
    doublePowerWhenUserStatused: boolean
    ignoreBurnPenaltyWhenUserStatused: boolean
    accuracy?: number
    alwaysCrit?: boolean
  }
}

export type ThreatPokemonInput = {
  combatant: {
    level: number
    stats: {
      hp: number
      attack: number
      defense: number
      specialAttack: number
      specialDefense: number
      speed: number
    }
    types: string[]
    abilityId: string | null
    itemId: string | null
    status: string
    stages: Record<string, number>
    grounded: boolean
    currentHp: number
  }
  moves: ResolvedMoveInput[]
}

export type ThreatMatrixRequest = {
  regulation: string
  teamA: ThreatPokemonInput[]
  teamB: ThreatPokemonInput[]
  field: FieldRequest
  sideA: SideConditions
  sideB: SideConditions
}

export type MatrixDirection = 'deal' | 'take'

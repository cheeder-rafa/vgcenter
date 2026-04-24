import type {
  CombatantRequest,
  FieldRequest,
  MoveRequest,
  Regulation,
  SideConditions,
} from '../calculator/types/api'

export type PreviewPokemon = {
  pokemonId: string
  displayName: string
  combatant: CombatantRequest
  moves: MoveRequest[]
}

export type PreviewField = {
  field: FieldRequest
  selectedSide: SideConditions
  opponentSide: SideConditions
  criticalHit: boolean
  targets: number
}

export type LeadEvaluationRequest = {
  regulation: Regulation
  selectedLeads: [PreviewPokemon, PreviewPokemon]
  opponentTeam: [
    PreviewPokemon,
    PreviewPokemon,
    PreviewPokemon,
    PreviewPokemon,
    PreviewPokemon,
    PreviewPokemon,
  ]
  field: PreviewField
}

export type PreviewMetric = {
  label: string
  value: number
  tone: 'low' | 'medium' | 'high'
}

export type LeadMatchup = {
  opponentLeadIds: [string, string]
  opponentLeadNames: [string, string]
  koPressure: PreviewMetric
  twoHitKoPressure: PreviewMetric
  doubleUpPressure: PreviewMetric
  incomingDanger: PreviewMetric
  speedComparison: PreviewMetric
  mustReactLabels: string[]
  turnOneAnnotations: string[]
}

export type LeadEvaluationResult = {
  matchups: LeadMatchup[]
}

export type LeadOption = {
  speciesId: string
  speciesName: string
  spriteId: string | null
}

export type PlanRecommendation = {
  bringIndices: number[]
  leadIndices: number[]
  summary: string
  modesCovered: string[]
  modesAtRisk: string[]
  winConditionSupported: boolean
  leftOutRationale: string[]
  predictionBurden: 'low' | 'medium' | 'high'
}

export type RecommendPlansResult = {
  plans: PlanRecommendation[]
}

export type RecommendPlansRequest = {
  regulation: string
  myTeam: PreviewPokemon[]
  opponentTeam: PreviewPokemon[]
  winConditionIndex: number | null
  field: PreviewField
}

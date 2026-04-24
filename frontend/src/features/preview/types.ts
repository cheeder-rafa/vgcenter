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
  isMega: boolean
  supportTags: string[]
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
  winConditionRole: 'leading' | 'backline' | 'benched' | 'none'
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

export type GameResult = 'win' | 'loss'

export type OpponentBehavior = 'ran-it-back' | 'adjusted' | 'new-mode'

export type GameRecord = {
  gameNumber: 1 | 2
  result: GameResult | null
  myLeads: string
  opponentLeads: string
  myBrought: string
  opponentBrought: string
  scoutedInfo: string
  unrevealedInfo: string
  resultNotes: string
  opponentBehavior: OpponentBehavior | null
}

export type AdaptationSuggestion =
  | 'run-it-back'
  | 'change-lead-only'
  | 'change-backline'
  | 'change-win-condition'
  | 'preserve-unrevealed'
  | 'calculated-risk'

export type AdaptationGuidance = {
  suggestions: AdaptationSuggestion[]
  reasoning: string[]
}

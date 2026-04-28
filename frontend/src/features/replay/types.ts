export type ReplayBoostState = {
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
  accuracy: number
  evasion: number
}

export type ReplayPokemonState = {
  slotId: string
  speciesName: string
  hpCurrent: number
  hpMax: number
  status: string | null
  fainted: boolean
  boosts: ReplayBoostState
}

export type ReplaySideState = {
  playerName: string
  tailwind: boolean
  reflect: boolean
  lightScreen: boolean
  auroraVeil: boolean
  activePokemon: ReplayPokemonState[]
}

export type ReplayBoardState = {
  weather: string | null
  terrain: string | null
  sideA: ReplaySideState
  sideB: ReplaySideState
}

export type ReplayEvent = {
  type: string
  actorSlotId: string | null
  targetSlotId: string | null
  moveName: string | null
  detail: string | null
}

export type ReplayTurn = {
  number: number
  boardStateAtStart: ReplayBoardState
  events: ReplayEvent[]
}

export type ReplayTimeline = {
  sideAName: string
  sideBName: string
  winner: string | null
  tie: boolean
  turns: ReplayTurn[]
}

export type ReplayMoveChoice = {
  actorSlotId: string
  actorSpeciesName: string
  moveName: string
  targetSlotId: string | null
  targetSpeciesName: string | null
}

export type ReplayDecisionLine = {
  choices: ReplayMoveChoice[]
  score: number
  expectedDamageDealt: number
  expectedDamageTaken: number
  expectedKos: number
  expectedFaints: number
}

export type TurnReview = {
  turnNumber: number
  played: ReplayDecisionLine
  rankedAlternatives: ReplayDecisionLine[]
  delta: number
  verdict: 'OPTIMAL' | 'ACCEPTABLE' | 'SUBOPTIMAL' | string
  narrative: string
}

export type ReplayGameReview = {
  gameNumber: number
  winner: string | null
  turnReviews: TurnReview[]
}

export type ReplayEvaluateResponse = {
  games: ReplayGameReview[]
  adaptationFlags: string[]
}

export type ReplayParseRequest = { url?: string; log?: string }

export type ReplayScoringWeights = {
  damageDealtWeight: number
  damageTakenWeight: number
  koBonus: number
  faintPenalty: number
}

export type ReplayEvaluateRequest = {
  regulation: 'M-A'
  timeline?: ReplayTimeline
  timelines?: ReplayTimeline[]
  objective?: ReplayScoringWeights
  userPlayer?: 'P1' | 'P2'
}

export type ReplayInputMode = 'single' | 'bo3'

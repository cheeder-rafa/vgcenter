import type {
  CalculateDamageResponse,
  CombatantRequest,
  Regulation,
} from '../../calculator/types/api'

export type EvaluateMatchupPokemonRequest = {
  speciesId: string
  combatant: CombatantRequest
  moveIds: [string, string, string, string]
  assumedForms: string[]
}

export type EvaluateMineRequest = {
  lineup: [
    EvaluateMatchupPokemonRequest,
    EvaluateMatchupPokemonRequest,
    EvaluateMatchupPokemonRequest,
    EvaluateMatchupPokemonRequest,
  ]
  winConditionIndex: number | null
}

export type EvaluateMatchupRequest = {
  regulation: Regulation
  mine: EvaluateMineRequest
  opponent: EvaluateMatchupPokemonRequest[]
}

export type GameplanScore = {
  total: number
  offense: number
  defense: number
  speed: number
  immunity: number
}

export type SpeedControl = 'NONE' | 'TAILWIND' | 'TRICK_ROOM'

export type TurnOneFlags = {
  protect: boolean
  redirection: boolean
  fakeOut: boolean
  priority: boolean
  speedControl: SpeedControl
}

export type GameplanDamageOption = {
  attackerIndex: number
  defenderIndex: number
  moveId: string
  damage: CalculateDamageResponse
}

export type GameplanMatchupCell = {
  firstOpponentIndex: number
  secondOpponentIndex: number
  opponentLeadSpeciesIds: string[]
  score: GameplanScore
  mineFlags: TurnOneFlags
  opponentFlags: TurnOneFlags
  outgoing: GameplanDamageOption[]
  incoming: GameplanDamageOption[]
}

export type EvaluateMatchupResponse = {
  cells: GameplanMatchupCell[]
}

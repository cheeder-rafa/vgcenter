export type Regulation = 'M-A'

export type MoveCategory = 'PHYSICAL' | 'SPECIAL'

export type StatusCondition =
  | 'NONE'
  | 'BURN'
  | 'POISON'
  | 'BADLY_POISONED'
  | 'PARALYSIS'
  | 'SLEEP'
  | 'FREEZE'

export type Weather = 'NONE' | 'SUN' | 'RAIN' | 'SAND' | 'SNOW'
export type Terrain = 'NONE' | 'GRASSY' | 'ELECTRIC' | 'MISTY' | 'PSYCHIC'
export type Room = 'NONE' | 'TRICK_ROOM' | 'WONDER_ROOM'

export type StatsRequest = {
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
}

export type CombatantRequest = {
  level: number
  stats: StatsRequest
  types: string[]
  abilityId: string | null
  itemId: string | null
  status: StatusCondition
  grounded: boolean
  fullHp: boolean
}

export type MoveRequest = {
  type: string
  category: MoveCategory
  basePower: number
  spread: boolean
  contact: boolean
  doublePowerWhenUserStatused: boolean
  ignoreBurnPenaltyWhenUserStatused: boolean
}

export type FieldRequest = {
  weather: Weather
  terrain: Terrain
  room: Room
}

export type SideConditions = {
  reflect: boolean
  lightScreen: boolean
  auroraVeil: boolean
  friendGuard: boolean
  helpingHand: boolean
}

export type DamageCalculationRequest = {
  regulation: Regulation
  attacker: CombatantRequest
  defender: CombatantRequest
  move: MoveRequest
  field: FieldRequest
  attackerSide: SideConditions
  defenderSide: SideConditions
  criticalHit: boolean
  targets: number
}

export type KoChance = {
  description: string
  probability: number
  hits: number
}

export type CalculateDamageResponse = {
  rolls: number[]
  min: number
  max: number
  minPct: number
  maxPct: number
  koChance: KoChance
}

export type StatsResponse = StatsRequest

export type MegaFormResponse = {
  id: string
  name: string
  types: string[]
  baseStats: StatsResponse
  abilityId: string
}

export type PokedexEntry = {
  id: string
  name: string
  types: string[]
  baseStats: StatsResponse
  abilityIds: string[]
  moveIds: string[]
  megaForms: MegaFormResponse[]
}

export type NamedDatasetEntry = { id: string; name: string }

export type NatureResponse = {
  id: string
  name: string
  increasedStat: string | null
  decreasedStat: string | null
}

export type ImportedPokemon = {
  speciesId: string
  speciesName: string
  nickname: string | null
  level: number
  gender: string | null
  abilityId: string | null
  itemId: string | null
  natureId: string | null
  sp: StatsResponse
  stats: StatsResponse
  moveIds: string[]
}

export type ImportedTeamResponse = { team: ImportedPokemon[] }

export type ProblemDetails = {
  type?: string
  title?: string
  status?: number
  detail?: string
  [key: string]: unknown
}

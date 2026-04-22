export type Regulation = 'M-A'

export type MoveCategory = 'PHYSICAL' | 'SPECIAL' | 'STATUS'

export type StatusCondition = 'NONE' | 'BURN' | 'POISON' | 'PARALYSIS'

export type Weather = 'CLEAR' | 'SUN' | 'RAIN' | 'SAND' | 'SNOW'
export type Terrain = 'NONE' | 'GRASSY' | 'ELECTRIC' | 'MISTY' | 'PSYCHIC'
export type Room = 'NONE' | 'TRICK' | 'WONDER' | 'MAGIC'

export type Type = string

export type Stats = {
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
}

export type StatsRequest = Stats

export type StatStages = {
  atk: number
  def: number
  spa: number
  spd: number
  spe: number
}

export type CombatantRequest = {
  level: number
  stats: StatsRequest
  types: string[]
  abilityId: string | null
  itemId: string | null
  status: StatusCondition
  stages: StatStages
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
  protect: boolean
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

export type DamageResult = CalculateDamageResponse

export type StatsResponse = Stats

export type Spread = {
  hp: number
  atk: number
  def: number
  spa: number
  spd: number
  spe: number
}

export type MoveSlot = {
  moveId: string | null
}

export type MoveDefinition = {
  id: string
  name: string
  type: string
  category: MoveCategory
  basePower: number
  spread: boolean
  contact: boolean
  doublePowerWhenUserStatused: boolean
  ignoreBurnPenaltyWhenUserStatused: boolean
}

export type BuildStatsRequest = {
  speciesId: string
  sp: Spread
  natureId: string
  megaActive: boolean
  megaFormId: string | null
}

export type BuildStatsResponse = {
  baseStats: StatsResponse
  finalStats: StatsResponse
}

export type CombatantBuild = {
  speciesId: string | null
  natureId: string
  sp: Spread
  stages: StatStages
  abilityId: string | null
  itemId: string | null
  status: StatusCondition
  megaActive: boolean
  megaFormId: string | null
  moves: [MoveSlot, MoveSlot, MoveSlot, MoveSlot]
  baseStats: Stats | null
  finalStats: Stats | null
  types: [Type, Type | null] | null
  grounded: boolean
  fullHp: boolean
}

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
  imageUrl: string
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

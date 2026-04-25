export type SpeedTierEntry = {
  speciesId: string
  speciesName: string
  spSpeed: number
  natureId: string
}

export type SpeedTierModifiers = {
  tailwind: boolean
  trickRoom: boolean
  paralysis: boolean
  choiceScarf: boolean
  stages: number
}

export type SpeedTiersRequest = {
  regulation: string
  userTeam: SpeedTierEntry[]
  modifiers: SpeedTierModifiers
}

export type SpeedTierRow = {
  speciesId: string
  speciesName: string
  finalSpeed: number
  userTeam: boolean
}

export type SpeedTiersResponse = {
  rows: SpeedTierRow[]
}

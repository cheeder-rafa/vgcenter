import { create } from 'zustand'

import { fetchMoves, fetchPokedex } from '../../calculator/api/datasetApi'
import type {
  CombatantBuild,
  FieldRequest,
  ImportedPokemon,
  MoveDefinition,
  PokedexEntry,
  SideConditions,
} from '../../calculator/types/api'
import { toCombatantBuild } from '../../importer/importedTeamMapping'
import { importPokepaste, importShowdown } from '../../calculator/api/importApi'
import { validatePokepasteUrl } from '../../importer/validatePokepasteUrl'
import { buildThreatMatrix } from '../api/matchupApi'
import { toThreatPokemonInput } from '../lib/buildInputs'
import type { MatrixDirection, ThreatMatrixResponse } from '../types'

type Status =
  | 'idle'
  | 'importing-a'
  | 'importing-b'
  | 'computing'
  | 'ready'
  | 'error'

const DEFAULT_FIELD: FieldRequest = { weather: 'CLEAR', terrain: 'NONE', room: 'NONE' }
const DEFAULT_SIDE: SideConditions = {
  reflect: false,
  lightScreen: false,
  auroraVeil: false,
  friendGuard: false,
  helpingHand: false,
  tailwind: false,
  protect: false,
}

type MatchupState = {
  rawA: string
  rawB: string
  teamA: ImportedPokemon[] | null
  teamB: ImportedPokemon[] | null
  buildsA: CombatantBuild[] | null
  buildsB: CombatantBuild[] | null
  labelsA: string[]
  labelsB: string[]
  result: ThreatMatrixResponse | null
  direction: MatrixDirection
  status: Status
  errorMessage: string | null
  field: FieldRequest
  sideA: SideConditions
  sideB: SideConditions

  setRawA: (v: string) => void
  setRawB: (v: string) => void
  importTeamA: () => Promise<void>
  importTeamB: () => Promise<void>
  compute: () => Promise<void>
  setDirection: (d: MatrixDirection) => void
  reset: () => void
}

let cachedMoves: MoveDefinition[] | null = null
let cachedPokedex: PokedexEntry[] | null = null

function looksLikeUrl(text: string): boolean {
  return /^https?:\/\//i.test(text.trim())
}

async function importFromRawInput(raw: string) {
  const normalized = raw.trim()
  const urlError = validatePokepasteUrl(normalized)
  if (urlError === null) {
    return importPokepaste(normalized)
  }
  if (looksLikeUrl(normalized) && normalized.toLowerCase().includes('pokepast.es')) {
    throw new Error(urlError)
  }
  return importShowdown(raw)
}

async function getDataset(): Promise<{
  moveMap: Map<string, MoveDefinition>
  pokedexMap: Map<string, PokedexEntry>
}> {
  const [moves, pokedex] = await Promise.all([
    cachedMoves ? Promise.resolve(cachedMoves) : fetchMoves('M-A'),
    cachedPokedex ? Promise.resolve(cachedPokedex) : fetchPokedex('M-A'),
  ])
  cachedMoves = moves
  cachedPokedex = pokedex
  return {
    moveMap: new Map(moves.map((m) => [m.id, m])),
    pokedexMap: new Map(pokedex.map((p) => [p.id, p])),
  }
}

export const useMatchupStore = create<MatchupState>((set, get) => ({
  rawA: '',
  rawB: '',
  teamA: null,
  teamB: null,
  buildsA: null,
  buildsB: null,
  labelsA: [],
  labelsB: [],
  result: null,
  direction: 'deal',
  status: 'idle',
  errorMessage: null,
  field: DEFAULT_FIELD,
  sideA: DEFAULT_SIDE,
  sideB: DEFAULT_SIDE,

  setRawA: (v) => set({ rawA: v }),
  setRawB: (v) => set({ rawB: v }),

  importTeamA: async () => {
    const { rawA } = get()
    if (!rawA.trim()) return
    set({ status: 'importing-a', errorMessage: null })
    try {
      const { team } = await importFromRawInput(rawA)
      set({
        teamA: team,
        labelsA: team.map((p) => p.speciesName),
        status: 'idle',
      })
    } catch (e) {
      set({ status: 'error', errorMessage: (e as Error).message })
    }
  },

  importTeamB: async () => {
    const { rawB } = get()
    if (!rawB.trim()) return
    set({ status: 'importing-b', errorMessage: null })
    try {
      const { team } = await importFromRawInput(rawB)
      set({
        teamB: team,
        labelsB: team.map((p) => p.speciesName),
        status: 'idle',
      })
    } catch (e) {
      set({ status: 'error', errorMessage: (e as Error).message })
    }
  },

  compute: async () => {
    const { teamA, teamB, field, sideA, sideB } = get()
    if (!teamA || !teamB) return
    set({ status: 'computing', errorMessage: null, result: null })
    try {
      const { moveMap, pokedexMap } = await getDataset()

      const inputA = teamA.map((p) => toThreatPokemonInput(p, pokedexMap, moveMap))
      const inputB = teamB.map((p) => toThreatPokemonInput(p, pokedexMap, moveMap))
      const buildsA = teamA.map((p) => toCombatantBuild(p, pokedexMap.get(p.speciesId)))
      const buildsB = teamB.map((p) => toCombatantBuild(p, pokedexMap.get(p.speciesId)))

      const result = await buildThreatMatrix({
        regulation: 'M-A',
        teamA: inputA,
        teamB: inputB,
        field,
        sideA,
        sideB,
      })

      set({ result, buildsA, buildsB, status: 'ready' })
    } catch (e) {
      set({ status: 'error', errorMessage: (e as Error).message })
    }
  },

  setDirection: (d) => set({ direction: d }),

  reset: () =>
    set({
      rawA: '',
      rawB: '',
      teamA: null,
      teamB: null,
      buildsA: null,
      buildsB: null,
      labelsA: [],
      labelsB: [],
      result: null,
      direction: 'deal',
      status: 'idle',
      errorMessage: null,
    }),
}))

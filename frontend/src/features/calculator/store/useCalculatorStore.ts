import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

import type {
  CombatantBuild,
  DamageCalculationRequest,
  DamageResult,
  FieldRequest,
  MoveDefinition,
  MoveRequest,
  Regulation,
  SideConditions,
  Spread,
  StatStages,
  Stats,
} from '../types/api'

export type CalculatorSide = 'attacker' | 'defender'

type CombatantBuildPatch = Partial<
  Omit<CombatantBuild, 'sp' | 'stages' | 'baseStats' | 'finalStats'>
> & {
  sp?: Partial<Spread>
  stages?: Partial<StatStages>
  baseStats?: Partial<Stats> | null
  finalStats?: Partial<Stats> | null
}

type DamageResults = {
  attackerMoves: [
    DamageResult | null,
    DamageResult | null,
    DamageResult | null,
    DamageResult | null,
  ]
  defenderMoves: [
    DamageResult | null,
    DamageResult | null,
    DamageResult | null,
    DamageResult | null,
  ]
}

type ResultsStatus = 'idle' | 'loading' | 'success' | 'error'

const defaultAttackerStats: Stats = {
  hp: 175,
  attack: 160,
  defense: 110,
  specialAttack: 110,
  specialDefense: 110,
  speed: 110,
}

const defaultDefenderStats: Stats = {
  hp: 180,
  attack: 110,
  defense: 120,
  specialAttack: 110,
  specialDefense: 120,
  speed: 100,
}

const defaultField: FieldRequest = {
  weather: 'CLEAR',
  terrain: 'NONE',
  room: 'NONE',
}

const defaultSide: SideConditions = {
  reflect: false,
  lightScreen: false,
  auroraVeil: false,
  friendGuard: false,
  helpingHand: false,
  tailwind: false,
  protect: false,
}

const defaultSpread: Spread = {
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
}

const defaultStages: StatStages = {
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
}

const defaultMoveSlots: CombatantBuild['moves'] = [
  { moveId: null },
  { moveId: null },
  { moveId: null },
  { moveId: null },
]

function createDefaultCombatant(stats: Stats): CombatantBuild {
  return {
    speciesId: null,
    natureId: 'serious',
    sp: { ...defaultSpread },
    stages: { ...defaultStages },
    abilityId: null,
    itemId: null,
    status: 'NONE',
    megaActive: false,
    megaFormId: null,
    moves: cloneMoveSlots(defaultMoveSlots),
    baseStats: { ...stats },
    finalStats: { ...stats },
    types: ['NORMAL', null],
    grounded: true,
    currentHp: stats.hp,
  }
}

function createEmptyResults(): DamageResults {
  return {
    attackerMoves: [null, null, null, null],
    defenderMoves: [null, null, null, null],
  }
}

function createEmptyMoveSlots(): CombatantBuild['moves'] {
  return cloneMoveSlots(defaultMoveSlots)
}

function createEmptySideResults(): DamageResults['attackerMoves'] {
  return [null, null, null, null]
}

function cloneMoveSlots(
  moves: CombatantBuild['moves'],
): CombatantBuild['moves'] {
  return moves.map((move) => ({ ...move })) as CombatantBuild['moves']
}

function mergeStats(
  current: Stats | null,
  patch: Partial<Stats> | null | undefined,
) {
  if (patch === undefined) {
    return current
  }
  if (patch === null) {
    return null
  }
  return current === null ? ({ ...patch } as Stats) : { ...current, ...patch }
}

function mergeCombatant(
  current: CombatantBuild,
  patch: CombatantBuildPatch,
): CombatantBuild {
  const nextBaseStats = mergeStats(current.baseStats, patch.baseStats)
  const nextFinalStats = mergeStats(current.finalStats, patch.finalStats)
  const nextMaxHp = nextFinalStats?.hp ?? nextBaseStats?.hp ?? null
  const requestedCurrentHp = patch.currentHp ?? current.currentHp

  return {
    ...current,
    ...patch,
    sp: patch.sp ? { ...current.sp, ...patch.sp } : current.sp,
    stages: patch.stages
      ? { ...current.stages, ...patch.stages }
      : current.stages,
    moves: patch.moves ? cloneMoveSlots(patch.moves) : current.moves,
    baseStats: nextBaseStats,
    finalStats: nextFinalStats,
    currentHp:
      nextMaxHp === null
        ? requestedCurrentHp
        : Math.max(1, Math.min(requestedCurrentHp, nextMaxHp)),
  }
}

function compactTypes(types: CombatantBuild['types']): string[] {
  if (types === null) {
    return []
  }
  return types.filter((value): value is string => value !== null)
}

type CalculatorState = {
  regulation: Regulation
  attacker: CombatantBuild
  defender: CombatantBuild
  moveCatalog: MoveDefinition[]
  moveCatalogVersion: number
  field: FieldRequest
  attackerSide: SideConditions
  defenderSide: SideConditions
  criticalHit: boolean
  targets: number
  results: DamageResults
  resultsStatus: ResultsStatus
  setRegulation: (regulation: Regulation) => void
  setAttacker: (patch: CombatantBuildPatch) => void
  setDefender: (patch: CombatantBuildPatch) => void
  setMoveCatalog: (moves: MoveDefinition[]) => void
  setCombatantDerived: (
    side: CalculatorSide,
    patch: Pick<
      CombatantBuildPatch,
      'baseStats' | 'finalStats' | 'types' | 'currentHp'
    >,
  ) => void
  setField: (patch: Partial<FieldRequest>) => void
  setAttackerSide: (patch: Partial<SideConditions>) => void
  setDefenderSide: (patch: Partial<SideConditions>) => void
  setTargets: (targets: number) => void
  setMoveSlot: (
    side: CalculatorSide,
    index: number,
    moveId: string | null,
  ) => void
  clearSideMovesAndResults: (side: CalculatorSide) => void
  setResult: (
    side: CalculatorSide,
    index: number,
    result: DamageResult | null,
  ) => void
  setResults: (results: DamageResults) => void
  clearResults: () => void
  setResultsStatus: (status: ResultsStatus) => void
  toggleCriticalHit: () => void
  applyDefensiveSpread: (spHp: number, spDef: number, spSpd: number) => void
  reset: () => void
}

function createInitialState() {
  return {
    regulation: 'M-A' as Regulation,
    attacker: createDefaultCombatant(defaultAttackerStats),
    defender: createDefaultCombatant(defaultDefenderStats),
    moveCatalog: [],
    moveCatalogVersion: 0,
    field: { ...defaultField },
    attackerSide: { ...defaultSide },
    defenderSide: { ...defaultSide },
    criticalHit: false,
    targets: 1,
    results: createEmptyResults(),
    resultsStatus: 'idle' as ResultsStatus,
  }
}

export const useCalculatorStore = create<CalculatorState>()(
  subscribeWithSelector((set) => ({
    ...createInitialState(),
    setRegulation: (regulation) => set({ regulation }),
    setAttacker: (patch) =>
      set((state) => ({ attacker: mergeCombatant(state.attacker, patch) })),
    setDefender: (patch) =>
      set((state) => ({ defender: mergeCombatant(state.defender, patch) })),
    setMoveCatalog: (moveCatalog) =>
      set((state) => ({
        moveCatalog,
        moveCatalogVersion: state.moveCatalogVersion + 1,
      })),
    setCombatantDerived: (side, patch) =>
      set((state) => ({
        [side]: mergeCombatant(state[side], patch),
      })),
    setField: (patch) =>
      set((state) => ({ field: { ...state.field, ...patch } })),
    setAttackerSide: (patch) =>
      set((state) => ({ attackerSide: { ...state.attackerSide, ...patch } })),
    setDefenderSide: (patch) =>
      set((state) => ({ defenderSide: { ...state.defenderSide, ...patch } })),
    setTargets: (targets) => set({ targets }),
    setMoveSlot: (side, index, moveId) =>
      set((state) => {
        const moves = cloneMoveSlots(state[side].moves)
        moves[index] = { moveId }
        return { [side]: { ...state[side], moves } }
      }),
    clearSideMovesAndResults: (side) =>
      set((state) => {
        const resultKey =
          side === 'attacker' ? 'attackerMoves' : 'defenderMoves'

        return {
          [side]: {
            ...state[side],
            moves: createEmptyMoveSlots(),
          },
          results: {
            ...state.results,
            [resultKey]: createEmptySideResults(),
          },
        }
      }),
    setResult: (side, index, result) =>
      set((state) => {
        const key = side === 'attacker' ? 'attackerMoves' : 'defenderMoves'
        const moves = [...state.results[key]] as DamageResults[typeof key]
        moves[index] = result
        return {
          results: {
            ...state.results,
            [key]: moves,
          },
        }
      }),
    setResults: (results) => set({ results }),
    clearResults: () => set({ results: createEmptyResults() }),
    setResultsStatus: (resultsStatus) => set({ resultsStatus }),
    toggleCriticalHit: () =>
      set((state) => ({ criticalHit: !state.criticalHit })),
    applyDefensiveSpread: (spHp, spDef, spSpd) =>
      set((state) => ({
        defender: {
          ...state.defender,
          sp: { ...state.defender.sp, hp: spHp, def: spDef, spd: spSpd },
        },
      })),
    reset: () => set({ ...createInitialState() }),
  })),
)

export function selectDamageRequestFor(
  state: CalculatorState,
  side: CalculatorSide,
  moveIndex: number,
): DamageCalculationRequest | null {
  const attackerSideKey: CalculatorSide = side
  const defenderSideKey: CalculatorSide =
    side === 'attacker' ? 'defender' : 'attacker'
  const attacker = state[attackerSideKey]
  const defender = state[defenderSideKey]

  const moveId = attacker.moves[moveIndex]?.moveId

  if (
    attacker.finalStats === null ||
    defender.finalStats === null ||
    attacker.types === null ||
    defender.types === null ||
    moveId === null
  ) {
    return null
  }

  const move = state.moveCatalog.find((entry) => entry.id === moveId)
  if (move === undefined || move.category === 'STATUS' || move.basePower <= 0) {
    return null
  }

  return {
    regulation: state.regulation,
    attacker: {
      level: 50,
      stats: attacker.finalStats,
      types: compactTypes(attacker.types),
      abilityId: attacker.abilityId,
      itemId: attacker.itemId,
      status: attacker.status,
      stages: attacker.stages,
      grounded: attacker.grounded,
      currentHp: attacker.currentHp,
    },
    defender: {
      level: 50,
      stats: defender.finalStats,
      types: compactTypes(defender.types),
      abilityId: defender.abilityId,
      itemId: defender.itemId,
      status: defender.status,
      stages: defender.stages,
      grounded: defender.grounded,
      currentHp: defender.currentHp,
    },
    move: toMoveRequest(move),
    field: state.field,
    attackerSide: side === 'attacker' ? state.attackerSide : state.defenderSide,
    defenderSide: side === 'attacker' ? state.defenderSide : state.attackerSide,
    criticalHit: state.criticalHit,
    targets: state.targets,
  }
}

function toMoveRequest(move: MoveDefinition): MoveRequest {
  return {
    type: move.type,
    category: move.category,
    basePower: move.basePower,
    spread: move.spread,
    contact: move.contact,
    doublePowerWhenUserStatused: move.doublePowerWhenUserStatused,
    ignoreBurnPenaltyWhenUserStatused: move.ignoreBurnPenaltyWhenUserStatused,
  }
}

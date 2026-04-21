import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

import type {
  CombatantBuild,
  DamageCalculationRequest,
  DamageResult,
  FieldRequest,
  MoveRequest,
  Regulation,
  SideConditions,
  Spread,
  Stats,
} from '../types/api'

export type CalculatorSide = 'attacker' | 'defender'

type CombatantBuildPatch = Partial<Omit<CombatantBuild, 'sp' | 'baseStats' | 'finalStats'>> & {
  sp?: Partial<Spread>
  baseStats?: Partial<Stats> | null
  finalStats?: Partial<Stats> | null
}

type DamageResults = {
  attackerMoves: [DamageResult | null, DamageResult | null, DamageResult | null, DamageResult | null]
  defenderMoves: [DamageResult | null, DamageResult | null, DamageResult | null, DamageResult | null]
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

const defaultMove: MoveRequest = {
  type: 'NORMAL',
  category: 'PHYSICAL',
  basePower: 80,
  spread: false,
  contact: true,
  doublePowerWhenUserStatused: false,
  ignoreBurnPenaltyWhenUserStatused: false,
}

const defaultField: FieldRequest = { weather: 'NONE', terrain: 'NONE', room: 'NONE' }

const defaultSide: SideConditions = {
  reflect: false,
  lightScreen: false,
  auroraVeil: false,
  friendGuard: false,
  helpingHand: false,
}

const defaultSpread: Spread = {
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
}

const defaultMoveSlots: CombatantBuild['moves'] = [
  { moveId: 'manual' },
  { moveId: null },
  { moveId: null },
  { moveId: null },
]

function createDefaultCombatant(stats: Stats): CombatantBuild {
  return {
    speciesId: null,
    natureId: 'serious',
    sp: { ...defaultSpread },
    abilityId: null,
    itemId: null,
    status: 'NONE',
    megaActive: false,
    moves: cloneMoveSlots(defaultMoveSlots),
    baseStats: { ...stats },
    finalStats: { ...stats },
    types: ['NORMAL', null],
    grounded: true,
    fullHp: true,
  }
}

function createEmptyResults(): DamageResults {
  return {
    attackerMoves: [null, null, null, null],
    defenderMoves: [null, null, null, null],
  }
}

function cloneMoveSlots(moves: CombatantBuild['moves']): CombatantBuild['moves'] {
  return moves.map((move) => ({ ...move })) as CombatantBuild['moves']
}

function mergeStats(current: Stats | null, patch: Partial<Stats> | null | undefined) {
  if (patch === undefined) {
    return current
  }
  if (patch === null) {
    return null
  }
  return current === null ? ({ ...patch } as Stats) : { ...current, ...patch }
}

function mergeCombatant(current: CombatantBuild, patch: CombatantBuildPatch): CombatantBuild {
  return {
    ...current,
    ...patch,
    sp: patch.sp ? { ...current.sp, ...patch.sp } : current.sp,
    moves: patch.moves ? cloneMoveSlots(patch.moves) : current.moves,
    baseStats: mergeStats(current.baseStats, patch.baseStats),
    finalStats: mergeStats(current.finalStats, patch.finalStats),
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
  move: MoveRequest
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
  setCombatantDerived: (
    side: CalculatorSide,
    patch: Pick<CombatantBuildPatch, 'baseStats' | 'finalStats' | 'types'>,
  ) => void
  setMove: (patch: Partial<MoveRequest>) => void
  setField: (patch: Partial<FieldRequest>) => void
  setAttackerSide: (patch: Partial<SideConditions>) => void
  setDefenderSide: (patch: Partial<SideConditions>) => void
  setTargets: (targets: number) => void
  setMoveSlot: (side: CalculatorSide, index: number, moveId: string | null) => void
  setResult: (side: CalculatorSide, index: number, result: DamageResult | null) => void
  setResults: (results: DamageResults) => void
  clearResults: () => void
  setResultsStatus: (status: ResultsStatus) => void
  toggleCriticalHit: () => void
  reset: () => void
}

function createInitialState() {
  return {
    regulation: 'M-A' as Regulation,
    attacker: createDefaultCombatant(defaultAttackerStats),
    defender: createDefaultCombatant(defaultDefenderStats),
    move: { ...defaultMove },
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
    setAttacker: (patch) => set((state) => ({ attacker: mergeCombatant(state.attacker, patch) })),
    setDefender: (patch) => set((state) => ({ defender: mergeCombatant(state.defender, patch) })),
    setCombatantDerived: (side, patch) =>
      set((state) => ({
        [side]: mergeCombatant(state[side], patch),
      })),
    setMove: (patch) => set((state) => ({ move: { ...state.move, ...patch } })),
    setField: (patch) => set((state) => ({ field: { ...state.field, ...patch } })),
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
    toggleCriticalHit: () => set((state) => ({ criticalHit: !state.criticalHit })),
    reset: () => set({ ...createInitialState() }),
  })),
)

export function selectDamageRequestFor(
  state: CalculatorState,
  side: CalculatorSide,
  moveIndex: number,
): DamageCalculationRequest | null {
  const attackerSideKey: CalculatorSide = side
  const defenderSideKey: CalculatorSide = side === 'attacker' ? 'defender' : 'attacker'
  const attacker = state[attackerSideKey]
  const defender = state[defenderSideKey]

  if (
    attacker.finalStats === null ||
    defender.finalStats === null ||
    attacker.types === null ||
    defender.types === null ||
    attacker.moves[moveIndex]?.moveId === null
  ) {
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
      grounded: attacker.grounded,
      fullHp: attacker.fullHp,
    },
    defender: {
      level: 50,
      stats: defender.finalStats,
      types: compactTypes(defender.types),
      abilityId: defender.abilityId,
      itemId: defender.itemId,
      status: defender.status,
      grounded: defender.grounded,
      fullHp: defender.fullHp,
    },
    move: state.move,
    field: state.field,
    attackerSide: side === 'attacker' ? state.attackerSide : state.defenderSide,
    defenderSide: side === 'attacker' ? state.defenderSide : state.attackerSide,
    criticalHit: state.criticalHit,
    targets: state.targets,
  }
}

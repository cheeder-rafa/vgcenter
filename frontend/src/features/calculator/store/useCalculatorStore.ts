import { create } from 'zustand'

import type {
  CombatantRequest,
  DamageCalculationRequest,
  FieldRequest,
  MoveRequest,
  Regulation,
  SideConditions,
} from '../types/api'

const defaultAttacker: CombatantRequest = {
  level: 50,
  stats: { hp: 175, attack: 160, defense: 110, specialAttack: 110, specialDefense: 110, speed: 110 },
  types: ['NORMAL'],
  abilityId: null,
  itemId: null,
  status: 'NONE',
  grounded: true,
  fullHp: true,
}

const defaultDefender: CombatantRequest = {
  level: 50,
  stats: { hp: 180, attack: 110, defense: 120, specialAttack: 110, specialDefense: 120, speed: 100 },
  types: ['NORMAL'],
  abilityId: null,
  itemId: null,
  status: 'NONE',
  grounded: true,
  fullHp: true,
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

type CalculatorState = {
  regulation: Regulation
  attacker: CombatantRequest
  defender: CombatantRequest
  move: MoveRequest
  field: FieldRequest
  attackerSide: SideConditions
  defenderSide: SideConditions
  criticalHit: boolean
  targets: number
  setRegulation: (regulation: Regulation) => void
  setAttacker: (patch: Partial<CombatantRequest>) => void
  setDefender: (patch: Partial<CombatantRequest>) => void
  setMove: (patch: Partial<MoveRequest>) => void
  setField: (patch: Partial<FieldRequest>) => void
  setAttackerSide: (patch: Partial<SideConditions>) => void
  setDefenderSide: (patch: Partial<SideConditions>) => void
  setTargets: (targets: number) => void
  toggleCriticalHit: () => void
  reset: () => void
}

const initialState = {
  regulation: 'M-A' as Regulation,
  attacker: defaultAttacker,
  defender: defaultDefender,
  move: defaultMove,
  field: defaultField,
  attackerSide: defaultSide,
  defenderSide: defaultSide,
  criticalHit: false,
  targets: 1,
}

export const useCalculatorStore = create<CalculatorState>((set) => ({
  ...initialState,
  setRegulation: (regulation) => set({ regulation }),
  setAttacker: (patch) =>
    set((state) => ({
      attacker: {
        ...state.attacker,
        ...patch,
        stats: patch.stats ? { ...state.attacker.stats, ...patch.stats } : state.attacker.stats,
      },
    })),
  setDefender: (patch) =>
    set((state) => ({
      defender: {
        ...state.defender,
        ...patch,
        stats: patch.stats ? { ...state.defender.stats, ...patch.stats } : state.defender.stats,
      },
    })),
  setMove: (patch) => set((state) => ({ move: { ...state.move, ...patch } })),
  setField: (patch) => set((state) => ({ field: { ...state.field, ...patch } })),
  setAttackerSide: (patch) =>
    set((state) => ({ attackerSide: { ...state.attackerSide, ...patch } })),
  setDefenderSide: (patch) =>
    set((state) => ({ defenderSide: { ...state.defenderSide, ...patch } })),
  setTargets: (targets) => set({ targets }),
  toggleCriticalHit: () => set((state) => ({ criticalHit: !state.criticalHit })),
  reset: () => set({ ...initialState }),
}))

export function selectDamageRequest(state: CalculatorState): DamageCalculationRequest {
  return {
    regulation: state.regulation,
    attacker: state.attacker,
    defender: state.defender,
    move: state.move,
    field: state.field,
    attackerSide: state.attackerSide,
    defenderSide: state.defenderSide,
    criticalHit: state.criticalHit,
    targets: state.targets,
  }
}

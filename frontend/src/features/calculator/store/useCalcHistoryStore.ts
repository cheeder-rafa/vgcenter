import { create } from 'zustand'

import type { CombatantBuild, FieldRequest, SideConditions } from '../types/api'

const MAX_ENTRIES = 10

export type HistoryEntry = {
  id: number
  timestamp: number
  attackerSpeciesId: string
  defenderSpeciesId: string
  attackerName: string | null
  defenderName: string | null
  snapshot: {
    attacker: CombatantBuild
    defender: CombatantBuild
    field: FieldRequest
    attackerSide: SideConditions
    defenderSide: SideConditions
    criticalHit: boolean
    targets: number
  }
  summary: {
    topMoveId: string | null
    topMoveMaxPercent: number | null
  }
}

type HistoryState = {
  entries: HistoryEntry[]
  push: (entry: HistoryEntry) => void
  clear: () => void
}

export const useCalcHistoryStore = create<HistoryState>()((set) => ({
  entries: [],
  push: (entry) =>
    set((state) => ({
      entries: [entry, ...state.entries].slice(0, MAX_ENTRIES),
    })),
  clear: () => set({ entries: [] }),
}))

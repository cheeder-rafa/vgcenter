import { create } from 'zustand'

import type { CombatantBuild } from '../types/api'

export type PinnedDefender = {
  id: string
  label: string
  build: CombatantBuild
  attackerBuild: CombatantBuild
  moveId: string
}

type CompareStore = {
  pins: PinnedDefender[]
  pin: (defender: PinnedDefender) => void
  unpin: (id: string) => void
  clear: () => void
}

const MAX_PINS = 4

export const useCompareStore = create<CompareStore>((set) => ({
  pins: [],
  pin: (defender) =>
    set((s) => {
      if (s.pins.length >= MAX_PINS) return s
      if (s.pins.some((p) => p.id === defender.id)) return s
      return { pins: [defender, ...s.pins] }
    }),
  unpin: (id) => set((s) => ({ pins: s.pins.filter((p) => p.id !== id) })),
  clear: () => set({ pins: [] }),
}))

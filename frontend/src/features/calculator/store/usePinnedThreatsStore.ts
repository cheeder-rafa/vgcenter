import { create } from 'zustand'

import type { CombatantBuild } from '../types/api'

export type PinnedThreat = {
  id: string
  label: string
  build: CombatantBuild
  moveId: string
}

type PinnedThreatsStore = {
  threats: PinnedThreat[]
  pin: (threat: PinnedThreat) => void
  unpin: (id: string) => void
  updateMove: (id: string, moveId: string) => void
  updateAbility: (id: string, abilityId: string | null) => void
  updateItem: (id: string, itemId: string | null) => void
  clear: () => void
}

const MAX_THREATS = 4

export const EMPTY_PINNED_THREATS: PinnedThreat[] = []

export const usePinnedThreatsStore = create<PinnedThreatsStore>((set) => ({
  threats: [],
  pin: (threat) =>
    set((s) => {
      if (s.threats.length >= MAX_THREATS) return s
      if (s.threats.some((p) => p.id === threat.id)) return s
      return { threats: [threat, ...s.threats] }
    }),
  unpin: (id) =>
    set((s) => ({ threats: s.threats.filter((p) => p.id !== id) })),
  updateMove: (id, moveId) =>
    set((s) => ({
      threats: s.threats.map((p) => (p.id === id ? { ...p, moveId } : p)),
    })),
  updateAbility: (id, abilityId) =>
    set((s) => ({
      threats: s.threats.map((p) =>
        p.id === id ? { ...p, build: { ...p.build, abilityId } } : p,
      ),
    })),
  updateItem: (id, itemId) =>
    set((s) => ({
      threats: s.threats.map((p) =>
        p.id === id ? { ...p, build: { ...p.build, itemId } } : p,
      ),
    })),
  clear: () => set({ threats: [] }),
}))

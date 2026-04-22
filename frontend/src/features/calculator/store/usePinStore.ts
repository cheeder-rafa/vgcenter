import { create } from 'zustand'

export type MatchupPin = {
  id: string
  attackerName: string
  defenderName: string
  label: string
  attackerSummary: string
  defenderSummary: string
}

type PinStore = {
  pins: MatchupPin[]
  addPin: (pin: MatchupPin) => void
  removePin: (id: string) => void
  clear: () => void
}

const MAX_PINS = 4

export const usePinStore = create<PinStore>((set) => ({
  pins: [],
  addPin: (pin) =>
    set((s) => {
      if (s.pins.length >= MAX_PINS) return s
      if (s.pins.some((p) => p.id === pin.id)) return s
      return { pins: [...s.pins, pin] }
    }),
  removePin: (id) => set((s) => ({ pins: s.pins.filter((p) => p.id !== id) })),
  clear: () => set({ pins: [] }),
}))

import { create } from 'zustand'

import type { Regulation } from '../types/scenario'

type CalculatorState = {
  regulation: Regulation
  setRegulation: (regulation: Regulation) => void
}

export const useCalculatorStore = create<CalculatorState>((set) => ({
  regulation: 'M-A',
  setRegulation: (regulation) => set({ regulation }),
}))

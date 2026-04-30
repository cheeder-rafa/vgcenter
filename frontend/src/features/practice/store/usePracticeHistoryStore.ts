import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { PracticeDrillType } from '../lib/buildPracticeDrills'

export type PracticeHistoryEntry = {
  id: string
  drillId: string
  drillType: PracticeDrillType
  result: 'correct' | 'missed'
  answeredAt: string
}

type PracticeHistoryStore = {
  entries: PracticeHistoryEntry[]
  record: (input: {
    drillId: string
    drillType: PracticeDrillType
    result: 'correct' | 'missed'
  }) => void
  clear: () => void
}

export const usePracticeHistoryStore = create<PracticeHistoryStore>()(
  persist(
    (set) => ({
      entries: [],
      record: ({ drillId, drillType, result }) =>
        set((state) => ({
          entries: [
            {
              id: `${drillId}-${Date.now()}`,
              drillId,
              drillType,
              result,
              answeredAt: new Date().toISOString(),
            },
            ...state.entries,
          ].slice(0, 50),
        })),
      clear: () => set({ entries: [] }),
    }),
    {
      name: 'vgcenter.practiceHistory.v1',
      version: 1,
      partialize: (state) => ({ entries: state.entries }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { MoveSlot, Spread } from '../types/api'

export type NamedSpread = {
  id: string
  name: string
  sp: Spread
  natureId: string
  abilityId: string | null
  itemId: string | null
  moves: [MoveSlot, MoveSlot, MoveSlot, MoveSlot]
}

type SpreadLibraryState = {
  library: Record<string, NamedSpread[]>
  getSpreads: (speciesId: string) => NamedSpread[]
  saveSpread: (speciesId: string, spread: NamedSpread) => void
  deleteSpread: (speciesId: string, spreadId: string) => void
  clearAll: () => void
}

export const useSpreadLibraryStore = create<SpreadLibraryState>()(
  persist(
    (set, get) => ({
      library: {},
      getSpreads: (speciesId) => get().library[speciesId] ?? [],
      saveSpread: (speciesId, spread) =>
        set((state) => ({
          library: {
            ...state.library,
            [speciesId]: [...(state.library[speciesId] ?? []), spread],
          },
        })),
      deleteSpread: (speciesId, spreadId) =>
        set((state) => ({
          library: {
            ...state.library,
            [speciesId]: (state.library[speciesId] ?? []).filter(
              (s) => s.id !== spreadId,
            ),
          },
        })),
      clearAll: () => set({ library: {} }),
    }),
    { name: 'vgcenter.spreadLibrary.v1' },
  ),
)

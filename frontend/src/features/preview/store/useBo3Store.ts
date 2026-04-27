import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { GameRecord } from '../types'

type Bo3State = {
  games: GameRecord[]
  addGame: (game: GameRecord) => void
  clear: () => void
}

export const useBo3Store = create<Bo3State>()(
  persist(
    (set) => ({
      games: [],
      addGame: (game) =>
        set((state) => ({
          games: [
            ...state.games.filter((g) => g.gameNumber !== game.gameNumber),
            game,
          ].sort((a, b) => a.gameNumber - b.gameNumber),
        })),
      clear: () => set({ games: [] }),
    }),
    {
      name: 'vgcenter.bo3Store.v1',
      version: 1,
      partialize: (state) => ({ games: state.games }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

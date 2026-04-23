import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type GameplanState = {
  gamePlanNote: string
  opponentArchetypeTag: string
  setGamePlanNote: (note: string) => void
  setOpponentArchetypeTag: (tag: string) => void
}

export const useGameplanStore = create<GameplanState>()(
  persist(
    (set) => ({
      gamePlanNote: '',
      opponentArchetypeTag: '',
      setGamePlanNote: (gamePlanNote) => set({ gamePlanNote }),
      setOpponentArchetypeTag: (opponentArchetypeTag) =>
        set({ opponentArchetypeTag }),
    }),
    {
      name: 'vgcenter.gameplan.v1',
      partialize: (state) => ({
        gamePlanNote: state.gamePlanNote,
        opponentArchetypeTag: state.opponentArchetypeTag,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

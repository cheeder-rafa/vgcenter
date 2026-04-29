import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type PrepNotebookState = {
  eventName: string
  opponentName: string
  opponentNotes: string
  gamePlanNotes: string
  watchedThreatIds: string[]
  setEventName: (value: string) => void
  setOpponentName: (value: string) => void
  setOpponentNotes: (value: string) => void
  setGamePlanNotes: (value: string) => void
  toggleWatchedThreat: (id: string) => void
  reset: () => void
}

function createInitialState() {
  return {
    eventName: '',
    opponentName: '',
    opponentNotes: '',
    gamePlanNotes: '',
    watchedThreatIds: [],
  }
}

export const usePrepNotebookStore = create<PrepNotebookState>()(
  persist(
    (set) => ({
      ...createInitialState(),
      setEventName: (eventName) => set({ eventName }),
      setOpponentName: (opponentName) => set({ opponentName }),
      setOpponentNotes: (opponentNotes) => set({ opponentNotes }),
      setGamePlanNotes: (gamePlanNotes) => set({ gamePlanNotes }),
      toggleWatchedThreat: (id) =>
        set((state) => ({
          watchedThreatIds: state.watchedThreatIds.includes(id)
            ? state.watchedThreatIds.filter((candidate) => candidate !== id)
            : [...state.watchedThreatIds, id],
        })),
      reset: () => set(createInitialState()),
    }),
    {
      name: 'vgcenter.prepNotebook.v1',
      version: 1,
      partialize: (state) => ({
        eventName: state.eventName,
        opponentName: state.opponentName,
        opponentNotes: state.opponentNotes,
        gamePlanNotes: state.gamePlanNotes,
        watchedThreatIds: state.watchedThreatIds,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

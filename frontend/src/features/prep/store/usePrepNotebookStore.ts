import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type PrepNotebookState = {
  eventName: string
  opponentName: string
  opponentNotes: string
  gamePlanNotes: string
  watchedThreatIds: string[]
  replayFindings: ReplayPrepFinding[]
  setEventName: (value: string) => void
  setOpponentName: (value: string) => void
  setOpponentNotes: (value: string) => void
  setGamePlanNotes: (value: string) => void
  toggleWatchedThreat: (id: string) => void
  addReplayFinding: (finding: ReplayPrepFindingInput) => void
  reset: () => void
}

export type ReplayPrepFindingType =
  | 'turning-point'
  | 'missed-ko'
  | 'risky-line'
  | 'adaptation-note'

export type ReplayPrepFinding = {
  id: string
  type: ReplayPrepFindingType
  title: string
  note: string
  source: string
  gameNumber: number
  turnNumber: number
  createdAt: string
}

export type ReplayPrepFindingInput = Omit<ReplayPrepFinding, 'id' | 'createdAt'>

function createInitialState() {
  return {
    eventName: '',
    opponentName: '',
    opponentNotes: '',
    gamePlanNotes: '',
    watchedThreatIds: [],
    replayFindings: [],
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
      addReplayFinding: (finding) =>
        set((state) => ({
          replayFindings: [
            {
              ...finding,
              id: `${finding.type}-${finding.gameNumber}-${finding.turnNumber}-${Date.now()}`,
              createdAt: new Date().toISOString(),
            },
            ...state.replayFindings,
          ],
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
        replayFindings: state.replayFindings,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

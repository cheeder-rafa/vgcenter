import { create } from 'zustand'

import type { ImportedPokemon } from '../calculator/types/api'

type ImportSessionState = {
  sessions: Record<string, ImportedPokemon[]>
  setSession: (key: string, team: ImportedPokemon[]) => void
  clearSession: (key: string) => void
}

export const useImportSessionStore = create<ImportSessionState>()((set) => ({
  sessions: {},
  setSession: (key, team) =>
    set((state) => ({ sessions: { ...state.sessions, [key]: team } })),
  clearSession: (key) =>
    set((state) => {
      const next = { ...state.sessions }
      delete next[key]
      return { sessions: next }
    }),
}))

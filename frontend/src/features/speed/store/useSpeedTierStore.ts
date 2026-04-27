import { create } from 'zustand'

import { buildSpeedTiers } from '../api/speedApi'
import type { SpeedTierEntry, SpeedTierModifiers, SpeedTierRow } from '../types'

type SpeedTierStoreState = {
  baseRows: SpeedTierRow[]
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
  fetchBase: (userTeam: SpeedTierEntry[], modifiers: SpeedTierModifiers) => Promise<void>
}

export const useSpeedTierStore = create<SpeedTierStoreState>()((set, get) => ({
  baseRows: [],
  status: 'idle',
  error: null,
  fetchBase: async (userTeam, modifiers) => {
    if (get().status === 'loading') return
    set({ status: 'loading', error: null })
    try {
      const result = await buildSpeedTiers({
        regulation: 'M-A',
        userTeam,
        modifiers,
      })
      set({ baseRows: result.rows, status: 'success' })
    } catch (e) {
      set({
        baseRows: [],
        status: 'error',
        error: e instanceof Error ? e.message : 'Failed to load speed tiers',
      })
    }
  },
}))

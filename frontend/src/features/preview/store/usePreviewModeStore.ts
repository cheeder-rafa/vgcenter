import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PreviewMode = 'beginner' | 'expert'

type PreviewModeState = {
  mode: PreviewMode
  setMode: (mode: PreviewMode) => void
  toggle: () => void
}

export const usePreviewModeStore = create<PreviewModeState>()(
  persist(
    (set, get) => ({
      mode: 'beginner',
      setMode: (mode) => set({ mode }),
      toggle: () => set({ mode: get().mode === 'beginner' ? 'expert' : 'beginner' }),
    }),
    { name: 'vgcenter.previewMode.v1' },
  ),
)

import { beforeEach, describe, expect, it } from 'vitest'

import { usePreviewModeStore } from '../../../src/features/preview/store/usePreviewModeStore'

describe('usePreviewModeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    usePreviewModeStore.setState({ mode: 'beginner' })
  })

  it('defaults to beginner mode', () => {
    expect(usePreviewModeStore.getState().mode).toBe('beginner')
  })

  it('setMode updates the mode', () => {
    usePreviewModeStore.getState().setMode('expert')
    expect(usePreviewModeStore.getState().mode).toBe('expert')
  })

  it('toggle flips between beginner and expert', () => {
    const { toggle } = usePreviewModeStore.getState()
    toggle()
    expect(usePreviewModeStore.getState().mode).toBe('expert')
    toggle()
    expect(usePreviewModeStore.getState().mode).toBe('beginner')
  })

  it('persists the mode to localStorage', () => {
    usePreviewModeStore.getState().setMode('expert')
    const raw = localStorage.getItem('vgcenter.previewMode.v1')
    expect(raw).toBeTruthy()
    expect(raw).toContain('expert')
  })
})

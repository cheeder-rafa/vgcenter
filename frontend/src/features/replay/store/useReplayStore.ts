import { create } from 'zustand'

import { evaluateReplay, parseReplay } from '../api/replayApi'
import { parseReplayInputs } from '../lib/parseReplayInputs'
import type {
  ReplayEvaluateResponse,
  ReplayInputMode,
  ReplayTimeline,
} from '../types'

type Status = 'idle' | 'parsing' | 'evaluating' | 'ready' | 'error'

type ReplayState = {
  rawInput: string
  mode: ReplayInputMode
  status: Status
  timelines: ReplayTimeline[]
  evaluation: ReplayEvaluateResponse | null
  inputErrors: string[]
  errorMessage: string | null
  userPlayer: 'P1' | 'P2'

  setRawInput: (value: string) => void
  setUserPlayer: (player: 'P1' | 'P2') => void
  reset: () => void
  analyze: () => Promise<void>
  reEvaluate: () => Promise<void>
}

const EMPTY_TIMELINES: ReplayTimeline[] = []
const EMPTY_ERRORS: string[] = []

export const useReplayStore = create<ReplayState>((set, get) => ({
  rawInput: '',
  mode: 'single',
  status: 'idle',
  timelines: EMPTY_TIMELINES,
  evaluation: null,
  inputErrors: EMPTY_ERRORS,
  errorMessage: null,
  userPlayer: 'P1',

  setRawInput: (value) => set({ rawInput: value }),

  setUserPlayer: (player) => {
    set({ userPlayer: player })
    const { timelines } = get()
    if (timelines.length > 0) {
      get().reEvaluate()
    }
  },

  reset: () =>
    set({
      rawInput: '',
      mode: 'single',
      status: 'idle',
      timelines: EMPTY_TIMELINES,
      evaluation: null,
      inputErrors: EMPTY_ERRORS,
      errorMessage: null,
      userPlayer: 'P1',
    }),

  analyze: async () => {
    const { rawInput } = get()
    const parsed = parseReplayInputs(rawInput)
    if (parsed.items.length === 0) {
      set({
        inputErrors: parsed.errors,
        status: 'error',
        errorMessage: null,
        timelines: EMPTY_TIMELINES,
        evaluation: null,
      })
      return
    }

    set({
      mode: parsed.mode,
      inputErrors: parsed.errors,
      status: 'parsing',
      errorMessage: null,
    })

    try {
      const timelines = await Promise.all(
        parsed.items.map((item) =>
          parseReplay(
            item.kind === 'url' ? { url: item.value } : { log: item.value },
          ),
        ),
      )
      set({ timelines, status: 'evaluating' })

      const { userPlayer } = get()
      const request =
        parsed.mode === 'bo3'
          ? { regulation: 'M-A' as const, timelines, userPlayer }
          : { regulation: 'M-A' as const, timeline: timelines[0], userPlayer }
      const evaluation = await evaluateReplay(request)
      set({ status: 'ready', evaluation })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Replay analysis failed'
      set({ status: 'error', errorMessage: message })
    }
  },

  reEvaluate: async () => {
    const { timelines, mode, userPlayer } = get()
    if (timelines.length === 0) return

    set({ status: 'evaluating', evaluation: null, errorMessage: null })
    try {
      const request =
        mode === 'bo3'
          ? { regulation: 'M-A' as const, timelines, userPlayer }
          : { regulation: 'M-A' as const, timeline: timelines[0], userPlayer }
      const evaluation = await evaluateReplay(request)
      set({ status: 'ready', evaluation })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Replay evaluation failed'
      set({ status: 'error', errorMessage: message })
    }
  },
}))

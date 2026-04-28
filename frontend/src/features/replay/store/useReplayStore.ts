import { create } from 'zustand'

import { evaluateReplay, parseReplay } from '../api/replayApi'
import { parseReplayInputs } from '../lib/parseReplayInputs'
import type {
  ReplayEvaluateResponse,
  ReplayInputMode,
  ReplayTimeline,
} from '../types'

type Status = 'idle' | 'loading' | 'ready' | 'error'

type ReplayState = {
  rawInput: string
  mode: ReplayInputMode
  status: Status
  timelines: ReplayTimeline[]
  evaluation: ReplayEvaluateResponse | null
  inputErrors: string[]
  errorMessage: string | null

  setRawInput: (value: string) => void
  reset: () => void
  analyze: () => Promise<void>
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

  setRawInput: (value) => set({ rawInput: value }),

  reset: () =>
    set({
      rawInput: '',
      mode: 'single',
      status: 'idle',
      timelines: EMPTY_TIMELINES,
      evaluation: null,
      inputErrors: EMPTY_ERRORS,
      errorMessage: null,
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
      status: 'loading',
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
      const request =
        parsed.mode === 'bo3'
          ? { regulation: 'M-A' as const, timelines }
          : { regulation: 'M-A' as const, timeline: timelines[0] }
      const evaluation = await evaluateReplay(request)
      set({
        status: 'ready',
        timelines,
        evaluation,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Replay analysis failed'
      set({ status: 'error', errorMessage: message })
    }
  },
}))

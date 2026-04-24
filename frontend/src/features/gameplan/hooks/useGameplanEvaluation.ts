import { useEffect, useRef, useState } from 'react'

import { evaluateMatchup } from '../api/gameplanApi'
import type {
  EvaluateMatchupRequest,
  EvaluateMatchupResponse,
} from '../types/api'

const DEBOUNCE_MS = 200

export type GameplanEvaluationStatus = 'idle' | 'loading' | 'success' | 'error'

export type GameplanEvaluationState = {
  status: GameplanEvaluationStatus
  data: EvaluateMatchupResponse | null
  error: string | null
}

const IDLE_STATE: GameplanEvaluationState = {
  status: 'idle',
  data: null,
  error: null,
}

/**
 * Debounced matchup evaluation. Mirrors useReactiveDamage — on every change of
 * serialized request inputs we schedule a fetch 200ms out and drop stale
 * responses via a request-id ref. Passing null forces idle.
 */
export function useGameplanEvaluation(
  request: EvaluateMatchupRequest | null,
): GameplanEvaluationState {
  const [state, setState] = useState<GameplanEvaluationState>(IDLE_STATE)
  const requestIdRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const key = request === null ? null : JSON.stringify(request)

  useEffect(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (request === null || key === null) {
      requestIdRef.current += 1
      return
    }

    timeoutRef.current = setTimeout(() => {
      requestIdRef.current += 1
      const currentId = requestIdRef.current
      setState((prev) => ({ ...prev, status: 'loading', error: null }))

      evaluateMatchup(request)
        .then((data) => {
          if (currentId !== requestIdRef.current) return
          setState({ status: 'success', data, error: null })
        })
        .catch((err: unknown) => {
          if (currentId !== requestIdRef.current) return
          const message = err instanceof Error ? err.message : 'request failed'
          setState({ status: 'error', data: null, error: message })
        })
    }, DEBOUNCE_MS)

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return request === null ? IDLE_STATE : state
}

import { useCallback, useMemo, useState, useTransition } from 'react'

import type { ApiError } from '../../../lib/api-client'
import { useTeamsStore } from '../../../store/useTeamsStore'
import type { MoveDefinition } from '../../calculator/types/api'
import { recommendPlans } from '../api/previewApi'
import type { RecommendPlansResult } from '../types'
import { usePreviewFieldStore } from '../store/usePreviewFieldStore'
import { buildPreviewTeam } from './previewPokemonBuilder'

const RECOMMEND_TIMEOUT_MS = 60_000

type Status = 'idle' | 'loading' | 'success' | 'error'

export type RecommendError = {
  title: string
  detail: string
  hint: string
}

type UsePlanRecommendationArgs = {
  moves: MoveDefinition[]
  winConditionIndex: number | null
}

export function usePlanRecommendation({
  moves,
  winConditionIndex,
}: UsePlanRecommendationArgs) {
  const mine = useTeamsStore((state) => state.mine)
  const opponent = useTeamsStore((state) => state.opponent)
  const field = usePreviewFieldStore((state) => state.field)
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<RecommendPlansResult | null>(null)
  const [error, setError] = useState<RecommendError | null>(null)
  const [, startTransition] = useTransition()

  const moveById = useMemo(
    () => new Map(moves.map((move) => [move.id, move])),
    [moves],
  )

  const myTeam = useMemo(
    () => buildPreviewTeam(mine, moveById),
    [mine, moveById],
  )

  const opponentTeam = useMemo(
    () => buildPreviewTeam(opponent, moveById),
    [opponent, moveById],
  )

  const recommend = useCallback(async () => {
    if (myTeam.length !== 6 || opponentTeam.length !== 6) {
      return
    }

    setStatus('loading')
    setError(null)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), RECOMMEND_TIMEOUT_MS)

    try {
      const nextResult = await recommendPlans(
        {
          regulation: 'M-A',
          myTeam,
          opponentTeam,
          winConditionIndex,
          field,
        },
        controller.signal,
      )
      startTransition(() => {
        setResult(nextResult)
        setStatus('success')
      })
    } catch (caught) {
      setResult(null)
      setStatus('error')
      setError(classifyError(caught))
    } finally {
      clearTimeout(timeoutId)
    }
  }, [myTeam, opponentTeam, winConditionIndex, field, startTransition])

  return { status, result, error, recommend }
}

function classifyError(caught: unknown): RecommendError {
  if (caught instanceof Error && caught.name === 'AbortError') {
    return {
      title: 'Request timed out',
      detail: 'Recommendations timed out after 60 s.',
      hint: 'The hosted backend may be warming up — try again in a moment.',
    }
  }

  const apiErr = caught as ApiError
  const status = apiErr?.status ?? 0
  const problem = apiErr?.problem

  if (status === 400) {
    const violations = problem?.violations as Record<string, string> | undefined
    if (violations && Object.keys(violations).length > 0) {
      const fields = Object.entries(violations)
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ')
      return {
        title: 'Team input invalid',
        detail: fields,
        hint: 'Fix the highlighted fields and try again.',
      }
    }
    return {
      title: 'Bad request',
      detail: problem?.detail ?? apiErr?.message ?? 'Invalid input.',
      hint: 'Check both teams have valid Pokémon and moves.',
    }
  }

  if (status === 404) {
    return {
      title: 'Missing dataset entry',
      detail: problem?.detail ?? apiErr?.message ?? 'An entry was not found.',
      hint: 'This may be a data issue — contact support.',
    }
  }

  if (status >= 500) {
    return {
      title: 'Server error',
      detail: problem?.detail ?? 'An unexpected error occurred on the server.',
      hint: 'If this keeps happening, the hosted instance may be cold-starting. Try again.',
    }
  }

  return {
    title: 'Could not generate recommendations',
    detail: apiErr?.message ?? 'Unknown error.',
    hint: 'Make sure both teams are saved with at least one damaging move each.',
  }
}

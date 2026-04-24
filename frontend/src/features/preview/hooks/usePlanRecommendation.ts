import { useCallback, useMemo, useState, useTransition } from 'react'

import { useTeamsStore } from '../../../store/useTeamsStore'
import type { MoveDefinition } from '../../calculator/types/api'
import { recommendPlans } from '../api/previewApi'
import type { RecommendPlansResult } from '../types'
import { buildPreviewTeam } from './previewPokemonBuilder'

type Status = 'idle' | 'loading' | 'success' | 'error'

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
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<RecommendPlansResult | null>(null)
  const [error, setError] = useState<string | null>(null)
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
    try {
      const nextResult = await recommendPlans({
        regulation: 'M-A',
        myTeam,
        opponentTeam,
        winConditionIndex,
        field: DEFAULT_FIELD,
      })
      startTransition(() => {
        setResult(nextResult)
        setStatus('success')
      })
    } catch (caught) {
      setResult(null)
      setStatus('error')
      setError(
        caught instanceof Error ? caught.message : 'Plan recommendation failed',
      )
    }
  }, [myTeam, opponentTeam, winConditionIndex, startTransition])

  return { status, result, error, recommend }
}

const DEFAULT_FIELD = {
  field: { weather: 'CLEAR', terrain: 'NONE', room: 'NONE' },
  selectedSide: {
    reflect: false,
    lightScreen: false,
    auroraVeil: false,
    friendGuard: false,
    helpingHand: false,
    tailwind: false,
    protect: false,
  },
  opponentSide: {
    reflect: false,
    lightScreen: false,
    auroraVeil: false,
    friendGuard: false,
    helpingHand: false,
    tailwind: false,
    protect: false,
  },
  criticalHit: false,
  targets: 1,
} as const

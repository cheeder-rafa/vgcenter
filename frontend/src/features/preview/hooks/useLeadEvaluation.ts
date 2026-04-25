import { useCallback, useMemo, useState, useTransition } from 'react'

import { useTeamsStore, type SavedPokemon } from '../../../store/useTeamsStore'
import type { MoveDefinition } from '../../calculator/types/api'
import { evaluateLeads } from '../api/previewApi'
import type {
  LeadEvaluationRequest,
  LeadEvaluationResult,
  PreviewPokemon,
} from '../types'
import { usePreviewFieldStore } from '../store/usePreviewFieldStore'
import { toPreviewPokemon } from './previewPokemonBuilder'

type Status = 'idle' | 'loading' | 'success' | 'error'

type UseLeadEvaluationArgs = {
  selectedLeadIds: [string | null, string | null]
  moves: MoveDefinition[]
}

export function useLeadEvaluation({
  selectedLeadIds,
  moves,
}: UseLeadEvaluationArgs) {
  const mine = useTeamsStore((state) => state.mine)
  const opponent = useTeamsStore((state) => state.opponent)
  const field = usePreviewFieldStore((state) => state.field)
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<LeadEvaluationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const moveById = useMemo(
    () => new Map(moves.map((move) => [move.id, move])),
    [moves],
  )

  const request = useMemo(
    () => createRequest(mine, opponent, selectedLeadIds, moveById, field),
    [mine, opponent, selectedLeadIds, moveById, field],
  )

  const evaluate = useCallback(async () => {
    if (request === null) {
      setStatus('idle')
      setResult(null)
      setError(null)
      return
    }

    setStatus('loading')
    setError(null)
    try {
      const nextResult = await evaluateLeads(request)
      startTransition(() => {
        setResult(nextResult)
        setStatus('success')
      })
    } catch (caught) {
      setResult(null)
      setStatus('error')
      setError(
        caught instanceof Error ? caught.message : 'Lead evaluation failed',
      )
    }
  }, [request, startTransition])

  return { status, result, error, canEvaluate: request !== null, evaluate }
}

function createRequest(
  mine: (SavedPokemon | null)[],
  opponent: (SavedPokemon | null)[],
  selectedLeadIds: [string | null, string | null],
  moveById: Map<string, MoveDefinition>,
  field: LeadEvaluationRequest['field'],
): LeadEvaluationRequest | null {
  const selectedLeads = selectedLeadIds
    .map((speciesId) =>
      speciesId === null
        ? null
        : (mine.find((pokemon) => pokemon?.speciesId === speciesId) ?? null),
    )
    .filter((pokemon): pokemon is SavedPokemon => pokemon !== null)

  const opponentTeam = opponent.filter(
    (pokemon): pokemon is SavedPokemon => pokemon !== null,
  )

  if (selectedLeads.length !== 2 || opponentTeam.length !== 6) {
    return null
  }

  const selectedPreview = selectedLeads.map((pokemon) =>
    toPreviewPokemon(pokemon, moveById),
  ) as [PreviewPokemon, PreviewPokemon]
  const opponentPreview = opponentTeam.map((pokemon) =>
    toPreviewPokemon(pokemon, moveById),
  ) as LeadEvaluationRequest['opponentTeam']

  if (
    selectedPreview.some((pokemon) => pokemon.moves.length === 0) ||
    opponentPreview.some((pokemon) => pokemon.moves.length === 0)
  ) {
    return null
  }

  return {
    regulation: 'M-A',
    selectedLeads: selectedPreview,
    opponentTeam: opponentPreview,
    field,
  }
}


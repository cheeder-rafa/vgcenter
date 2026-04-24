import { useCallback, useMemo, useState, useTransition } from 'react'

import { useTeamsStore, type SavedPokemon } from '../../../store/useTeamsStore'
import type { MoveDefinition, MoveRequest } from '../../calculator/types/api'
import { evaluateLeads } from '../api/previewApi'
import type {
  LeadEvaluationRequest,
  LeadEvaluationResult,
  PreviewPokemon,
} from '../types'

type Status = 'idle' | 'loading' | 'success' | 'error'

type UseLeadEvaluationArgs = {
  selectedLeadIds: [string | null, string | null]
  moves: MoveDefinition[]
}

const DEFAULT_FIELD: LeadEvaluationRequest['field'] = {
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
}

export function useLeadEvaluation({
  selectedLeadIds,
  moves,
}: UseLeadEvaluationArgs) {
  const mine = useTeamsStore((state) => state.mine)
  const opponent = useTeamsStore((state) => state.opponent)
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<LeadEvaluationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const moveById = useMemo(
    () => new Map(moves.map((move) => [move.id, move])),
    [moves],
  )

  const request = useMemo(
    () => createRequest(mine, opponent, selectedLeadIds, moveById),
    [mine, opponent, selectedLeadIds, moveById],
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
    field: DEFAULT_FIELD,
  }
}

function toPreviewPokemon(
  pokemon: SavedPokemon,
  moveById: Map<string, MoveDefinition>,
): PreviewPokemon {
  return {
    pokemonId: pokemon.speciesId ?? pokemon.speciesName,
    displayName: pokemon.speciesName,
    combatant: {
      level: 50,
      stats: pokemon.finalStats ?? pokemon.baseStats ?? fallbackStats(),
      types: pokemon.types?.filter((type): type is string => type !== null) ?? [
        'NORMAL',
      ],
      abilityId: pokemon.abilityId,
      itemId: pokemon.itemId,
      status: pokemon.status,
      stages: pokemon.stages,
      grounded: pokemon.grounded,
      currentHp:
        pokemon.currentHp ??
        pokemon.finalStats?.hp ??
        pokemon.baseStats?.hp ??
        fallbackStats().hp,
    },
    moves: pokemon.moves
      .map((slot) => (slot.moveId === null ? null : moveById.get(slot.moveId)))
      .filter(
        (move): move is MoveDefinition => move !== null && move !== undefined,
      )
      .filter((move) => move.category !== 'STATUS' && move.basePower > 0)
      .map(toMoveRequest),
  }
}

function toMoveRequest(move: MoveDefinition): MoveRequest {
  return {
    type: move.type,
    category: move.category,
    basePower: move.basePower,
    spread: move.spread,
    contact: move.contact,
    doublePowerWhenUserStatused: move.doublePowerWhenUserStatused,
    ignoreBurnPenaltyWhenUserStatused: move.ignoreBurnPenaltyWhenUserStatused,
  }
}

function fallbackStats() {
  return {
    hp: 1,
    attack: 1,
    defense: 1,
    specialAttack: 1,
    specialDefense: 1,
    speed: 1,
  }
}

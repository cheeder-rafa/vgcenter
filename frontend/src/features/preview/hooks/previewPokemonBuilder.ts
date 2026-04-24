import type { SavedPokemon } from '../../../store/useTeamsStore'
import type { MoveDefinition, MoveRequest } from '../../calculator/types/api'
import { buildSupportTags } from '../supportTags'
import type { PreviewPokemon } from '../types'

export function buildPreviewTeam(
  team: (SavedPokemon | null)[],
  moveById: Map<string, MoveDefinition>,
): PreviewPokemon[] {
  return team
    .filter((p): p is SavedPokemon => p !== null)
    .map((p) => toPreviewPokemon(p, moveById))
}

export function toPreviewPokemon(
  pokemon: SavedPokemon,
  moveById: Map<string, MoveDefinition>,
): PreviewPokemon {
  const allMoveIds = pokemon.moves.map((slot) => slot.moveId)
  return {
    pokemonId: pokemon.speciesId ?? pokemon.speciesName,
    displayName: pokemon.speciesName,
    combatant: {
      level: 50,
      stats: pokemon.finalStats ?? pokemon.baseStats ?? fallbackStats(),
      types: pokemon.types?.filter((t): t is string => t !== null) ?? ['NORMAL'],
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
      .filter((move): move is MoveDefinition => move !== null && move !== undefined)
      .filter((move) => move.category !== 'STATUS' && move.basePower > 0)
      .map(toMoveRequest),
    isMega: pokemon.megaActive ?? false,
    supportTags: buildSupportTags(allMoveIds),
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
  return { hp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1 }
}

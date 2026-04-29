import type { MoveDefinition, PokedexEntry } from '../../calculator/types/api'
import type { ImportedPokemon } from '../../calculator/types/api'
import type { ThreatPokemonInput } from '../types'

export function toThreatPokemonInput(
  pokemon: ImportedPokemon,
  pokedexMap: Map<string, PokedexEntry>,
  moveMap: Map<string, MoveDefinition>,
): ThreatPokemonInput {
  const entry = pokedexMap.get(pokemon.speciesId)
  const types = entry?.types ?? ['NORMAL']
  const hasFlying = types.includes('FLYING')
  const hasLevitate = pokemon.abilityId === 'levitate'
  const grounded = !hasFlying && !hasLevitate

  const moves = pokemon.moveIds
    .filter((id) => id != null)
    .map((id) => moveMap.get(id))
    .filter((m): m is MoveDefinition => m !== undefined)
    .map((m) => ({
      moveId: m.id,
      move: {
        type: m.type,
        category: m.category,
        basePower: m.basePower,
        spread: m.spread,
        contact: m.contact,
        doublePowerWhenUserStatused: m.doublePowerWhenUserStatused,
        ignoreBurnPenaltyWhenUserStatused: m.ignoreBurnPenaltyWhenUserStatused,
      },
    }))

  return {
    combatant: {
      level: pokemon.level,
      stats: {
        hp: pokemon.stats.hp,
        attack: pokemon.stats.attack,
        defense: pokemon.stats.defense,
        specialAttack: pokemon.stats.specialAttack,
        specialDefense: pokemon.stats.specialDefense,
        speed: pokemon.stats.speed,
      },
      types,
      abilityId: pokemon.abilityId,
      itemId: pokemon.itemId,
      status: 'NONE',
      stages: {},
      grounded,
      currentHp: pokemon.stats.hp,
    },
    moves,
  }
}

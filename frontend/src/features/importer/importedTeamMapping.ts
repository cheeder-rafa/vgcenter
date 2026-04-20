import type {
  CombatantRequest,
  ImportedPokemon,
  PokedexEntry,
} from '../calculator/types/api'

export function toCombatantRequest(
  pokemon: ImportedPokemon,
  pokedexEntry?: PokedexEntry,
): CombatantRequest {
  const types = normalizeTypes(pokedexEntry?.types)

  return {
    level: pokemon.level,
    stats: pokemon.stats,
    types,
    abilityId: pokemon.abilityId,
    itemId: pokemon.itemId,
    status: 'NONE',
    grounded: !types.includes('FLYING'),
    fullHp: true,
  }
}

function normalizeTypes(types: string[] | undefined): string[] {
  if (types === undefined || types.length === 0) {
    return ['NORMAL']
  }

  const [primary, secondary] = types
  return secondary === undefined ? [primary] : [primary, secondary]
}

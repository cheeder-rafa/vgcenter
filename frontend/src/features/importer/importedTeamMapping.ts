import type { SavedPokemon } from '../calculator/store/useSavedTeamStore'
import type {
  CombatantBuild,
  ImportedPokemon,
  PokedexEntry,
} from '../calculator/types/api'

export function toCombatantBuild(
  pokemon: ImportedPokemon,
  pokedexEntry?: PokedexEntry,
): CombatantBuild {
  const types = normalizeTypes(pokedexEntry?.types)

  return {
    speciesId: pokemon.speciesId,
    natureId: pokemon.natureId ?? 'serious',
    sp: {
      hp: pokemon.sp.hp,
      atk: pokemon.sp.attack,
      def: pokemon.sp.defense,
      spa: pokemon.sp.specialAttack,
      spd: pokemon.sp.specialDefense,
      spe: pokemon.sp.speed,
    },
    abilityId: pokemon.abilityId,
    itemId: pokemon.itemId,
    status: 'NONE',
    megaActive: false,
    moves: toMoveSlots(pokemon.moveIds),
    baseStats: pokedexEntry?.baseStats ?? pokemon.stats,
    finalStats: pokemon.stats,
    types,
    grounded: !types.includes('FLYING'),
    fullHp: true,
  }
}

export function toSavedPokemon(
  pokemon: ImportedPokemon,
  pokedexEntry?: PokedexEntry,
): SavedPokemon {
  const build = toCombatantBuild(pokemon, pokedexEntry)

  return {
    ...build,
    speciesName: pokemon.speciesName,
    spriteId: pokemon.speciesId,
  }
}

function normalizeTypes(types: string[] | undefined): [string, string | null] {
  if (types === undefined || types.length === 0) {
    return ['NORMAL', null]
  }

  const [primary, secondary] = types
  return [primary, secondary ?? null]
}

function toMoveSlots(moveIds: string[]): CombatantBuild['moves'] {
  return Array.from({ length: 4 }, (_, index) => ({
    moveId: moveIds[index] ?? null,
  })) as CombatantBuild['moves']
}

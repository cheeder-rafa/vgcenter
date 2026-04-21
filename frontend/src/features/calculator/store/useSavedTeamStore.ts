import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { CalculatorSide } from './useCalculatorStore'
import { useToastStore } from './useToastStore'
import type { CombatantBuild, Stats } from '../types/api'

export type SavedPokemon = CombatantBuild & {
  speciesName: string
  spriteId: string | null
}

type SavedPokemonSlot = SavedPokemon | null

type SavedTeamState = {
  attackerSaved: [
    SavedPokemonSlot,
    SavedPokemonSlot,
    SavedPokemonSlot,
    SavedPokemonSlot,
    SavedPokemonSlot,
    SavedPokemonSlot,
  ]
  defenderSaved: [
    SavedPokemonSlot,
    SavedPokemonSlot,
    SavedPokemonSlot,
    SavedPokemonSlot,
    SavedPokemonSlot,
    SavedPokemonSlot,
  ]
  save: (side: CalculatorSide, pokemon: SavedPokemon) => void
  importTeam: (side: CalculatorSide, pokemon: SavedPokemon[]) => void
  remove: (side: CalculatorSide, index: number) => void
  load: (side: CalculatorSide, index: number) => CombatantBuild | null
  reset: () => void
}

function createEmptyRail(): SavedTeamState['attackerSaved'] {
  return [null, null, null, null, null, null]
}

function cloneStats(stats: Stats | null): Stats | null {
  return stats === null ? null : { ...stats }
}

function cloneMoves(moves: CombatantBuild['moves']): CombatantBuild['moves'] {
  return moves.map((move) => ({ ...move })) as CombatantBuild['moves']
}

function cloneTypes(
  types: CombatantBuild['types'],
): CombatantBuild['types'] {
  return types === null ? null : [...types] as CombatantBuild['types']
}

function cloneSavedPokemon(pokemon: SavedPokemon): SavedPokemon {
  return {
    ...pokemon,
    sp: { ...pokemon.sp },
    moves: cloneMoves(pokemon.moves),
    baseStats: cloneStats(pokemon.baseStats),
    finalStats: cloneStats(pokemon.finalStats),
    types: cloneTypes(pokemon.types),
  }
}

function toCombatantBuild(pokemon: SavedPokemon): CombatantBuild {
  return {
    speciesId: pokemon.speciesId,
    natureId: pokemon.natureId,
    sp: { ...pokemon.sp },
    abilityId: pokemon.abilityId,
    itemId: pokemon.itemId,
    status: pokemon.status,
    megaActive: pokemon.megaActive,
    megaFormId: pokemon.megaFormId,
    moves: cloneMoves(pokemon.moves),
    baseStats: cloneStats(pokemon.baseStats),
    finalStats: cloneStats(pokemon.finalStats),
    types: cloneTypes(pokemon.types),
    grounded: pokemon.grounded,
    fullHp: pokemon.fullHp,
  }
}

function railKeyFor(side: CalculatorSide) {
  return side === 'attacker' ? 'attackerSaved' : 'defenderSaved'
}

function createInitialState() {
  return {
    attackerSaved: createEmptyRail(),
    defenderSaved: createEmptyRail(),
  }
}

export const useSavedTeamStore = create<SavedTeamState>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      save: (side, pokemon) =>
        set((state) => {
          const key = railKeyFor(side)
          const nextRail = [...state[key]] as SavedTeamState[typeof key]
          const firstEmptyIndex = nextRail.findIndex((entry) => entry === null)

          if (firstEmptyIndex === -1) {
            useToastStore
              .getState()
              .push(
                `${side === 'attacker' ? 'Attacker' : 'Defender'} rail is full.`,
              )
            return state
          }

          nextRail[firstEmptyIndex] = cloneSavedPokemon(pokemon)
          return { [key]: nextRail }
        }),
      importTeam: (side, pokemon) =>
        set(() => {
          const key = railKeyFor(side)
          const imported = pokemon
            .slice(0, 6)
            .map((entry) => cloneSavedPokemon(entry))
          const nextRail = createEmptyRail()
          imported.forEach((entry, index) => {
            nextRail[index] = entry
          })
          return { [key]: nextRail }
        }),
      remove: (side, index) =>
        set((state) => {
          const key = railKeyFor(side)
          const nextRail = [...state[key]] as SavedTeamState[typeof key]
          nextRail[index] = null
          return { [key]: nextRail }
        }),
      load: (side, index) => {
        const key = railKeyFor(side)
        const pokemon = get()[key][index]
        return pokemon === null ? null : toCombatantBuild(pokemon)
      },
      reset: () => set(createInitialState()),
    }),
    {
      name: 'vgcenter.savedTeams.v1',
      version: 1,
      partialize: (state) => ({
        attackerSaved: state.attackerSaved,
        defenderSaved: state.defenderSaved,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

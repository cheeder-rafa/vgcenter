import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { CalculatorSide } from '../features/calculator/store/useCalculatorStore'
import { useToastStore } from '../features/calculator/store/useToastStore'
import type { CombatantBuild, Stats } from '../features/calculator/types/api'

export type SavedPokemon = CombatantBuild & {
  speciesName: string
  spriteId: string | null
}

type SavedPokemonSlot = SavedPokemon | null

type Rail = [
  SavedPokemonSlot,
  SavedPokemonSlot,
  SavedPokemonSlot,
  SavedPokemonSlot,
  SavedPokemonSlot,
  SavedPokemonSlot,
]

type TeamsState = {
  mine: Rail
  opponent: Rail
  save: (side: CalculatorSide, pokemon: SavedPokemon) => void
  importTeam: (side: CalculatorSide, pokemon: SavedPokemon[]) => void
  remove: (side: CalculatorSide, index: number) => void
  load: (side: CalculatorSide, index: number) => CombatantBuild | null
  reset: () => void
}

function createEmptyRail(): Rail {
  return [null, null, null, null, null, null]
}

function cloneStats(stats: Stats | null): Stats | null {
  return stats === null ? null : { ...stats }
}

function cloneMoves(moves: CombatantBuild['moves']): CombatantBuild['moves'] {
  return moves.map((move) => ({ ...move })) as CombatantBuild['moves']
}

function cloneTypes(types: CombatantBuild['types']): CombatantBuild['types'] {
  return types === null ? null : ([...types] as CombatantBuild['types'])
}

function cloneSavedPokemon(pokemon: SavedPokemon): SavedPokemon {
  return {
    ...pokemon,
    sp: { ...pokemon.sp },
    stages: { ...pokemon.stages },
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
    stages: { ...pokemon.stages },
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
    currentHp: pokemon.currentHp,
  }
}

function railKeyFor(side: CalculatorSide): 'mine' | 'opponent' {
  return side === 'attacker' ? 'mine' : 'opponent'
}

function createInitialState() {
  return {
    mine: createEmptyRail(),
    opponent: createEmptyRail(),
  }
}

export const useTeamsStore = create<TeamsState>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      save: (side, pokemon) =>
        set((state) => {
          const key = railKeyFor(side)
          const nextRail = [...state[key]] as Rail
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
          const nextRail = createEmptyRail()
          pokemon.slice(0, 6).forEach((entry, index) => {
            nextRail[index] = cloneSavedPokemon(entry)
          })
          return { [key]: nextRail }
        }),
      remove: (side, index) =>
        set((state) => {
          const key = railKeyFor(side)
          const nextRail = [...state[key]] as Rail
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
      name: 'vgcenter.teamsStore.v1',
      version: 1,
      partialize: (state) => ({
        mine: state.mine,
        opponent: state.opponent,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

// One-shot migration from the old useSavedTeamStore key.
// Runs synchronously after the store is created so useTeamsStore is in scope.
const OLD_KEY = 'vgcenter.savedTeams.v1'
const oldRaw = localStorage.getItem(OLD_KEY)
if (oldRaw) {
  localStorage.removeItem(OLD_KEY)

  const hasExistingData =
    useTeamsStore.getState().mine.some(Boolean) ||
    useTeamsStore.getState().opponent.some(Boolean)

  if (!hasExistingData) {
    try {
      const parsed = JSON.parse(oldRaw) as {
        state?: {
          attackerSaved?: SavedPokemonSlot[]
          defenderSaved?: SavedPokemonSlot[]
        }
      }

      const mine = (parsed?.state?.attackerSaved ?? []).slice(0, 6)
      const opponent = (parsed?.state?.defenderSaved ?? []).slice(0, 6)

      while (mine.length < 6) mine.push(null)
      while (opponent.length < 6) opponent.push(null)

      useTeamsStore.setState({
        mine: mine as Rail,
        opponent: opponent as Rail,
      })

      useToastStore
        .getState()
        .push('Your saved teams have been upgraded to the new format.')
    } catch {
      // Malformed old data — discard
    }
  }
}

// Backward-compat alias used by existing calculator components
export const useSavedTeamStore = useTeamsStore

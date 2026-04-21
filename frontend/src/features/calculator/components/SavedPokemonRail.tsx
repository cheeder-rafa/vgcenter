import type { CombatantBuild } from '../types/api'
import {
  useSavedTeamStore,
  type SavedPokemon,
} from '../store/useSavedTeamStore'
import type { CalculatorSide } from '../store/useCalculatorStore'
import { SavedPokemonCard } from './SavedPokemonCard'

type Props = {
  side: CalculatorSide
  currentBuild: CombatantBuild
  speciesName: string | null
  spriteId: string | null
  onLoadBuild: (side: CalculatorSide, build: CombatantBuild) => void
}

export function SavedPokemonRail({
  side,
  currentBuild,
  speciesName,
  spriteId,
  onLoadBuild,
}: Props) {
  const saved = useSavedTeamStore((state) =>
    side === 'attacker' ? state.attackerSaved : state.defenderSaved,
  )
  const save = useSavedTeamStore((state) => state.save)
  const remove = useSavedTeamStore((state) => state.remove)
  const load = useSavedTeamStore((state) => state.load)

  const sideLabel = side === 'attacker' ? 'Attacker' : 'Defender'
  const canSave = currentBuild.speciesId !== null

  function handleSaveCurrent() {
    if (!canSave || currentBuild.speciesId === null) {
      return
    }

    const entry: SavedPokemon = {
      ...currentBuild,
      sp: { ...currentBuild.sp },
      moves: currentBuild.moves.map((move) => ({
        ...move,
      })) as CombatantBuild['moves'],
      baseStats:
        currentBuild.baseStats === null ? null : { ...currentBuild.baseStats },
      finalStats:
        currentBuild.finalStats === null ? null : { ...currentBuild.finalStats },
      types:
        currentBuild.types === null
          ? null
          : [...currentBuild.types] as CombatantBuild['types'],
      speciesName: speciesName ?? currentBuild.speciesId,
      spriteId: spriteId ?? currentBuild.speciesId,
    }

    save(side, entry)
  }

  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:gap-3"
      aria-label={`${sideLabel} saved rail`}
    >
      <button
        type="button"
        className="arena-button h-12 whitespace-nowrap px-3 text-[0.68rem] uppercase tracking-[0.24em] text-white/88 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={handleSaveCurrent}
        disabled={!canSave}
      >
        Save
      </button>
      <div className="flex flex-col gap-3">
        {saved.map((pokemon, index) =>
          pokemon === null ? null : (
            <SavedPokemonCard
              key={`${side}-${index}-${pokemon.speciesId ?? 'empty'}`}
              index={index}
              pokemon={pokemon}
              side={side}
              onLoad={() => {
                const build = load(side, index)
                if (build !== null) {
                  onLoadBuild(side, build)
                }
              }}
              onRemove={() => remove(side, index)}
            />
          ),
        )}
      </div>
    </aside>
  )
}

import type { CombatantBuild } from '../types/api'
import {
  useTeamsStore,
  type SavedPokemon,
} from '../../../store/useTeamsStore'
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
  const saved = useTeamsStore((state) =>
    side === 'attacker' ? state.mine : state.opponent,
  )
  const save = useTeamsStore((state) => state.save)
  const remove = useTeamsStore((state) => state.remove)
  const load = useTeamsStore((state) => state.load)

  const sideLabel = side === 'attacker' ? 'Attacker' : 'Defender'
  const canSave = currentBuild.speciesId !== null
  const savedCount = saved.filter((pokemon) => pokemon !== null).length

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
        currentBuild.finalStats === null
          ? null
          : { ...currentBuild.finalStats },
      types:
        currentBuild.types === null
          ? null
          : ([...currentBuild.types] as CombatantBuild['types']),
      speciesName: speciesName ?? currentBuild.speciesId,
      spriteId: spriteId ?? currentBuild.speciesId,
    }

    save(side, entry)
  }

  return (
    <aside
      className="flex flex-col gap-2 xl:gap-3"
      aria-label={`${sideLabel} saved rail`}
    >
      <div className="flex items-center justify-between gap-3 xl:flex-col xl:items-stretch">
        <div className="min-w-0">
          <p className="arena-label text-white/55">{sideLabel} saved</p>
          <p className="pt-1 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/35">
            {savedCount}/6 loaded
          </p>
        </div>
        <button
          type="button"
          className="arena-button h-11 min-w-[9rem] whitespace-nowrap px-3 text-[0.68rem] uppercase tracking-[0.24em] text-white/88 disabled:cursor-not-allowed disabled:opacity-40 xl:h-12 xl:min-w-0"
          onClick={handleSaveCurrent}
          disabled={!canSave}
        >
          Save
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:gap-3 xl:overflow-visible xl:pb-0">
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

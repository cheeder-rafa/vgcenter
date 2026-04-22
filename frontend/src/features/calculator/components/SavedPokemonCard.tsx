import { useState } from 'react'

import type { CalculatorSide } from '../store/useCalculatorStore'
import type { SavedPokemon } from '../store/useSavedTeamStore'

type Props = {
  index: number
  pokemon: SavedPokemon
  side: CalculatorSide
  onLoad: () => void
  onRemove: () => void
}

const FALLBACK_SRC = '/sprites/_unknown.png'

function resolveSpriteSrc(spriteId: string | null) {
  if (spriteId === null || spriteId.trim() === '') {
    return FALLBACK_SRC
  }
  return `/sprites/${spriteId}.png`
}

export function SavedPokemonCard({
  index,
  pokemon,
  side,
  onLoad,
  onRemove,
}: Props) {
  return (
    <SavedPokemonCardInner
      key={`${pokemon.spriteId ?? pokemon.speciesId ?? index}-${pokemon.megaActive ? 'mega' : 'base'}`}
      index={index}
      pokemon={pokemon}
      side={side}
      onLoad={onLoad}
      onRemove={onRemove}
    />
  )
}

function SavedPokemonCardInner({
  index,
  pokemon,
  side,
  onLoad,
  onRemove,
}: Props) {
  const [src, setSrc] = useState(() => resolveSpriteSrc(pokemon.spriteId))
  const accentRing =
    side === 'attacker'
      ? 'border-arena-plasma/45 shadow-[0_0_24px_rgba(255,43,142,0.18)]'
      : 'border-arena-cyan/45 shadow-[0_0_24px_rgba(34,211,238,0.18)]'

  return (
    <div className="relative w-20 shrink-0 sm:w-24 xl:w-full xl:shrink">
      <button
        type="button"
        className={`group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-sm border bg-arena-void/80 transition hover:-translate-y-0.5 hover:border-white/30 ${accentRing}`}
        onClick={onLoad}
        aria-label={`Load ${pokemon.speciesName} for ${side}`}
        title={pokemon.speciesName}
      >
        <img
          src={src}
          alt={pokemon.speciesName}
          className="h-full w-full object-contain p-2"
          loading="lazy"
          onError={() => {
            if (src !== FALLBACK_SRC) {
              setSrc(FALLBACK_SRC)
            }
          }}
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-[rgba(8,12,27,0.82)] px-2 py-1 text-center font-mono text-[0.58rem] uppercase tracking-[0.18em] text-white/78">
          {index + 1}
        </span>
      </button>
      <button
        type="button"
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/12 bg-arena-void/90 font-body text-xs text-white/72 transition hover:border-white/28 hover:text-white"
        onClick={(event) => {
          event.stopPropagation()
          onRemove()
        }}
        aria-label={`Remove ${pokemon.speciesName} from ${side}`}
      >
        ×
      </button>
    </div>
  )
}

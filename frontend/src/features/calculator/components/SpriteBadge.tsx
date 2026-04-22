import { useState } from 'react'

import { FALLBACK_SRC, resolveSpriteSources } from './spriteBadgeSources'

type Props = {
  speciesId: string | null
  speciesName?: string | null
  megaActive?: boolean
  megaFormId?: string | null
  accent?: 'plasma' | 'cyan'
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-14 w-14',
  md: 'h-20 w-20',
  lg: 'h-28 w-28',
}

export function SpriteBadge(props: Props) {
  // Re-mount inner sprite when speciesId changes so local fallback state resets.
  const key = `${props.speciesId ?? '__empty__'}:${props.megaActive ? 'mega' : 'base'}:${props.megaFormId ?? '__none__'}`
  return <SpriteBadgeInner key={key} {...props} />
}

function SpriteBadgeInner({
  speciesId,
  speciesName = null,
  megaActive = false,
  megaFormId = null,
  accent = 'plasma',
  size = 'md',
}: Props) {
  const sources = resolveSpriteSources(speciesId, megaActive, megaFormId)
  const [srcIndex, setSrcIndex] = useState(0)
  const src = sources[srcIndex] ?? FALLBACK_SRC

  const ringColor =
    accent === 'cyan' ? 'border-arena-cyan/55' : 'border-arena-plasma/55'
  const glow =
    accent === 'cyan'
      ? 'shadow-[0_0_32px_-12px_rgba(34,211,238,0.85)]'
      : 'shadow-[0_0_32px_-12px_rgba(255,43,142,0.85)]'

  const altLabel = speciesName ?? speciesId ?? 'No Pokémon selected'

  return (
    <div
      className={`relative flex ${SIZE_CLASSES[size]} shrink-0 items-center justify-center rounded-sm border bg-arena-void/60 ${ringColor} ${glow}`}
    >
      <img
        src={src}
        alt={altLabel}
        className="h-full w-full object-contain p-1.5"
        loading="lazy"
        onError={() => {
          if (srcIndex < sources.length - 1) {
            setSrcIndex((current) => current + 1)
          }
        }}
      />
    </div>
  )
}

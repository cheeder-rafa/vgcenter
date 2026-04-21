import { useState } from 'react'

type Props = {
  speciesId: string | null
  speciesName?: string | null
  accent?: 'plasma' | 'cyan'
  size?: 'sm' | 'md' | 'lg'
}

const FALLBACK_SRC = '/sprites/_unknown.png'

function resolveSrc(speciesId: string | null): string {
  if (speciesId === null || speciesId.trim() === '') {
    return FALLBACK_SRC
  }
  return `/sprites/${speciesId}.png`
}

const SIZE_CLASSES: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-14 w-14',
  md: 'h-20 w-20',
  lg: 'h-28 w-28',
}

export function SpriteBadge(props: Props) {
  // Re-mount inner sprite when speciesId changes so local fallback state resets.
  return <SpriteBadgeInner key={props.speciesId ?? '__empty__'} {...props} />
}

function SpriteBadgeInner({
  speciesId,
  speciesName = null,
  accent = 'plasma',
  size = 'md',
}: Props) {
  const [src, setSrc] = useState(() => resolveSrc(speciesId))

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
          if (src !== FALLBACK_SRC) {
            setSrc(FALLBACK_SRC)
          }
        }}
      />
    </div>
  )
}

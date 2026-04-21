const TYPE_PALETTE: Record<
  string,
  { border: string; background: string; text: string }
> = {
  NORMAL: {
    border: 'border-[#b7b7aa]/45',
    background: 'bg-[#b7b7aa]/18',
    text: 'text-[#f3f1d9]',
  },
  FIRE: {
    border: 'border-[#ff9c54]/45',
    background: 'bg-[#ff9c54]/18',
    text: 'text-[#ffd4b4]',
  },
  WATER: {
    border: 'border-[#6ea7ff]/45',
    background: 'bg-[#6ea7ff]/18',
    text: 'text-[#dbe8ff]',
  },
  ELECTRIC: {
    border: 'border-[#f7d54b]/45',
    background: 'bg-[#f7d54b]/18',
    text: 'text-[#fff2b3]',
  },
  GRASS: {
    border: 'border-[#78d870]/45',
    background: 'bg-[#78d870]/18',
    text: 'text-[#d5ffd0]',
  },
  ICE: {
    border: 'border-[#98f1ff]/45',
    background: 'bg-[#98f1ff]/18',
    text: 'text-[#ddfbff]',
  },
  FIGHTING: {
    border: 'border-[#df6d63]/45',
    background: 'bg-[#df6d63]/18',
    text: 'text-[#ffd1c9]',
  },
  POISON: {
    border: 'border-[#c47be7]/45',
    background: 'bg-[#c47be7]/18',
    text: 'text-[#f1d6ff]',
  },
  GROUND: {
    border: 'border-[#d7b163]/45',
    background: 'bg-[#d7b163]/18',
    text: 'text-[#f9e6ba]',
  },
  FLYING: {
    border: 'border-[#8fa8ff]/45',
    background: 'bg-[#8fa8ff]/18',
    text: 'text-[#dde6ff]',
  },
  PSYCHIC: {
    border: 'border-[#ff74b8]/45',
    background: 'bg-[#ff74b8]/18',
    text: 'text-[#ffd0e6]',
  },
  BUG: {
    border: 'border-[#a8bf39]/45',
    background: 'bg-[#a8bf39]/18',
    text: 'text-[#edf8b9]',
  },
  ROCK: {
    border: 'border-[#c6ad67]/45',
    background: 'bg-[#c6ad67]/18',
    text: 'text-[#f4e7bb]',
  },
  GHOST: {
    border: 'border-[#8f7ae6]/45',
    background: 'bg-[#8f7ae6]/18',
    text: 'text-[#e1dcff]',
  },
  DRAGON: {
    border: 'border-[#8f7dff]/45',
    background: 'bg-[#8f7dff]/18',
    text: 'text-[#ddd5ff]',
  },
  DARK: {
    border: 'border-[#8d7868]/45',
    background: 'bg-[#8d7868]/18',
    text: 'text-[#e8ddd2]',
  },
  STEEL: {
    border: 'border-[#9cb8c9]/45',
    background: 'bg-[#9cb8c9]/18',
    text: 'text-[#e4f0f8]',
  },
  FAIRY: {
    border: 'border-[#f2a7da]/45',
    background: 'bg-[#f2a7da]/18',
    text: 'text-[#ffe1f2]',
  },
}

const FALLBACK = {
  border: 'border-white/18',
  background: 'bg-white/8',
  text: 'text-white/68',
}

export function getTypeChipClasses(type: string | null): string {
  const palette =
    type === null ? FALLBACK : (TYPE_PALETTE[type.toUpperCase()] ?? FALLBACK)
  return `${palette.border} ${palette.background} ${palette.text}`
}

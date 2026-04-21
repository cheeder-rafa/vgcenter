const FALLBACK_SRC = '/sprites/_unknown.png'
const SPRITE_OVERRIDES: Record<string, string> = {
  floette: 'floette-eternal',
}

export { FALLBACK_SRC }

export function resolveSpriteSources(
  speciesId: string | null,
  megaActive = false,
): string[] {
  if (speciesId === null || speciesId.trim() === '') {
    return [FALLBACK_SRC]
  }

  const spriteId = SPRITE_OVERRIDES[speciesId] ?? speciesId

  const sources = megaActive
    ? [`/sprites/${spriteId}-mega.png`, `/sprites/${spriteId}.png`]
    : [`/sprites/${spriteId}.png`]

  return [...sources, FALLBACK_SRC]
}

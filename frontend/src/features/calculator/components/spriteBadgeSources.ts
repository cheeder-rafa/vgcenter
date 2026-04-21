const FALLBACK_SRC = '/sprites/_unknown.png'

export { FALLBACK_SRC }

export function resolveSpriteSources(
  speciesId: string | null,
  megaActive = false,
): string[] {
  if (speciesId === null || speciesId.trim() === '') {
    return [FALLBACK_SRC]
  }

  const sources = megaActive
    ? [`/sprites/${speciesId}-mega.png`, `/sprites/${speciesId}.png`]
    : [`/sprites/${speciesId}.png`]

  return [...sources, FALLBACK_SRC]
}

const FALLBACK_SRC = '/sprites/_unknown.png'
const SPRITE_OVERRIDES: Record<string, string> = {
  floette: 'floette-eternal',
  aegislash: 'aegislash-shield',
  'maushold-four': 'maushold',
  mausholdfamilyoffour: 'maushold',
}

export { FALLBACK_SRC }

export function resolveSpriteId(speciesId: string | null): string | null {
  if (speciesId === null || speciesId.trim() === '') {
    return null
  }
  const normalized = speciesId.toLowerCase().replace(/[^a-z0-9-]/g, '')
  const compact = normalized.replace(/-/g, '')
  return SPRITE_OVERRIDES[normalized] ?? SPRITE_OVERRIDES[compact] ?? normalized
}

export function resolveSpriteSources(
  speciesId: string | null,
  megaActive = false,
  megaFormId: string | null = null,
): string[] {
  const resolvedSpriteId = resolveSpriteId(speciesId)
  if (resolvedSpriteId === null) {
    return [FALLBACK_SRC]
  }

  const sources = megaActive
    ? [
        ...(megaFormId ? [`/sprites/${megaFormId}.png`] : []),
        `/sprites/${resolvedSpriteId}-mega.png`,
        `/sprites/${resolvedSpriteId}.png`,
      ]
    : [`/sprites/${resolvedSpriteId}.png`]

  return [...sources, FALLBACK_SRC]
}

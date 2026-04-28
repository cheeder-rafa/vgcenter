import type { ReplayInputMode } from '../types'

const SHOWDOWN_HOST = /https?:\/\/replay\.pokemonshowdown\.com\//i
const BO3_SLUG = /regmabo3-/i

export type ReplayInputItem =
  | { kind: 'url'; value: string }
  | { kind: 'log'; value: string }

export type ReplayInputParseResult = {
  mode: ReplayInputMode
  items: ReplayInputItem[]
  errors: string[]
}

const MAX_BO3_GAMES = 3

export function parseReplayInputs(raw: string): ReplayInputParseResult {
  const trimmed = raw.trim()
  const errors: string[] = []

  if (!trimmed) {
    return { mode: 'single', items: [], errors: ['Paste a replay URL or log.'] }
  }

  // Raw protocol log heuristic: starts with `|player|` or contains `|move|` early on.
  const looksLikeLog =
    trimmed.startsWith('|') && /\|(player|move|switch|turn)\|/.test(trimmed)
  if (looksLikeLog) {
    return { mode: 'single', items: [{ kind: 'log', value: trimmed }], errors }
  }

  const tokens = trimmed
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)

  const urls: string[] = []
  for (const token of tokens) {
    if (SHOWDOWN_HOST.test(token)) {
      urls.push(token)
    } else {
      errors.push(`Not a Showdown replay URL: ${token}`)
    }
  }

  if (urls.length === 0) {
    return {
      mode: 'single',
      items: [],
      errors: errors.length
        ? errors
        : [
            'No Showdown replay URLs detected. Expected https://replay.pokemonshowdown.com/...',
          ],
    }
  }

  const isBo3 = urls.some((u) => BO3_SLUG.test(u))
  if (isBo3) {
    if (urls.length > MAX_BO3_GAMES) {
      errors.push(
        `BO3 supports at most ${MAX_BO3_GAMES} games; ignoring extras.`,
      )
    }
    return {
      mode: 'bo3',
      items: urls
        .slice(0, MAX_BO3_GAMES)
        .map((u) => ({ kind: 'url', value: u })),
      errors,
    }
  }

  if (urls.length > 1) {
    errors.push(
      'Multiple URLs detected but none look like a BO3 (regmabo3) match. Using the first.',
    )
  }
  return {
    mode: 'single',
    items: [{ kind: 'url', value: urls[0] }],
    errors,
  }
}

const SPEED_CONTROL_MOVES = new Set([
  'tailwind',
  'trick-room',
  'icy-wind',
  'electroweb',
])
const REDIRECTION_MOVES = new Set(['follow-me', 'rage-powder'])
const SCREEN_MOVES = new Set(['reflect', 'light-screen', 'aurora-veil'])
const FAKE_OUT_MOVES = new Set(['fake-out'])
const DEFENSE_SHRED_MOVES = new Set([
  'fake-tears',
  'tickle',
  'charm',
  'screech',
  'snarl',
  'parting-shot',
])
const HELPING_HAND_MOVES = new Set(['helping-hand'])

export function buildSupportTags(moveIds: (string | null)[]): string[] {
  const tags = new Set<string>()
  for (const id of moveIds) {
    if (id === null) continue
    if (SPEED_CONTROL_MOVES.has(id)) tags.add('speed-control')
    if (REDIRECTION_MOVES.has(id)) tags.add('redirection')
    if (SCREEN_MOVES.has(id)) tags.add('screens')
    if (FAKE_OUT_MOVES.has(id)) tags.add('fake-out')
    if (DEFENSE_SHRED_MOVES.has(id)) tags.add('defense-shred')
    if (HELPING_HAND_MOVES.has(id)) tags.add('helping-hand')
  }
  return Array.from(tags)
}

import { describe, expect, it } from 'vitest'

import {
  filterTournamentsByMinPlayers,
  buildSourceMetadata,
} from '../../src/features/prep/lib/snapshotFilter'

describe('filterTournamentsByMinPlayers', () => {
  const tournaments = [
    { date: '2026-04-01', name: 'Small Cup', players: 20, winner: 'A' },
    { date: '2026-04-02', name: 'Below Min', players: 39, winner: 'B' },
    { date: '2026-04-03', name: 'Exact Min', players: 40, winner: 'C' },
    { date: '2026-04-04', name: 'Above Min', players: 100, winner: 'D' },
  ]

  it('excludes tournaments below minimum', () => {
    const result = filterTournamentsByMinPlayers(tournaments, 40)
    expect(result.some((t) => t.players < 40)).toBe(false)
  })

  it('includes tournaments at exactly minimum', () => {
    const result = filterTournamentsByMinPlayers(tournaments, 40)
    expect(result.some((t) => t.players === 40)).toBe(true)
  })

  it('includes tournaments above minimum', () => {
    const result = filterTournamentsByMinPlayers(tournaments, 40)
    expect(result.some((t) => t.players === 100)).toBe(true)
  })

  it('returns empty array when none qualify', () => {
    const result = filterTournamentsByMinPlayers(tournaments, 1000)
    expect(result).toHaveLength(0)
  })

  it('preserves all fields on qualifying entries', () => {
    const result = filterTournamentsByMinPlayers(tournaments, 40)
    expect(result[0]).toMatchObject({ name: 'Exact Min', players: 40, winner: 'C' })
  })
})

describe('buildSourceMetadata', () => {
  it('includes required fields', () => {
    const meta = buildSourceMetadata('Limitless', 'https://example.com', '2026-04-29', 'players >= 40')
    expect(meta).toMatchObject({
      sourceName: 'Limitless',
      sourceUrl: 'https://example.com',
      checkedOn: '2026-04-29',
      filterPolicy: 'players >= 40',
    })
  })
})

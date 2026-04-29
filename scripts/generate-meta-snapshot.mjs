#!/usr/bin/env node
/**
 * Generates frontend/src/features/prep/data/metaSnapshot.generated.json
 *
 * Sources:
 *   Limitless – completed online Regulation M-A tournaments (last 4 weeks, players >= 40)
 *   Pikalytics – Champions Tournaments usage data
 *
 * Run: node scripts/generate-meta-snapshot.mjs
 * Commit the resulting JSON file after review.
 */

import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_PATH = path.resolve(
  __dirname,
  '../frontend/src/features/prep/data/metaSnapshot.generated.json',
)

const MINIMUM_PLAYERS = 40
const CHECKED_ON = new Date().toISOString().slice(0, 10)

const SOURCES = {
  limitless: {
    sourceName: 'Limitless Tournament Platform',
    sourceUrl:
      'https://play.limitlesstcg.com/tournaments/completed?game=VGC&format=M-A&platform=all&type=online&time=4weeks',
    checkedOn: CHECKED_ON,
    filterPolicy: `Completed online Regulation M-A tournaments from the last 4 weeks with at least ${MINIMUM_PLAYERS} players.`,
  },
  pikalytics: {
    sourceName: 'Pikalytics Champions Tournaments',
    sourceUrl: 'https://www.pikalytics.com/pokedex/championstournaments',
    checkedOn: CHECKED_ON,
    filterPolicy: 'Pokemon Champions tournament usage percentages.',
  },
}

// ---------------------------------------------------------------------------
// Limitless parser
// ---------------------------------------------------------------------------

async function fetchLimitlessTournaments() {
  const url = SOURCES.limitless.sourceUrl
  console.log(`Fetching Limitless: ${url}`)
  const res = await fetch(url, {
    headers: { 'User-Agent': 'VGCenter-MetaPipeline/1.0 (data attribution preserved)' },
  })
  if (!res.ok) throw new Error(`Limitless fetch failed: ${res.status} ${res.statusText}`)
  const html = await res.text()
  return parseLimitlessHtml(html)
}

function parseLimitlessHtml(html) {
  const rows = []
  // Match table rows containing tournament data.
  // Limitless renders a table with columns: name, date, players, winner, format.
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let rowMatch
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const row = rowMatch[1]
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      m[1].replace(/<[^>]+>/g, '').trim(),
    )
    if (cells.length < 4) continue

    // Try to find a date (YYYY-MM-DD), player count, and name.
    const dateMatch = row.match(/(\d{4}-\d{2}-\d{2})/)
    const playerMatch = cells.find((c) => /^\d+$/.test(c.trim()))
    const players = playerMatch ? parseInt(playerMatch, 10) : 0
    if (!dateMatch || players === 0) continue

    const name = cells[0]?.replace(/\s+/g, ' ').trim() || 'Unknown'
    const winner = cells.find((c, i) => i > 0 && c.length > 1 && !/^\d+$/.test(c) && c !== name) || 'Unknown'

    rows.push({ date: dateMatch[1], name, players, winner })
  }
  return rows
}

function filterTournamentsByMinPlayers(tournaments, minimumPlayers) {
  return tournaments.filter((t) => t.players >= minimumPlayers)
}

// ---------------------------------------------------------------------------
// Pikalytics parser
// ---------------------------------------------------------------------------

async function fetchPikalyticsUsage() {
  const url = SOURCES.pikalytics.sourceUrl
  console.log(`Fetching Pikalytics: ${url}`)
  const res = await fetch(url, {
    headers: { 'User-Agent': 'VGCenter-MetaPipeline/1.0 (data attribution preserved)' },
  })
  if (!res.ok) throw new Error(`Pikalytics fetch failed: ${res.status} ${res.statusText}`)
  const html = await res.text()
  return parsePikalyticsHtml(html)
}

function parsePikalyticsHtml(html) {
  const entries = []
  // Pikalytics renders usage rows with species name and percentage.
  // Each row has the species name and a usage percentage like "51.30%".
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let rank = 1
  let rowMatch
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const row = rowMatch[1]
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      m[1].replace(/<[^>]+>/g, '').trim(),
    )
    const pctCell = cells.find((c) => /^\d+\.\d+%$/.test(c.trim()))
    if (!pctCell) continue
    const usagePercent = parseFloat(pctCell)
    const nameCell = cells.find(
      (c) => c.length > 1 && !/^\d/.test(c) && !c.includes('%'),
    )
    if (!nameCell || isNaN(usagePercent)) continue
    entries.push({ rank: rank++, speciesName: nameCell, usagePercent })
  }
  return entries
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function generate() {
  let usage = []
  let qualifiedTournaments = []

  try {
    const allTournaments = await fetchLimitlessTournaments()
    qualifiedTournaments = filterTournamentsByMinPlayers(allTournaments, MINIMUM_PLAYERS)
    console.log(`Limitless: ${qualifiedTournaments.length} qualifying tournaments (of ${allTournaments.length} fetched)`)
  } catch (err) {
    console.error(`Limitless fetch error: ${err.message}`)
    console.error('Preserving existing qualifiedTournaments from current snapshot.')
    const { createRequire } = await import('node:module')
    try {
      const require = createRequire(import.meta.url)
      const existing = require(OUT_PATH)
      qualifiedTournaments = existing.qualifiedTournaments ?? []
    } catch {
      qualifiedTournaments = []
    }
  }

  try {
    usage = await fetchPikalyticsUsage()
    console.log(`Pikalytics: ${usage.length} usage entries`)
  } catch (err) {
    console.error(`Pikalytics fetch error: ${err.message}`)
    console.error('Preserving existing usage from current snapshot.')
    const { createRequire } = await import('node:module')
    try {
      const require = createRequire(import.meta.url)
      const existing = require(OUT_PATH)
      usage = existing.usage ?? []
    } catch {
      usage = []
    }
  }

  const snapshot = {
    sources: SOURCES,
    regulation: 'M-A',
    checkedOn: CHECKED_ON,
    minimumPlayers: MINIMUM_PLAYERS,
    usage,
    qualifiedTournaments,
  }

  await writeFile(OUT_PATH, JSON.stringify(snapshot, null, 2) + '\n', 'utf8')
  console.log(`Written: ${OUT_PATH}`)
  console.log('Review the snapshot before committing. Credit: Limitless + Pikalytics.')
}

generate().catch((err) => {
  console.error(err)
  process.exit(1)
})

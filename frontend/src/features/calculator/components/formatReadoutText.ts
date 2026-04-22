import type { DamageResult } from '../types/api'

type ReadoutContext = {
  attackerName: string | null
  defenderName: string | null
  moveName: string | null
  result: DamageResult
  throughProtect?: boolean
}

export function formatReadoutText({
  attackerName,
  defenderName,
  moveName,
  result,
  throughProtect = false,
}: ReadoutContext): string {
  const summary = formatSummaryText({
    attackerName,
    defenderName,
    moveName,
    result,
    throughProtect,
  })
  return `${summary}\n${formatRollsText(result)}`
}

export function formatSummaryText({
  attackerName,
  defenderName,
  moveName,
  result,
  throughProtect = false,
}: ReadoutContext): string {
  const attacker = attackerName ?? '—'
  const defender = defenderName ?? '—'
  const move = moveName ?? '—'
  const defenderSuffix = throughProtect ? ' through Protect' : ''
  const percentRange = `${result.minPct.toFixed(1)} - ${result.maxPct.toFixed(1)}%`
  const koChanceText = formatKoChance(result)
  return `${attacker} ${move} vs. ${defender}${defenderSuffix}: ${result.min}-${result.max} (${percentRange}) -- ${koChanceText}`
}

export function formatRollsText(result: DamageResult): string {
  return `(${result.rolls.join(', ')})`
}

function formatKoChance(result: DamageResult): string {
  const { description, probability, hits } = result.koChance

  if (
    description.includes('guaranteed') ||
    description.includes('chance to') ||
    description.includes('after ')
  ) {
    return description
  }

  if (probability > 0 && probability < 1) {
    return `${formatPercent(probability)} chance to ${formatHits(hits)}`
  }

  if (probability === 1) {
    return `guaranteed ${formatHits(hits)}`
  }

  return description
}

function formatPercent(probability: number): string {
  return `${(probability * 100).toFixed(2).replace(/\.00$/, '')}%`
}

function formatHits(hits: number): string {
  return hits === 1 ? 'OHKO' : `${hits}HKO`
}

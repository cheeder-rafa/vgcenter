import type { DamageResult } from '../types/api'

type ReadoutContext = {
  attackerName: string | null
  defenderName: string | null
  moveName: string | null
  result: DamageResult
}

export function formatReadoutText({
  attackerName,
  defenderName,
  moveName,
  result,
}: ReadoutContext): string {
  const attacker = attackerName ?? '—'
  const defender = defenderName ?? '—'
  const move = moveName ?? '—'
  const percentRange = `${result.minPct.toFixed(1)} - ${result.maxPct.toFixed(1)}%`
  const summary = `${attacker} ${move} vs. ${defender}: ${result.min}-${result.max} (${percentRange}) -- ${result.koChance.description}`
  const rolls = `(${result.rolls.join(', ')})`
  return `${summary}\n${rolls}`
}

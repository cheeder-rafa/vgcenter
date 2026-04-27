import type { MoveEntry } from '../components/DualMoveReadout'
import type { DamageResult } from '../types/api'

export type DiscordReportInput = {
  attackerName: string | null
  defenderName: string | null
  attackerMoves: MoveEntry[]
  defenderMoves: MoveEntry[]
}

export function formatDiscordReport({
  attackerName,
  defenderName,
  attackerMoves,
  defenderMoves,
}: DiscordReportInput): string {
  const atk = attackerName ?? '—'
  const def = defenderName ?? '—'
  const header = `**${atk} → ${def}**`

  const atkRows = buildMoveRows(attackerMoves)
  const defRows = buildMoveRows(defenderMoves)

  const sections: string[] = []

  if (atkRows.length > 0) {
    sections.push(`${atk} attacking:\n${atkRows.join('\n\n')}`)
  }

  if (defRows.length > 0) {
    sections.push(`${def} attacking:\n${defRows.join('\n\n')}`)
  }

  const body = sections.join('\n\n')
  return `${header}\n\`\`\`\n${body}\n\`\`\``
}

function buildMoveRows(moves: MoveEntry[]): string[] {
  return moves
    .filter(
      (m): m is MoveEntry & { moveName: string; result: DamageResult } =>
        m.moveName !== null && m.result !== null,
    )
    .map((m) => formatMoveRow(m.moveName, m.result))
}

function formatMoveRow(moveName: string, result: DamageResult): string {
  const range = `${result.minPct.toFixed(1)}%–${result.maxPct.toFixed(1)}%`
  const ko = result.koChance.description
  const rolls = result.rolls.join(', ')
  return `${moveName}: ${range} (${ko})\nRolls: ${rolls}`
}

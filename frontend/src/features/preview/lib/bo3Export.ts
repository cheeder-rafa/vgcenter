import type { AdaptationGuidance, GameRecord } from '../types'

const SUGGESTION_LABELS: Record<string, string> = {
  'run-it-back': 'Run it back',
  'change-lead-only': 'Change lead only',
  'change-backline': 'Change backline',
  'change-win-condition': 'Change win condition',
  'preserve-unrevealed': 'Preserve unrevealed info',
  'calculated-risk': 'Take a calculated risk',
}

function formatGameMarkdown(game: GameRecord): string {
  const lines: string[] = []
  lines.push(`### Game ${game.gameNumber}`)
  lines.push('')
  lines.push(`**Result:** ${game.result ?? 'not recorded'}`)

  if (game.myLeads) lines.push(`**My leads:** ${game.myLeads}`)
  if (game.opponentLeads)
    lines.push(`**Opponent leads:** ${game.opponentLeads}`)
  if (game.myBrought) lines.push(`**I brought:** ${game.myBrought}`)
  if (game.opponentBrought)
    lines.push(`**Opponent brought:** ${game.opponentBrought}`)

  if (game.scoutedInfo) {
    lines.push('')
    lines.push('**Scouted info:**')
    lines.push(game.scoutedInfo)
  }

  if (game.unrevealedInfo) {
    lines.push('')
    lines.push('**Unrevealed info:**')
    lines.push(game.unrevealedInfo)
  }

  if (game.resultNotes) {
    lines.push('')
    lines.push('**Key plays:**')
    lines.push(game.resultNotes)
  }

  if (game.opponentBehavior) {
    const label = {
      'ran-it-back': 'Ran it back',
      adjusted: 'Adjusted',
      'new-mode': 'Showed a new mode',
    }[game.opponentBehavior]
    lines.push('')
    lines.push(`**Opponent between games:** ${label}`)
  }

  return lines.join('\n')
}

export function exportAsMarkdown(
  games: GameRecord[],
  guidance: AdaptationGuidance | null,
): string {
  const sections: string[] = []

  sections.push('# BO3 Adaptation Notebook')
  sections.push('')

  for (const game of games) {
    sections.push(formatGameMarkdown(game))
    sections.push('')
  }

  if (guidance !== null && guidance.suggestions.length > 0) {
    sections.push('## Adaptation Guidance')
    sections.push('')
    sections.push('**Suggestions:**')
    for (const s of guidance.suggestions) {
      sections.push(`- ${SUGGESTION_LABELS[s] ?? s}`)
    }
    sections.push('')
    sections.push('**Reasoning:**')
    for (const r of guidance.reasoning) {
      sections.push(`- ${r}`)
    }
  }

  return sections.join('\n').trimEnd()
}

export function exportAsJson(
  games: GameRecord[],
  guidance: AdaptationGuidance | null,
): string {
  return JSON.stringify({ games, guidance }, null, 2)
}

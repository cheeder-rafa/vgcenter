import { copyDamageReport } from '../../calculator/components/copyDamageReport'
import type { GameplanMatchupCell, TurnOneFlags } from '../types/api'

type Props = {
  cells: GameplanMatchupCell[]
  gamePlanNote: string
  opponentArchetypeTag: string
  winConditionSpeciesId: string | null
  mineAssumedForms: Record<string, string[]>
  opponentAssumedForms: Record<string, string[]>
  mineNameById: Record<string, string>
  opponentNameById: Record<string, string>
}

function flagSummary(flags: TurnOneFlags): string {
  const out = []
  if (flags.protect) out.push('Protect')
  if (flags.redirection) out.push('Redirection')
  if (flags.fakeOut) out.push('Fake Out')
  if (flags.priority) out.push('Priority')
  if (flags.speedControl !== 'NONE') out.push(flags.speedControl)
  return out.length === 0 ? 'none' : out.join(', ')
}

function cellPair(
  cell: GameplanMatchupCell,
  opponentNameById: Record<string, string>,
): string {
  return cell.opponentLeadSpeciesIds
    .map((id) => opponentNameById[id] ?? id)
    .join(' + ')
}

function scoreSummary(cells: GameplanMatchupCell[]) {
  if (cells.length === 0) return { average: 0, best: null, worst: null }
  const totals = cells.map((cell) => cell.score.total)
  return {
    average: totals.reduce((sum, score) => sum + score, 0) / totals.length,
    best: Math.max(...totals),
    worst: Math.min(...totals),
  }
}

function buildReport(props: Props): string {
  const summary = scoreSummary(props.cells)
  const heatmapRows = props.cells
    .map(
      (cell) =>
        `| ${cellPair(cell, props.opponentNameById)} | ${cell.score.total} | ${cell.score.offense} | ${cell.score.defense} | ${cell.score.speed} | ${cell.score.immunity} | ${flagSummary(cell.mineFlags)} | ${flagSummary(cell.opponentFlags)} |`,
    )
    .join('\n')
  const payload = {
    scoreSummary: summary,
    heatmap: props.cells,
    flagsLegend: {
      protect: 'Protect available',
      redirection: 'Follow Me / Rage Powder available',
      fakeOut: 'Fake Out pressure',
      priority: 'Priority move available',
      speedControl: 'Tailwind or Trick Room available',
    },
    gamePlanNote: props.gamePlanNote,
    opponentArchetypeTag: props.opponentArchetypeTag,
    winConditionTag:
      props.winConditionSpeciesId === null
        ? null
        : (props.mineNameById[props.winConditionSpeciesId] ??
          props.winConditionSpeciesId),
    assumedForms: {
      mine: props.mineAssumedForms,
      opponent: props.opponentAssumedForms,
    },
  }

  return `# Gameplan Report

## Score summary
- Average score: ${summary.average.toFixed(1)}
- Best cell: ${summary.best ?? 'n/a'}
- Worst cell: ${summary.worst ?? 'n/a'}
- Opponent archetype: ${props.opponentArchetypeTag || 'n/a'}
- Win condition: ${
    props.winConditionSpeciesId === null
      ? 'n/a'
      : (props.mineNameById[props.winConditionSpeciesId] ??
        props.winConditionSpeciesId)
  }

## Game-plan note
${props.gamePlanNote || 'n/a'}

## Heatmap
| Opponent leads | Total | Offense | Defense | Speed | Immunity | Mine flags | Opponent flags |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
${heatmapRows}

## Flags legend
- PRO: Protect available
- RED: Follow Me / Rage Powder available
- FO: Fake Out pressure
- PRI: Priority move available
- TW/TR: Tailwind or Trick Room available

## JSON
\`\`\`json
${JSON.stringify(payload, null, 2)}
\`\`\`
`
}

export function ReportExportButton(props: Props) {
  return (
    <button
      type="button"
      disabled={props.cells.length === 0}
      onClick={() => copyDamageReport(buildReport(props))}
      className="rounded border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-40"
    >
      Export report
    </button>
  )
}

import { memo, useMemo } from 'react'

import type { GameplanMatchupCell, TurnOneFlags } from '../types/api'

type Severity =
  | 'strong-advantage'
  | 'advantage'
  | 'even'
  | 'disadvantage'
  | 'strong-disadvantage'

function classifySeverity(total: number): Severity {
  if (total >= 50) return 'strong-advantage'
  if (total >= 15) return 'advantage'
  if (total > -15) return 'even'
  if (total > -50) return 'disadvantage'
  return 'strong-disadvantage'
}

const SEVERITY_LABEL: Record<Severity, string> = {
  'strong-advantage': 'strong advantage',
  advantage: 'advantage',
  even: 'even',
  disadvantage: 'disadvantage',
  'strong-disadvantage': 'strong disadvantage',
}

const SEVERITY_GLYPH: Record<Severity, string> = {
  'strong-advantage': '▲▲',
  advantage: '▲',
  even: '◆',
  disadvantage: '▽',
  'strong-disadvantage': '▽▽',
}

const SEVERITY_SCORE_CLASS: Record<Severity, string> = {
  'strong-advantage': 'text-arena-cyan',
  advantage: 'text-arena-mint',
  even: 'text-arena-violet',
  disadvantage: 'text-arena-ember',
  'strong-disadvantage': 'text-arena-plasma',
}

type FlagBadge = { key: string; label: string; title: string }

function collectFlagBadges(
  mine: TurnOneFlags,
  opponent: TurnOneFlags,
): FlagBadge[] {
  const out: FlagBadge[] = []
  const anyProtect = mine.protect || opponent.protect
  const anyRedirection = mine.redirection || opponent.redirection
  const anyFakeOut = mine.fakeOut || opponent.fakeOut
  const anyPriority = mine.priority || opponent.priority
  const speed =
    mine.speedControl !== 'NONE' ? mine.speedControl : opponent.speedControl

  if (anyProtect)
    out.push({ key: 'pro', label: 'PRO', title: 'Protect available' })
  if (anyRedirection)
    out.push({
      key: 'red',
      label: 'RED',
      title: 'Redirection (Follow Me / Rage Powder)',
    })
  if (anyFakeOut)
    out.push({ key: 'fo', label: 'FO', title: 'Fake Out on turn 1' })
  if (anyPriority)
    out.push({ key: 'pri', label: 'PRI', title: 'Priority move available' })
  if (speed === 'TAILWIND')
    out.push({ key: 'tw', label: 'TW', title: 'Tailwind (speed control)' })
  if (speed === 'TRICK_ROOM')
    out.push({ key: 'tr', label: 'TR', title: 'Trick Room (speed control)' })
  return out
}

type CellProps = {
  cell: GameplanMatchupCell
  index: number
  selected: boolean
  onSelect: (index: number) => void
  opponentNameById: Record<string, string>
}

const MatchupCellButton = memo(function MatchupCellButton({
  cell,
  index,
  selected,
  onSelect,
  opponentNameById,
}: CellProps) {
  const severity = classifySeverity(cell.score.total)
  const flags = collectFlagBadges(cell.mineFlags, cell.opponentFlags)
  const pair = cell.opponentLeadSpeciesIds
    .map((id) => opponentNameById[id] ?? id)
    .join(' + ')

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${pair}: ${SEVERITY_LABEL[severity]}, score ${cell.score.total}`}
      onClick={() => onSelect(index)}
      data-severity={severity}
      className="arena-cell flex min-w-[9rem] flex-col items-start gap-1 rounded px-3 py-2.5 text-left"
      style={{ '--cell-i': index } as React.CSSProperties}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span
          className={`font-mono text-lg font-bold leading-none ${SEVERITY_SCORE_CLASS[severity]}`}
        >
          {cell.score.total}
        </span>
        <span
          aria-hidden="true"
          className="font-mono text-xs text-white/40"
          title={SEVERITY_LABEL[severity]}
        >
          {SEVERITY_GLYPH[severity]}
        </span>
      </div>
      <div className="truncate text-xs text-white/50">{pair}</div>
      {flags.length > 0 && (
        <div className="mt-0.5 flex flex-wrap gap-1">
          {flags.map((f) => (
            <span
              key={f.key}
              title={f.title}
              className="arena-chip py-0.5 text-white/60"
            >
              {f.label}
            </span>
          ))}
        </div>
      )}
    </button>
  )
})

type Props = {
  cells: GameplanMatchupCell[]
  selectedCellIndex: number | null
  onSelectCell: (index: number) => void
  opponentNameById: Record<string, string>
}

export function MatchupMatrix({
  cells,
  selectedCellIndex,
  onSelectCell,
  opponentNameById,
}: Props) {
  const content = useMemo(
    () =>
      cells.map((cell, i) => (
        <MatchupCellButton
          key={`${cell.firstOpponentIndex}-${cell.secondOpponentIndex}`}
          cell={cell}
          index={i}
          selected={selectedCellIndex === i}
          onSelect={onSelectCell}
          opponentNameById={opponentNameById}
        />
      )),
    [cells, selectedCellIndex, onSelectCell, opponentNameById],
  )

  return (
    <div
      role="grid"
      aria-label="Opponent lead-pair matchups"
      className="grid grid-cols-3 gap-2 md:grid-cols-5"
    >
      {content}
    </div>
  )
}

import { DamageBar } from '../../calculator/components/DamageBar'
import { RollHeatmap } from '../../calculator/components/RollHeatmap'
import type { GameplanDamageOption, GameplanMatchupCell } from '../types/api'

type Props = {
  cell: GameplanMatchupCell | null
  mineNameById: Record<string, string>
  opponentNameById: Record<string, string>
}

type Side = 'outgoing' | 'incoming'

function OptionRow({
  option,
  side,
  mineNameById,
  opponentNameById,
}: {
  option: GameplanDamageOption
  side: Side
  mineNameById: Record<string, string>
  opponentNameById: Record<string, string>
}) {
  const { damage } = option
  const attackerName =
    side === 'outgoing'
      ? (mineNameById[`slot-${option.attackerIndex}`] ??
        `Mine #${option.attackerIndex + 1}`)
      : (opponentNameById[`slot-${option.attackerIndex}`] ??
        `Opp #${option.attackerIndex + 1}`)
  const defenderName =
    side === 'outgoing'
      ? (opponentNameById[`slot-${option.defenderIndex}`] ??
        `Opp #${option.defenderIndex + 1}`)
      : (mineNameById[`slot-${option.defenderIndex}`] ??
        `Mine #${option.defenderIndex + 1}`)

  return (
    <li className="arena-panel flex flex-col gap-2 p-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-sm font-semibold text-white">
            {option.moveId}
          </span>
          <span className="text-xs text-white/45">
            {attackerName} → {defenderName}
          </span>
        </div>
        <span className="font-mono text-xs text-white/55">
          {damage.minPct.toFixed(1)}% – {damage.maxPct.toFixed(1)}%
        </span>
      </div>
      <DamageBar minPct={damage.minPct} maxPct={damage.maxPct} />
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>{damage.koChance.description}</span>
        <span className="font-mono">
          {damage.min}–{damage.max} HP
        </span>
      </div>
      <RollHeatmap
        rolls={damage.rolls}
        defenderHp={100}
        koChancePct={Math.round(damage.koChance.probability * 100)}
        defenderName={defenderName}
      />
    </li>
  )
}

const SCORE_ENTRIES: {
  key: keyof GameplanMatchupCell['score']
  label: string
  delay: number
}[] = [
  { key: 'total', label: 'Total', delay: 0 },
  { key: 'offense', label: 'Offense', delay: 55 },
  { key: 'defense', label: 'Defense', delay: 110 },
  { key: 'speed', label: 'Speed', delay: 165 },
  { key: 'immunity', label: 'Immunity', delay: 220 },
]

function ScoreBreakdown({ score }: { score: GameplanMatchupCell['score'] }) {
  return (
    <div
      role="group"
      aria-label="Score breakdown"
      className="grid grid-cols-5 gap-2"
    >
      {SCORE_ENTRIES.map((entry) => {
        const value = score[entry.key]
        const positive = value >= 0
        const barPct = Math.max(0, Math.min(100, 50 + value * 0.8))
        return (
          <div
            key={entry.key}
            className="arena-panel flex flex-col gap-2 p-2.5"
          >
            <span className="arena-label text-[9px] text-white/40">
              {entry.label}
            </span>
            <span
              className={`font-mono text-lg font-bold leading-none ${positive ? 'text-arena-cyan' : 'text-arena-plasma'}`}
            >
              {value}
            </span>
            {entry.key !== 'total' && (
              <div className="h-px overflow-hidden rounded-full bg-white/10">
                <div
                  className="score-bar-fill h-full rounded-full"
                  style={
                    {
                      width: `${barPct}%`,
                      '--bar-delay': `${entry.delay}ms`,
                      background: positive
                        ? 'oklch(75% 0.15 200)'
                        : 'oklch(65% 0.22 350)',
                    } as React.CSSProperties
                  }
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function MatchupDrilldown({
  cell,
  mineNameById,
  opponentNameById,
}: Props) {
  if (cell === null) {
    return (
      <div className="rounded border border-dashed border-white/10 p-8 text-center text-sm text-white/40">
        Select a cell in the matrix to see the matchup breakdown.
      </div>
    )
  }

  const pairLabel = cell.opponentLeadSpeciesIds
    .map((id) => opponentNameById[id] ?? id)
    .join(' + ')

  return (
    <section
      key={`${cell.firstOpponentIndex}-${cell.secondOpponentIndex}`}
      className="drilldown-content flex flex-col gap-4"
    >
      <header className="flex items-baseline justify-between">
        <h3 className="arena-label text-white/80">vs. {pairLabel}</h3>
        <span className="font-mono text-xs text-white/35">
          cell #{cell.firstOpponentIndex}-{cell.secondOpponentIndex}
        </span>
      </header>

      <ScoreBreakdown score={cell.score} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h4 className="arena-label text-[9px] text-white/45">
            Outgoing (mine → opponent)
          </h4>
          {cell.outgoing.length === 0 ? (
            <p className="text-xs text-white/35">No outgoing damage options.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {cell.outgoing.map((option, i) => (
                <OptionRow
                  key={`out-${i}-${option.moveId}`}
                  option={option}
                  side="outgoing"
                  mineNameById={mineNameById}
                  opponentNameById={opponentNameById}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="arena-label text-[9px] text-white/45">
            Incoming (opponent → mine)
          </h4>
          {cell.incoming.length === 0 ? (
            <p className="text-xs text-white/35">No incoming damage options.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {cell.incoming.map((option, i) => (
                <OptionRow
                  key={`in-${i}-${option.moveId}`}
                  option={option}
                  side="incoming"
                  mineNameById={mineNameById}
                  opponentNameById={opponentNameById}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

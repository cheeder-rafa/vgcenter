import { DamageBar } from '../../calculator/components/DamageBar'
import { RollHeatmap } from '../../calculator/components/RollHeatmap'
import type {
  GameplanDamageOption,
  GameplanMatchupCell,
} from '../types/api'

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
      ? mineNameById[`slot-${option.attackerIndex}`] ??
        `Mine #${option.attackerIndex + 1}`
      : opponentNameById[`slot-${option.attackerIndex}`] ??
        `Opp #${option.attackerIndex + 1}`
  const defenderName =
    side === 'outgoing'
      ? opponentNameById[`slot-${option.defenderIndex}`] ??
        `Opp #${option.defenderIndex + 1}`
      : mineNameById[`slot-${option.defenderIndex}`] ??
        `Mine #${option.defenderIndex + 1}`

  return (
    <li className="flex flex-col gap-2 rounded border border-white/10 bg-arena-surface/60 p-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-mono text-sm text-white">{option.moveId}</span>
          <span className="text-xs text-white/50">
            {attackerName} → {defenderName}
          </span>
        </div>
        <span className="font-mono text-xs text-white/70">
          {damage.minPct.toFixed(1)}% – {damage.maxPct.toFixed(1)}%
        </span>
      </div>
      <DamageBar minPct={damage.minPct} maxPct={damage.maxPct} />
      <div className="flex items-center justify-between text-xs text-white/55">
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

function ScoreBreakdown({
  score,
}: {
  score: GameplanMatchupCell['score']
}) {
  const entries: { key: string; label: string; value: number }[] = [
    { key: 'total', label: 'Total', value: score.total },
    { key: 'offense', label: 'Offense', value: score.offense },
    { key: 'defense', label: 'Defense', value: score.defense },
    { key: 'speed', label: 'Speed', value: score.speed },
    { key: 'immunity', label: 'Immunity', value: score.immunity },
  ]
  return (
    <div
      role="group"
      aria-label="Score breakdown"
      className="grid grid-cols-5 gap-2"
    >
      {entries.map((entry) => (
        <div
          key={entry.key}
          className="flex flex-col items-center rounded border border-white/10 bg-arena-surface/60 p-2"
        >
          <span className="text-[10px] uppercase tracking-widest text-white/50">
            {entry.label}
          </span>
          <span className="font-mono text-lg text-white">{entry.value}</span>
        </div>
      ))}
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
      <div className="rounded border border-dashed border-white/15 p-8 text-center text-sm text-white/40">
        Select a cell in the matrix to see the matchup breakdown.
      </div>
    )
  }

  const pairLabel = cell.opponentLeadSpeciesIds
    .map((id) => opponentNameById[id] ?? id)
    .join(' + ')

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70">
          vs. {pairLabel}
        </h3>
        <span className="font-mono text-xs text-white/50">
          cell #{cell.firstOpponentIndex}-{cell.secondOpponentIndex}
        </span>
      </header>

      <ScoreBreakdown score={cell.score} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h4 className="text-xs uppercase tracking-widest text-white/55">
            Outgoing (mine → opponent)
          </h4>
          {cell.outgoing.length === 0 ? (
            <p className="text-xs text-white/40">No outgoing damage options.</p>
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
          <h4 className="text-xs uppercase tracking-widest text-white/55">
            Incoming (opponent → mine)
          </h4>
          {cell.incoming.length === 0 ? (
            <p className="text-xs text-white/40">No incoming damage options.</p>
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

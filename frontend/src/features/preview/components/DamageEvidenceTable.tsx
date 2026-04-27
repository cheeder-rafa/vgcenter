import { getTypeChipClasses } from '../../calculator/components/typeColors'
import type { DamageEvidenceEntry } from '../types'

type DamageEvidenceTableProps = {
  outgoing: DamageEvidenceEntry[]
  incoming: DamageEvidenceEntry[]
}

export function DamageEvidenceTable({
  outgoing,
  incoming,
}: DamageEvidenceTableProps) {
  const hasData = outgoing.length > 0 || incoming.length > 0

  if (!hasData) {
    return (
      <div className="rounded border border-white/8 bg-black/14 px-3 py-3">
        <p className="arena-label text-white/32">Damage evidence</p>
        <p className="mt-2 text-xs text-white/32">
          No damage data for this matchup.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded border border-white/8 bg-black/14 px-3 py-3">
      <p className="arena-label text-white/48">Damage evidence</p>
      <div className="mt-2 grid gap-1">
        {outgoing.map((entry, i) => (
          <EvidenceRow key={`out-${i}`} entry={entry} />
        ))}
        {incoming.map((entry, i) => (
          <EvidenceRow key={`in-${i}`} entry={entry} />
        ))}
      </div>
    </div>
  )
}

function EvidenceRow({ entry }: { entry: DamageEvidenceEntry }) {
  const isOutgoing = entry.selectedAttacking
  const accentClass = isOutgoing ? 'text-arena-cyan' : 'text-arena-plasma'
  const dotClass = isOutgoing ? 'bg-arena-cyan/60' : 'bg-arena-plasma/60'

  const koPct = Math.round(entry.koProbability * 100)
  const isOhko =
    entry.koLabel.toLowerCase().includes('ohko') ||
    entry.koLabel.toLowerCase().includes('1hko')
  const is2hko = entry.koLabel.toLowerCase().includes('2hko')

  return (
    <div className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-white/[0.03]">
      <span
        className={`mt-0.5 h-1.5 w-1.5 shrink-0 self-start rounded-full ${dotClass}`}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span
            className={`font-mono text-[0.7rem] font-semibold ${accentClass}`}
          >
            {entry.attackerName}
          </span>
          <span className="text-[0.65rem] text-white/30">→</span>
          <span className="font-mono text-[0.7rem] text-white/65">
            {entry.defenderName}
          </span>

          <span
            className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.1em] ${getTypeChipClasses(entry.moveType)}`}
          >
            {entry.moveType}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-2">
          <span className="font-mono text-[0.72rem] font-black text-white/90 tabular-nums">
            {entry.minPct.toFixed(1)}–{entry.maxPct.toFixed(1)}%
          </span>

          {koPct > 0 && (
            <KoBadge
              label={entry.koLabel}
              pct={koPct}
              isOhko={isOhko}
              is2hko={is2hko}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function KoBadge({
  label,
  pct,
  isOhko,
  is2hko,
}: {
  label: string
  pct: number
  isOhko: boolean
  is2hko: boolean
}) {
  const colorClass = isOhko
    ? 'border-arena-plasma/40 bg-arena-plasma/12 text-arena-plasma'
    : is2hko
      ? 'border-arena-sun/35 bg-arena-sun/10 text-arena-sun'
      : 'border-white/14 bg-white/[0.05] text-white/50'

  const displayLabel =
    pct >= 99
      ? label.replace(/guaranteed /i, '').toUpperCase()
      : `${pct}% ${label.replace(/guaranteed /i, '').toUpperCase()}`

  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[0.6rem] tracking-[0.08em] ${colorClass}`}
    >
      {displayLabel}
    </span>
  )
}

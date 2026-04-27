import { useState } from 'react'

import {
  useCalcHistoryStore,
  type HistoryEntry,
} from '../store/useCalcHistoryStore'
import { useCalculatorStore } from '../store/useCalculatorStore'

function restoreEntry(entry: HistoryEntry) {
  const { setAttacker, setDefender, setField, setAttackerSide, setDefenderSide } =
    useCalculatorStore.getState()
  const { snapshot } = entry
  setAttacker(snapshot.attacker)
  setDefender(snapshot.defender)
  setField(snapshot.field)
  setAttackerSide(snapshot.attackerSide)
  setDefenderSide(snapshot.defenderSide)
  useCalculatorStore.setState({
    criticalHit: snapshot.criticalHit,
    targets: snapshot.targets,
  })
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function HistoryPanel() {
  const entries = useCalcHistoryStore((s) => s.entries)
  const clear = useCalcHistoryStore((s) => s.clear)
  const [open, setOpen] = useState(false)

  if (entries.length === 0) return null

  return (
    <div className="relative" data-testid="history-panel">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="arena-chip cursor-pointer text-arena-violet transition hover:bg-arena-violet/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan"
          aria-expanded={open}
        >
          <span className="tabular-nums">{entries.length} calcs</span>
          <span
            className="ml-1 inline-block transition-transform duration-150"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>

        {open && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear calc history"
            className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/30 transition hover:text-white/60 focus-visible:outline focus-visible:outline-1 focus-visible:outline-arena-cyan"
          >
            clear
          </button>
        )}
      </div>

      {open && (
        <ul
          className="absolute left-0 top-full z-20 mt-1 flex max-h-72 w-72 flex-col gap-0.5 overflow-y-auto rounded-sm border border-white/10 bg-[#0d0d18] p-1 shadow-xl"
          role="list"
        >
          {entries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => restoreEntry(entry)}
                aria-label={`${entry.attackerName ?? entry.attackerSpeciesId} vs ${entry.defenderName ?? entry.defenderSpeciesId}`}
                className="group flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-1 focus-visible:outline-arena-violet"
              >
                <span className="font-mono text-[0.55rem] tabular-nums text-white/25 shrink-0">
                  {formatTime(entry.timestamp)}
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
                  <span className="truncate font-display text-xs font-semibold text-white/85">
                    {entry.attackerName ?? entry.attackerSpeciesId}
                  </span>
                  <span className="font-mono text-[0.6rem] text-white/30 shrink-0">→</span>
                  <span className="truncate font-display text-xs font-semibold text-white/85">
                    {entry.defenderName ?? entry.defenderSpeciesId}
                  </span>
                </span>
                {entry.summary.topMoveMaxPercent !== null && (
                  <span className="shrink-0 font-mono text-[0.6rem] tabular-nums text-arena-plasma/80">
                    {entry.summary.topMoveMaxPercent.toFixed(1)}%
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

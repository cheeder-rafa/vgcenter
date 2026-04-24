import { useMemo, useState } from 'react'

import type { LeadEvaluationResult, LeadMatchup, LeadOption } from '../types'

type LeadLabProps = {
  selectedLeadIds: [string | null, string | null]
  onSelectedLeadIdsChange: (ids: [string | null, string | null]) => void
  mine: LeadOption[]
  opponentCount: number
  result: LeadEvaluationResult | null
  status: 'idle' | 'loading' | 'success' | 'error'
  error?: string | null
  onEvaluate: () => void
}

export function LeadLab({
  selectedLeadIds,
  onSelectedLeadIdsChange,
  mine,
  opponentCount,
  result,
  status,
  error,
  onEvaluate,
}: LeadLabProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const activeKey =
    result?.matchups.some((matchup) => matchupKey(matchup) === selectedKey) ===
    true
      ? selectedKey
      : result?.matchups[0]
        ? matchupKey(result.matchups[0])
        : null

  const activeMatchup = useMemo(
    () =>
      result?.matchups.find((matchup) => matchupKey(matchup) === activeKey) ??
      result?.matchups[0] ??
      null,
    [activeKey, result],
  )

  const canEvaluate =
    selectedLeadIds.every((id): id is string => id !== null) &&
    opponentCount === 6

  function setLead(index: 0 | 1, speciesId: string) {
    const next: [string | null, string | null] = [...selectedLeadIds]
    next[index] = speciesId || null
    onSelectedLeadIdsChange(next)
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(280px,0.38fr)_minmax(0,1fr)]">
      <aside className="arena-panel arena-panel--cyan p-4">
        <div className="relative z-10 space-y-4">
          <div>
            <p className="arena-label text-arena-cyan">Preview Coach</p>
            <h2 className="mt-2 text-2xl font-black tracking-wide text-white">
              Lead Lab
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/68">
              Pick two saved leads. Lead Lab checks every opponent pair.
            </p>
          </div>

          <div className="grid gap-3">
            <LeadSelect
              label="Lead 1"
              value={selectedLeadIds[0]}
              options={mine}
              onChange={(value) => setLead(0, value)}
            />
            <LeadSelect
              label="Lead 2"
              value={selectedLeadIds[1]}
              options={mine}
              onChange={(value) => setLead(1, value)}
            />
          </div>

          <div className="rounded border border-white/10 bg-black/18 p-3">
            <p className="arena-label text-white/45">Opponent rail</p>
            <p className="mt-1 font-mono text-sm text-white/78">
              {opponentCount}/6 Pokemon loaded
            </p>
          </div>

          <button
            type="button"
            className="arena-button h-11 w-full justify-center text-white disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!canEvaluate || status === 'loading'}
            onClick={onEvaluate}
          >
            {status === 'loading' ? 'Evaluating…' : 'Evaluate leads'}
          </button>

          {status === 'error' ? (
            <p className="rounded border border-arena-plasma/30 bg-arena-plasma/10 px-3 py-2 text-sm text-white/78">
              {error ?? 'Lead evaluation failed. Check saved teams and moves.'}
            </p>
          ) : null}
        </div>
      </aside>

      <div className="grid gap-4">
        <LeadMatrix
          matchups={result?.matchups ?? []}
          activeKey={activeMatchup ? matchupKey(activeMatchup) : null}
          onSelect={setSelectedKey}
        />
        <LeadDrilldown matchup={activeMatchup} status={status} />
      </div>
    </section>
  )
}

function LeadSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string | null
  options: LeadOption[]
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-2">
      <span className="arena-label text-white/55">{label}</span>
      <select
        className="min-h-11 rounded border border-white/10 bg-arena-surface px-3 text-sm text-white outline-none transition focus-visible:border-arena-cyan/70 focus-visible:ring-2 focus-visible:ring-arena-cyan/25"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Choose lead</option>
        {options.map((option) => (
          <option key={option.speciesId} value={option.speciesId}>
            {option.speciesName}
          </option>
        ))}
      </select>
    </label>
  )
}

function LeadMatrix({
  matchups,
  activeKey,
  onSelect,
}: {
  matchups: LeadMatchup[]
  activeKey: string | null
  onSelect: (key: string) => void
}) {
  return (
    <div className="arena-panel arena-panel--plasma p-4">
      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="arena-label text-arena-plasma">All opponent pairs</p>
            <h3 className="mt-1 text-lg font-black text-white">Matrix</h3>
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/45">
            {matchups.length}/15
          </span>
        </div>

        <div
          className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3"
          role="grid"
          aria-label="Lead matchup matrix"
        >
          {matchups.length === 0 ? (
            <div className="rounded border border-white/10 bg-black/16 p-4 text-sm text-white/62">
              Save two player leads and six opponents, then evaluate.
            </div>
          ) : (
            matchups.map((matchup) => {
              const key = matchupKey(matchup)
              return (
                <button
                  key={key}
                  type="button"
                  className={`min-h-[112px] rounded border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arena-cyan/35 ${
                    key === activeKey
                      ? 'border-arena-cyan/70 bg-arena-cyan/12'
                      : 'border-white/10 bg-black/18 hover:border-white/24 hover:bg-white/[0.06]'
                  }`}
                  onClick={() => onSelect(key)}
                >
                  <p className="truncate text-sm font-black text-white">
                    {matchup.opponentLeadNames.join(' + ')}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <MetricPill metric={matchup.koPressure} compact />
                    <MetricPill metric={matchup.incomingDanger} compact />
                    <MetricPill metric={matchup.doubleUpPressure} compact />
                    <MetricPill metric={matchup.speedComparison} compact />
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

function LeadDrilldown({
  matchup,
  status,
}: {
  matchup: LeadMatchup | null
  status: LeadLabProps['status']
}) {
  if (matchup === null) {
    return (
      <section className="rounded border border-white/10 bg-arena-panel/85 p-4 text-sm text-white/62">
        {status === 'loading'
          ? 'Building lead readout.'
          : 'Select a matrix result to inspect turn-1 pressure.'}
      </section>
    )
  }

  return (
    <section className="arena-panel p-4" aria-label="Lead matchup drilldown">
      <div className="relative z-10 grid gap-4 lg:grid-cols-[0.8fr_1fr]">
        <div>
          <p className="arena-label text-arena-sun">Drilldown</p>
          <h3 className="mt-1 text-xl font-black text-white">
            {matchup.opponentLeadNames.join(' + ')}
          </h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <MetricPill metric={matchup.koPressure} />
            <MetricPill metric={matchup.twoHitKoPressure} />
            <MetricPill metric={matchup.doubleUpPressure} />
            <MetricPill metric={matchup.incomingDanger} />
            <MetricPill metric={matchup.speedComparison} />
          </div>
        </div>

        <div className="grid gap-3">
          <ReadoutList title="Must react" items={matchup.mustReactLabels} />
          <ReadoutList
            title="Turn 1 notes"
            items={matchup.turnOneAnnotations}
          />
        </div>
      </div>
    </section>
  )
}

function MetricPill({
  metric,
  compact = false,
}: {
  metric: LeadMatchup['koPressure']
  compact?: boolean
}) {
  const toneClass = {
    low: 'border-white/10 bg-white/[0.04] text-white/62',
    medium: 'border-arena-sun/35 bg-arena-sun/10 text-arena-sun',
    high: 'border-arena-plasma/35 bg-arena-plasma/10 text-white',
  }[metric.tone]

  return (
    <div className={`rounded border px-3 py-2 ${toneClass}`}>
      <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] opacity-75">
        {metric.label}
      </p>
      <p
        className={
          compact ? 'mt-1 text-sm font-black' : 'mt-1 text-xl font-black'
        }
      >
        {metric.value}
      </p>
    </div>
  )
}

function ReadoutList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded border border-white/10 bg-black/18 p-3">
      <p className="arena-label text-white/48">{title}</p>
      <ul className="mt-2 grid gap-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-6 text-white/76">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function matchupKey(matchup: Pick<LeadMatchup, 'opponentLeadIds'>) {
  return matchup.opponentLeadIds.join('__')
}

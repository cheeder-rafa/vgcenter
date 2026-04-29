import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { usePreviewModeStore } from '../store/usePreviewModeStore'
import type {
  LeadEvaluationResult,
  LeadMatchup,
  LeadOption,
  PreviewField,
  Verdict,
} from '../types'
import { hydrateFromMatchup } from '../lib/hydrateFromMatchup'
import { DamageEvidenceTable } from './DamageEvidenceTable'

type LeadLabProps = {
  selectedLeadIds: [string | null, string | null]
  onSelectedLeadIdsChange: (ids: [string | null, string | null]) => void
  mine: LeadOption[]
  opponentCount: number
  result: LeadEvaluationResult | null
  status: 'idle' | 'loading' | 'success' | 'error'
  error?: string | null
  onEvaluate: () => void
  field: PreviewField
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
  field,
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
              Pick two of your leads. Lead Lab runs them against all 15 possible
              opponent pairs and shows how each matchup looks on turn 1.
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
          matrixSummary={result?.matrixSummary ?? null}
          activeKey={activeMatchup ? matchupKey(activeMatchup) : null}
          onSelect={setSelectedKey}
        />
        <LeadDrilldown
          matchup={activeMatchup}
          status={status}
          selectedLeadIds={selectedLeadIds}
          field={field}
        />
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
        className="min-h-11 rounded border border-white/10 bg-arena-night/60 px-3 text-sm text-white outline-none transition focus-visible:border-arena-cyan/70 focus-visible:ring-2 focus-visible:ring-arena-cyan/25"
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
  matrixSummary,
  activeKey,
  onSelect,
}: {
  matchups: LeadMatchup[]
  matrixSummary: Verdict | null
  activeKey: string | null
  onSelect: (key: string) => void
}) {
  const mode = usePreviewModeStore((s) => s.mode)
  const beginner = mode === 'beginner'
  const [showNumbers, setShowNumbers] = useState(false)
  const showPills = !beginner || showNumbers

  return (
    <div className="arena-panel arena-panel--plasma p-4">
      <div className="relative z-10">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="arena-label text-arena-plasma">All opponent pairs</p>
            <h3 className="mt-1 text-lg font-black text-white">Matrix</h3>
            {matrixSummary ? (
              <div className="mt-2 max-w-prose">
                <p className="text-base font-semibold text-white">
                  {matrixSummary.headline}
                </p>
                {matrixSummary.subline ? (
                  <p className="mt-0.5 text-sm text-white/72">
                    {matrixSummary.subline}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/45">
            {matchups.length}/15
          </span>
        </div>

        {beginner && matchups.length > 0 ? (
          <button
            type="button"
            aria-expanded={showNumbers}
            onClick={() => setShowNumbers((v) => !v)}
            className="mb-3 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-arena-cyan/80 hover:text-arena-cyan"
          >
            {showNumbers ? 'Hide numbers' : 'Show numbers ▸'}
          </button>
        ) : null}
        {showPills ? <ToneLegend /> : null}

        <div
          className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3"
          role="grid"
          aria-label="Lead matchup matrix"
        >
          {matchups.length === 0 ? (
            <div className="rounded border border-white/10 bg-black/16 p-4">
              <p className="text-sm font-medium text-white/62">
                No results yet
              </p>
              <p className="mt-1 text-xs leading-5 text-white/40">
                Select two of your leads and make sure six opponent Pokémon are
                loaded, then click "Evaluate leads."
              </p>
            </div>
          ) : (
            matchups.map((matchup) => {
              const key = matchupKey(matchup)
              return (
                <button
                  key={key}
                  type="button"
                  className={`min-h-[96px] rounded border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arena-cyan/35 ${
                    key === activeKey
                      ? 'border-arena-cyan/70 bg-arena-cyan/12'
                      : 'border-white/10 bg-black/18 hover:border-white/24 hover:bg-white/[0.06]'
                  }`}
                  onClick={() => onSelect(key)}
                >
                  <p className="truncate text-sm font-black text-white">
                    {matchup.opponentLeadNames.join(' + ')}
                  </p>
                  {showPills ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <MetricPill metric={matchup.koPressure} compact />
                      <MetricPill metric={matchup.incomingDanger} compact />
                      <MetricPill metric={matchup.doubleUpPressure} compact />
                      <MetricPill metric={matchup.speedComparison} compact />
                    </div>
                  ) : matchup.summary ? (
                    <p className="mt-2 text-xs leading-5 text-white/72">
                      {matchup.summary}
                    </p>
                  ) : null}
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
  selectedLeadIds,
  field,
}: {
  matchup: LeadMatchup | null
  status: LeadLabProps['status']
  selectedLeadIds: [string | null, string | null]
  field: PreviewField
}) {
  const navigate = useNavigate()

  if (matchup === null) {
    return (
      <section className="rounded border border-white/10 bg-arena-panel/85 p-4 text-sm text-white/62">
        {status === 'loading'
          ? 'Building lead readout.'
          : 'Select a matrix result to inspect turn-1 pressure.'}
      </section>
    )
  }

  function openInCalculator() {
    if (matchup === null) return
    hydrateFromMatchup(matchup, selectedLeadIds, field, 0)
    navigate('/')
  }

  return (
    <section className="arena-panel p-4" aria-label="Lead matchup drilldown">
      <div className="relative z-10 grid gap-4 lg:grid-cols-[0.8fr_1fr]">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="arena-label text-arena-sun">Drilldown</p>
              <h3 className="mt-1 text-xl font-black text-white">
                {matchup.opponentLeadNames.join(' + ')}
              </h3>
            </div>
            <button
              type="button"
              onClick={openInCalculator}
              className="mt-1 flex shrink-0 items-center gap-1 rounded border border-white/14 bg-white/[0.04] px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-white/52 transition hover:border-arena-cyan/40 hover:bg-arena-cyan/8 hover:text-arena-cyan focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-arena-cyan/50"
              title="Open this matchup in the damage calculator"
            >
              Calc →
            </button>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <MetricPill metric={matchup.koPressure} />
            <MetricPill metric={matchup.twoHitKoPressure} />
            <MetricPill metric={matchup.doubleUpPressure} />
            <MetricPill metric={matchup.incomingDanger} />
            <MetricPill metric={matchup.speedComparison} />
          </div>
        </div>

        <div className="grid gap-3">
          <ReadoutList
            title="Key decisions this turn"
            items={matchup.mustReactLabels}
          />
          {matchup.turnOneAnnotations.length > 0 && (
            <ReadoutList
              title="Turn-1 notes"
              items={matchup.turnOneAnnotations}
            />
          )}
          <DamageEvidenceTable
            outgoing={matchup.outgoingEvidence ?? []}
            incoming={matchup.incomingEvidence ?? []}
          />
        </div>
      </div>
    </section>
  )
}

const METRIC_TOOLTIPS: Record<string, { tip: string; outOf: number | null }> = {
  'Your OHKOs': {
    tip: 'Opponent lead pairs you can knock out in one hit this turn.',
    outOf: 15,
  },
  'Your 2HKOs': {
    tip: 'Pairs you can knock out in two hits — strong ongoing pressure.',
    outOf: 15,
  },
  'Combined KOs': {
    tip: 'Pairs that fall if both your leads focus one Pokémon.',
    outOf: 2,
  },
  'Threats on you': {
    tip: 'Pairs that can OHKO or 2HKO one of your leads — the higher, the more careful you must be.',
    outOf: 15,
  },
  'You outspeed': {
    tip: 'Individual speed matchups where one of your leads moves first (out of 4 total checks).',
    outOf: 4,
  },
}

function MetricPill({
  metric,
  compact = false,
}: {
  metric: LeadMatchup['koPressure']
  compact?: boolean
}) {
  const [showTip, setShowTip] = useState(false)
  const tipRef = useRef<HTMLDivElement>(null)

  const toneClass = {
    low: 'border-white/10 bg-white/[0.04] text-white/62',
    medium: 'border-arena-sun/35 bg-arena-sun/10 text-arena-sun',
    high: 'border-arena-plasma/35 bg-arena-plasma/10 text-white',
  }[metric.tone]

  const meta = METRIC_TOOLTIPS[metric.label]
  const outOf = meta?.outOf ?? null

  return (
    <div className={`relative rounded border px-3 py-2 ${toneClass}`}>
      <div className="flex items-center gap-1">
        <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] opacity-75">
          {metric.label}
        </p>
        {meta && (
          <button
            type="button"
            aria-label={`What is ${metric.label}?`}
            className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-current text-[0.55rem] opacity-50 transition hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              setShowTip((v) => !v)
            }}
            onBlur={() => setShowTip(false)}
          >
            ?
          </button>
        )}
      </div>
      <p
        className={
          compact ? 'mt-1 text-sm font-black' : 'mt-1 text-xl font-black'
        }
      >
        {metric.value}
        {outOf !== null && !compact && (
          <span className="ml-0.5 font-mono text-xs font-normal opacity-50">
            /{outOf}
          </span>
        )}
      </p>
      {showTip && meta && (
        <div
          ref={tipRef}
          className="absolute bottom-full left-0 z-20 mb-1.5 w-52 rounded border border-white/20 bg-arena-void/95 px-3 py-2 text-xs leading-5 text-white/80 shadow-lg backdrop-blur-sm"
        >
          {meta.tip}
        </div>
      )}
    </div>
  )
}

function ToneLegend() {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.6rem] uppercase tracking-[0.14em]">
      <span className="text-white/35">Color guide:</span>
      <span className="flex items-center gap-1 text-white/55">
        <span className="h-2 w-2 rounded-full border border-white/20 bg-white/[0.04]" />
        Low — no immediate threat or pressure
      </span>
      <span className="flex items-center gap-1 text-arena-sun">
        <span className="h-2 w-2 rounded-full border border-arena-sun/35 bg-arena-sun/10" />
        Amber — notable advantage or risk
      </span>
      <span className="flex items-center gap-1 text-white">
        <span className="h-2 w-2 rounded-full border border-arena-plasma/35 bg-arena-plasma/10" />
        Pink — high pressure — act now
      </span>
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

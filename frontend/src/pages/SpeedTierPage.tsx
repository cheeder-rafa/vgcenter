import { useState } from 'react'

import { useSpeedTiers } from '../features/speed/hooks/useSpeedTiers'
import { META_TOP_IDS } from '../features/speed/data/meta-top'
import type { SpeedTierModifiers, SpeedTierRow } from '../features/speed/types'

export function SpeedTierPage() {
  const { status, rows, error, modifiers, setModifiers } = useSpeedTiers()
  const [metaOnly, setMetaOnly] = useState(false)

  const displayRows = metaOnly
    ? rows.filter((r) => r.userTeam || META_TOP_IDS.has(r.speciesId))
    : rows

  const baseRows = displayRows.filter((r) => !r.isMega)
  const megaRows = displayRows.filter((r) => r.isMega)

  return (
    <main className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden bg-arena-gradient text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05] [background-size:48px_48px]" />
      <div className="pointer-events-none absolute inset-0 arena-scanlines opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[4px] bg-gradient-to-r from-arena-plasma via-arena-sun to-arena-cyan shadow-[0_0_32px_rgba(255,43,142,0.7)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1600px] flex-col gap-4 px-3 py-3 sm:px-5 sm:py-4 xl:px-6">
        <header className="flex min-h-16 flex-col justify-center border-b border-white/10 pb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-arena-cyan">
            Regulation M-A
          </p>
          <h1 className="text-2xl font-black tracking-wide sm:text-3xl">Speed Tier Sheet</h1>
        </header>

        <div className="grid gap-4 xl:grid-cols-[minmax(280px,0.3fr)_1fr]">
          <aside className="arena-panel arena-panel--cyan p-4">
            <div className="relative z-10 space-y-5">
              <div>
                <p className="arena-label text-arena-cyan">Controls</p>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  Toggle modifiers to update the sheet. Your team's speeds are highlighted.
                </p>
              </div>

              <ModifierToggles modifiers={modifiers} onChange={setModifiers} />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={metaOnly}
                  onClick={() => setMetaOnly((v) => !v)}
                  className={`relative h-5 w-9 rounded-full border transition ${
                    metaOnly
                      ? 'border-arena-cyan/60 bg-arena-cyan/20'
                      : 'border-white/15 bg-white/[0.06]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
                      metaOnly ? 'left-[18px] bg-arena-cyan' : 'left-0.5 bg-white/40'
                    }`}
                  />
                </button>
                <span className="text-sm text-white/70">Top-30 meta only</span>
              </div>

              {status === 'error' && error ? (
                <p className="rounded border border-arena-plasma/30 bg-arena-plasma/10 px-3 py-2 text-sm text-white/78">
                  {error}
                </p>
              ) : null}
            </div>
          </aside>

          <div className="arena-panel p-4">
            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="arena-label text-arena-sun">Full roster</p>
                  <h2 className="mt-1 text-lg font-black text-white">Speed Tiers</h2>
                </div>
                {rows.length > 0 && (
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/45">
                    {displayRows.length} entries
                  </span>
                )}
              </div>

              <SpeedLegend />

              {status === 'loading' && rows.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <p className="text-sm text-white/45">Computing speed tiers…</p>
                </div>
              ) : rows.length === 0 ? (
                <div className="rounded border border-white/10 bg-black/16 p-6">
                  <p className="text-sm font-medium text-white/62">No tiers loaded yet</p>
                  <p className="mt-1 text-xs leading-5 text-white/40">
                    Speed tiers load automatically. Add Pokémon to your team to see them highlighted.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <SpeedSection
                    label="Base Forms"
                    rows={baseRows}
                    modifiers={modifiers}
                    loading={status === 'loading'}
                  />
                  {megaRows.length > 0 && (
                    <SpeedSection
                      label="Mega Evolutions"
                      rows={megaRows}
                      modifiers={modifiers}
                      loading={status === 'loading'}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function ModifierToggles({
  modifiers,
  onChange,
}: {
  modifiers: SpeedTierModifiers
  onChange: (m: SpeedTierModifiers) => void
}) {
  function toggle(key: keyof Omit<SpeedTierModifiers, 'stages'>) {
    onChange({ ...modifiers, [key]: !modifiers[key] })
  }

  return (
    <div className="space-y-2">
      <p className="arena-label text-white/48">Modifiers</p>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { key: 'tailwind', label: 'Tailwind ×2' },
            { key: 'trickRoom', label: 'Trick Room' },
            { key: 'paralysis', label: 'Paralysis ÷2' },
            { key: 'choiceScarf', label: 'Choice Scarf ×1.5' },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={`rounded border px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.1em] transition ${
              modifiers[key]
                ? 'border-arena-cyan/60 bg-arena-cyan/15 text-arena-cyan'
                : 'border-white/10 bg-white/[0.04] text-white/50 hover:border-white/20 hover:text-white/75'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <span className="arena-label text-white/48">Stages</span>
        <div className="flex items-center gap-1">
          {[-2, -1, 0, 1, 2].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ ...modifiers, stages: s })}
              className={`h-7 w-7 rounded border text-xs font-bold transition ${
                modifiers.stages === s
                  ? 'border-arena-sun/60 bg-arena-sun/15 text-arena-sun'
                  : 'border-white/10 bg-white/[0.04] text-white/50 hover:border-white/20 hover:text-white/75'
              }`}
            >
              {s > 0 ? `+${s}` : s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SpeedLegend() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.6rem] uppercase tracking-[0.14em]">
      <span className="text-white/35">Legend:</span>
      <span className="flex items-center gap-1.5 text-arena-cyan">
        <span className="h-2 w-2 rounded-full border border-arena-cyan/60 bg-arena-cyan/20" />
        Your team
      </span>
      <span className="flex items-center gap-1.5 text-white/55">
        <span className="h-2 w-2 rounded-full border border-white/20 bg-white/[0.04]" />
        Roster
      </span>
    </div>
  )
}

function SpeedSection({
  label,
  rows,
  modifiers,
  loading,
}: {
  label: string
  rows: SpeedTierRow[]
  modifiers: SpeedTierModifiers
  loading: boolean
}) {
  const grouped = groupBySpeed(rows)

  return (
    <div>
      <p className="mb-2 arena-label text-white/40 uppercase tracking-[0.18em] text-xs">
        {label}
        {loading && (
          <span className="ml-2 text-white/25">updating…</span>
        )}
      </p>
      <div
        className="max-h-[calc(100vh-22rem)] overflow-y-auto rounded border border-white/10"
        role="table"
        aria-label={`${label} speed tier table`}
      >
        <div role="rowgroup">
          <div
            role="row"
            className="grid grid-cols-[5rem_32px_1fr_auto] gap-x-3 border-b border-white/10 bg-white/[0.03] px-4 py-2"
          >
            <span role="columnheader" className="arena-label text-white/45">
              {modifiers.trickRoom ? 'Slowest first' : 'Fastest first'}
            </span>
            <span role="columnheader" />
            <span role="columnheader" className="arena-label text-white/45">
              Species
            </span>
            <span role="columnheader" className="arena-label text-white/45">
              Speed
            </span>
          </div>
        </div>

        <div role="rowgroup">
          {grouped.map(({ speed, entries }) => (
            <SpeedGroup key={speed} speed={speed} entries={entries} />
          ))}
        </div>
      </div>
    </div>
  )
}

function SpeedGroup({ speed, entries }: { speed: number; entries: SpeedTierRow[] }) {
  return (
    <>
      {entries.map((row, idx) => (
        <div
          key={`${row.speciesId}-${row.userTeam}`}
          role="row"
          className={`grid grid-cols-[5rem_32px_1fr_auto] items-center gap-x-3 border-b border-white/[0.06] px-4 py-2 transition-colors ${
            row.userTeam
              ? 'bg-arena-cyan/[0.06] hover:bg-arena-cyan/10'
              : 'hover:bg-white/[0.03]'
          }`}
        >
          <div role="cell" className="font-mono text-sm font-black tabular-nums text-white/30">
            {idx === 0 && speed}
          </div>
          <div role="cell" className="flex items-center justify-center">
            <MiniSprite speciesId={row.speciesId} name={row.speciesName} />
          </div>
          <div role="cell" className="flex items-center gap-2">
            {row.userTeam && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-arena-cyan" />
            )}
            <span
              className={`text-sm font-semibold ${
                row.userTeam ? 'text-arena-cyan' : 'text-white/78'
              }`}
            >
              {row.speciesName}
            </span>
          </div>
          <div role="cell" className="font-mono text-sm font-black tabular-nums text-white/62">
            {speed}
          </div>
        </div>
      ))}
    </>
  )
}

function MiniSprite({ speciesId, name }: { speciesId: string; name: string }) {
  return (
    <img
      src={`/sprites/${speciesId}.png`}
      alt={name}
      width={28}
      height={28}
      className="h-7 w-7 object-contain"
      onError={(e) => {
        const img = e.currentTarget
        img.style.display = 'none'
      }}
    />
  )
}

function groupBySpeed(rows: SpeedTierRow[]): { speed: number; entries: SpeedTierRow[] }[] {
  const map = new Map<number, SpeedTierRow[]>()
  for (const row of rows) {
    const bucket = map.get(row.finalSpeed) ?? []
    bucket.push(row)
    map.set(row.finalSpeed, bucket)
  }
  return [...map.entries()].map(([speed, entries]) => ({ speed, entries }))
}

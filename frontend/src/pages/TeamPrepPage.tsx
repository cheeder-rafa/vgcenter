import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { SpriteBadge } from '../features/calculator/components/SpriteBadge'
import {
  META_SNAPSHOT,
  META_SOURCES,
  type MetaUsageEntry,
} from '../features/prep/data/metaSnapshot'
import { analyzePrep, type PrepThreat } from '../features/prep/lib/analyzePrep'
import { usePrepNotebookStore } from '../features/prep/store/usePrepNotebookStore'
import { useTeamsStore, type SavedPokemon } from '../store/useTeamsStore'

const READINESS_COPY = {
  empty: {
    label: 'No teams loaded',
    tone: 'text-white/62',
  },
  partial: {
    label: 'Partial profile',
    tone: 'text-arena-sun',
  },
  ready: {
    label: 'Ready to prep',
    tone: 'text-arena-cyan',
  },
} as const

export function TeamPrepPage() {
  const mine = useTeamsStore((state) => state.mine)
  const opponent = useTeamsStore((state) => state.opponent)
  const eventName = usePrepNotebookStore((state) => state.eventName)
  const opponentName = usePrepNotebookStore((state) => state.opponentName)
  const opponentNotes = usePrepNotebookStore((state) => state.opponentNotes)
  const gamePlanNotes = usePrepNotebookStore((state) => state.gamePlanNotes)
  const watchedThreatIds = usePrepNotebookStore(
    (state) => state.watchedThreatIds,
  )
  const setEventName = usePrepNotebookStore((state) => state.setEventName)
  const setOpponentName = usePrepNotebookStore((state) => state.setOpponentName)
  const setOpponentNotes = usePrepNotebookStore(
    (state) => state.setOpponentNotes,
  )
  const setGamePlanNotes = usePrepNotebookStore(
    (state) => state.setGamePlanNotes,
  )
  const toggleWatchedThreat = usePrepNotebookStore(
    (state) => state.toggleWatchedThreat,
  )

  const report = useMemo(
    () => analyzePrep({ mine, opponent, watchedThreatIds }),
    [mine, opponent, watchedThreatIds],
  )
  const readiness = READINESS_COPY[report.readinessLevel]

  return (
    <main className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden bg-arena-gradient text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05] [background-size:48px_48px]" />
      <div className="pointer-events-none absolute inset-0 arena-scanlines opacity-45" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[4px] bg-gradient-to-r from-arena-cyan via-arena-sun to-arena-plasma shadow-[0_0_32px_rgba(34,211,238,0.45)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1600px] flex-col gap-4 px-3 py-3 sm:px-5 sm:py-4 xl:px-6">
        <header className="grid gap-4 border-b border-white/10 pb-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.34fr)] lg:items-end">
          <div>
            <p className="arena-label text-arena-cyan">VGC Decision Lab</p>
            <h1 className="mt-2 font-display text-3xl font-black tracking-wide text-white sm:text-4xl">
              Team Prep
            </h1>
            <p className="mt-3 max-w-[70ch] font-body text-sm leading-6 text-white/68">
              Connect saved teams, matchup checks, replay notes, and practice
              prompts into one scouting board before a ladder session or event.
            </p>
          </div>
          <div className="rounded-sm border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="arena-label text-arena-sun">Status</span>
              <span
                className={`font-display text-sm font-bold ${readiness.tone}`}
              >
                {readiness.label}
              </span>
            </div>
            <p className="mt-3 font-body text-sm leading-6 text-white/72">
              {report.nextAction}
            </p>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Your team" value={`${report.myCount} / 6 saved`} />
          <MetricCard
            label="Opponent"
            value={`${report.opponentCount} / 6 saved`}
          />
          <MetricCard
            label="Fastest yours"
            value={report.fastestMine?.speciesName ?? 'Unknown'}
            detail={
              report.fastestMine
                ? `Spe ${report.fastestMine.finalStats?.speed ?? '—'}`
                : 'Save a team first'
            }
          />
          <MetricCard
            label="Fastest theirs"
            value={report.fastestOpponent?.speciesName ?? 'Unknown'}
            detail={
              report.fastestOpponent
                ? `Spe ${report.fastestOpponent.finalStats?.speed ?? '—'}`
                : 'Save an opponent first'
            }
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)]">
          <article className="arena-panel arena-panel--cyan p-4">
            <div className="relative z-10 grid gap-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="arena-label text-arena-cyan">Coverage report</p>
                  <h2 className="mt-1 font-display text-2xl font-black text-white">
                    Prep signals
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <WorkflowLink href="/calc" label="Open Calc" />
                  <WorkflowLink href="/preview" label="Preview Coach" />
                  <WorkflowLink href="/replay" label="Replay Review" />
                  <WorkflowLink href="/speed" label="Speed Tiers" />
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <SignalCard
                  label="Speed posture"
                  value={formatSpeedPosture(
                    report.averageSpeedMine,
                    report.averageSpeedOpponent,
                  )}
                  detail="Use this as a first-pass signal, then confirm Tailwind and Trick Room on the Speed page."
                />
                <SignalCard
                  label="Type spread"
                  value={
                    report.typeTags.length > 0
                      ? `${report.typeTags.length} tags seen`
                      : 'No type data'
                  }
                  detail={
                    report.typeTags.length > 0
                      ? report.typeTags.slice(0, 7).join(' · ')
                      : 'Import teams to see combined matchup surface area.'
                  }
                />
                <SignalCard
                  label="Watchlist"
                  value={`${report.threats.filter((threat) => threat.watched).length} marked`}
                  detail="Mark threats you must answer in preview, calcs, and replay review."
                />
              </div>

              <PracticeQueue prompts={report.practicePrompts} />
            </div>
          </article>

          <PrepNotebook
            eventName={eventName}
            opponentName={opponentName}
            opponentNotes={opponentNotes}
            gamePlanNotes={gamePlanNotes}
            onEventNameChange={setEventName}
            onOpponentNameChange={setOpponentName}
            onOpponentNotesChange={setOpponentNotes}
            onGamePlanNotesChange={setGamePlanNotes}
          />
        </section>

        <MetaPulse mine={mine} opponent={opponent} />

        <section className="arena-panel arena-panel--plasma p-4">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="arena-label text-arena-plasma">
                  Threat watchlist
                </p>
                <h2 className="mt-1 font-display text-2xl font-black text-white">
                  Opponent pressure points
                </h2>
              </div>
              <p className="max-w-[54ch] font-body text-sm leading-6 text-white/58">
                Ranked by offensive stat first, then Speed. This is a scouting
                queue, not a replacement for exact damage rolls.
              </p>
            </div>

            {report.threats.length === 0 ? (
              <div className="mt-4 rounded-sm border border-white/10 bg-white/[0.04] px-4 py-5 font-body text-sm leading-6 text-white/62">
                Save or import an opposing team from Calc to create a threat
                queue.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {report.threats.map((threat) => (
                  <ThreatCard
                    key={threat.id}
                    threat={threat}
                    onToggle={() => toggleWatchedThreat(threat.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function MetaPulse({
  mine,
  opponent,
}: {
  mine: ReturnType<typeof useTeamsStore.getState>['mine']
  opponent: ReturnType<typeof useTeamsStore.getState>['opponent']
}) {
  const myMetaHits = getMetaHits(mine)
  const opponentMetaHits = getMetaHits(opponent)
  const leadingTournaments = META_SNAPSHOT.qualifiedTournaments.slice(0, 4)

  return (
    <section className="arena-panel arena-panel--violet p-4">
      <div className="relative z-10 grid gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="arena-label text-arena-violet">Meta Feed</p>
            <h2 className="mt-1 font-display text-2xl font-black text-white">
              Tournament-backed context
            </h2>
            <p className="mt-2 max-w-[74ch] font-body text-sm leading-6 text-white/62">
              Usage comes from Pikalytics Champions Tournaments. Tournament
              recency comes from Limitless, filtered to online Regulation M-A
              events with at least {META_SNAPSHOT.minimumPlayers} players.
            </p>
          </div>
          <div className="rounded-sm border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-white/42">
              Snapshot
            </p>
            <p className="mt-1 font-display text-sm font-bold text-white">
              {formatSnapshotDate(META_SNAPSHOT.checkedOn)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.55fr)]">
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg font-black text-white">
                Top tournament usage
              </h3>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/42">
                Top {META_SNAPSHOT.usage.length}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {META_SNAPSHOT.usage.slice(0, 9).map((entry) => (
                <MetaUsageRow key={entry.speciesName} entry={entry} />
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <SignalCard
              label="Your meta overlap"
              value={`${myMetaHits.length} top picks`}
              detail={
                myMetaHits.length > 0
                  ? myMetaHits.map((hit) => hit.speciesName).join(' · ')
                  : 'No saved team members are in the current top usage slice.'
              }
            />
            <SignalCard
              label="Opponent meta overlap"
              value={`${opponentMetaHits.length} top picks`}
              detail={
                opponentMetaHits.length > 0
                  ? opponentMetaHits.map((hit) => hit.speciesName).join(' · ')
                  : 'Save an opposing team to compare it against the meta.'
              }
            />
            <div className="rounded-sm border border-white/10 bg-arena-void/45 p-4">
              <p className="arena-label text-arena-violet">Qualified events</p>
              <p className="mt-2 font-display text-lg font-black text-white">
                {META_SNAPSHOT.qualifiedTournaments.length} events
              </p>
              <p className="mt-2 font-body text-sm leading-6 text-white/58">
                Limitless rows below {META_SNAPSHOT.minimumPlayers} players are
                intentionally excluded.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-4">
          {leadingTournaments.map((event) => (
            <article
              key={`${event.date}-${event.name}`}
              className="rounded-sm border border-white/10 bg-white/[0.035] p-3"
            >
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-white/42">
                {event.date} · {event.players} players
              </p>
              <h3 className="mt-2 line-clamp-2 font-display text-sm font-bold leading-5 text-white">
                {event.name}
              </h3>
              <p className="mt-2 truncate font-body text-xs text-white/52">
                Winner: {event.winner}
              </p>
            </article>
          ))}
        </div>

        <SourceCredits />
      </div>
    </section>
  )
}

function MetaUsageRow({ entry }: { entry: MetaUsageEntry }) {
  return (
    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_4.5rem] items-center gap-2 rounded-sm border border-white/10 bg-white/[0.035] px-3 py-2">
      <span className="font-mono text-xs tabular-nums text-white/42">
        #{entry.rank}
      </span>
      <span className="min-w-0 truncate font-display text-sm font-bold text-white">
        {entry.speciesName}
      </span>
      <span className="text-right font-mono text-xs tabular-nums text-arena-cyan">
        {entry.usagePercent.toFixed(2)}%
      </span>
    </div>
  )
}

function SourceCredits() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-3 font-body text-xs leading-5 text-white/50">
      <span>Sources credited:</span>
      <a
        href={META_SOURCES.limitless.url}
        target="_blank"
        rel="noreferrer"
        className="text-arena-cyan underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan"
      >
        {META_SOURCES.limitless.name}
      </a>
      <span aria-hidden="true">·</span>
      <a
        href={META_SOURCES.pikalytics.url}
        target="_blank"
        rel="noreferrer"
        className="text-arena-cyan underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan"
      >
        {META_SOURCES.pikalytics.name}
      </a>
    </div>
  )
}

function getMetaHits(
  rail: ReturnType<typeof useTeamsStore.getState>['mine'],
): MetaUsageEntry[] {
  const species = new Set(
    rail
      .filter((pokemon): pokemon is SavedPokemon => pokemon !== null)
      .map((pokemon) => pokemon.speciesName.toLowerCase()),
  )
  return META_SNAPSHOT.usage.filter((entry) =>
    species.has(entry.speciesName.toLowerCase()),
  )
}

function formatSnapshotDate(date: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="rounded-sm border border-white/10 bg-white/[0.04] p-4">
      <p className="arena-label text-white/42">{label}</p>
      <p className="mt-2 font-display text-xl font-black text-white">{value}</p>
      {detail ? (
        <p className="mt-1 font-body text-xs leading-5 text-white/52">
          {detail}
        </p>
      ) : null}
    </div>
  )
}

function WorkflowLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      to={href}
      className="arena-chip text-white/54 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan"
    >
      {label}
    </Link>
  )
}

function SignalCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-sm border border-white/10 bg-arena-void/45 p-4">
      <p className="arena-label text-arena-cyan">{label}</p>
      <p className="mt-2 font-display text-lg font-black text-white">{value}</p>
      <p className="mt-2 font-body text-sm leading-6 text-white/58">{detail}</p>
    </div>
  )
}

function PracticeQueue({
  prompts,
}: {
  prompts: ReturnType<typeof analyzePrep>['practicePrompts']
}) {
  return (
    <div className="grid gap-3">
      <div>
        <p className="arena-label text-arena-sun">Practice queue</p>
        <h3 className="mt-1 font-display text-xl font-black text-white">
          Drills for this prep board
        </h3>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {prompts.map((prompt) => (
          <article
            key={`${prompt.href}-${prompt.title}`}
            className="rounded-sm border border-white/10 bg-white/[0.035] p-4"
          >
            <h4 className="font-display text-base font-bold text-white">
              {prompt.title}
            </h4>
            <p className="mt-2 font-body text-sm leading-6 text-white/58">
              {prompt.detail}
            </p>
            <Link
              to={prompt.href}
              className="mt-3 inline-flex font-display text-[0.68rem] font-bold uppercase tracking-[0.18em] text-arena-cyan transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan"
            >
              {prompt.actionLabel}
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}

function PrepNotebook({
  eventName,
  opponentName,
  opponentNotes,
  gamePlanNotes,
  onEventNameChange,
  onOpponentNameChange,
  onOpponentNotesChange,
  onGamePlanNotesChange,
}: {
  eventName: string
  opponentName: string
  opponentNotes: string
  gamePlanNotes: string
  onEventNameChange: (value: string) => void
  onOpponentNameChange: (value: string) => void
  onOpponentNotesChange: (value: string) => void
  onGamePlanNotesChange: (value: string) => void
}) {
  return (
    <article className="arena-panel arena-panel--ember p-4">
      <div className="relative z-10 grid gap-4">
        <div>
          <p className="arena-label text-arena-ember">Notebook</p>
          <h2 className="mt-1 font-display text-2xl font-black text-white">
            Opponent file
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Event"
            name="prep-event"
            value={eventName}
            placeholder="Local, ladder, regional…"
            onChange={onEventNameChange}
          />
          <TextField
            label="Opponent"
            name="prep-opponent"
            value={opponentName}
            placeholder="Player name or archetype"
            onChange={onOpponentNameChange}
          />
        </div>
        <TextArea
          label="Opponent notes"
          name="prep-opponent-notes"
          value={opponentNotes}
          placeholder="Known leads, comfort picks, defensive habits…"
          onChange={onOpponentNotesChange}
        />
        <TextArea
          label="Game plan notes"
          name="prep-game-plan-notes"
          value={gamePlanNotes}
          placeholder="Lead plan, win condition, what to preserve, what to trade…"
          onChange={onGamePlanNotesChange}
        />
      </div>
    </article>
  )
}

function TextField({
  label,
  name,
  value,
  placeholder,
  onChange,
}: {
  label: string
  name: string
  value: string
  placeholder: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5">
      <span className="arena-label text-white/45">{label}</span>
      <input
        className="arena-input"
        name={name}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function TextArea({
  label,
  name,
  value,
  placeholder,
  onChange,
}: {
  label: string
  name: string
  value: string
  placeholder: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5">
      <span className="arena-label text-white/45">{label}</span>
      <textarea
        className="arena-input min-h-28 resize-y"
        name={name}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function ThreatCard({
  threat,
  onToggle,
}: {
  threat: PrepThreat
  onToggle: () => void
}) {
  return (
    <article className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-sm border border-white/10 bg-white/[0.04] p-4">
      <SpriteBadge
        speciesId={threat.spriteId}
        speciesName={threat.speciesName}
        accent={threat.watched ? 'plasma' : 'cyan'}
        size="sm"
      />
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-black text-white">
              {threat.speciesName}
            </h3>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.18em] text-white/42">
              Spe {threat.speed} · Off {threat.offensiveStat}
            </p>
          </div>
          <button
            type="button"
            className={`rounded-sm border px-2.5 py-1.5 font-display text-[0.6rem] font-bold uppercase tracking-[0.16em] transition ${
              threat.watched
                ? 'border-arena-plasma/50 bg-arena-plasma/12 text-arena-plasma'
                : 'border-white/10 bg-white/[0.035] text-white/55 hover:border-arena-cyan/40 hover:text-white'
            } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan`}
            onClick={onToggle}
            aria-label={`${threat.watched ? 'Unwatch' : 'Watch'} ${threat.speciesName}`}
          >
            {threat.watched ? 'Watched' : 'Watch'}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {threat.types.map((type) => (
            <span
              key={type}
              className="rounded-sm border border-white/10 bg-arena-void/50 px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-white/58"
            >
              {type}
            </span>
          ))}
        </div>
      </div>
    </article>
  )
}

function formatSpeedPosture(
  mineAverage: number | null,
  opponentAverage: number | null,
): string {
  if (mineAverage === null || opponentAverage === null) return 'Needs data'
  if (mineAverage > opponentAverage + 10) return 'Naturally faster'
  if (opponentAverage > mineAverage + 10) return 'Speed pressure'
  return 'Speed parity'
}

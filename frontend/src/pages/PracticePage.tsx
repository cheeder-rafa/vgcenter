import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { usePrepNotebookStore } from '../features/prep/store/usePrepNotebookStore'
import { buildPracticeDrills } from '../features/practice/lib/buildPracticeDrills'
import { usePracticeHistoryStore } from '../features/practice/store/usePracticeHistoryStore'
import { useTeamsStore } from '../store/useTeamsStore'

export function PracticePage() {
  const mine = useTeamsStore((state) => state.mine)
  const opponent = useTeamsStore((state) => state.opponent)
  const watchedThreatIds = usePrepNotebookStore((state) => state.watchedThreatIds)
  const replayFindings = usePrepNotebookStore((state) => state.replayFindings)
  const history = usePracticeHistoryStore((state) => state.entries)
  const record = usePracticeHistoryStore((state) => state.record)
  const clear = usePracticeHistoryStore((state) => state.clear)

  const drills = useMemo(
    () =>
      buildPracticeDrills({
        mine: mine.filter((entry) => entry !== null),
        opponent: opponent.filter((entry) => entry !== null),
        watchedThreatIds,
        replayFindings,
      }),
    [mine, opponent, watchedThreatIds, replayFindings],
  )

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-14 pt-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <span className="font-display text-arena-2xs uppercase tracking-[0.22em] text-arena-cyan">
          Practice Mode
        </span>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
          Practice Mode
        </h1>
        <p className="max-w-[72ch] text-arena-xs text-white/60 sm:text-sm">
          Drills generated from saved teams, watched threats, meta threats, and
          replay findings. Every answer includes calc-backed explanation.
        </p>
      </header>

      {drills.length === 0 ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white/75">
          <p className="text-sm">
            Save both teams in Calc and mark at least one watched threat in Team
            Prep to unlock drills.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/calc" className="arena-chip">
              Open Calc
            </Link>
            <Link to="/prep" className="arena-chip">
              Open Team Prep
            </Link>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-3">
          {drills.map((drill) => (
            <article
              key={drill.id}
              className="rounded-2xl border border-arena-violet/25 bg-arena-night/40 p-4"
            >
              <p className="font-display text-arena-2xs uppercase tracking-[0.16em] text-arena-cyan">
                {drill.title}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">{drill.prompt}</p>
              <p className="mt-3 text-sm text-arena-sun">{drill.answer}</p>
              <p className="mt-2 text-xs leading-5 text-white/68">
                {drill.explanation}
              </p>
              <p className="mt-2 text-[0.72rem] text-white/50">
                Sources: {drill.sources.join(' · ')}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to={drill.calcHref} className="arena-chip">
                  Open in Calc
                </Link>
                <button
                  type="button"
                  className="arena-chip"
                  onClick={() =>
                    record({
                      drillId: drill.id,
                      drillType: drill.type,
                      result: 'correct',
                    })
                  }
                >
                  Mark Correct
                </button>
                <button
                  type="button"
                  className="arena-chip"
                  onClick={() =>
                    record({
                      drillId: drill.id,
                      drillType: drill.type,
                      result: 'missed',
                    })
                  }
                >
                  Mark Missed
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm uppercase tracking-[0.16em] text-white/85">
            Local Practice History
          </h2>
          <button type="button" onClick={clear} className="arena-chip">
            Clear
          </button>
        </div>
        {history.length === 0 ? (
          <p className="mt-3 text-xs text-white/55">No local attempts yet.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {history.slice(0, 8).map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-white/10 bg-arena-night/35 px-3 py-2 text-xs text-white/70"
              >
                {entry.drillType} · {entry.result} ·{' '}
                {new Date(entry.answeredAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

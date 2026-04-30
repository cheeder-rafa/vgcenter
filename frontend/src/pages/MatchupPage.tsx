import { TeamInput } from '../features/matchup/components/TeamInput'
import { ThreatMatrix } from '../features/matchup/components/ThreatMatrix'
import { useMatchupStore } from '../features/matchup/store/useMatchupStore'

export function MatchupPage() {
  const rawA = useMatchupStore((s) => s.rawA)
  const rawB = useMatchupStore((s) => s.rawB)
  const teamA = useMatchupStore((s) => s.teamA)
  const teamB = useMatchupStore((s) => s.teamB)
  const buildsA = useMatchupStore((s) => s.buildsA)
  const buildsB = useMatchupStore((s) => s.buildsB)
  const labelsA = useMatchupStore((s) => s.labelsA)
  const labelsB = useMatchupStore((s) => s.labelsB)
  const result = useMatchupStore((s) => s.result)
  const direction = useMatchupStore((s) => s.direction)
  const status = useMatchupStore((s) => s.status)
  const errorMessage = useMatchupStore((s) => s.errorMessage)
  const field = useMatchupStore((s) => s.field)
  const sideA = useMatchupStore((s) => s.sideA)
  const sideB = useMatchupStore((s) => s.sideB)

  const setRawA = useMatchupStore((s) => s.setRawA)
  const setRawB = useMatchupStore((s) => s.setRawB)
  const importTeamA = useMatchupStore((s) => s.importTeamA)
  const importTeamB = useMatchupStore((s) => s.importTeamB)
  const compute = useMatchupStore((s) => s.compute)
  const setDirection = useMatchupStore((s) => s.setDirection)
  const reset = useMatchupStore((s) => s.reset)

  const canCompute = teamA !== null && teamB !== null && status !== 'computing'

  return (
    <main
      className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden bg-arena-gradient text-white"
      data-testid="matchup-shell"
    >
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05] [background-size:48px_48px]" />
      <div className="pointer-events-none absolute inset-0 arena-scanlines opacity-55" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[4px] bg-gradient-to-r from-arena-cyan via-arena-violet to-arena-plasma shadow-[0_0_32px_rgba(34,211,238,0.45)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1600px] flex-col gap-5 px-3 py-3 sm:px-5 sm:py-4 xl:px-6">
        <header className="grid gap-4 border-b border-white/10 pb-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.34fr)] lg:items-end">
          <div>
            <p className="arena-label text-arena-cyan">Team-vs-team board</p>
            <h1 className="mt-2 font-display text-3xl font-black tracking-wide text-white sm:text-4xl">
              Threat Matrix
            </h1>
            <p className="mt-3 max-w-[70ch] font-body text-sm leading-6 text-white/68">
              Paste two team inputs as Showdown export text or Pokepaste URLs to
              see a 6x6 damage heatmap. Click any cell to open that matchup in
              the calculator.
            </p>
          </div>
          <div className="rounded-sm border border-white/10 bg-white/[0.04] p-4">
            <span className="arena-label text-arena-sun">Workflow</span>
            <p className="mt-3 font-body text-sm leading-6 text-white/72">
              Import both sides, compute the matrix, then jump from problem
              cells into exact rolls.
            </p>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="arena-panel arena-panel--cyan p-4">
            <div className="relative z-10">
              <TeamInput
                label="Your Team"
                value={rawA}
                onChange={setRawA}
                onImport={importTeamA}
                imported={teamA !== null}
                loading={status === 'importing-a'}
                teamLabels={labelsA}
              />
            </div>
          </div>
          <div className="arena-panel arena-panel--plasma p-4">
            <div className="relative z-10">
              <TeamInput
                label="Opponent's Team"
                value={rawB}
                onChange={setRawB}
                onImport={importTeamB}
                imported={teamB !== null}
                loading={status === 'importing-b'}
                teamLabels={labelsB}
              />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={compute}
            disabled={!canCompute}
            className="arena-button disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === 'computing' ? 'Computing...' : 'Compute Matrix'}
          </button>
          {result !== null ? (
            <button
              type="button"
              onClick={reset}
              className="arena-chip text-white/45 transition hover:text-white/75"
            >
              Reset
            </button>
          ) : null}
        </div>

        {errorMessage !== null ? (
          <div
            role="alert"
            className="rounded-sm border border-arena-ember/40 bg-arena-ember/[0.08] px-4 py-3 font-body text-sm text-arena-ember"
          >
            {errorMessage}
          </div>
        ) : null}

        {result !== null ? (
          <section
            aria-label="Threat matrix"
            className="arena-panel arena-panel--violet p-4"
          >
            <div className="relative z-10">
              <ThreatMatrix
                matrix={result}
                labelsA={labelsA}
                labelsB={labelsB}
                direction={direction}
                onDirectionChange={setDirection}
                buildsA={buildsA ?? undefined}
                buildsB={buildsB ?? undefined}
                regulation="M-A"
                field={field}
                sideA={sideA}
                sideB={sideB}
              />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}

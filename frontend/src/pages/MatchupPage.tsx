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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">
          Threat Matrix
        </h1>
        <p className="mt-1 font-body text-sm text-white/50">
          Paste two Showdown exports to see a 6×6 damage heatmap. Click any cell to open that
          matchup in the calculator.
        </p>
      </header>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <TeamInput
          label="Your Team"
          value={rawA}
          onChange={setRawA}
          onImport={importTeamA}
          imported={teamA !== null}
          loading={status === 'importing-a'}
          teamLabels={labelsA}
        />
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

      <div className="mb-8 flex items-center gap-3">
        <button
          type="button"
          onClick={compute}
          disabled={!canCompute}
          className="arena-chip disabled:cursor-not-allowed disabled:opacity-40 enabled:bg-arena-plasma/20 enabled:text-arena-plasma enabled:hover:bg-arena-plasma/30"
        >
          {status === 'computing' ? 'Computing…' : 'Compute Matrix'}
        </button>
        {result !== null && (
          <button
            type="button"
            onClick={reset}
            className="arena-chip text-white/40 hover:text-white/70"
          >
            Reset
          </button>
        )}
      </div>

      {errorMessage !== null && (
        <div
          role="alert"
          className="mb-6 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 font-body text-sm text-red-400"
        >
          {errorMessage}
        </div>
      )}

      {result !== null && (
        <section aria-label="Threat matrix">
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
        </section>
      )}
    </div>
  )
}

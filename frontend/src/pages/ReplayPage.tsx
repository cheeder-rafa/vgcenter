import { AdaptationFlags } from '../features/replay/components/AdaptationFlags'
import { GameSection } from '../features/replay/components/GameSection'
import { PlayerSelector } from '../features/replay/components/PlayerSelector'
import { ReplayInputPanel } from '../features/replay/components/ReplayInputPanel'
import { useReplayStore } from '../features/replay/store/useReplayStore'
import { usePrepNotebookStore } from '../features/prep/store/usePrepNotebookStore'

export function ReplayPage() {
  const rawInput = useReplayStore((s) => s.rawInput)
  const mode = useReplayStore((s) => s.mode)
  const status = useReplayStore((s) => s.status)
  const inputErrors = useReplayStore((s) => s.inputErrors)
  const errorMessage = useReplayStore((s) => s.errorMessage)
  const timelines = useReplayStore((s) => s.timelines)
  const evaluation = useReplayStore((s) => s.evaluation)
  const userPlayer = useReplayStore((s) => s.userPlayer)
  const setRawInput = useReplayStore((s) => s.setRawInput)
  const setUserPlayer = useReplayStore((s) => s.setUserPlayer)
  const analyze = useReplayStore((s) => s.analyze)
  const reset = useReplayStore((s) => s.reset)
  const addReplayFinding = usePrepNotebookStore((s) => s.addReplayFinding)

  const games = evaluation?.games ?? []
  const adaptationFlags = evaluation?.adaptationFlags ?? []
  const showGameHeaders = mode === 'bo3' && games.length > 1

  // Use first timeline's side names for the selector labels
  const firstTimeline = timelines[0]
  const firstTurn = firstTimeline?.turns[0]
  const sideAName =
    firstTimeline?.sideAName ||
    firstTurn?.boardStateAtStart.sideA.playerName ||
    'Player 1'
  const sideBName =
    firstTimeline?.sideBName ||
    firstTurn?.boardStateAtStart.sideB.playerName ||
    'Player 2'

  const hasTimelines = timelines.length > 0
  const isLoading = status === 'parsing' || status === 'evaluating'

  const loadingLabel =
    status === 'parsing'
      ? 'Fetching and reconstructing turns…'
      : 'Scoring alternatives…'
  const replaySources = rawInput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  return (
    <main
      className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden bg-arena-gradient text-white"
      data-testid="replay-shell"
    >
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05] [background-size:48px_48px]" />
      <div className="pointer-events-none absolute inset-0 arena-scanlines opacity-55" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[4px] bg-gradient-to-r from-arena-plasma via-arena-sun to-arena-cyan shadow-[0_0_32px_rgba(255,43,142,0.55)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1600px] flex-col gap-5 px-3 py-3 sm:px-5 sm:py-4 xl:px-6">
        <header className="grid gap-4 border-b border-white/10 pb-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.34fr)] lg:items-end">
          <div>
            <p className="arena-label text-arena-cyan">Replay Autopsy</p>
            <h1 className="mt-2 font-display text-3xl font-black tracking-wide text-white sm:text-4xl">
              Decision review, turn by turn
            </h1>
            <p className="mt-3 max-w-[76ch] font-body text-sm leading-6 text-white/68">
              Paste a Pokemon Showdown replay URL, up to three BO3 URLs, or raw
              protocol. We rebuild every turn and score played lines against
              legal alternatives.
            </p>
          </div>
          <div className="rounded-sm border border-white/10 bg-white/[0.04] p-4">
            <span className="arena-label text-arena-sun">Score model</span>
            <p className="mt-3 font-body text-sm leading-6 text-white/72">
              Expected damage dealt, damage taken, KO pressure, and faint risk.
            </p>
          </div>
        </header>

        <ReplayInputPanel
          rawInput={rawInput}
          mode={mode}
          status={status}
          inputErrors={inputErrors}
          errorMessage={errorMessage}
          onChange={setRawInput}
          onAnalyze={analyze}
          onReset={reset}
        />

        {hasTimelines ? (
          <PlayerSelector
            sideAName={sideAName}
            sideBName={sideBName}
            value={userPlayer}
            disabled={isLoading}
            onChange={setUserPlayer}
          />
        ) : null}

        {isLoading ? (
          <div
            data-testid="replay-loading"
            className="arena-panel arena-panel--cyan p-6 text-center font-display text-arena-2xs uppercase tracking-[0.18em] text-white/62"
          >
            <span className="relative z-10">{loadingLabel}</span>
          </div>
        ) : null}

        {status === 'ready' && evaluation ? (
          <div className="flex flex-col gap-6">
            <AdaptationFlags flags={adaptationFlags} />
            {games.map((game, idx) => (
              <GameSection
                key={game.gameNumber}
                game={game}
                timeline={timelines[idx]}
                showHeader={showGameHeaders}
                onSaveFinding={(finding) =>
                  addReplayFinding({
                    ...finding,
                    source:
                      replaySources[game.gameNumber - 1] ??
                      replaySources[0] ??
                      'Replay log input',
                  })
                }
              />
            ))}
            {games.length === 0 ? (
              <p className="text-arena-xs text-white/55">No turns to review.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  )
}

import { AdaptationFlags } from '../features/replay/components/AdaptationFlags'
import { GameSection } from '../features/replay/components/GameSection'
import { PlayerSelector } from '../features/replay/components/PlayerSelector'
import { ReplayInputPanel } from '../features/replay/components/ReplayInputPanel'
import { useReplayStore } from '../features/replay/store/useReplayStore'

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

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-1">
        <span className="font-display text-arena-2xs uppercase tracking-[0.22em] text-arena-cyan">
          Replay Autopsy
        </span>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
          Decision review, turn by turn
        </h1>
        <p className="text-arena-xs text-white/55 sm:text-sm">
          Paste a Pokémon Showdown replay URL (or up to three for a BO3 set) —
          or paste the raw protocol log. We rebuild every turn and score each
          played pair against the legal alternatives.
        </p>
        <p className="text-[0.72rem] text-white/45 sm:text-xs">
          Decision score combines expected damage dealt, expected damage taken,
          KO pressure, and faint risk.
        </p>
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
          className="rounded-2xl border border-arena-violet/20 bg-arena-night/40 p-6 text-center font-display text-arena-2xs uppercase tracking-[0.18em] text-white/55"
        >
          {loadingLabel}
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
            />
          ))}
          {games.length === 0 ? (
            <p className="text-arena-xs text-white/55">No turns to review.</p>
          ) : null}
        </div>
      ) : null}
    </main>
  )
}

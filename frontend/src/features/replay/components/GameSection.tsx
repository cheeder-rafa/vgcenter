import type { ReplayPrepFindingType } from '../../prep/store/usePrepNotebookStore'
import { classifyReplayFinding } from '../lib/classifyReplayFinding'
import type { ReplayGameReview, ReplayTimeline } from '../types'
import { TurnReviewCard } from './TurnReviewCard'

type Props = {
  game: ReplayGameReview
  timeline: ReplayTimeline | undefined
  showHeader: boolean
  onSaveFinding: (payload: {
    type: ReplayPrepFindingType
    title: string
    note: string
    turnNumber: number
    gameNumber: number
  }) => void
}

export function GameSection({ game, timeline, showHeader, onSaveFinding }: Props) {
  const turnsByNumber = new Map(timeline?.turns.map((t) => [t.number, t]) ?? [])
  const hasRevealedMoves =
    timeline != null && Object.keys(timeline.revealedMovesBySpecies).length > 0
  return (
    <section className="flex flex-col gap-3">
      {showHeader ? (
        <header className="flex items-baseline justify-between">
          <h2 className="font-display text-sm uppercase tracking-[0.18em] text-white">
            Game {game.gameNumber}
          </h2>
          {game.winner ? (
            <span className="font-display text-arena-2xs uppercase tracking-[0.14em] text-arena-mint">
              Winner · {game.winner}
            </span>
          ) : null}
        </header>
      ) : null}
      {!hasRevealedMoves ? (
        <p className="rounded-lg border border-arena-violet/15 bg-arena-night/40 px-3 py-2 font-display text-arena-2xs uppercase tracking-[0.14em] text-white/40">
          Single-game replay: alternatives are limited to moves observed in this game. Full
          movesets are only available when the replay exposes team preview (`showteam`).
        </p>
      ) : null}
      <div className="flex flex-col gap-3">
        {game.turnReviews.map((review) => (
          <TurnReviewCard
            key={review.turnNumber}
            review={review}
            turn={turnsByNumber.get(review.turnNumber)}
            findingType={classifyReplayFinding(review)}
            onSaveFinding={(payload) =>
              onSaveFinding({ ...payload, gameNumber: game.gameNumber })
            }
          />
        ))}
      </div>
    </section>
  )
}

import type { ReplayGameReview, ReplayTimeline } from '../types'
import { TurnReviewCard } from './TurnReviewCard'

type Props = {
  game: ReplayGameReview
  timeline: ReplayTimeline | undefined
  showHeader: boolean
}

export function GameSection({ game, timeline, showHeader }: Props) {
  const turnsByNumber = new Map(timeline?.turns.map((t) => [t.number, t]) ?? [])
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
      <div className="flex flex-col gap-3">
        {game.turnReviews.map((review) => (
          <TurnReviewCard
            key={review.turnNumber}
            review={review}
            turn={turnsByNumber.get(review.turnNumber)}
          />
        ))}
      </div>
    </section>
  )
}

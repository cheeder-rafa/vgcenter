import type { ReplayTurn, TurnReview } from '../types'
import { DecisionLineRow } from './DecisionLineRow'

type Props = {
  review: TurnReview
  turn: ReplayTurn | undefined
}

const VERDICT_STYLES: Record<
  string,
  { tint: string; label: string; mark: string }
> = {
  OPTIMAL: {
    tint: 'border-arena-mint/40 bg-arena-mint/[0.05]',
    label: 'Optimal',
    mark: '✓',
  },
  ACCEPTABLE: {
    tint: 'border-arena-violet/40 bg-arena-violet/[0.05]',
    label: 'Acceptable',
    mark: '◐',
  },
  SUBOPTIMAL: {
    tint: 'border-arena-plasma/40 bg-arena-plasma/[0.05]',
    label: 'Suboptimal',
    mark: '✗',
  },
}

export function TurnReviewCard({ review, turn }: Props) {
  const verdict = VERDICT_STYLES[review.verdict] ?? VERDICT_STYLES.ACCEPTABLE
  const top3 = review.rankedAlternatives.slice(0, 3)
  const allScores = [review.played.score, ...top3.map((line) => line.score)]
  const playedScore = review.played.score
  const maxAbsDelta =
    Math.max(0.0001, ...allScores.map((s) => Math.abs(s - playedScore))) || 1

  return (
    <article
      data-testid="turn-review-card"
      className={[
        'flex flex-col gap-3 rounded-2xl border bg-arena-night/60 p-4 backdrop-blur-sm transition',
        verdict.tint,
      ].join(' ')}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-display text-arena-2xs uppercase tracking-[0.18em] text-white/45">
            Turn
          </span>
          <span className="font-display text-2xl font-bold tabular-nums text-white">
            {review.turnNumber}
          </span>
        </div>
        <span
          className={[
            'flex items-center gap-1.5 rounded-full px-2.5 py-1 font-display text-arena-2xs uppercase tracking-[0.14em]',
            verdict.tint,
          ].join(' ')}
        >
          <span aria-hidden>{verdict.mark}</span>
          {verdict.label}
        </span>
      </header>

      {turn ? (
        <DecisionLineRow
          line={review.played}
          board={turn.boardStateAtStart}
          delta={0}
          maxAbsDelta={maxAbsDelta}
          emphasis="played"
        />
      ) : null}

      {top3.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="font-display text-arena-2xs uppercase tracking-[0.18em] text-white/45">
            Best alternatives
          </h3>
          <ol className="flex flex-col gap-2">
            {top3.map((alt, idx) =>
              turn ? (
                <li key={idx}>
                  <DecisionLineRow
                    line={alt}
                    board={turn.boardStateAtStart}
                    delta={alt.score - playedScore}
                    maxAbsDelta={maxAbsDelta}
                  />
                </li>
              ) : null,
            )}
          </ol>
        </section>
      ) : (
        <p className="text-arena-xs text-white/45">
          No legal alternative move pairs were observed for this turn.
        </p>
      )}

      {review.narrative ? (
        <p className="rounded-md border border-arena-violet/15 bg-arena-void/50 px-3 py-2 font-body text-[0.78rem] leading-relaxed text-white/75">
          {review.narrative}
        </p>
      ) : null}
    </article>
  )
}

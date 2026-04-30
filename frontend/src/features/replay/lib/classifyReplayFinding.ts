import type { TurnReview } from '../types'
import type { ReplayPrepFindingType } from '../../prep/store/usePrepNotebookStore'

export function classifyReplayFinding(review: TurnReview): ReplayPrepFindingType {
  const topAlternative = review.rankedAlternatives[0]
  const played = review.played
  if (
    topAlternative &&
    played.expectedKos < topAlternative.expectedKos &&
    review.delta >= 2
  ) {
    return 'missed-ko'
  }
  if (review.verdict === 'SUBOPTIMAL' && review.delta >= 3) {
    return 'turning-point'
  }
  if (played.expectedFaints > 0 || played.expectedDamageTaken >= 45) {
    return 'risky-line'
  }
  return 'adaptation-note'
}

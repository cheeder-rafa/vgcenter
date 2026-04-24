import { useState } from 'react'

import { recommendLineups } from '../api/gameplanApi'
import type {
  RecommendLineupRequest,
  RecommendLineupResponse,
  Recommendation,
} from '../types/api'
import type { LeadOrder } from './LeadOrderPicker'

type Props = {
  request: RecommendLineupRequest | null
  onPromote: (order: LeadOrder) => void
  opponentNameById: Record<string, string>
}

function speciesLabel(speciesId: string): string {
  return speciesId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function topBreakdowns(
  recommendation: Recommendation,
  opponentNameById: Record<string, string>,
) {
  return [...recommendation.cells]
    .sort((left, right) => left.score.total - right.score.total)
    .slice(0, 3)
    .map((cell) => ({
      key: `${cell.firstOpponentIndex}-${cell.secondOpponentIndex}`,
      pair: cell.opponentLeadSpeciesIds
        .map((id) => opponentNameById[id] ?? speciesLabel(id))
        .join(' + '),
      score: cell.score.total,
    }))
}

const RANK_COLORS = [
  'text-arena-sun',
  'text-arena-violet',
  'text-white/45',
] as const

export function LineupRecommendations({
  request,
  onPromote,
  opponentNameById,
}: Props) {
  const [result, setResult] = useState<RecommendLineupResponse | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function fetchRecommendations() {
    if (request === null) return
    setStatus('loading')
    setError(null)
    try {
      const next = await recommendLineups(request)
      setResult(next)
      setStatus('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recommendation failed')
      setStatus('error')
    }
  }

  return (
    <section className="arena-panel flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="arena-label text-white/70">Lineup Recommendations</h2>
          <p className="text-xs text-white/35">
            Scores 45 bring-4 lead pairings — top 3 ranked.
          </p>
        </div>
        <button
          type="button"
          disabled={request === null || status === 'loading'}
          onClick={fetchRecommendations}
          className="arena-button"
        >
          {status === 'loading' ? 'Recommending…' : 'Recommend lineups'}
        </button>
      </div>

      {status === 'error' && (
        <p className="text-sm text-arena-plasma/90">
          Recommendation failed: {error}
        </p>
      )}

      {result !== null && (
        <div className="grid gap-3 lg:grid-cols-3">
          {result.recommendations.map((recommendation, index) => (
            <article
              key={`${recommendation.lineupIndices.join('-')}-${index}`}
              className="arena-panel flex flex-col gap-3 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-display text-2xl font-bold leading-none ${RANK_COLORS[index] ?? 'text-white/40'}`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-mono text-lg font-semibold text-white">
                    {recommendation.averageScore.toFixed(1)}
                    <span className="ml-1 text-xs text-white/35">avg</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onPromote({
                      lead1: recommendation.lineupSpeciesIds[0] ?? null,
                      lead2: recommendation.lineupSpeciesIds[1] ?? null,
                      back1: recommendation.lineupSpeciesIds[2] ?? null,
                      back2: recommendation.lineupSpeciesIds[3] ?? null,
                    })
                  }
                  className="arena-chip border-arena-violet/30 text-arena-violet/80 transition hover:border-arena-violet/60 hover:text-arena-violet"
                >
                  Promote
                </button>
              </div>

              <ol className="grid grid-cols-2 gap-1 text-xs">
                {recommendation.lineupSpeciesIds.map((id, slot) => (
                  <li key={`${id}-${slot}`} className="flex items-center gap-1">
                    <span className="arena-label text-[9px] text-white/30">
                      {slot < 2 ? `L${slot + 1}` : `B${slot - 1}`}
                    </span>
                    <span className="text-white/70">{speciesLabel(id)}</span>
                  </li>
                ))}
              </ol>

              <div className="arena-divider" />

              <div className="flex flex-col gap-1">
                {topBreakdowns(recommendation, opponentNameById).map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-white/50">
                      {row.pair}: {row.score}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

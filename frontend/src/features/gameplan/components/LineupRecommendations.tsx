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
    <section className="flex flex-col gap-3 rounded border border-white/10 bg-arena-surface/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white/80">
            Lineup Recommendations
          </h2>
          <p className="text-xs text-white/45">
            Scores 45 bring-4 lead pairings and keeps top 3.
          </p>
        </div>
        <button
          type="button"
          disabled={request === null || status === 'loading'}
          onClick={fetchRecommendations}
          className="rounded border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === 'loading' ? 'Recommending…' : 'Recommend lineups'}
        </button>
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-300">Recommendation failed: {error}</p>
      )}

      {result !== null && (
        <div className="grid gap-3 lg:grid-cols-3">
          {result.recommendations.map((recommendation, index) => (
            <article
              key={`${recommendation.lineupIndices.join('-')}-${index}`}
              className="flex flex-col gap-3 rounded border border-white/10 bg-black/20 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs uppercase tracking-widest text-white/40">
                    Rank {index + 1}
                  </div>
                  <div className="font-mono text-xl font-semibold text-white">
                    {recommendation.averageScore.toFixed(1)}
                  </div>
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
                  className="rounded border border-white/20 px-2 py-1 text-xs text-white/75 hover:border-white/40 hover:text-white"
                >
                  Promote
                </button>
              </div>

              <ol className="grid grid-cols-2 gap-1 text-xs text-white/70">
                {recommendation.lineupSpeciesIds.map((id, slot) => (
                  <li key={`${id}-${slot}`}>
                    {slot < 2 ? `Lead ${slot + 1}` : `Back ${slot - 1}`}:{' '}
                    {speciesLabel(id)}
                  </li>
                ))}
              </ol>

              <div className="flex flex-col gap-1 text-xs text-white/55">
                {topBreakdowns(recommendation, opponentNameById).map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between gap-2"
                  >
                    <span>
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

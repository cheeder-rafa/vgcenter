import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LineupRecommendations } from '../../../src/features/gameplan/components/LineupRecommendations'
import type {
  RecommendLineupRequest,
  RecommendLineupResponse,
} from '../../../src/features/gameplan/types/api'

vi.mock('../../../src/features/gameplan/api/gameplanApi', () => ({
  recommendLineups: vi.fn(),
}))

const { recommendLineups } =
  await import('../../../src/features/gameplan/api/gameplanApi')

const request = {
  regulation: 'M-A',
  mine: [],
  winConditionIndex: null,
  opponent: [],
} as unknown as RecommendLineupRequest

const response: RecommendLineupResponse = {
  evaluatedLineups: 45,
  recommendations: [
    {
      lineupIndices: [2, 3, 4, 5],
      lineupSpeciesIds: ['tyranitar', 'pikachu', 'farigiraf', 'pelipper'],
      winConditionIndex: 2,
      averageScore: 18,
      cells: [
        {
          firstOpponentIndex: 0,
          secondOpponentIndex: 1,
          opponentLeadSpeciesIds: ['blastoise', 'venusaur'],
          score: {
            total: 24,
            offense: 30,
            defense: -10,
            speed: 0,
            immunity: 4,
          },
          mineFlags: {
            protect: false,
            redirection: false,
            fakeOut: false,
            priority: false,
            speedControl: 'NONE',
          },
          opponentFlags: {
            protect: true,
            redirection: false,
            fakeOut: true,
            priority: true,
            speedControl: 'TRICK_ROOM',
          },
          outgoing: [],
          incoming: [],
        },
      ],
    },
  ],
}

describe('LineupRecommendations', () => {
  beforeEach(() => {
    vi.mocked(recommendLineups).mockReset()
  })

  it('fetches recommendations and promotes an ordered lineup', async () => {
    const user = userEvent.setup()
    const onPromote = vi.fn()
    vi.mocked(recommendLineups).mockResolvedValue(response)

    render(
      <LineupRecommendations
        request={request}
        onPromote={onPromote}
        opponentNameById={{ blastoise: 'Blastoise', venusaur: 'Venusaur' }}
      />,
    )

    await user.click(screen.getByRole('button', { name: /recommend lineups/i }))

    expect(await screen.findByText(/Tyranitar/i)).toBeInTheDocument()
    expect(screen.getByText(/Blastoise \+ Venusaur: 24/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /promote/i }))
    expect(onPromote).toHaveBeenCalledWith({
      lead1: 'tyranitar',
      lead2: 'pikachu',
      back1: 'farigiraf',
      back2: 'pelipper',
    })
  })
})

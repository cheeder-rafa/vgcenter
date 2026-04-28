import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  parseReplay: vi.fn(),
  evaluateReplay: vi.fn(),
}))

vi.mock('../../../src/features/replay/api/replayApi', () => ({
  parseReplay: mocks.parseReplay,
  evaluateReplay: mocks.evaluateReplay,
}))

import { ReplayPage } from '../../../src/pages/ReplayPage'
import { useReplayStore } from '../../../src/features/replay/store/useReplayStore'
import type {
  ReplayDecisionLine,
  ReplayEvaluateResponse,
  ReplayTimeline,
} from '../../../src/features/replay/types'

const emptyBoosts = {
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  speed: 0,
  accuracy: 0,
  evasion: 0,
}

const mon = (slotId: string, name: string) => ({
  slotId,
  speciesName: name,
  hpCurrent: 100,
  hpMax: 100,
  status: null,
  fainted: false,
  boosts: emptyBoosts,
})

const sampleTimeline = (turnNumbers: number[]): ReplayTimeline => ({
  sideAName: 'A',
  sideBName: 'B',
  winner: 'A',
  tie: false,
  turns: turnNumbers.map((number) => ({
    number,
    boardStateAtStart: {
      weather: null,
      terrain: null,
      sideA: {
        playerName: 'A',
        tailwind: false,
        reflect: false,
        lightScreen: false,
        auroraVeil: false,
        activePokemon: [mon('p1a', 'Incineroar'), mon('p1b', 'Amoonguss')],
      },
      sideB: {
        playerName: 'B',
        tailwind: false,
        reflect: false,
        lightScreen: false,
        auroraVeil: false,
        activePokemon: [mon('p2a', 'Flutter Mane'), mon('p2b', 'Urshifu')],
      },
    },
    events: [],
  })),
})

const line = (
  overrides: Partial<ReplayDecisionLine> = {},
): ReplayDecisionLine => ({
  choices: [
    {
      actorSlotId: 'p1a',
      actorSpeciesName: 'Incineroar',
      moveName: 'Knock Off',
      targetSlotId: 'p2a',
      targetSpeciesName: 'Flutter Mane',
    },
  ],
  score: 10,
  expectedDamageDealt: 30,
  expectedDamageTaken: 10,
  expectedKos: 0,
  expectedFaints: 0,
  ...overrides,
})

beforeEach(() => {
  mocks.parseReplay.mockReset()
  mocks.evaluateReplay.mockReset()
  useReplayStore.getState().reset()
})

afterEach(() => {
  useReplayStore.getState().reset()
})

function renderPage() {
  return render(
    <MemoryRouter>
      <ReplayPage />
    </MemoryRouter>,
  )
}

describe('ReplayPage', () => {
  it('renders the input area and headline', () => {
    renderPage()
    expect(
      screen.getByRole('heading', { name: /decision review/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/replay url/i)).toBeInTheDocument()
  })

  it('analyzes a single replay URL and renders one card per turn', async () => {
    const timeline = sampleTimeline([1, 2, 3])
    mocks.parseReplay.mockResolvedValueOnce(timeline)
    const evaluation: ReplayEvaluateResponse = {
      games: [
        {
          gameNumber: 1,
          winner: 'A',
          turnReviews: [1, 2, 3].map((n) => ({
            turnNumber: n,
            played: line(),
            rankedAlternatives: [line({ score: 12 }), line({ score: 8 })],
            delta: 2,
            verdict: 'OPTIMAL',
            narrative: `Turn ${n} narrative`,
          })),
        },
      ],
      adaptationFlags: [],
    }
    mocks.evaluateReplay.mockResolvedValueOnce(evaluation)

    const user = userEvent.setup()
    renderPage()
    await user.type(
      screen.getByLabelText(/replay url/i),
      'https://replay.pokemonshowdown.com/gen9championsvgc2026regma-2593988469-x',
    )
    await user.click(screen.getByRole('button', { name: /run autopsy/i }))

    await waitFor(() =>
      expect(screen.getAllByTestId('turn-review-card')).toHaveLength(3),
    )
    expect(mocks.parseReplay).toHaveBeenCalledTimes(1)
    expect(mocks.evaluateReplay).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Turn 2 narrative')).toBeInTheDocument()
  })

  it('chains BO3 URLs and surfaces adaptation flags', async () => {
    const t1 = sampleTimeline([1, 2])
    const t2 = sampleTimeline([1])
    mocks.parseReplay.mockResolvedValueOnce(t1).mockResolvedValueOnce(t2)
    const evaluation: ReplayEvaluateResponse = {
      games: [
        {
          gameNumber: 1,
          winner: 'A',
          turnReviews: [1, 2].map((n) => ({
            turnNumber: n,
            played: line(),
            rankedAlternatives: [],
            delta: 0,
            verdict: 'OPTIMAL',
            narrative: `G1T${n}`,
          })),
        },
        {
          gameNumber: 2,
          winner: 'B',
          turnReviews: [
            {
              turnNumber: 1,
              played: line(),
              rankedAlternatives: [],
              delta: 0,
              verdict: 'ACCEPTABLE',
              narrative: 'G2T1',
            },
          ],
        },
      ],
      adaptationFlags: ['Opponent re-led Flutter Mane after losing G1'],
    }
    mocks.evaluateReplay.mockResolvedValueOnce(evaluation)

    const user = userEvent.setup()
    renderPage()
    const urls = [
      'https://replay.pokemonshowdown.com/gen9championsvgc2026regmabo3-2586638266-a',
      'https://replay.pokemonshowdown.com/gen9championsvgc2026regmabo3-2586642583-b',
    ].join('\n')
    await user.type(screen.getByLabelText(/replay url/i), urls)
    await user.click(screen.getByRole('button', { name: /run autopsy/i }))

    await waitFor(() =>
      expect(screen.getAllByTestId('turn-review-card')).toHaveLength(3),
    )
    expect(screen.getByTestId('adaptation-flags')).toHaveTextContent(
      /Flutter Mane/,
    )
    expect(screen.getByText(/Game 1/)).toBeInTheDocument()
    expect(screen.getByText(/Game 2/)).toBeInTheDocument()
    expect(mocks.parseReplay).toHaveBeenCalledTimes(2)
  })
})

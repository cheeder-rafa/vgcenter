import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PlanCards } from '../../../src/features/preview/components/PlanCards'
import { usePreviewModeStore } from '../../../src/features/preview/store/usePreviewModeStore'
import type {
  PlanRecommendation,
  RecommendPlansResult,
} from '../../../src/features/preview/types'

const plan1: PlanRecommendation = {
  bringIndices: [0, 1, 2, 3],
  leadIndices: [0, 1],
  summary: 'Lead Flutter Mane + Incineroar. Strong into most of the field.',
  modesCovered: ['Opponent A + Opponent B'],
  modesAtRisk: ['Opponent C + Opponent D'],
  winConditionSupported: true,
  leftOutRationale: ['Palafin: left out — coverage handled by the core four.'],
  predictionBurden: 'low',
  winConditionRole: 'backline',
}

const plan2: PlanRecommendation = {
  bringIndices: [0, 2, 3, 4],
  leadIndices: [1, 2],
  summary: 'Lead Incineroar + Urshifu. Aggressive double pressure.',
  modesCovered: [],
  modesAtRisk: ['Opponent E + Opponent F'],
  winConditionSupported: false,
  leftOutRationale: [
    'Amoonguss: left out — coverage handled by the core four.',
  ],
  predictionBurden: 'medium',
  winConditionRole: 'benched',
}

const myTeamNames = [
  'Flutter Mane',
  'Incineroar',
  'Urshifu',
  'Palafin',
  'Amoonguss',
  'Rillaboom',
]

describe('PlanCards', () => {
  beforeEach(() => {
    usePreviewModeStore.setState({ mode: 'expert' })
  })

  it('renders a card for each plan', () => {
    const result: RecommendPlansResult = { plans: [plan1, plan2] }

    render(
      <PlanCards
        result={result}
        myTeamNames={myTeamNames}
        onPromote={vi.fn()}
        winConditionIndex={null}
        onWinConditionChange={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('article')).toHaveLength(2)
  })

  it('shows the verdict headline on each card', () => {
    const result: RecommendPlansResult = { plans: [plan1] }

    render(
      <PlanCards
        result={result}
        myTeamNames={myTeamNames}
        onPromote={vi.fn()}
        winConditionIndex={null}
        onWinConditionChange={vi.fn()}
      />,
    )

    expect(
      screen.getByText(/lead flutter mane \+ incineroar/i),
    ).toBeInTheDocument()
  })

  it('hides rationale lists in beginner mode until "Why this plan" is clicked', async () => {
    const user = userEvent.setup()
    usePreviewModeStore.setState({ mode: 'beginner' })
    const result: RecommendPlansResult = { plans: [plan1] }

    render(
      <PlanCards
        result={result}
        myTeamNames={myTeamNames}
        onPromote={vi.fn()}
        winConditionIndex={null}
        onWinConditionChange={vi.fn()}
      />,
    )

    expect(screen.queryByText(/read difficulty/i)).not.toBeInTheDocument()
    expect(
      screen.queryByText(/opponent a \+ opponent b/i),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /why this plan/i }))

    expect(screen.getByText(/read difficulty/i)).toBeInTheDocument()
    expect(screen.getByText(/opponent a \+ opponent b/i)).toBeInTheDocument()
  })

  it('shows read difficulty label', () => {
    const result: RecommendPlansResult = { plans: [plan1, plan2] }

    render(
      <PlanCards
        result={result}
        myTeamNames={myTeamNames}
        onPromote={vi.fn()}
        winConditionIndex={null}
        onWinConditionChange={vi.fn()}
      />,
    )

    expect(screen.getAllByText(/read difficulty/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/low/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/medium/i).length).toBeGreaterThan(0)
  })

  it('shows win condition role for plans when a win condition is set', () => {
    const result: RecommendPlansResult = { plans: [plan1] }

    render(
      <PlanCards
        result={result}
        myTeamNames={myTeamNames}
        onPromote={vi.fn()}
        winConditionIndex={0}
        onWinConditionChange={vi.fn()}
      />,
    )

    expect(screen.getByText(/win condition in back/i)).toBeInTheDocument()
  })

  it('calls onPromote with the plan when the promote button is clicked', async () => {
    const user = userEvent.setup()
    const onPromote = vi.fn()
    const result: RecommendPlansResult = { plans: [plan1] }

    render(
      <PlanCards
        result={result}
        myTeamNames={myTeamNames}
        onPromote={onPromote}
        winConditionIndex={null}
        onWinConditionChange={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /use this plan/i }))

    expect(onPromote).toHaveBeenCalledWith(plan1)
  })

  it('shows modesCovered and modesAtRisk sections', () => {
    const result: RecommendPlansResult = { plans: [plan1] }

    render(
      <PlanCards
        result={result}
        myTeamNames={myTeamNames}
        onPromote={vi.fn()}
        winConditionIndex={null}
        onWinConditionChange={vi.fn()}
      />,
    )

    expect(screen.getByText(/opponent a \+ opponent b/i)).toBeInTheDocument()
    expect(screen.getByText(/opponent c \+ opponent d/i)).toBeInTheDocument()
  })

  it('renders empty state when result has no plans', () => {
    render(
      <PlanCards
        result={{ plans: [] }}
        myTeamNames={myTeamNames}
        onPromote={vi.fn()}
        winConditionIndex={null}
        onWinConditionChange={vi.fn()}
      />,
    )

    expect(screen.getByText(/no recommendations/i)).toBeInTheDocument()
  })

  it('renders a win-condition picker above the cards', () => {
    const result: RecommendPlansResult = { plans: [plan1] }

    render(
      <PlanCards
        result={result}
        myTeamNames={myTeamNames}
        onPromote={vi.fn()}
        winConditionIndex={null}
        onWinConditionChange={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('combobox', { name: /win condition/i }),
    ).toBeInTheDocument()
  })

  it('calls onWinConditionChange when a different win-condition is selected', async () => {
    const user = userEvent.setup()
    const onWinConditionChange = vi.fn()
    const result: RecommendPlansResult = { plans: [plan1] }

    render(
      <PlanCards
        result={result}
        myTeamNames={myTeamNames}
        onPromote={vi.fn()}
        winConditionIndex={null}
        onWinConditionChange={onWinConditionChange}
      />,
    )

    await user.selectOptions(
      screen.getByRole('combobox', { name: /win condition/i }),
      'Flutter Mane',
    )

    expect(onWinConditionChange).toHaveBeenCalledWith(0)
  })
})

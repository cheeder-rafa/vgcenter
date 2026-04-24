import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Bo3Notebook } from '../../../src/features/preview/components/Bo3Notebook'
import type { GameRecord } from '../../../src/features/preview/types'

function makeGame(overrides: Partial<GameRecord> = {}): GameRecord {
  return {
    gameNumber: 1,
    result: null,
    myLeads: '',
    opponentLeads: '',
    myBrought: '',
    opponentBrought: '',
    scoutedInfo: '',
    unrevealedInfo: '',
    resultNotes: '',
    opponentBehavior: null,
    ...overrides,
  }
}

describe('Bo3Notebook', () => {
  it('renders the section heading', () => {
    render(<Bo3Notebook games={[]} onAddGame={vi.fn()} onClear={vi.fn()} />)
    expect(
      screen.getByRole('heading', { name: /BO3 Adaptation Notebook/i }),
    ).toBeInTheDocument()
  })

  it('renders the add game 1 button when no games recorded', () => {
    render(<Bo3Notebook games={[]} onAddGame={vi.fn()} onClear={vi.fn()} />)
    expect(
      screen.getByRole('button', { name: /record game 1/i }),
    ).toBeInTheDocument()
  })

  it('renders the add game 2 button after game 1 is recorded', () => {
    render(
      <Bo3Notebook
        games={[makeGame({ gameNumber: 1, result: 'win' })]}
        onAddGame={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    expect(
      screen.getByRole('button', { name: /record game 2/i }),
    ).toBeInTheDocument()
  })

  it('shows recorded game result', () => {
    render(
      <Bo3Notebook
        games={[makeGame({ gameNumber: 1, result: 'win', myLeads: 'Tornadus + Urshifu' })]}
        onAddGame={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    expect(screen.getByText('win')).toBeInTheDocument()
  })

  it('shows scouted info in recorded game', () => {
    render(
      <Bo3Notebook
        games={[makeGame({ gameNumber: 1, result: 'loss', scoutedInfo: 'Flutter Mane: Timid' })]}
        onAddGame={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    expect(screen.getByText('Flutter Mane: Timid')).toBeInTheDocument()
  })

  it('shows adaptation guidance when games with results exist', () => {
    render(
      <Bo3Notebook
        games={[makeGame({ gameNumber: 1, result: 'win', opponentBehavior: 'ran-it-back' })]}
        onAddGame={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    expect(screen.getByText(/run it back/i)).toBeInTheDocument()
  })

  it('shows export buttons when at least one game is recorded', () => {
    render(
      <Bo3Notebook
        games={[makeGame({ gameNumber: 1, result: 'win' })]}
        onAddGame={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /copy as markdown/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copy as json/i })).toBeInTheDocument()
  })

  it('does not show export buttons when no games recorded', () => {
    render(<Bo3Notebook games={[]} onAddGame={vi.fn()} onClear={vi.fn()} />)
    expect(
      screen.queryByRole('button', { name: /copy as markdown/i }),
    ).not.toBeInTheDocument()
  })

  it('calls onAddGame when a game form is submitted', async () => {
    const onAddGame = vi.fn()
    render(<Bo3Notebook games={[]} onAddGame={onAddGame} onClear={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /record game 1/i }))

    const resultSelect = screen.getByRole('combobox', { name: /result/i })
    await userEvent.selectOptions(resultSelect, 'win')

    await userEvent.click(screen.getByRole('button', { name: /save game 1/i }))

    expect(onAddGame).toHaveBeenCalledOnce()
    const savedGame = onAddGame.mock.calls[0][0] as GameRecord
    expect(savedGame.result).toBe('win')
    expect(savedGame.gameNumber).toBe(1)
  })

  it('calls onClear when clear button is pressed and games exist', async () => {
    const onClear = vi.fn()
    render(
      <Bo3Notebook
        games={[makeGame({ gameNumber: 1, result: 'win' })]}
        onAddGame={vi.fn()}
        onClear={onClear}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /clear all/i }))
    expect(onClear).toHaveBeenCalledOnce()
  })

  it('has accessible labels on all form fields', async () => {
    render(<Bo3Notebook games={[]} onAddGame={vi.fn()} onClear={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /record game 1/i }))

    expect(screen.getByLabelText(/result/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/my leads/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/opponent leads/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/scouted info/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/unrevealed info/i)).toBeInTheDocument()
  })
})

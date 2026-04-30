import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { TeamPrepPage } from '../../../src/pages/TeamPrepPage'
import { usePrepNotebookStore } from '../../../src/features/prep/store/usePrepNotebookStore'
import type { SavedPokemon } from '../../../src/store/useTeamsStore'
import { useTeamsStore } from '../../../src/store/useTeamsStore'

function savedPokemon(name: string, speed: number, attack = 120): SavedPokemon {
  return {
    speciesId: name.toLowerCase(),
    speciesName: name,
    spriteId: name.toLowerCase(),
    natureId: 'serious',
    sp: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    abilityId: null,
    itemId: null,
    status: 'NONE',
    megaActive: false,
    megaFormId: null,
    moves: [
      { moveId: 'protect' },
      { moveId: null },
      { moveId: null },
      { moveId: null },
    ],
    baseStats: {
      hp: 150,
      attack,
      defense: 100,
      specialAttack: 100,
      specialDefense: 100,
      speed,
    },
    finalStats: {
      hp: 150,
      attack,
      defense: 100,
      specialAttack: 100,
      specialDefense: 100,
      speed,
    },
    types: ['NORMAL', null],
    grounded: true,
    currentHp: 150,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <TeamPrepPage />
    </MemoryRouter>,
  )
}

describe('TeamPrepPage', () => {
  beforeEach(() => {
    useTeamsStore.getState().reset()
    useTeamsStore.persist.clearStorage()
    usePrepNotebookStore.getState().reset()
    usePrepNotebookStore.persist.clearStorage()
  })

  it('renders empty-state workflow links', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { level: 1, name: /team prep/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/import your team/i)).toBeInTheDocument()
    expect(
      screen.getAllByRole('link', { name: /open calc/i })[0],
    ).toHaveAttribute('href', '/calc')
    expect(
      screen.getByRole('link', { name: /preview coach/i }),
    ).toHaveAttribute('href', '/preview')
    expect(screen.getByText(/tournament-backed context/i)).toBeInTheDocument()
    expect(screen.getByText(/at least 40 players/i)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /limitless tournament platform/i }),
    ).toHaveAttribute('href', expect.stringContaining('play.limitlesstcg.com'))
    expect(
      screen.getByRole('link', { name: /pikalytics champions tournaments/i }),
    ).toHaveAttribute('href', expect.stringContaining('pikalytics.com'))
  })

  it('shows saved team readiness, threats, and editable notes', async () => {
    useTeamsStore.setState({
      mine: [
        savedPokemon('Charizard', 132),
        savedPokemon('Amoonguss', 31),
        null,
        null,
        null,
        null,
      ],
      opponent: [
        savedPokemon('Dragonite', 145, 204),
        savedPokemon('Incineroar', 80, 160),
        null,
        null,
        null,
        null,
      ],
    })
    const user = userEvent.setup()

    renderPage()

    expect(screen.getAllByText(/2 \/ 6 saved/i)).toHaveLength(2)
    expect(screen.getAllByText(/Dragonite/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Charizard/i).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /watch dragonite/i }))
    expect(
      screen.getByRole('button', { name: /unwatch dragonite/i }),
    ).toBeInTheDocument()

    await user.type(
      screen.getByLabelText(/opponent notes/i),
      'Expect Dragonite lead.',
    )
    expect(usePrepNotebookStore.getState().opponentNotes).toContain(
      'Dragonite lead',
    )
    expect(screen.getAllByText(/Sneasler/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/51.30%/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/2 top picks/i)).toBeInTheDocument()
    expect(screen.getByText(/Defensive spread suggestions/i)).toBeInTheDocument()
    expect(screen.getByText(/Tech move suggestions/i)).toBeInTheDocument()
    expect(screen.getByText(/Replacement candidates/i)).toBeInTheDocument()
    expect(
      screen.getAllByRole('link', { name: /open calc evidence/i }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('link', { name: /open source/i }).length,
    ).toBeGreaterThan(0)
  })
})

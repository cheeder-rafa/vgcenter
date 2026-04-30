import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { usePrepNotebookStore } from '../../../src/features/prep/store/usePrepNotebookStore'
import { usePracticeHistoryStore } from '../../../src/features/practice/store/usePracticeHistoryStore'
import { PracticePage } from '../../../src/pages/PracticePage'
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
      { moveId: 'heat-wave' },
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
    types: ['FIRE', null],
    grounded: true,
    currentHp: 150,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <PracticePage />
    </MemoryRouter>,
  )
}

describe('PracticePage', () => {
  beforeEach(() => {
    useTeamsStore.getState().reset()
    useTeamsStore.persist.clearStorage()
    usePrepNotebookStore.getState().reset()
    usePrepNotebookStore.persist.clearStorage()
    usePracticeHistoryStore.getState().clear()
    usePracticeHistoryStore.persist.clearStorage()
  })

  it('renders three drill types and calc-backed answers', () => {
    useTeamsStore.setState({
      mine: [savedPokemon('Charizard', 132), savedPokemon('Amoonguss', 30), null, null, null, null],
      opponent: [savedPokemon('Dragonite', 145, 204), null, null, null, null, null],
    })
    usePrepNotebookStore.setState({
      watchedThreatIds: ['dragonite'],
      replayFindings: [
        {
          id: 'finding-1',
          type: 'turning-point',
          title: 'Turn 4 swing',
          note: 'Lost board after missing KO line.',
          source: 'https://replay.pokemonshowdown.com/test-1',
          gameNumber: 1,
          turnNumber: 4,
          createdAt: '2026-04-29T10:00:00.000Z',
        },
      ],
    })

    renderPage()

    expect(
      screen.getByRole('heading', { level: 1, name: /practice mode/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/does this survive/i)).toBeInTheDocument()
    expect(screen.getByText(/best ko odds/i)).toBeInTheDocument()
    expect(screen.getByText(/safest lead/i)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /open in calc/i }).length).toBe(
      3,
    )
  })

  it('stores local drill history when user scores a drill', async () => {
    useTeamsStore.setState({
      mine: [savedPokemon('Charizard', 132), null, null, null, null, null],
      opponent: [savedPokemon('Dragonite', 145, 204), null, null, null, null, null],
    })
    const user = userEvent.setup()

    renderPage()

    await user.click(screen.getAllByRole('button', { name: /mark correct/i })[0]!)

    expect(usePracticeHistoryStore.getState().entries.length).toBe(1)
    expect(usePracticeHistoryStore.getState().entries[0]?.result).toBe('correct')
  })
})

import { beforeEach, describe, expect, it } from 'vitest'

import { useGameplanStore } from '../../../src/features/gameplan/store/useGameplanStore'

describe('useGameplanStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameplanStore.setState({
      gamePlanNote: '',
      opponentArchetypeTag: '',
    })
  })

  it('persists game-plan note and opponent archetype metadata', () => {
    useGameplanStore
      .getState()
      .setGamePlanNote('Protect Charizard, pivot late.')
    useGameplanStore.getState().setOpponentArchetypeTag('Trick Room')

    const raw = localStorage.getItem('vgcenter.gameplan.v1')

    expect(raw).not.toBeNull()
    expect(JSON.parse(raw as string).state).toMatchObject({
      gamePlanNote: 'Protect Charizard, pivot late.',
      opponentArchetypeTag: 'Trick Room',
    })
  })
})

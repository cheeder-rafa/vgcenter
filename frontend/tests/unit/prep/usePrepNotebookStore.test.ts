import { beforeEach, describe, expect, it } from 'vitest'

import { usePrepNotebookStore } from '../../../src/features/prep/store/usePrepNotebookStore'

describe('usePrepNotebookStore replay findings', () => {
  beforeEach(() => {
    usePrepNotebookStore.getState().reset()
    usePrepNotebookStore.persist.clearStorage()
  })

  it('persists replay finding with source and turn reference', () => {
    usePrepNotebookStore.getState().addReplayFinding({
      type: 'missed-ko',
      title: 'Missed KO on turn 4',
      note: 'Used spread move into wrong slot.',
      source: 'https://replay.pokemonshowdown.com/foo',
      gameNumber: 1,
      turnNumber: 4,
    })

    const findings = usePrepNotebookStore.getState().replayFindings
    expect(findings).toHaveLength(1)
    expect(findings[0]).toEqual(
      expect.objectContaining({
        type: 'missed-ko',
        source: 'https://replay.pokemonshowdown.com/foo',
        gameNumber: 1,
        turnNumber: 4,
      }),
    )
  })
})

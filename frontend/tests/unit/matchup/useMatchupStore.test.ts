import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useMatchupStore } from '../../../src/features/matchup/store/useMatchupStore'

const { importShowdownMock, importPokepasteMock } = vi.hoisted(() => ({
  importShowdownMock: vi.fn(),
  importPokepasteMock: vi.fn(),
}))

vi.mock('../../../src/features/calculator/api/importApi', () => ({
  importShowdown: importShowdownMock,
  importPokepaste: importPokepasteMock,
}))

describe('useMatchupStore import auto-detect', () => {
  beforeEach(() => {
    importShowdownMock.mockReset()
    importPokepasteMock.mockReset()
    useMatchupStore.getState().reset()
  })

  it('uses Pokepaste importer for valid pokepast.es URL', async () => {
    importPokepasteMock.mockResolvedValue({
      team: [{ speciesName: 'Garchomp', speciesId: 'garchomp' }],
    })
    useMatchupStore.getState().setRawA('https://pokepast.es/abcd123')

    await useMatchupStore.getState().importTeamA()

    expect(importPokepasteMock).toHaveBeenCalledWith('https://pokepast.es/abcd123')
    expect(importShowdownMock).not.toHaveBeenCalled()
  })

  it('uses Showdown importer for non-URL paste text', async () => {
    importShowdownMock.mockResolvedValue({
      team: [{ speciesName: 'Aegislash', speciesId: 'aegislash-shield' }],
    })
    useMatchupStore.getState().setRawA('Aegislash @ Leftovers\n- Shadow Ball')

    await useMatchupStore.getState().importTeamA()

    expect(importShowdownMock).toHaveBeenCalledWith(
      'Aegislash @ Leftovers\n- Shadow Ball',
    )
    expect(importPokepasteMock).not.toHaveBeenCalled()
  })
})

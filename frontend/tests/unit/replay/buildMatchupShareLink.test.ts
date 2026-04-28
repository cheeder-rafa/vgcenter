import { describe, expect, it } from 'vitest'

import { decodeCalcState } from '../../../src/features/calculator/share/encodeState'
import {
  buildMatchupShareLink,
  speciesNameToId,
} from '../../../src/features/replay/lib/buildMatchupShareLink'
import type {
  ReplayBoardState,
  ReplayMoveChoice,
} from '../../../src/features/replay/types'

const board: ReplayBoardState = {
  weather: 'SUN',
  terrain: 'NONE',
  sideA: {
    playerName: 'A',
    tailwind: true,
    reflect: false,
    lightScreen: false,
    auroraVeil: false,
    activePokemon: [
      {
        slotId: 'p1a',
        speciesName: 'Incineroar',
        hpCurrent: 180,
        hpMax: 200,
        status: null,
        fainted: false,
        boosts: {
          attack: 1,
          defense: 0,
          specialAttack: 0,
          specialDefense: 0,
          speed: 0,
          accuracy: 0,
          evasion: 0,
        },
      },
    ],
  },
  sideB: {
    playerName: 'B',
    tailwind: false,
    reflect: false,
    lightScreen: false,
    auroraVeil: false,
    activePokemon: [
      {
        slotId: 'p2a',
        speciesName: 'Flutter Mane',
        hpCurrent: 130,
        hpMax: 130,
        status: null,
        fainted: false,
        boosts: {
          attack: 0,
          defense: 0,
          specialAttack: 0,
          specialDefense: 0,
          speed: 0,
          accuracy: 0,
          evasion: 0,
        },
      },
    ],
  },
}

describe('speciesNameToId', () => {
  it('slugifies species names', () => {
    expect(speciesNameToId('Flutter Mane')).toBe('flutter-mane')
    expect(speciesNameToId('Farfetch’d')).toBe('farfetchd')
  })
})

describe('buildMatchupShareLink', () => {
  it('encodes attacker, defender, weather, and tailwind into the share state', () => {
    const choice: ReplayMoveChoice = {
      actorSlotId: 'p1a',
      actorSpeciesName: 'Incineroar',
      moveName: 'Knock Off',
      targetSlotId: 'p2a',
      targetSpeciesName: 'Flutter Mane',
    }
    const link = buildMatchupShareLink(choice, board)
    expect(link.startsWith('/calc?s=')).toBe(true)
    const encoded = link.split('=')[1]
    const decoded = decodeCalcState(encoded)
    expect(decoded).not.toBeNull()
    expect(decoded?.attacker.speciesId).toBe('incineroar')
    expect(decoded?.defender.speciesId).toBe('flutter-mane')
    expect(decoded?.field.weather).toBe('SUN')
    expect(decoded?.attackerSide.tailwind).toBe(true)
    expect(decoded?.defenderSide.tailwind).toBe(false)
    expect(decoded?.attacker.stages.atk).toBe(1)
  })
})

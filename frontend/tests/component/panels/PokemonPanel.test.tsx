import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PokemonPanel } from '../../../src/features/calculator/components/PokemonPanel'
import { useCalculatorStore } from '../../../src/features/calculator/store/useCalculatorStore'
import type {
  NamedDatasetEntry,
  NatureResponse,
  PokedexEntry,
} from '../../../src/features/calculator/types/api'

const pokedex: PokedexEntry[] = [
  {
    id: 'charizard',
    name: 'Charizard',
    imageUrl: '/sprites/charizard.png',
    types: ['FIRE', 'FLYING'],
    baseStats: {
      hp: 78,
      attack: 84,
      defense: 78,
      specialAttack: 109,
      specialDefense: 85,
      speed: 100,
    },
    abilityIds: ['blaze', 'solar-power'],
    moveIds: ['heat-wave', 'protect', 'air-slash'],
    megaForms: [],
  },
  {
    id: 'amoonguss',
    name: 'Amoonguss',
    imageUrl: '/sprites/amoonguss.png',
    types: ['GRASS', 'POISON'],
    baseStats: {
      hp: 114,
      attack: 85,
      defense: 70,
      specialAttack: 85,
      specialDefense: 80,
      speed: 30,
    },
    abilityIds: ['regenerator'],
    moveIds: ['spore', 'rage-powder'],
    megaForms: [],
  },
]

const abilities: NamedDatasetEntry[] = [
  { id: 'blaze', name: 'Blaze' },
  { id: 'solar-power', name: 'Solar Power' },
  { id: 'regenerator', name: 'Regenerator' },
  { id: 'levitate', name: 'Levitate' },
]

const items: NamedDatasetEntry[] = [
  { id: 'life-orb', name: 'Life Orb' },
  { id: 'sitrus-berry', name: 'Sitrus Berry' },
]

const moves: NamedDatasetEntry[] = [
  { id: 'heat-wave', name: 'Heat Wave' },
  { id: 'protect', name: 'Protect' },
  { id: 'air-slash', name: 'Air Slash' },
  { id: 'spore', name: 'Spore' },
  { id: 'rage-powder', name: 'Rage Powder' },
]

const natures: NatureResponse[] = [
  { id: 'serious', name: 'Serious', increasedStat: null, decreasedStat: null },
  {
    id: 'timid',
    name: 'Timid',
    increasedStat: 'SPEED',
    decreasedStat: 'ATTACK',
  },
]

function renderPanel(onFocus = vi.fn()) {
  return {
    onFocus,
    ...render(
      <PokemonPanel
        side="attacker"
        pokedex={pokedex}
        abilities={abilities}
        items={items}
        natures={natures}
        moves={moves}
        focusedSide="attacker"
        focusedMoveIndex={0}
        onFocusSlot={onFocus}
      />,
    ),
  }
}

describe('PokemonPanel', () => {
  beforeEach(() => {
    useCalculatorStore.getState().reset()
  })

  it('renders a placeholder heading and sprite fallback when no species is selected', () => {
    renderPanel()
    expect(
      screen.getByRole('heading', { name: /attacker/i, level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /no pokémon/i })).toBeInTheDocument()
  })

  it('populates types and filters legal abilities when a species is selected', async () => {
    renderPanel()
    const user = userEvent.setup()

    const speciesSelect = screen.getByRole('combobox', { name: /^species$/i })
    await user.selectOptions(speciesSelect, 'charizard')

    const state = useCalculatorStore.getState().attacker
    expect(state.speciesId).toBe('charizard')
    expect(state.types).toEqual(['FIRE', 'FLYING'])
    expect(state.grounded).toBe(false)
    expect(state.abilityId).toBe('blaze')

    const abilitySelect = screen.getByLabelText(
      /^ability$/i,
    ) as HTMLSelectElement
    const abilityValues = Array.from(abilitySelect.options).map(
      (option) => option.value,
    )
    // Abilities filtered to Charizard's legal set plus the empty option
    expect(abilityValues).toEqual(
      expect.arrayContaining(['', 'blaze', 'solar-power']),
    )
    expect(abilityValues).not.toContain('regenerator')
    expect(abilityValues).not.toContain('levitate')
  })

  it('filters move-slot options to the species learnset', async () => {
    renderPanel()
    const user = userEvent.setup()

    const speciesSelect = screen.getByRole('combobox', { name: /^species$/i })
    await user.selectOptions(speciesSelect, 'charizard')

    const slot = screen.getByTestId('move-slot-0')
    const options = within(slot).getAllByRole('option')
    const values = options.map((option) => option.getAttribute('value'))

    expect(values).toEqual(
      expect.arrayContaining(['', 'heat-wave', 'protect', 'air-slash']),
    )
    expect(values).not.toContain('spore')
    expect(values).not.toContain('rage-powder')
  })

  it('focuses a move slot when clicked', async () => {
    const onFocus = vi.fn()
    renderPanel(onFocus)
    const user = userEvent.setup()

    await user.click(screen.getByTestId('move-slot-2'))
    expect(onFocus).toHaveBeenCalledWith('attacker', 2)
  })
})

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SpeciesSelect } from '../../../src/features/calculator/components/SpeciesSelect'
import type { PokedexEntry } from '../../../src/features/calculator/types/api'

const pokedex: PokedexEntry[] = [
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
    moveIds: ['spore'],
    megaForms: [],
  },
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
    abilityIds: ['blaze'],
    moveIds: ['heat-wave'],
    megaForms: [],
  },
  {
    id: 'hydrapple',
    name: 'Hydrapple',
    imageUrl: '/sprites/hydrapple.png',
    types: ['GRASS', 'DRAGON'],
    baseStats: {
      hp: 106,
      attack: 80,
      defense: 110,
      specialAttack: 120,
      specialDefense: 80,
      speed: 44,
    },
    abilityIds: ['supersweet-syrup'],
    moveIds: ['fickle-beam'],
    megaForms: [],
  },
]

describe('SpeciesSelect', () => {
  it('filters the inline popover list from one input and selects with keyboard navigation', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <SpeciesSelect
        pokedex={pokedex}
        speciesId={null}
        onChange={onChange}
        accent="plasma"
      />,
    )

    const combobox = screen.getByRole('combobox', { name: /^species$/i })
    await user.click(combobox)
    await user.type(combobox, 'char')

    const listbox = screen.getByRole('listbox', { name: /species options/i })
    expect(within(listbox).getAllByRole('option')).toHaveLength(1)
    expect(
      within(listbox).getByRole('option', { name: /charizard/i }),
    ).toBeInTheDocument()

    await user.keyboard('{ArrowDown}{Enter}')

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'charizard', name: 'Charizard' }),
    )
  })

  it('shows the selected species in the input and clears it with the clear button', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <SpeciesSelect
        pokedex={pokedex}
        speciesId="hydrapple"
        onChange={onChange}
        accent="cyan"
      />,
    )

    const combobox = screen.getByRole('combobox', { name: /^species$/i })
    expect(combobox).toHaveValue('Hydrapple')

    await user.click(screen.getByRole('button', { name: /clear species/i }))

    expect(onChange).toHaveBeenCalledWith(null)
    expect(combobox).toHaveValue('')
  })

  it('closes the popover on escape', async () => {
    const user = userEvent.setup()

    render(
      <SpeciesSelect
        pokedex={pokedex}
        speciesId={null}
        onChange={vi.fn()}
        accent="plasma"
      />,
    )

    const combobox = screen.getByRole('combobox', { name: /^species$/i })
    await user.click(combobox)
    expect(
      screen.getByRole('listbox', { name: /species options/i }),
    ).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(
      screen.queryByRole('listbox', { name: /species options/i }),
    ).not.toBeInTheDocument()
  })
})

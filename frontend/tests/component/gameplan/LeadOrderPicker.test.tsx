import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { LeadOrderPicker } from '../../../src/features/gameplan/components/LeadOrderPicker'
import type { SavedPokemon } from '../../../src/store/useTeamsStore'
import type { CombatantBuild } from '../../../src/features/calculator/types/api'

function makePokemon(speciesId: string): SavedPokemon {
  return {
    speciesId,
    speciesName: speciesId,
    spriteId: speciesId,
    natureId: 'serious',
    sp: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    abilityId: null,
    itemId: null,
    status: 'NONE' as const,
    megaActive: false,
    megaFormId: null,
    moves: [
      { moveId: null },
      { moveId: null },
      { moveId: null },
      { moveId: null },
    ] as CombatantBuild['moves'],
    baseStats: null,
    finalStats: null,
    types: ['NORMAL', null] as CombatantBuild['types'],
    grounded: true,
    currentHp: 100,
  }
}

const SIX_POKEMON = [
  makePokemon('charizard'),
  makePokemon('amoonguss'),
  makePokemon('incineroar'),
  makePokemon('rillaboom'),
  makePokemon('gholdengo'),
  makePokemon('flutter-mane'),
]

describe('LeadOrderPicker', () => {
  it('renders all six Pokémon as selectable options', () => {
    render(
      <LeadOrderPicker
        roster={SIX_POKEMON}
        order={{ lead1: null, lead2: null, back1: null, back2: null }}
        onChange={() => {}}
      />,
    )

    for (const mon of SIX_POKEMON) {
      expect(screen.getAllByText(mon.speciesId).length).toBeGreaterThan(0)
    }
  })

  it('renders four slot labels: Lead 1, Lead 2, Back 1, Back 2', () => {
    render(
      <LeadOrderPicker
        roster={SIX_POKEMON}
        order={{ lead1: null, lead2: null, back1: null, back2: null }}
        onChange={() => {}}
      />,
    )

    expect(screen.getByText(/lead 1/i)).toBeInTheDocument()
    expect(screen.getByText(/lead 2/i)).toBeInTheDocument()
    expect(screen.getByText(/back 1/i)).toBeInTheDocument()
    expect(screen.getByText(/back 2/i)).toBeInTheDocument()
  })

  it('calls onChange when a Pokémon is assigned to a slot', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <LeadOrderPicker
        roster={SIX_POKEMON}
        order={{ lead1: null, lead2: null, back1: null, back2: null }}
        onChange={onChange}
      />,
    )

    const lead1Selects = screen.getAllByRole('combobox')
    await user.selectOptions(lead1Selects[0], 'charizard')

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ lead1: 'charizard' }),
    )
  })

  it('does not allow the same Pokémon in two slots', () => {
    const onChange = vi.fn()

    render(
      <LeadOrderPicker
        roster={SIX_POKEMON}
        order={{ lead1: 'charizard', lead2: null, back1: null, back2: null }}
        onChange={onChange}
      />,
    )

    const [, lead2Select] = screen.getAllByRole('combobox')
    // Charizard option should be disabled in the lead2 selector
    const charizardOption = Array.from(lead2Select.querySelectorAll('option')).find(
      (o) => o.value === 'charizard',
    )

    expect(charizardOption).toBeDisabled()
  })

  it('shows a validation message when fewer than 4 are selected', () => {
    render(
      <LeadOrderPicker
        roster={SIX_POKEMON}
        order={{ lead1: 'charizard', lead2: null, back1: null, back2: null }}
        onChange={() => {}}
      />,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows no validation message when all 4 slots are filled', () => {
    render(
      <LeadOrderPicker
        roster={SIX_POKEMON}
        order={{
          lead1: 'charizard',
          lead2: 'amoonguss',
          back1: 'incineroar',
          back2: 'rillaboom',
        }}
        onChange={() => {}}
      />,
    )

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('disables all slots when roster has fewer than 4 Pokémon', () => {
    render(
      <LeadOrderPicker
        roster={SIX_POKEMON.slice(0, 2)}
        order={{ lead1: null, lead2: null, back1: null, back2: null }}
        onChange={() => {}}
      />,
    )

    const selects = screen.getAllByRole('combobox')
    for (const select of selects) {
      expect(select).toBeDisabled()
    }
  })
})

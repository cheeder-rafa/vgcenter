import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ScenarioEditor } from '../../../src/features/gameplan/components/ScenarioEditor'
import type { SavedPokemon } from '../../../src/store/useTeamsStore'
import type { CombatantBuild } from '../../../src/features/calculator/types/api'

function makePokemon(speciesId: string, speciesName = speciesId): SavedPokemon {
  return {
    speciesId,
    speciesName,
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

const ROSTER = [
  makePokemon('charizard', 'Charizard'),
  makePokemon('amoonguss', 'Amoonguss'),
  makePokemon('incineroar', 'Incineroar'),
  makePokemon('rillaboom', 'Rillaboom'),
  makePokemon('gholdengo', 'Gholdengo'),
  makePokemon('flutter-mane', 'Flutter Mane'),
]

const FILLED_ORDER = {
  lead1: 'charizard',
  lead2: 'amoonguss',
  back1: 'incineroar',
  back2: 'rillaboom',
} as const

describe('ScenarioEditor — mine side', () => {
  it('renders a win-condition radio group for the 4 lineup mons', () => {
    render(
      <ScenarioEditor
        title="My Team"
        side="mine"
        roster={ROSTER}
        leadOrder={FILLED_ORDER}
        onLeadOrderChange={() => {}}
        winConditionSpeciesId={null}
        onWinConditionChange={() => {}}
        assumedFormsBySpeciesId={{}}
        onAssumedFormsChange={() => {}}
      />,
    )
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(4)
  })

  it('fires onWinConditionChange with the speciesId when a radio is chosen', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ScenarioEditor
        title="My Team"
        side="mine"
        roster={ROSTER}
        leadOrder={FILLED_ORDER}
        onLeadOrderChange={() => {}}
        winConditionSpeciesId={null}
        onWinConditionChange={onChange}
        assumedFormsBySpeciesId={{}}
        onAssumedFormsChange={() => {}}
      />,
    )
    const radios = screen.getAllByRole('radio')
    await user.click(radios[1]) // amoonguss
    expect(onChange).toHaveBeenCalledWith('amoonguss')
  })

  it('shows an assumed-forms chip per lineup mon with the mega toggle', () => {
    render(
      <ScenarioEditor
        title="My Team"
        side="mine"
        roster={ROSTER}
        leadOrder={FILLED_ORDER}
        onLeadOrderChange={() => {}}
        winConditionSpeciesId={null}
        onWinConditionChange={() => {}}
        assumedFormsBySpeciesId={{ charizard: ['mega'] }}
        onAssumedFormsChange={() => {}}
      />,
    )
    const megaToggles = screen.getAllByRole('button', { name: /mega/i })
    expect(megaToggles).toHaveLength(4)
    // Charizard's is pressed
    expect(megaToggles[0]).toHaveAttribute('aria-pressed', 'true')
    expect(megaToggles[1]).toHaveAttribute('aria-pressed', 'false')
  })

  it('toggles mega via onAssumedFormsChange', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ScenarioEditor
        title="My Team"
        side="mine"
        roster={ROSTER}
        leadOrder={FILLED_ORDER}
        onLeadOrderChange={() => {}}
        winConditionSpeciesId={null}
        onWinConditionChange={() => {}}
        assumedFormsBySpeciesId={{ charizard: ['mega'] }}
        onAssumedFormsChange={onChange}
      />,
    )
    const [charizardToggle, amoonTog] = screen.getAllByRole('button', {
      name: /mega/i,
    })
    await user.click(charizardToggle)
    expect(onChange).toHaveBeenCalledWith('charizard', [])

    await user.click(amoonTog)
    expect(onChange).toHaveBeenCalledWith('amoonguss', ['mega'])
  })
})

describe('ScenarioEditor — opponent side', () => {
  it('does not render a win-condition radio group', () => {
    render(
      <ScenarioEditor
        title="Opponent"
        side="opponent"
        roster={ROSTER}
        leadOrder={FILLED_ORDER}
        onLeadOrderChange={() => {}}
        assumedFormsBySpeciesId={{}}
        onAssumedFormsChange={() => {}}
      />,
    )
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
  })
})

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SpeedTierRibbon } from '../../../src/features/calculator/components/SpeedTierRibbon'

const BASE_COMBATANT = {
  baseSpeed: 110,
  stagedSpeed: 110,
  itemId: null as string | null,
  status: 'NONE' as const,
  name: 'Mon A',
}

const SLOW_COMBATANT = {
  baseSpeed: 75,
  stagedSpeed: 75,
  itemId: null as string | null,
  status: 'NONE' as const,
  name: 'Mon B',
}

describe('SpeedTierRibbon', () => {
  it('shows attacker moves first when attacker is faster', () => {
    render(
      <SpeedTierRibbon
        attacker={{ ...BASE_COMBATANT, name: 'Sneasler', tailwind: false }}
        defender={{ ...SLOW_COMBATANT, name: 'Kingambit', tailwind: false }}
        trickRoom={false}
      />,
    )

    expect(screen.getByTestId('speed-winner')).toHaveTextContent('Sneasler')
    expect(screen.getByText(/moves first/i)).toBeInTheDocument()
  })

  it('shows defender moves first when defender is faster', () => {
    render(
      <SpeedTierRibbon
        attacker={{ ...SLOW_COMBATANT, name: 'Kingambit', tailwind: false }}
        defender={{ ...BASE_COMBATANT, name: 'Sneasler', tailwind: false }}
        trickRoom={false}
      />,
    )

    expect(screen.getByTestId('speed-winner')).toHaveTextContent('Sneasler')
  })

  it('applies Choice Scarf ×1.5 multiplier', () => {
    render(
      <SpeedTierRibbon
        attacker={{
          ...SLOW_COMBATANT,
          name: 'Kingambit',
          itemId: 'choice-scarf',
          tailwind: false,
        }}
        defender={{ ...BASE_COMBATANT, name: 'Sneasler', tailwind: false }}
        trickRoom={false}
      />,
    )

    // Kingambit scarfed: floor(75 × 1.5) = 112 > 110 → Kingambit moves first
    expect(screen.getByTestId('speed-winner')).toHaveTextContent('Kingambit')
    expect(screen.getByTestId('speed-attacker-effective')).toHaveTextContent(
      '112',
    )
  })

  it('inverts winner in Trick Room', () => {
    render(
      <SpeedTierRibbon
        attacker={{ ...BASE_COMBATANT, name: 'Sneasler', tailwind: false }}
        defender={{ ...SLOW_COMBATANT, name: 'Kingambit', tailwind: false }}
        trickRoom={true}
      />,
    )

    // Without TR: Sneasler (110) first. With TR: Kingambit (75) first (slower wins).
    expect(screen.getByTestId('speed-winner')).toHaveTextContent('Kingambit')
    expect(screen.getByTestId('trick-room-indicator')).toBeInTheDocument()
  })

  it('applies paralysis ×0.5 speed penalty', () => {
    render(
      <SpeedTierRibbon
        attacker={{
          ...BASE_COMBATANT,
          name: 'Sneasler',
          status: 'PARALYSIS',
          tailwind: false,
        }}
        defender={{ ...SLOW_COMBATANT, name: 'Kingambit', tailwind: false }}
        trickRoom={false}
      />,
    )

    // Sneasler paralyzed: floor(110 × 0.5) = 55 < 75 → Kingambit moves first
    expect(screen.getByTestId('speed-winner')).toHaveTextContent('Kingambit')
    expect(screen.getByTestId('speed-attacker-effective')).toHaveTextContent(
      '55',
    )
  })

  it('shows speed tie when both effective speeds are equal', () => {
    render(
      <SpeedTierRibbon
        attacker={{
          ...BASE_COMBATANT,
          name: 'Mon A',
          baseSpeed: 100,
          stagedSpeed: 100,
          tailwind: false,
        }}
        defender={{
          ...BASE_COMBATANT,
          name: 'Mon B',
          baseSpeed: 100,
          stagedSpeed: 100,
          tailwind: false,
        }}
        trickRoom={false}
      />,
    )

    expect(screen.getByTestId('speed-tie')).toBeInTheDocument()
  })

  it('shows placeholder when either side has no speed data', () => {
    render(
      <SpeedTierRibbon
        attacker={null}
        defender={{ ...BASE_COMBATANT, name: 'Sneasler', tailwind: false }}
        trickRoom={false}
      />,
    )

    expect(screen.getByTestId('speed-ribbon-empty')).toBeInTheDocument()
  })

  it('displays effective speed numbers for both sides', () => {
    render(
      <SpeedTierRibbon
        attacker={{
          ...BASE_COMBATANT,
          name: 'Sneasler',
          baseSpeed: 110,
          stagedSpeed: 110,
          tailwind: false,
        }}
        defender={{
          ...SLOW_COMBATANT,
          name: 'Kingambit',
          baseSpeed: 65,
          stagedSpeed: 65,
          tailwind: false,
        }}
        trickRoom={false}
      />,
    )

    expect(screen.getByTestId('speed-attacker-effective')).toHaveTextContent(
      '110',
    )
    expect(screen.getByTestId('speed-defender-effective')).toHaveTextContent(
      '65',
    )
  })

  it('applies tailwind by doubling effective speed for the affected side', () => {
    render(
      <SpeedTierRibbon
        attacker={{ ...SLOW_COMBATANT, name: 'Kingambit', tailwind: true }}
        defender={{ ...BASE_COMBATANT, name: 'Sneasler', tailwind: false }}
        trickRoom={false}
      />,
    )

    expect(screen.getByTestId('speed-attacker-effective')).toHaveTextContent(
      '150',
    )
    expect(screen.getByTestId('speed-winner')).toHaveTextContent('Kingambit')
  })
})

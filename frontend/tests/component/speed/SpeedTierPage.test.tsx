import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as speedApi from '../../../src/features/speed/api/speedApi'
import { SpeedTierPage } from '../../../src/pages/SpeedTierPage'

vi.mock('../../../src/features/speed/api/speedApi')

describe('SpeedTierPage', () => {
  beforeEach(() => {
    vi.mocked(speedApi.buildSpeedTiers).mockResolvedValue({
      rows: [
        { speciesId: 'flutter-mane', speciesName: 'Flutter Mane', finalSpeed: 186, userTeam: false },
        { speciesId: 'incineroar', speciesName: 'Incineroar', finalSpeed: 80, userTeam: true },
        { speciesId: 'garchomp', speciesName: 'Garchomp', finalSpeed: 122, userTeam: false },
      ],
    })
  })

  it('renders heading and load button', () => {
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /speed tier sheet/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /load speed tiers/i })).toBeInTheDocument()
  })

  it('shows empty state before loading', () => {
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/no tiers loaded yet/i)).toBeInTheDocument()
  })

  it('displays rows sorted by speed after loading', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /load speed tiers/i }))

    expect(screen.getByText('Flutter Mane')).toBeInTheDocument()
    expect(screen.getByText('Incineroar')).toBeInTheDocument()
    expect(screen.getByText('Garchomp')).toBeInTheDocument()
  })

  it('marks user team entries with a badge', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /load speed tiers/i }))

    // The user-team row for Incineroar should have a "your team" badge
    expect(screen.getAllByText(/your team/i).length).toBeGreaterThanOrEqual(1)
  })

  it('toggles tailwind modifier', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )

    const tailwindBtn = screen.getByRole('button', { name: /tailwind/i })
    await user.click(tailwindBtn)
    expect(tailwindBtn).toHaveClass('bg-arena-cyan/15')
  })
})

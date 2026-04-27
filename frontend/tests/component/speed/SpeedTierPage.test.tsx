import { render, screen, waitFor } from '@testing-library/react'
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
        { speciesId: 'flutter-mane', speciesName: 'Flutter Mane', finalSpeed: 186, userTeam: false, isMega: false },
        { speciesId: 'incineroar', speciesName: 'Incineroar', finalSpeed: 80, userTeam: true, isMega: false },
        { speciesId: 'garchomp', speciesName: 'Garchomp', finalSpeed: 122, userTeam: false, isMega: false },
      ],
    })
  })

  it('renders heading', () => {
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /speed tier sheet/i })).toBeInTheDocument()
  })

  it('shows idle empty state on initial render before data loads', () => {
    vi.mocked(speedApi.buildSpeedTiers).mockReturnValue(new Promise(() => {})) // never resolves
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/no tiers loaded yet/i)).toBeInTheDocument()
  })

  it('displays rows after auto-loading', async () => {
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Flutter Mane')).toBeInTheDocument())
    expect(screen.getByText('Incineroar')).toBeInTheDocument()
    expect(screen.getByText('Garchomp')).toBeInTheDocument()
  })

  it('highlights user-team row in cyan', async () => {
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Incineroar')).toBeInTheDocument())
    // Incineroar is userTeam — its name should have the cyan class
    expect(screen.getByText('Incineroar')).toHaveClass('text-arena-cyan')
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

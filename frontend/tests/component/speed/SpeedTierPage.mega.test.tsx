import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  buildSpeedTiers: vi.fn(),
  useTeamsStore: vi.fn(),
}))

vi.mock('../../../src/features/speed/api/speedApi', () => ({
  buildSpeedTiers: mocks.buildSpeedTiers,
}))

vi.mock('../../../src/store/useTeamsStore', () => ({
  useTeamsStore: mocks.useTeamsStore,
}))

import { SpeedTierPage } from '../../../src/pages/SpeedTierPage'

const EMPTY_RAIL = [null, null, null, null, null, null] as const

const ROWS_WITH_MEGAS = [
  {
    speciesId: 'venusaur',
    speciesName: 'Venusaur',
    finalSpeed: 100,
    userTeam: false,
    isMega: false,
  },
  {
    speciesId: 'venusaur-mega',
    speciesName: 'Mega Venusaur',
    finalSpeed: 100,
    userTeam: false,
    isMega: true,
  },
  {
    speciesId: 'charizard',
    speciesName: 'Charizard',
    finalSpeed: 120,
    userTeam: false,
    isMega: false,
  },
  {
    speciesId: 'charizard-mega-x',
    speciesName: 'Mega Charizard X',
    finalSpeed: 120,
    userTeam: false,
    isMega: true,
  },
  {
    speciesId: 'beedrill-mega',
    speciesName: 'Mega Beedrill',
    finalSpeed: 145,
    userTeam: false,
    isMega: true,
  },
  {
    speciesId: 'incineroar',
    speciesName: 'Incineroar',
    finalSpeed: 80,
    userTeam: false,
    isMega: false,
  },
]

beforeEach(() => {
  mocks.useTeamsStore.mockImplementation(
    (selector: (s: { mine: readonly null[] }) => unknown) =>
      selector({ mine: EMPTY_RAIL }),
  )
  mocks.buildSpeedTiers.mockResolvedValue({ rows: ROWS_WITH_MEGAS })
})

describe('SpeedTierPage — mega indicators', () => {
  it('renders Ω glyph on isMega rows', async () => {
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )

    await waitFor(() =>
      expect(screen.getByText('Mega Venusaur')).toBeInTheDocument(),
    )

    // Every isMega row should have an Ω glyph next to it
    const omegaGlyphs = screen.getAllByText('Ω')
    expect(omegaGlyphs.length).toBeGreaterThanOrEqual(3) // 3 mega rows in fixture
  })

  it('applies speed-row--mega class to isMega rows', async () => {
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )

    await waitFor(() =>
      expect(screen.getByText('Mega Venusaur')).toBeInTheDocument(),
    )

    // Find a row containing a mega species name and verify parent has mega class
    const megaName = screen.getByText('Mega Venusaur')
    const row = megaName.closest('[role="row"]')
    expect(row).not.toBeNull()
    expect(row!.className).toContain('speed-row--mega')
  })

  it('does NOT render Ω glyph on base-form rows', async () => {
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )

    await waitFor(() =>
      expect(screen.getByText('Venusaur')).toBeInTheDocument(),
    )

    const venusaurRow = screen
      .getByText('Venusaur')
      .closest('[role="row"]') as HTMLElement
    expect(venusaurRow.className).not.toContain('speed-row--mega')
    // Ω glyph must not be inside the base-form row
    expect(venusaurRow.textContent).not.toContain('Ω')
  })
})

describe('SpeedTierPage — meta-only filter with mega rows', () => {
  it('keeps mega rows of meta species visible when metaOnly is toggled on', async () => {
    // venusaur is in META_TOP_IDS; venusaur-mega should also pass the filter
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )

    await waitFor(() =>
      expect(screen.getByText('Mega Venusaur')).toBeInTheDocument(),
    )

    const toggle = screen.getByRole('switch', { name: /top-30 meta only/i })
    await user.click(toggle)

    // venusaur is meta → Mega Venusaur should still show
    expect(screen.queryByText('Mega Venusaur')).toBeInTheDocument()
    // Incineroar is also meta → still visible
    expect(screen.queryByText('Incineroar')).toBeInTheDocument()
    // Mega Beedrill's base beedrill is NOT in meta top → should be hidden
    expect(screen.queryByText('Mega Beedrill')).not.toBeInTheDocument()
  })

  it('shows all mega rows when metaOnly is off (default)', async () => {
    render(
      <MemoryRouter>
        <SpeedTierPage />
      </MemoryRouter>,
    )

    await waitFor(() =>
      expect(screen.getByText('Mega Venusaur')).toBeInTheDocument(),
    )

    expect(screen.getByText('Mega Charizard X')).toBeInTheDocument()
    expect(screen.getByText('Mega Beedrill')).toBeInTheDocument()
  })
})

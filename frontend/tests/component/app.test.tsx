import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach } from 'vitest'

import App from '../../src/App'

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the VGCenter damage calculator shell at /calc', () => {
    render(
      <MemoryRouter initialEntries={['/calc']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /vgcenter damage calculator/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/^regulation m-a$/i)).toBeInTheDocument()
  })

  it('renders the Preview Coach placeholder at /preview', () => {
    render(
      <MemoryRouter initialEntries={['/preview']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: /preview coach/i }),
    ).toBeInTheDocument()
  })

  it('renders the Team Prep workspace at /prep', () => {
    render(
      <MemoryRouter initialEntries={['/prep']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: /team prep/i }),
    ).toBeInTheDocument()
  })

  it('renders Practice Mode at /practice', () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: /practice mode/i }),
    ).toBeInTheDocument()
  })

  it('redirects / to /calc', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /vgcenter damage calculator/i }),
    ).toBeInTheDocument()
  })

  it('shows first-run onboarding checklist with prep flow links', () => {
    render(
      <MemoryRouter initialEntries={['/calc']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /first-run flow/i }),
    ).toBeInTheDocument()
    const card = screen.getByRole('heading', { name: /first-run flow/i }).closest('aside')
    expect(card).not.toBeNull()
    const cardScope = within(card as HTMLElement)
    expect(cardScope.getByRole('link', { name: /import pokepaste/i })).toHaveAttribute(
      'href',
      '/calc',
    )
    expect(cardScope.getByRole('link', { name: /team prep/i })).toHaveAttribute(
      'href',
      '/prep',
    )
    expect(cardScope.getByRole('link', { name: /preview coach/i })).toHaveAttribute(
      'href',
      '/preview',
    )
    expect(cardScope.getByRole('link', { name: /^calculator$/i })).toHaveAttribute(
      'href',
      '/calc',
    )
  })
})

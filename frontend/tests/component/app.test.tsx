import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import App from '../../src/App'

describe('App', () => {
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
})

import { render, screen } from '@testing-library/react'

import App from '../../src/App'

describe('App', () => {
  it('renders the VGCenter damage calculator shell', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /vgcenter damage calculator/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/^regulation m-a$/i)).toBeInTheDocument()
  })
})

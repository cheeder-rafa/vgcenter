import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { TopNav } from '../../../src/components/shell/TopNav'

function renderTopNavAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <TopNav />
              <main>
                <Routes>
                  <Route path="/calc" element={<div>Calculator</div>} />
                  <Route path="/preview" element={<div>Preview Coach</div>} />
                </Routes>
              </main>
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TopNav', () => {
  it('renders nav links for /calc and /preview', () => {
    renderTopNavAt('/calc')

    expect(
      screen.getByRole('link', { name: /calculator/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /preview coach/i }),
    ).toBeInTheDocument()
  })

  it('marks the active link with aria-current="page"', () => {
    renderTopNavAt('/calc')

    const calcLink = screen.getByRole('link', { name: /calculator/i })
    const previewLink = screen.getByRole('link', { name: /preview coach/i })

    expect(calcLink).toHaveAttribute('aria-current', 'page')
    expect(previewLink).not.toHaveAttribute('aria-current', 'page')
  })

  it('marks preview as current when on /preview', () => {
    renderTopNavAt('/preview')

    const calcLink = screen.getByRole('link', { name: /calculator/i })
    const previewLink = screen.getByRole('link', { name: /preview coach/i })

    expect(previewLink).toHaveAttribute('aria-current', 'page')
    expect(calcLink).not.toHaveAttribute('aria-current', 'page')
  })

  it('nav links are keyboard focusable', async () => {
    const user = userEvent.setup()
    renderTopNavAt('/calc')

    const calcLink = screen.getByRole('link', { name: /calculator/i })
    const previewLink = screen.getByRole('link', { name: /preview coach/i })

    await user.tab()
    expect(document.activeElement).toBe(calcLink)

    await user.tab()
    expect(document.activeElement).toBe(previewLink)
  })

  it('has a navigation landmark role', () => {
    renderTopNavAt('/calc')

    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('nav is fixed to the top of the viewport', () => {
    renderTopNavAt('/calc')

    const nav = screen.getByRole('navigation')
    expect(nav.className).toMatch(/fixed/)
  })
})

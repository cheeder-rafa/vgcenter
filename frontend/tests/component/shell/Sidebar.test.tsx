import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { Sidebar } from '../../../src/components/shell/Sidebar'

function renderSidebarAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <Sidebar />
              <main>
                <Routes>
                  <Route path="/calc" element={<div>Calculator</div>} />
                  <Route path="/gameplan" element={<div>Gameplan</div>} />
                </Routes>
              </main>
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  it('renders nav links for /calc and /gameplan', () => {
    renderSidebarAt('/calc')

    expect(screen.getByRole('link', { name: /calculator/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /gameplan/i })).toBeInTheDocument()
  })

  it('marks the active link with aria-current="page"', () => {
    renderSidebarAt('/calc')

    const calcLink = screen.getByRole('link', { name: /calculator/i })
    const gameplanLink = screen.getByRole('link', { name: /gameplan/i })

    expect(calcLink).toHaveAttribute('aria-current', 'page')
    expect(gameplanLink).not.toHaveAttribute('aria-current', 'page')
  })

  it('marks gameplan as current when on /gameplan', () => {
    renderSidebarAt('/gameplan')

    const calcLink = screen.getByRole('link', { name: /calculator/i })
    const gameplanLink = screen.getByRole('link', { name: /gameplan/i })

    expect(gameplanLink).toHaveAttribute('aria-current', 'page')
    expect(calcLink).not.toHaveAttribute('aria-current', 'page')
  })

  it('nav links are keyboard focusable', async () => {
    const user = userEvent.setup()
    renderSidebarAt('/calc')

    const calcLink = screen.getByRole('link', { name: /calculator/i })
    const gameplanLink = screen.getByRole('link', { name: /gameplan/i })

    await user.tab()
    expect(document.activeElement).toBe(calcLink)

    await user.tab()
    expect(document.activeElement).toBe(gameplanLink)
  })

  it('sidebar nav has a landmark role', () => {
    renderSidebarAt('/calc')

    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})

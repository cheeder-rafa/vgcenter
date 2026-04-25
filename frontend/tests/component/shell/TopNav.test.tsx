import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

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
  afterEach(() => {
    vi.unstubAllEnvs()
  })
  it('renders nav links for /calc, /preview, and /speed', () => {
    renderTopNavAt('/calc')

    expect(
      screen.getByRole('link', { name: /calculator/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /preview coach/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /speed tiers/i }),
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

  it('Speed Tiers link has a "new" badge', () => {
    renderTopNavAt('/calc')

    const speedLink = screen.getByRole('link', { name: /speed tiers/i })
    expect(speedLink.querySelector('[data-testid="new-badge"]')).toBeInTheDocument()
  })

  it('renders a patch notes button', () => {
    renderTopNavAt('/calc')

    expect(
      screen.getByRole('button', { name: /patch notes/i }),
    ).toBeInTheDocument()
  })

  it('shows feedback link when VITE_FEEDBACK_URL is set', () => {
    vi.stubEnv('VITE_FEEDBACK_URL', 'https://tally.so/r/vgcenter-feedback')
    renderTopNavAt('/calc')

    const feedbackLink = screen.getByRole('link', { name: /feedback/i })
    expect(feedbackLink).toHaveAttribute(
      'href',
      'https://tally.so/r/vgcenter-feedback',
    )
    expect(feedbackLink).toHaveAttribute('target', '_blank')
  })

  it('hides feedback link when VITE_FEEDBACK_URL is not set', () => {
    vi.stubEnv('VITE_FEEDBACK_URL', '')
    renderTopNavAt('/calc')

    expect(
      screen.queryByRole('link', { name: /feedback/i }),
    ).not.toBeInTheDocument()
  })

  it('clicking patch notes opens the dialog', async () => {
    const user = userEvent.setup()
    renderTopNavAt('/calc')

    await user.click(screen.getByRole('button', { name: /patch notes/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closing the dialog from inside hides it', async () => {
    const user = userEvent.setup()
    renderTopNavAt('/calc')

    await user.click(screen.getByRole('button', { name: /patch notes/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

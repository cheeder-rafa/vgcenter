import { useState } from 'react'
import { NavLink } from 'react-router-dom'

import { PatchNotesModal } from '../../features/calculator/components/PatchNotesModal'
import { getFeedbackUrl } from '../../lib/app-config'

const NAV_ITEMS = [
  { to: '/calc', label: 'Calculator', isNew: false },
  { to: '/preview', label: 'Preview Coach', isNew: false },
  { to: '/speed', label: 'Speed Tiers', isNew: true },
] as const

export function TopNav() {
  const [patchNotesOpen, setPatchNotesOpen] = useState(false)
  const feedbackUrl = getFeedbackUrl()

  return (
    <>
      <nav
        aria-label="Site navigation"
        className="fixed left-0 right-0 top-3 z-50 flex justify-center"
      >
        <div className="flex items-center gap-0.5 rounded-full border border-arena-violet/20 bg-arena-void/90 px-1.5 py-1.5 backdrop-blur-sm">
          {NAV_ITEMS.map(({ to, label, isNew }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-1.5 rounded-full px-5 py-2 font-body text-[0.72rem] font-medium uppercase tracking-[0.12em] transition-colors duration-200',
                  isActive
                    ? 'bg-arena-plasma/10 text-white'
                    : 'text-white/40 hover:text-white/70',
                ].join(' ')
              }
            >
              {label}
              {isNew && (
                <span
                  data-testid="new-badge"
                  className="rounded bg-arena-plasma/20 px-1.5 py-px font-display text-[0.5rem] font-bold uppercase tracking-[0.08em] text-arena-plasma"
                >
                  new
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="fixed right-4 top-3 z-50 flex items-center gap-2">
        {feedbackUrl !== null && (
          <a
            href={feedbackUrl}
            rel="noreferrer"
            target="_blank"
            className="arena-chip cursor-pointer text-white/35 transition hover:text-white/70"
          >
            Feedback
          </a>
        )}
        <button
          type="button"
          aria-label="Patch notes and known issues"
          onClick={() => setPatchNotesOpen(true)}
          className="arena-chip cursor-pointer text-white/35 transition hover:text-white/70"
        >
          Patch Notes
        </button>
      </div>

      <PatchNotesModal
        isOpen={patchNotesOpen}
        onClose={() => setPatchNotesOpen(false)}
      />
    </>
  )
}

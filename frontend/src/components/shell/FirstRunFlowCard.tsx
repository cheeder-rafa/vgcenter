import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const FIRST_RUN_KEY = 'vgcenter.firstRunFlow.v1'

const FLOW_STEPS = [
  { href: '/calc', label: 'Import Pokepaste' },
  { href: '/prep', label: 'Team Prep' },
  { href: '/preview', label: 'Preview Coach' },
  { href: '/calc', label: 'Calculator' },
] as const

export function FirstRunFlowCard() {
  const location = useLocation()
  const [visible, setVisible] = useState(
    () => window.localStorage.getItem(FIRST_RUN_KEY) !== 'done',
  )

  if (!visible) return null

  return (
    <aside className="fixed bottom-4 left-4 right-4 z-40 rounded-sm border border-white/15 bg-arena-void/92 p-3 shadow-[0_12px_32px_rgba(2,6,23,0.5)] backdrop-blur md:left-auto md:max-w-[520px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-arena-cyan">
            First-run flow
          </h2>
          <p className="mt-1 font-body text-xs leading-5 text-white/70">
            Import Pokepaste, prep board, preview, then lock matchup in calc.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem(FIRST_RUN_KEY, 'done')
            setVisible(false)
          }}
          className="rounded-sm border border-white/20 px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-white/70 transition hover:text-white"
        >
          Complete
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {FLOW_STEPS.map((step) => (
          <Link
            key={`${step.href}-${step.label}`}
            to={step.href}
            className={`arena-chip ${location.pathname === step.href ? 'text-arena-cyan' : 'text-white/70'} transition hover:text-white`}
          >
            {step.label}
          </Link>
        ))}
      </div>
    </aside>
  )
}

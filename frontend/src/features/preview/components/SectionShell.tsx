import { useState, type ReactNode } from 'react'

type SectionShellProps = {
  title: string
  verdict?: { headline: string; subline?: string; callout?: string | null } | null
  defaultOpen?: boolean
  /** When true, overrides user-collapse and forces the section open. */
  forceOpen?: boolean
  children: ReactNode
}

export function SectionShell({
  title,
  verdict,
  defaultOpen = false,
  forceOpen = false,
  children,
}: SectionShellProps) {
  const [userOpen, setUserOpen] = useState<boolean | null>(defaultOpen ? true : null)
  const open = userOpen ?? forceOpen

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-900/40">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setUserOpen(!open)}
        className="flex w-full items-start justify-between gap-3 rounded-t-lg px-4 py-3 text-left hover:bg-slate-800/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-400">{title}</span>
          </div>
          {verdict ? (
            <>
              <p className="mt-1 text-base font-semibold text-slate-100">{verdict.headline}</p>
              {verdict.subline ? (
                <p className="mt-0.5 text-sm text-slate-300">{verdict.subline}</p>
              ) : null}
              {verdict.callout ? (
                <p className="mt-1 text-xs font-medium text-amber-300">⚠ {verdict.callout}</p>
              ) : null}
            </>
          ) : null}
        </div>
        <span aria-hidden className="select-none pt-1 text-slate-400">
          {open ? '▾' : '▸'}
        </span>
      </button>
      {open ? <div className="border-t border-slate-700 px-4 py-4">{children}</div> : null}
    </section>
  )
}

const PREVIEW_STEPS = [
  {
    label: 'Lead Lab',
    detail: 'Compare chosen leads into all 15 opponent lead pairs.',
  },
  {
    label: 'Team Preview Coach',
    detail: 'Build bring-4 plans with pressure, risk, and win-condition notes.',
  },
  {
    label: 'BO3 Notebook',
    detail: 'Track revealed information and adjustments between games.',
  },
] as const

export function PreviewPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-arena-gradient text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05] [background-size:48px_48px]" />
      <div className="pointer-events-none absolute inset-0 arena-scanlines opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[4px] bg-gradient-to-r from-arena-plasma via-arena-sun to-arena-cyan shadow-[0_0_32px_rgba(255,43,142,0.7)]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 px-3 py-3 sm:px-5 sm:py-4 xl:px-6">
        <header className="flex min-h-16 flex-col justify-center rounded border border-white/10 bg-arena-panel/90 px-4 py-3 shadow-arena sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-arena-cyan">
            Regulation M-A
          </p>
          <h1 className="text-2xl font-black tracking-wide sm:text-3xl">
            Preview Coach
          </h1>
        </header>

        <section className="grid flex-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded border border-white/10 bg-arena-panel/90 p-5 shadow-arena">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-arena-sun">
              Coming next
            </p>
            <h2 className="mt-3 max-w-3xl text-xl font-black tracking-wide text-white sm:text-2xl">
              Turn calculator evidence into team-preview decisions.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
              Preview Coach will help choose leads, bring-4 plans, and BO3
              adjustments while reusing the calculator damage and stat APIs as
              source of truth.
            </p>
          </div>

          <ol className="grid gap-3">
            {PREVIEW_STEPS.map((step, index) => (
              <li
                key={step.label}
                className="rounded border border-white/10 bg-arena-surface/90 p-4 shadow-arena"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded border border-arena-cyan/40 bg-arena-cyan/10 text-sm font-black text-arena-cyan">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white">
                      {step.label}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-white/65">
                      {step.detail}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  )
}

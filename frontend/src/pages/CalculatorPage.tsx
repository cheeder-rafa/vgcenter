import { PokepasteImportModal } from '../features/importer/PokepasteImportModal'
import { ShowdownImportModal } from '../features/importer/ShowdownImportModal'
import { useCalculatorStore } from '../features/calculator/store/useCalculatorStore'
import { t } from '../lib/i18n'

const panelShell =
  'rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_80px_-40px_rgba(8,47,73,0.85)] backdrop-blur'

export function CalculatorPage() {
  const regulation = useCalculatorStore((state) => state.regulation)
  const setRegulation = useCalculatorStore((state) => state.setRegulation)

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.18),_transparent_28%),linear-gradient(180deg,_rgba(15,23,42,0.9),_rgba(2,6,23,1))]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-12 sm:px-10">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-teal-300">
              VGCenter
            </p>
            <div className="space-y-3">
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {t('calculator.title')}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                {t('calculator.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-full border border-teal-300/30 bg-teal-300/10 px-4 py-2 text-sm font-medium text-teal-100">
              Regulation {regulation}
            </div>
            <label className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              <span>{t('calculator.regulationLabel')}</span>
              <select
                aria-label={t('calculator.regulationLabel')}
                className="bg-transparent font-medium text-white outline-none"
                value={regulation}
                onChange={(event) => setRegulation(event.target.value as 'M-A')}
              >
                <option className="bg-slate-950" value="M-A">
                  M-A
                </option>
              </select>
            </label>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_30px_120px_-60px_rgba(13,148,136,0.9)] backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-amber-300">
                  Bootstrap Status
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Frontend shell and backend API scaffold are ready for M1.
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <ShowdownImportModal />
                <PokepasteImportModal />
              </div>
            </div>
          </div>

          <aside className={`${panelShell} flex flex-col gap-3`}>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">
              Next Work
            </p>
            <p className="text-sm leading-6 text-slate-300">
              M1 will populate the domain model, damage formula steps, and the
              first golden-set tests on top of this scaffold.
            </p>
          </aside>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.85fr_1fr]">
          <article className={panelShell}>
            <p className="text-xs uppercase tracking-[0.3em] text-rose-300">
              Attacker
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Pokemon input panel scaffold
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Species, move, item, nature, SP spread, status, and Mega toggle
              will live here.
            </p>
          </article>

          <article className={panelShell}>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
              Field
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Battle state controls
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Weather, terrain, screens, rooms, Friend Guard, Helping Hand, and
              spread targets are scaffolded for the next milestones.
            </p>
          </article>

          <article className={panelShell}>
            <p className="text-xs uppercase tracking-[0.3em] text-violet-300">
              Defender
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Result and KO summary panel
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Damage rolls, HP percentages, and KO odds will be rendered here
              once the domain formula lands.
            </p>
          </article>
        </section>
      </div>
    </main>
  )
}

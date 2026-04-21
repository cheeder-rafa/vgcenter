import { useEffect, useState } from 'react'

import { calculateDamage } from '../features/calculator/api/damageApi'
import { fetchPokedex } from '../features/calculator/api/datasetApi'
import { useReactiveDamage } from '../features/calculator/hooks/useReactiveDamage'
import {
  ResultPanel,
  type ResultMode,
} from '../features/calculator/components/ResultPanel'
import { PokepasteImportModal } from '../features/importer/PokepasteImportModal'
import { ShowdownImportModal } from '../features/importer/ShowdownImportModal'
import { toCombatantBuild } from '../features/importer/importedTeamMapping'
import { AttackerPanel } from '../features/calculator/components/AttackerPanel'
import { DefenderPanel } from '../features/calculator/components/DefenderPanel'
import { FieldPanel } from '../features/calculator/components/FieldPanel'
import {
  selectDamageRequestFor,
  useCalculatorStore,
} from '../features/calculator/store/useCalculatorStore'
import type {
  ImportedPokemon,
  PokedexEntry,
} from '../features/calculator/types/api'
import { t } from '../lib/i18n'

export function CalculatorPage() {
  const regulation = useCalculatorStore((s) => s.regulation)
  const setAttacker = useCalculatorStore((s) => s.setAttacker)
  const setDefender = useCalculatorStore((s) => s.setDefender)
  const results = useCalculatorStore((s) => s.results)
  const resultsStatus = useCalculatorStore((s) => s.resultsStatus)
  const [resultMode, setResultMode] = useState<ResultMode>('range')
  const [pokedex, setPokedex] = useState<PokedexEntry[]>([])

  useReactiveDamage(pokedex)

  useEffect(() => {
    let active = true

    fetchPokedex(regulation)
      .then((entries) => {
        if (active) {
          setPokedex(entries)
        }
      })
      .catch(() => {
        if (active) {
          setPokedex([])
        }
      })

    return () => {
      active = false
    }
  }, [regulation])

  async function handleCalculate() {
    const store = useCalculatorStore.getState()
    const request = selectDamageRequestFor(store, 'attacker', 0)

    store.clearResults()
    store.setResultsStatus('loading')

    if (request === null) {
      store.setResultsStatus('error')
      return
    }

    try {
      const response = await calculateDamage(request)
      useCalculatorStore.getState().setResult('attacker', 0, response)
      setResultMode('range')
      useCalculatorStore.getState().setResultsStatus('success')
    } catch {
      useCalculatorStore.getState().clearResults()
      useCalculatorStore.getState().setResultsStatus('error')
    }
  }

  function handleLoadImportedPokemon(
    side: 'attacker' | 'defender',
    pokemon: ImportedPokemon,
  ) {
    const entry = pokedex.find(
      (candidate) => candidate.id === pokemon.speciesId,
    )
    const nextCombatant = toCombatantBuild(pokemon, entry)

    if (side === 'attacker') {
      setAttacker(nextCombatant)
      return
    }

    setDefender(nextCombatant)
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-arena-gradient text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05] [background-size:48px_48px]" />
      <div className="pointer-events-none absolute inset-0 arena-scanlines opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[6px] bg-gradient-to-r from-arena-plasma via-arena-sun to-arena-cyan shadow-[0_0_40px_rgba(255,43,142,0.7)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[4px] bg-gradient-to-r from-arena-cyan via-arena-violet to-arena-plasma" />

      <div className="relative mx-auto flex min-h-screen max-w-[1280px] flex-col gap-10 px-6 py-12 sm:px-10">
        <PageHeader regulation={regulation} />
        <CommandBar
          loading={resultsStatus === 'loading'}
          onCalculate={handleCalculate}
          onLoadPokemon={handleLoadImportedPokemon}
        />

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr_1.15fr]">
          <AttackerPanel />
          <FieldPanel />
          <DefenderPanel />
        </section>

        <ResultPanel
          mode={resultMode}
          onModeChange={setResultMode}
          result={results.attackerMoves[0]}
          status={resultsStatus}
          errorMessage={
            resultsStatus === 'error' ? 'The calculator could not complete the request.' : null
          }
        />

        <footer className="pb-2 text-center font-mono text-[0.7rem] uppercase tracking-[0.4em] text-white/35">
          VGCenter · Champions Circuit · Regulation M-A · Build M9
        </footer>
      </div>
    </main>
  )
}

function PageHeader({ regulation }: { regulation: string }) {
  return (
    <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="arena-chip text-arena-plasma">
            <span className="h-1.5 w-1.5 rounded-full bg-arena-plasma shadow-[0_0_10px_rgba(255,43,142,0.9)]" />
            CHAMPIONS CIRCUIT
          </span>
          <span className="arena-chip text-arena-cyan">
            APRIL 8 — JUNE 17 · 2026
          </span>
          <span className="arena-chip text-arena-sun">LIVE OPS</span>
        </div>

        <h1 className="max-w-[12ch] font-display text-4xl font-extrabold leading-[0.95] tracking-tight text-white sm:text-6xl">
          {t('calculator.title')}
        </h1>
        <p className="max-w-2xl font-body text-base leading-relaxed text-white/70 sm:text-lg">
          {t('calculator.subtitle')}
        </p>
      </div>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="rounded-sm border border-arena-plasma/60 bg-arena-plasma/10 px-4 py-2 shadow-[0_0_30px_-10px_rgba(255,43,142,0.9)]">
          <p className="arena-label text-arena-plasma">
            {t('calculator.regulationLabel')}
          </p>
          <p className="font-display text-lg font-bold tracking-[0.3em] text-white">
            Regulation {regulation}
          </p>
        </div>
      </div>
    </header>
  )
}

function CommandBar({
  loading,
  onCalculate,
  onLoadPokemon,
}: {
  loading: boolean
  onCalculate: () => Promise<void>
  onLoadPokemon: (
    side: 'attacker' | 'defender',
    pokemon: ImportedPokemon,
  ) => void
}) {
  return (
    <section className="arena-panel arena-panel--violet p-4">
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-display text-xs tracking-[0.4em] text-arena-violet">
            IMPORT ⟶
          </span>
          <ShowdownImportModal onLoadPokemon={onLoadPokemon} />
          <PokepasteImportModal onLoadPokemon={onLoadPokemon} />
          <button
            type="button"
            className="arena-button text-arena-plasma"
            onClick={onCalculate}
            disabled={loading}
          >
            {loading ? 'Calculating…' : 'Calculate Damage'}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-white/50">
          <span>{loading ? 'ENGINE: RUNNING' : 'ENGINE: READY'}</span>
          <span className="h-1 w-1 rounded-full bg-arena-plasma" />
          <span>STREAM SYNC: READY</span>
        </div>
      </div>
    </section>
  )
}

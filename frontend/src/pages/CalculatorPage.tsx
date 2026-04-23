import { useEffect, useMemo, useState } from 'react'

import {
  fetchAbilities,
  fetchItems,
  fetchMoves,
  fetchNatures,
  fetchPokedex,
} from '../features/calculator/api/datasetApi'
import { DualMoveReadout } from '../features/calculator/components/DualMoveReadout'
import { DamagePlanView } from '../features/calculator/components/DamagePlanView'
import { useBuildStatsSync } from '../features/calculator/hooks/useBuildStatsSync'
import { FieldPanel } from '../features/calculator/components/FieldPanel'
import { MatchupPinStrip } from '../features/calculator/components/MatchupPinStrip'
import { PokemonPanel } from '../features/calculator/components/PokemonPanel'
import { PatchNotesModal } from '../features/calculator/components/PatchNotesModal'
import { SavedPokemonRail } from '../features/calculator/components/SavedPokemonRail'
import { ToastViewport } from '../features/calculator/components/ToastViewport'
import { useReactiveDamage } from '../features/calculator/hooks/useReactiveDamage'
import {
  useCalculatorStore,
  type CalculatorSide,
} from '../features/calculator/store/useCalculatorStore'
import type {
  ImportedPokemon,
  MoveDefinition,
  NamedDatasetEntry,
  NatureResponse,
  PokedexEntry,
} from '../features/calculator/types/api'
import { PokepasteImportModal } from '../features/importer/PokepasteImportModal'
import { ShowdownImportModal } from '../features/importer/ShowdownImportModal'
import {
  toCombatantBuild,
  toSavedPokemon,
} from '../features/importer/importedTeamMapping'
import { t } from '../lib/i18n'
import { useSavedTeamStore } from '../features/calculator/store/useSavedTeamStore'
import {
  usePinStore,
  type MatchupPin,
} from '../features/calculator/store/usePinStore'
import { getFeedbackUrl } from '../lib/app-config'

export function CalculatorPage() {
  const regulation = useCalculatorStore((s) => s.regulation)
  const attacker = useCalculatorStore((s) => s.attacker)
  const defender = useCalculatorStore((s) => s.defender)
  const setAttacker = useCalculatorStore((s) => s.setAttacker)
  const setDefender = useCalculatorStore((s) => s.setDefender)
  const setMoveCatalog = useCalculatorStore((s) => s.setMoveCatalog)
  const results = useCalculatorStore((s) => s.results)
  const importSavedTeam = useSavedTeamStore((s) => s.importTeam)

  const [pokedex, setPokedex] = useState<PokedexEntry[]>([])
  const [abilities, setAbilities] = useState<NamedDatasetEntry[]>([])
  const [items, setItems] = useState<NamedDatasetEntry[]>([])
  const [moves, setMoves] = useState<MoveDefinition[]>([])
  const [natures, setNatures] = useState<NatureResponse[]>([])

  const [focusedSide, setFocusedSide] = useState<CalculatorSide>('attacker')
  const [focusedMoveIndex, setFocusedMoveIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'overview' | 'plan'>('overview')

  useBuildStatsSync('attacker', pokedex)
  useBuildStatsSync('defender', pokedex)
  useReactiveDamage()

  useEffect(() => {
    let active = true

    Promise.allSettled([
      fetchPokedex(regulation),
      fetchAbilities(regulation),
      fetchItems(regulation),
      fetchMoves(regulation),
      fetchNatures(regulation),
    ]).then((settled) => {
      if (!active) {
        return
      }
      const [poke, abil, itm, mv, nat] = settled
      if (poke.status === 'fulfilled') setPokedex(poke.value)
      if (abil.status === 'fulfilled') setAbilities(abil.value)
      if (itm.status === 'fulfilled') setItems(itm.value)
      if (mv.status === 'fulfilled') {
        setMoves(mv.value)
        setMoveCatalog(mv.value)
      }
      if (nat.status === 'fulfilled') setNatures(nat.value)
    })

    return () => {
      active = false
    }
  }, [regulation, setMoveCatalog])

  const attackerEntry = usePokedexEntryForSide('attacker', pokedex)
  const defenderEntry = usePokedexEntryForSide('defender', pokedex)
  const attackerName = attackerEntry?.name ?? null
  const defenderName = defenderEntry?.name ?? null

  const attackerMoveEntries = useAllMoveEntries(
    'attacker',
    moves,
    results.attackerMoves,
    results.previousAttackerMoves,
  )
  const defenderMoveEntries = useAllMoveEntries(
    'defender',
    moves,
    results.defenderMoves,
    results.previousDefenderMoves,
  )
  const attackerHp = useCalculatorStore(
    (s) => s.attacker.finalStats?.hp ?? null,
  )
  const defenderHp = useCalculatorStore(
    (s) => s.defender.finalStats?.hp ?? null,
  )

  function handleFocusSlot(side: CalculatorSide, index: number) {
    setFocusedSide(side)
    setFocusedMoveIndex(index)
  }

  function handleLoadImportedPokemon(
    side: CalculatorSide,
    pokemon: ImportedPokemon,
  ) {
    const entry = pokedex.find(
      (candidate) => candidate.id === pokemon.speciesId,
    )
    const nextCombatant = toCombatantBuild(pokemon, entry)

    if (side === 'attacker') {
      setAttacker(nextCombatant)
    } else {
      setDefender(nextCombatant)
    }

    setFocusedSide(side)
  }

  function handleImportTeam(side: CalculatorSide, team: ImportedPokemon[]) {
    const [activePokemon] = team
    if (activePokemon === undefined) {
      return
    }

    handleLoadImportedPokemon(side, activePokemon)

    importSavedTeam(
      side,
      team.map((pokemon) => {
        const entry = pokedex.find(
          (candidate) => candidate.id === pokemon.speciesId,
        )
        return toSavedPokemon(pokemon, entry)
      }),
    )
  }

  function handleLoadSavedPokemon(
    side: CalculatorSide,
    build: ReturnType<typeof useCalculatorStore.getState>['attacker'],
  ) {
    if (side === 'attacker') {
      setAttacker(build)
    } else {
      setDefender(build)
    }

    setFocusedSide(side)
  }

  const addPin = usePinStore((s) => s.addPin)

  function handleCurrentPin() {
    if (attackerName === null || defenderName === null) return
    const firstAttackerResult = results.attackerMoves[0]
    const firstDefenderResult = results.defenderMoves[0]
    const atkSummary =
      firstAttackerResult !== null && firstAttackerResult !== undefined
        ? `${firstAttackerResult.minPct.toFixed(1)}–${firstAttackerResult.maxPct.toFixed(1)}%`
        : '—'
    const defSummary =
      firstDefenderResult !== null && firstDefenderResult !== undefined
        ? `${firstDefenderResult.minPct.toFixed(1)}–${firstDefenderResult.maxPct.toFixed(1)}%`
        : '—'
    const pin: MatchupPin = {
      id: `${attacker.speciesId ?? 'atk'}-${defender.speciesId ?? 'def'}-${Date.now()}`,
      attackerName,
      defenderName,
      label: `${attackerName} → ${defenderName}`,
      attackerSummary: atkSummary,
      defenderSummary: defSummary,
    }
    addPin(pin)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleLoadPin(_pin: MatchupPin) {}

  const datasets = useMemo(
    () => ({ pokedex, abilities, items, moves, natures }),
    [pokedex, abilities, items, moves, natures],
  )

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-arena-gradient text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05] [background-size:48px_48px]" />
      <div className="pointer-events-none absolute inset-0 arena-scanlines opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[4px] bg-gradient-to-r from-arena-plasma via-arena-sun to-arena-cyan shadow-[0_0_32px_rgba(255,43,142,0.7)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-arena-cyan via-arena-violet to-arena-plasma" />

      <div
        className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 px-3 py-3 sm:px-5 sm:py-4 xl:gap-3 xl:px-6"
        data-testid="calculator-shell"
      >
        <CompactHeader
          activeSide={focusedSide}
          regulation={regulation}
          onImportTeam={handleImportTeam}
          onLoadPokemon={handleLoadImportedPokemon}
        />

        <MatchupPinStrip
          onLoadPin={handleLoadPin}
          onCurrentPin={handleCurrentPin}
        />

        <section className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-white/10 bg-white/[0.03] px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="arena-label text-arena-violet">Damage View</span>
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/35">
              switch between overview and turn sequencing
            </span>
          </div>
          <div
            className="inline-flex rounded-sm border border-white/10 bg-black/10 p-1"
            role="tablist"
            aria-label="Damage view mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'overview'}
              onClick={() => setViewMode('overview')}
              className={`arena-chip rounded-none px-3 py-1.5 text-[0.62rem] tracking-[0.2em] ${
                viewMode === 'overview'
                  ? 'border-arena-plasma/50 bg-arena-plasma/15 text-white'
                  : 'border-transparent text-white/50 hover:text-white/80'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'plan'}
              onClick={() => setViewMode('plan')}
              className={`arena-chip rounded-none px-3 py-1.5 text-[0.62rem] tracking-[0.2em] ${
                viewMode === 'plan'
                  ? 'border-arena-cyan/50 bg-arena-cyan/15 text-white'
                  : 'border-transparent text-white/50 hover:text-white/80'
              }`}
            >
              Damage Plan
            </button>
          </div>
        </section>

        <section
          className="grid grid-cols-1 gap-3 xl:grid-cols-[90px_minmax(0,1.1fr)_minmax(240px,0.7fr)_minmax(0,1.1fr)_90px]"
          data-testid="detailed-result-grid"
        >
          <div
            className="xl:col-start-2 xl:col-end-5"
            data-testid="detailed-result-span"
          >
            {viewMode === 'overview' ? (
              <DualMoveReadout
                attackerName={attackerName}
                defenderName={defenderName}
                attackerMoves={attackerMoveEntries}
                defenderMoves={defenderMoveEntries}
                attackerHp={attackerHp}
                defenderHp={defenderHp}
              />
            ) : (
              <DamagePlanView
                attackerName={attackerName}
                defenderName={defenderName}
                attackerMoves={attackerMoveEntries}
                defenderMoves={defenderMoveEntries}
                attackerHp={attackerHp}
                defenderHp={defenderHp}
              />
            )}
          </div>
        </section>

        <section
          className="grid grid-cols-1 gap-3 xl:grid-cols-[90px_minmax(0,1.1fr)_minmax(240px,0.7fr)_minmax(0,1.1fr)_90px]"
          data-testid="calculator-main-grid"
        >
          <div className="order-2 xl:order-none">
            <SavedPokemonRail
              side="attacker"
              currentBuild={attacker}
              speciesName={attackerEntry?.name ?? null}
              spriteId={attacker.speciesId}
              onLoadBuild={handleLoadSavedPokemon}
            />
          </div>
          <div className="order-1 xl:order-none">
            <PokemonPanel
              side="attacker"
              {...datasets}
              focusedSide={focusedSide}
              focusedMoveIndex={focusedMoveIndex}
              onFocusSlot={handleFocusSlot}
              onActivateSide={setFocusedSide}
            />
          </div>
          <div className="order-3 xl:order-none">
            <FieldPanel
              focusedSide={focusedSide}
              attackerName={attackerName}
              defenderName={defenderName}
            />
          </div>
          <div className="order-4 xl:order-none">
            <PokemonPanel
              side="defender"
              {...datasets}
              focusedSide={focusedSide}
              focusedMoveIndex={focusedMoveIndex}
              onFocusSlot={handleFocusSlot}
              onActivateSide={setFocusedSide}
            />
          </div>
          <div className="order-5 xl:order-none">
            <SavedPokemonRail
              side="defender"
              currentBuild={defender}
              speciesName={defenderEntry?.name ?? null}
              spriteId={defender.speciesId}
              onLoadBuild={handleLoadSavedPokemon}
            />
          </div>
        </section>

        <footer className="pb-1 text-center font-mono text-[0.7rem] uppercase tracking-[0.4em] text-white/35">
          VGCenter · Champions Circuit · Regulation M-A
        </footer>
      </div>
      <ToastViewport />
    </main>
  )
}

function usePokedexEntryForSide(
  side: CalculatorSide,
  pokedex: PokedexEntry[],
): PokedexEntry | null {
  const speciesId = useCalculatorStore((s) => s[side].speciesId)
  if (speciesId === null) {
    return null
  }
  return pokedex.find((entry) => entry.id === speciesId) ?? null
}

function useAllMoveEntries(
  side: CalculatorSide,
  moves: MoveDefinition[],
  results: ReturnType<
    typeof useCalculatorStore.getState
  >['results']['attackerMoves'][number][],
  previousResults: ReturnType<
    typeof useCalculatorStore.getState
  >['results']['previousAttackerMoves'][number][],
): {
  moveName: string | null
  moveType: string | null
  moveCategory: MoveDefinition['category'] | null
  result: import('../features/calculator/types/api').DamageResult | null
  previousResult: import('../features/calculator/types/api').DamageResult | null
}[] {
  const slots = useCalculatorStore((s) => s[side].moves)
  return slots.map((slot, i) => {
    const moveId = slot.moveId
    const move =
      moveId !== null ? (moves.find((m) => m.id === moveId) ?? null) : null
    return {
      moveName: move?.name ?? null,
      moveType: move?.type ?? null,
      moveCategory: move?.category ?? null,
      result: results[i] ?? null,
      previousResult: previousResults[i] ?? null,
    }
  })
}

function CompactHeader({
  activeSide,
  regulation,
  onImportTeam,
  onLoadPokemon,
}: {
  activeSide: CalculatorSide
  regulation: string
  onImportTeam: (side: CalculatorSide, team: ImportedPokemon[]) => void
  onLoadPokemon: (side: CalculatorSide, pokemon: ImportedPokemon) => void
}) {
  const activeSideLabel = activeSide === 'attacker' ? 'Left Side' : 'Right Side'
  const feedbackUrl = getFeedbackUrl()
  const [patchNotesOpen, setPatchNotesOpen] = useState(false)

  return (
    <header
      className="grid gap-3 border-b border-white/10 pb-2 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center"
      data-testid="calculator-header"
    >
      <div
        className="flex min-w-0 flex-wrap items-center gap-2.5 sm:gap-3"
        data-testid="calculator-header-brand"
      >
        <span className="h-2 w-2 rounded-full bg-arena-plasma shadow-[0_0_12px_rgba(255,43,142,0.9)]" />
        <h1 className="font-display text-lg font-extrabold tracking-tight text-white sm:text-2xl">
          {t('calculator.title')}
        </h1>
        <span
          className="arena-chip text-arena-plasma"
          data-testid="regulation-chip"
        >
          Regulation {regulation}
        </span>
        <button
          type="button"
          className="arena-chip cursor-pointer text-white/55 transition hover:text-white/80"
          onClick={() => setPatchNotesOpen(true)}
          aria-label="Patch notes and known issues"
        >
          Patch Notes
        </button>
        <PatchNotesModal
          isOpen={patchNotesOpen}
          onClose={() => setPatchNotesOpen(false)}
          regulation={regulation}
        />
      </div>
      <div
        className="grid gap-2 sm:flex sm:flex-wrap sm:items-center xl:justify-self-end"
        data-testid="calculator-header-actions"
      >
        <span className="hidden font-display text-xs tracking-[0.3em] text-arena-violet sm:inline">
          IMPORT ⟶
        </span>
        <span className="arena-chip justify-center text-arena-cyan sm:justify-start">
          Import Target: {activeSideLabel}
        </span>
        <ShowdownImportModal
          activeSide={activeSide}
          onImportTeam={onImportTeam}
          onLoadPokemon={onLoadPokemon}
        />
        <PokepasteImportModal
          activeSide={activeSide}
          onImportTeam={onImportTeam}
          onLoadPokemon={onLoadPokemon}
        />
        {feedbackUrl !== null ? (
          <a
            className="arena-button flex w-full items-center justify-center whitespace-nowrap text-white/80 sm:w-auto"
            href={feedbackUrl}
            rel="noreferrer"
            target="_blank"
          >
            Send feedback
          </a>
        ) : null}
      </div>
    </header>
  )
}

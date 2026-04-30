import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  fetchAbilities,
  fetchItems,
  fetchMoves,
  fetchNatures,
  fetchPokedex,
} from '../features/calculator/api/datasetApi'
import { DualMoveReadout } from '../features/calculator/components/DualMoveReadout'
import { SpreadOptimizerPanel } from '../features/calculator/components/SpreadOptimizerPanel'
import { SpreadComparePanel } from '../features/calculator/components/SpreadComparePanel'
import { useBuildStatsSync } from '../features/calculator/hooks/useBuildStatsSync'
import { useCalcHistorySync } from '../features/calculator/hooks/useCalcHistorySync'
import { HistoryPanel } from '../features/calculator/components/HistoryPanel'
import { FieldPanel } from '../features/calculator/components/FieldPanel'
import { MatchupPinStrip } from '../features/calculator/components/MatchupPinStrip'
import { PokemonPanel } from '../features/calculator/components/PokemonPanel'
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
import { useTeamsStore } from '../store/useTeamsStore'
import {
  usePinStore,
  type MatchupPin,
} from '../features/calculator/store/usePinStore'
import { useUrlStateSync } from '../features/calculator/share/useUrlStateSync'
import { formatDiscordReport } from '../features/calculator/share/exportDiscord'
import {
  exportResultImage,
  type ExportImageInput,
} from '../features/calculator/share/exportImage'
import { useToastStore } from '../features/calculator/store/useToastStore'

export function CalculatorPage() {
  const regulation = useCalculatorStore((s) => s.regulation)
  const attacker = useCalculatorStore((s) => s.attacker)
  const defender = useCalculatorStore((s) => s.defender)
  const setAttacker = useCalculatorStore((s) => s.setAttacker)
  const setDefender = useCalculatorStore((s) => s.setDefender)
  const setMoveCatalog = useCalculatorStore((s) => s.setMoveCatalog)
  const results = useCalculatorStore((s) => s.results)
  const importSavedTeam = useTeamsStore((s) => s.importTeam)

  const [pokedex, setPokedex] = useState<PokedexEntry[]>([])
  const [abilities, setAbilities] = useState<NamedDatasetEntry[]>([])
  const [items, setItems] = useState<NamedDatasetEntry[]>([])
  const [moves, setMoves] = useState<MoveDefinition[]>([])
  const [natures, setNatures] = useState<NatureResponse[]>([])

  const [focusedSide, setFocusedSide] = useState<CalculatorSide>('attacker')
  const [focusedMoveIndex, setFocusedMoveIndex] = useState(0)
  const [mobileLayout, setMobileLayout] = useState<'single' | 'full'>(() =>
    window.innerWidth <= 767 ? 'single' : 'full',
  )
  const attackerPanelRef = useRef<HTMLDivElement | null>(null)
  const defenderPanelRef = useRef<HTMLDivElement | null>(null)

  useBuildStatsSync('attacker', pokedex)
  useBuildStatsSync('defender', pokedex)
  useReactiveDamage()
  const { copyShareLink } = useUrlStateSync()
  useCalcHistorySync()

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
  )
  const defenderMoveEntries = useAllMoveEntries(
    'defender',
    moves,
    results.defenderMoves,
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

  const handleExportDiscord = useCallback(() => {
    const text = formatDiscordReport({
      attackerName,
      defenderName,
      attackerMoves: attackerMoveEntries,
      defenderMoves: defenderMoveEntries,
    })
    navigator.clipboard.writeText(text).then(
      () => useToastStore.getState().push('Discord report copied to clipboard'),
      () =>
        useToastStore.getState().push('Could not copy — clipboard unavailable'),
    )
  }, [attackerMoveEntries, attackerName, defenderMoveEntries, defenderName])

  function handleExportPng() {
    const input: ExportImageInput = {
      attacker: {
        name: attackerName,
        speciesId: attacker.speciesId,
        megaActive: attacker.megaActive,
        megaFormId: attacker.megaFormId,
        types: (attacker.types ?? []).flatMap((t) => (t !== null ? [t] : [])),
      },
      defender: {
        name: defenderName,
        speciesId: defender.speciesId,
        megaActive: defender.megaActive,
        megaFormId: defender.megaFormId,
        types: (defender.types ?? []).flatMap((t) => (t !== null ? [t] : [])),
      },
      attackerMoves: attackerMoveEntries,
      defenderMoves: defenderMoveEntries,
      regulation,
    }
    void exportResultImage(input)
  }

  function swapSides() {
    useCalculatorStore.setState((state) => ({
      attacker: state.defender,
      defender: state.attacker,
      attackerSide: state.defenderSide,
      defenderSide: state.attackerSide,
      results: {
        attackerMoves: state.results.defenderMoves,
        defenderMoves: state.results.attackerMoves,
      },
    }))
    setFocusedSide((current) => (current === 'attacker' ? 'defender' : 'attacker'))
  }

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 767) {
        setMobileLayout('full')
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    function shouldIgnore(target: EventTarget | null) {
      return (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      )
    }

    function focusSpeciesFor(side: CalculatorSide) {
      const root = side === 'attacker' ? attackerPanelRef.current : defenderPanelRef.current
      const input = root?.querySelector<HTMLInputElement>('input[role="combobox"]')
      input?.focus()
    }

    function onKeyDown(event: KeyboardEvent) {
      if (shouldIgnore(event.target)) return
      if (event.key === '/') {
        event.preventDefault()
        focusSpeciesFor(focusedSide)
        return
      }
      if (event.key.toLowerCase() === 'x') {
        event.preventDefault()
        swapSides()
        return
      }
      if (event.key.toLowerCase() === 'r') {
        event.preventDefault()
        useCalculatorStore.getState().resetFieldModifiers()
        return
      }
      if (event.key.toLowerCase() === 'c') {
        event.preventDefault()
        handleExportDiscord()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [focusedSide, handleExportDiscord])

  return (
    <main className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden bg-arena-gradient text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05] [background-size:48px_48px]" />
      <div className="pointer-events-none absolute inset-0 arena-scanlines opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[4px] bg-gradient-to-r from-arena-plasma via-arena-sun to-arena-cyan shadow-[0_0_32px_rgba(255,43,142,0.7)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-arena-cyan via-arena-violet to-arena-plasma" />

      <div
        className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1600px] flex-col gap-4 px-3 py-3 sm:px-5 sm:py-4 xl:gap-3 xl:px-6"
        data-testid="calculator-shell"
      >
        <CompactHeader
          activeSide={focusedSide}
          regulation={regulation}
          onImportTeam={handleImportTeam}
          onLoadPokemon={handleLoadImportedPokemon}
          onShare={copyShareLink}
          onExportDiscord={handleExportDiscord}
          onExportPng={handleExportPng}
        />
        <div className="flex flex-wrap items-center gap-2 md:hidden">
          <button
            type="button"
            aria-pressed={mobileLayout === 'single'}
            onClick={() => setMobileLayout('single')}
            className={`arena-chip ${mobileLayout === 'single' ? 'text-arena-cyan' : 'text-white/60'}`}
          >
            Single Matchup
          </button>
          <button
            type="button"
            aria-pressed={mobileLayout === 'full'}
            onClick={() => setMobileLayout('full')}
            className={`arena-chip ${mobileLayout === 'full' ? 'text-arena-cyan' : 'text-white/60'}`}
          >
            Full Board
          </button>
          <button
            type="button"
            onClick={swapSides}
            className="arena-chip text-arena-plasma"
          >
            Swap Sides
          </button>
        </div>

        <div className="flex items-center gap-3">
          <MatchupPinStrip
            onLoadPin={handleLoadPin}
            onCurrentPin={handleCurrentPin}
          />
          <HistoryPanel />
        </div>

        <section
          className="grid grid-cols-1 gap-3 xl:grid-cols-[90px_minmax(0,1.1fr)_minmax(240px,0.7fr)_minmax(0,1.1fr)_90px]"
          data-testid="detailed-result-grid"
        >
          <div
            className="xl:col-start-2 xl:col-end-5"
            data-testid="detailed-result-span"
          >
            <DualMoveReadout
              attackerName={attackerName}
              defenderName={defenderName}
              attackerMoves={attackerMoveEntries}
              defenderMoves={defenderMoveEntries}
              attackerHp={attackerHp}
              defenderHp={defenderHp}
            />
          </div>
        </section>

        <section
          className="grid grid-cols-1 gap-3 xl:grid-cols-[90px_minmax(0,1.1fr)_minmax(240px,0.7fr)_minmax(0,1.1fr)_90px]"
          data-testid="calculator-main-grid"
        >
          <div
            className={`order-2 xl:order-none ${mobileLayout === 'single' && focusedSide !== 'attacker' ? 'hidden md:block' : ''}`}
          >
            <SavedPokemonRail
              side="attacker"
              currentBuild={attacker}
              speciesName={attackerEntry?.name ?? null}
              spriteId={attacker.speciesId}
              onLoadBuild={handleLoadSavedPokemon}
            />
          </div>
          <div
            ref={attackerPanelRef}
            className={`order-1 xl:order-none ${mobileLayout === 'single' && focusedSide !== 'attacker' ? 'hidden md:block' : ''}`}
          >
            <PokemonPanel
              side="attacker"
              {...datasets}
              focusedSide={focusedSide}
              focusedMoveIndex={focusedMoveIndex}
              onFocusSlot={handleFocusSlot}
              onActivateSide={setFocusedSide}
            />
          </div>
          <div className={`order-3 xl:order-none ${mobileLayout === 'single' ? 'hidden md:block' : ''}`}>
            <FieldPanel
              focusedSide={focusedSide}
              attackerName={attackerName}
              defenderName={defenderName}
            />
          </div>
          <div
            ref={defenderPanelRef}
            className={`order-4 xl:order-none ${mobileLayout === 'single' && focusedSide !== 'defender' ? 'hidden md:block' : ''}`}
          >
            <PokemonPanel
              side="defender"
              {...datasets}
              focusedSide={focusedSide}
              focusedMoveIndex={focusedMoveIndex}
              onFocusSlot={handleFocusSlot}
              onActivateSide={setFocusedSide}
            />
          </div>
          <div className={`order-5 xl:order-none ${mobileLayout === 'single' && focusedSide !== 'defender' ? 'hidden md:block' : ''}`}>
            <SavedPokemonRail
              side="defender"
              currentBuild={defender}
              speciesName={defenderEntry?.name ?? null}
              spriteId={defender.speciesId}
              onLoadBuild={handleLoadSavedPokemon}
            />
          </div>
        </section>

        <SpreadOptimizerPanel natures={natures} />

        <SpreadComparePanel defenderName={defenderName} />

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
): {
  moveName: string | null
  moveType: string | null
  moveCategory: MoveDefinition['category'] | null
  result: import('../features/calculator/types/api').DamageResult | null
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
    }
  })
}

function ShareMenu({
  onShare,
  onExportDiscord,
  onExportPng,
}: {
  onShare: () => void
  onExportDiscord: () => void
  onExportPng: () => void
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function action(fn: () => void) {
    fn()
    setOpen(false)
  }

  return (
    <div ref={menuRef} className="relative" data-testid="share-menu">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Share and export options"
        className="arena-button min-h-[44px] flex w-full items-center justify-center gap-1.5 text-arena-violet sm:w-auto"
      >
        <span aria-hidden="true">⬡</span>
        Share
        <span
          aria-hidden="true"
          className={`ml-0.5 text-[0.6em] transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[190px] overflow-hidden rounded-sm border border-white/15 bg-[#0d0b1e] shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-arena-violet via-arena-plasma to-arena-cyan" />
          <ul className="py-1">
            <li>
              <button
                role="menuitem"
                type="button"
                onClick={() => action(onShare)}
                aria-label="Copy shareable link to clipboard"
                className="flex w-full items-center gap-3 px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-[0.2em] text-arena-violet transition hover:bg-arena-violet/10"
              >
                <span aria-hidden="true" className="text-base leading-none">
                  ⬡
                </span>
                Copy Link
              </button>
            </li>
            <li>
              <div className="mx-3 h-px bg-white/8" />
            </li>
            <li>
              <button
                role="menuitem"
                type="button"
                onClick={() => action(onExportDiscord)}
                aria-label="Copy damage report for Discord"
                className="flex w-full items-center gap-3 px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-[0.2em] text-arena-cyan transition hover:bg-arena-cyan/10"
              >
                <span aria-hidden="true" className="text-base leading-none">
                  #
                </span>
                Discord Text
              </button>
            </li>
            <li>
              <div className="mx-3 h-px bg-white/8" />
            </li>
            <li>
              <button
                role="menuitem"
                type="button"
                onClick={() => action(onExportPng)}
                aria-label="Export result as PNG image"
                className="flex w-full items-center gap-3 px-4 py-2.5 font-display text-[0.65rem] uppercase tracking-[0.2em] text-arena-plasma transition hover:bg-arena-plasma/10"
              >
                <span aria-hidden="true" className="text-base leading-none">
                  ⊡
                </span>
                Export Image
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

function CompactHeader({
  activeSide,
  regulation,
  onImportTeam,
  onLoadPokemon,
  onShare,
  onExportDiscord,
  onExportPng,
}: {
  activeSide: CalculatorSide
  regulation: string
  onImportTeam: (side: CalculatorSide, team: ImportedPokemon[]) => void
  onLoadPokemon: (side: CalculatorSide, pokemon: ImportedPokemon) => void
  onShare: () => void
  onExportDiscord: () => void
  onExportPng: () => void
}) {
  const activeSideLabel = activeSide === 'attacker' ? 'Left' : 'Right'

  return (
    <header
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/10 pb-3 sm:flex-nowrap"
      data-testid="calculator-header"
    >
      {/* Zone 1: Identity */}
      <div
        className="flex min-w-0 flex-shrink-0 items-center gap-2.5"
        data-testid="calculator-header-brand"
      >
        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-arena-plasma shadow-[0_0_12px_rgba(255,43,142,0.9)]" />
        <h1 className="font-display text-lg font-extrabold tracking-tight text-white sm:text-xl">
          {t('calculator.title')}
        </h1>
        <span
          className="arena-chip hidden text-arena-plasma sm:inline-flex"
          data-testid="regulation-chip"
        >
          Regulation {regulation}
        </span>
      </div>

      {/* Zone 2: Import cluster */}
      <div
        className="flex flex-1 flex-wrap items-center gap-2 border-l border-white/10 pl-4"
        data-testid="calculator-header-actions"
      >
        <span className="arena-chip justify-center text-arena-cyan">
          {activeSideLabel}
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
      </div>

      {/* Zone 3: Share / export */}
      <div className="flex-shrink-0">
        <ShareMenu
          onShare={onShare}
          onExportDiscord={onExportDiscord}
          onExportPng={onExportPng}
        />
      </div>
    </header>
  )
}

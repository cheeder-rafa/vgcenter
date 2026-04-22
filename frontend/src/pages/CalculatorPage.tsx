import { useEffect, useMemo, useState } from 'react'

import {
  fetchAbilities,
  fetchItems,
  fetchMoves,
  fetchNatures,
  fetchPokedex,
} from '../features/calculator/api/datasetApi'
import { DualMoveReadout } from '../features/calculator/components/DualMoveReadout'
import { useBuildStatsSync } from '../features/calculator/hooks/useBuildStatsSync'
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

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-arena-gradient text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05] [background-size:48px_48px]" />
      <div className="pointer-events-none absolute inset-0 arena-scanlines opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[4px] bg-gradient-to-r from-arena-plasma via-arena-sun to-arena-cyan shadow-[0_0_32px_rgba(255,43,142,0.7)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-arena-cyan via-arena-violet to-arena-plasma" />

      <div
        className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col gap-3 px-4 py-4 sm:px-6 sm:py-4"
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

        <section
          className="grid gap-3 lg:grid-cols-[90px_1.1fr_0.7fr_1.1fr_90px]"
          data-testid="detailed-result-grid"
        >
          <div
            className="lg:col-start-2 lg:col-end-5"
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
          className="grid gap-3 lg:grid-cols-[90px_1.1fr_0.7fr_1.1fr_90px]"
          data-testid="calculator-main-grid"
        >
          <SavedPokemonRail
            side="attacker"
            currentBuild={attacker}
            speciesName={attackerEntry?.name ?? null}
            spriteId={attacker.speciesId}
            onLoadBuild={handleLoadSavedPokemon}
          />
          <PokemonPanel
            side="attacker"
            {...datasets}
            focusedSide={focusedSide}
            focusedMoveIndex={focusedMoveIndex}
            onFocusSlot={handleFocusSlot}
            onActivateSide={setFocusedSide}
          />
          <FieldPanel
            focusedSide={focusedSide}
            attackerName={attackerName}
            defenderName={defenderName}
          />
          <PokemonPanel
            side="defender"
            {...datasets}
            focusedSide={focusedSide}
            focusedMoveIndex={focusedMoveIndex}
            onFocusSlot={handleFocusSlot}
            onActivateSide={setFocusedSide}
          />
          <SavedPokemonRail
            side="defender"
            currentBuild={defender}
            speciesName={defenderEntry?.name ?? null}
            spriteId={defender.speciesId}
            onLoadBuild={handleLoadSavedPokemon}
          />
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
): {
  moveName: string | null
  moveType: string | null
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
      result: results[i] ?? null,
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

  return (
    <header
      className="grid gap-2 border-b border-white/10 pb-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
      data-testid="calculator-header"
    >
      <div
        className="flex min-w-0 flex-wrap items-center gap-3"
        data-testid="calculator-header-brand"
      >
        <span className="h-2 w-2 rounded-full bg-arena-plasma shadow-[0_0_12px_rgba(255,43,142,0.9)]" />
        <h1 className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl">
          {t('calculator.title')}
        </h1>
        <span className="arena-chip text-arena-plasma">
          Regulation {regulation}
        </span>
      </div>
      <div
        className="flex flex-wrap items-center gap-2 lg:justify-self-end"
        data-testid="calculator-header-actions"
      >
        <span className="font-display text-xs tracking-[0.3em] text-arena-violet">
          IMPORT ⟶
        </span>
        <span className="arena-chip text-arena-cyan">
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
            className="arena-button shrink-0 whitespace-nowrap text-white/80"
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

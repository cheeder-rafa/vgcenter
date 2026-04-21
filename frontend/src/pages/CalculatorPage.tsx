import { useEffect, useMemo, useState } from 'react'

import {
  fetchAbilities,
  fetchItems,
  fetchMoves,
  fetchNatures,
  fetchPokedex,
} from '../features/calculator/api/datasetApi'
import { DetailedResult } from '../features/calculator/components/DetailedResult'
import { useBuildStatsSync } from '../features/calculator/hooks/useBuildStatsSync'
import { FieldPanel } from '../features/calculator/components/FieldPanel'
import { PokemonPanel } from '../features/calculator/components/PokemonPanel'
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
import { toCombatantBuild } from '../features/importer/importedTeamMapping'
import { t } from '../lib/i18n'

export function CalculatorPage() {
  const regulation = useCalculatorStore((s) => s.regulation)
  const setAttacker = useCalculatorStore((s) => s.setAttacker)
  const setDefender = useCalculatorStore((s) => s.setDefender)
  const setMoveCatalog = useCalculatorStore((s) => s.setMoveCatalog)
  const results = useCalculatorStore((s) => s.results)
  const resultsStatus = useCalculatorStore((s) => s.resultsStatus)

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

  const attackerName = useNameForSide('attacker', pokedex)
  const defenderName = useNameForSide('defender', pokedex)

  const focusedResult =
    focusedSide === 'attacker'
      ? (results.attackerMoves[focusedMoveIndex] ?? null)
      : (results.defenderMoves[focusedMoveIndex] ?? null)

  const focusedMoveName = useMoveNameForSlot(
    focusedSide,
    focusedMoveIndex,
    moves,
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
  }

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

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-8 sm:py-6">
        <CompactHeader
          regulation={regulation}
          onLoadPokemon={handleLoadImportedPokemon}
        />

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.7fr_1.2fr]">
          <PokemonPanel
            side="attacker"
            {...datasets}
            focusedSide={focusedSide}
            focusedMoveIndex={focusedMoveIndex}
            onFocusSlot={handleFocusSlot}
          />
          <FieldPanel />
          <PokemonPanel
            side="defender"
            {...datasets}
            focusedSide={focusedSide}
            focusedMoveIndex={focusedMoveIndex}
            onFocusSlot={handleFocusSlot}
          />
        </section>

        <DetailedResult
          focusedSide={focusedSide}
          focusedIndex={focusedMoveIndex}
          result={focusedResult}
          status={resultsStatus}
          attackerName={attackerName}
          defenderName={defenderName}
          moveName={focusedMoveName}
        />

        <footer className="pb-1 text-center font-mono text-[0.7rem] uppercase tracking-[0.4em] text-white/35">
          VGCenter · Champions Circuit · Regulation M-A
        </footer>
      </div>
    </main>
  )
}

function useNameForSide(
  side: CalculatorSide,
  pokedex: PokedexEntry[],
): string | null {
  const speciesId = useCalculatorStore((s) => s[side].speciesId)
  if (speciesId === null) {
    return null
  }
  return pokedex.find((entry) => entry.id === speciesId)?.name ?? speciesId
}

function useMoveNameForSlot(
  side: CalculatorSide,
  index: number,
  moves: MoveDefinition[],
): string | null {
  const moveId = useCalculatorStore((s) => s[side].moves[index]?.moveId ?? null)
  if (moveId === null) {
    return null
  }
  return moves.find((entry) => entry.id === moveId)?.name ?? moveId
}

function CompactHeader({
  regulation,
  onLoadPokemon,
}: {
  regulation: string
  onLoadPokemon: (side: CalculatorSide, pokemon: ImportedPokemon) => void
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-arena-plasma shadow-[0_0_12px_rgba(255,43,142,0.9)]" />
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          {t('calculator.title')}
        </h1>
        <span className="arena-chip text-arena-plasma">
          Regulation {regulation}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-xs tracking-[0.3em] text-arena-violet">
          IMPORT ⟶
        </span>
        <ShowdownImportModal onLoadPokemon={onLoadPokemon} />
        <PokepasteImportModal onLoadPokemon={onLoadPokemon} />
      </div>
    </header>
  )
}

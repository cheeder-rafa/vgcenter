import { useMemo, useState } from 'react'

import type {
  CombatantBuild,
  CombatantRequest,
} from '../../calculator/types/api'
import type { SavedPokemon } from '../../../store/useTeamsStore'
import { useTeamsStore } from '../../../store/useTeamsStore'
import { CellFlagsLegend } from '../components/CellFlagsLegend'
import type { LeadOrder } from '../components/LeadOrderPicker'
import { LineupRecommendations } from '../components/LineupRecommendations'
import { MatchupDrilldown } from '../components/MatchupDrilldown'
import { MatchupMatrix } from '../components/MatchupMatrix'
import { ReportExportButton } from '../components/ReportExportButton'
import { ScenarioEditor } from '../components/ScenarioEditor'
import { useGameplanEvaluation } from '../hooks/useGameplanEvaluation'
import { useGameplanStore } from '../store/useGameplanStore'
import type {
  EvaluateMatchupPokemonRequest,
  EvaluateMatchupRequest,
  RecommendLineupRequest,
} from '../types/api'

const EMPTY_ORDER: LeadOrder = {
  lead1: null,
  lead2: null,
  back1: null,
  back2: null,
}

function toCombatantRequest(mon: CombatantBuild): CombatantRequest | null {
  if (mon.finalStats === null || mon.types === null) return null
  const types = mon.types.filter((t): t is string => t !== null)
  return {
    level: 50,
    stats: mon.finalStats,
    types,
    abilityId: mon.abilityId,
    itemId: mon.itemId,
    status: mon.status,
    stages: mon.stages,
    grounded: mon.grounded,
    currentHp: mon.currentHp ?? mon.finalStats.hp,
  }
}

function lineupFromOrder(
  roster: (SavedPokemon | null)[],
  order: LeadOrder,
): SavedPokemon[] | null {
  const ids = [order.lead1, order.lead2, order.back1, order.back2]
  if (ids.some((id) => id === null)) return null
  const byId = new Map<string, SavedPokemon>()
  roster.forEach((p) => {
    if (p !== null && p.speciesId !== null) byId.set(p.speciesId, p)
  })
  const picked: SavedPokemon[] = []
  for (const id of ids) {
    const mon = byId.get(id as string)
    if (!mon) return null
    picked.push(mon)
  }
  return picked
}

function fullRoster(roster: (SavedPokemon | null)[]): SavedPokemon[] | null {
  const out = roster.filter((p): p is SavedPokemon => p !== null)
  return out.length === 6 ? out : null
}

function toPokemonRequest(
  mon: SavedPokemon,
  assumedForms: string[],
): EvaluateMatchupPokemonRequest | null {
  const combatant = toCombatantRequest(mon)
  if (combatant === null) return null
  if (mon.speciesId === null) return null
  const ids = mon.moves.map((m) => m.moveId ?? '')
  if (ids.some((id) => id === '')) return null
  return {
    speciesId: mon.speciesId,
    combatant,
    moveIds: [ids[0], ids[1], ids[2], ids[3]],
    assumedForms,
  }
}

function buildRequest(
  mine: (SavedPokemon | null)[],
  opponent: (SavedPokemon | null)[],
  myOrder: LeadOrder,
  winConditionSpeciesId: string | null,
  mineForms: Record<string, string[]>,
  opponentForms: Record<string, string[]>,
): EvaluateMatchupRequest | null {
  const lineupMons = lineupFromOrder(mine, myOrder)
  const oppAll = fullRoster(opponent)
  if (lineupMons === null || oppAll === null) return null

  const lineupReqs = lineupMons.map((mon) =>
    toPokemonRequest(mon, mineForms[mon.speciesId ?? ''] ?? []),
  )
  if (lineupReqs.some((r) => r === null)) return null

  const opponentReqs = oppAll.map((mon) =>
    toPokemonRequest(mon, opponentForms[mon.speciesId ?? ''] ?? []),
  )
  if (opponentReqs.some((r) => r === null)) return null

  const winConditionIndex =
    winConditionSpeciesId === null
      ? null
      : lineupMons.findIndex((m) => m.speciesId === winConditionSpeciesId)

  return {
    regulation: 'M-A',
    mine: {
      lineup: lineupReqs as [
        EvaluateMatchupPokemonRequest,
        EvaluateMatchupPokemonRequest,
        EvaluateMatchupPokemonRequest,
        EvaluateMatchupPokemonRequest,
      ],
      winConditionIndex:
        winConditionIndex !== null && winConditionIndex >= 0
          ? winConditionIndex
          : null,
    },
    opponent: opponentReqs as EvaluateMatchupPokemonRequest[],
  }
}

function buildRecommendRequest(
  mine: (SavedPokemon | null)[],
  opponent: (SavedPokemon | null)[],
  winConditionSpeciesId: string | null,
  mineForms: Record<string, string[]>,
  opponentForms: Record<string, string[]>,
): RecommendLineupRequest | null {
  const mineAll = fullRoster(mine)
  const oppAll = fullRoster(opponent)
  if (mineAll === null || oppAll === null) return null

  const mineReqs = mineAll.map((mon) =>
    toPokemonRequest(mon, mineForms[mon.speciesId ?? ''] ?? []),
  )
  const opponentReqs = oppAll.map((mon) =>
    toPokemonRequest(mon, opponentForms[mon.speciesId ?? ''] ?? []),
  )
  if (
    mineReqs.some((r) => r === null) ||
    opponentReqs.some((r) => r === null)
  ) {
    return null
  }

  const winConditionIndex =
    winConditionSpeciesId === null
      ? null
      : mineAll.findIndex((m) => m.speciesId === winConditionSpeciesId)

  return {
    regulation: 'M-A',
    mine: mineReqs as EvaluateMatchupPokemonRequest[],
    winConditionIndex:
      winConditionIndex !== null && winConditionIndex >= 0
        ? winConditionIndex
        : null,
    opponent: opponentReqs as EvaluateMatchupPokemonRequest[],
  }
}

export function GameplanPage() {
  const mine = useTeamsStore((s) => s.mine)
  const opponent = useTeamsStore((s) => s.opponent)
  const gamePlanNote = useGameplanStore((s) => s.gamePlanNote)
  const setGamePlanNote = useGameplanStore((s) => s.setGamePlanNote)
  const opponentArchetypeTag = useGameplanStore((s) => s.opponentArchetypeTag)
  const setOpponentArchetypeTag = useGameplanStore(
    (s) => s.setOpponentArchetypeTag,
  )

  const [myOrder, setMyOrder] = useState<LeadOrder>(EMPTY_ORDER)
  const [oppOrder, setOppOrder] = useState<LeadOrder>(EMPTY_ORDER)
  const [winConditionSpeciesId, setWinConditionSpeciesId] = useState<
    string | null
  >(null)
  const [mineForms, setMineForms] = useState<Record<string, string[]>>({})
  const [opponentForms, setOpponentForms] = useState<Record<string, string[]>>(
    {},
  )
  const [selectedCellIndex, setSelectedCellIndex] = useState<number | null>(
    null,
  )

  const request = useMemo(
    () =>
      buildRequest(
        mine,
        opponent,
        myOrder,
        winConditionSpeciesId,
        mineForms,
        opponentForms,
      ),
    [mine, opponent, myOrder, winConditionSpeciesId, mineForms, opponentForms],
  )

  const recommendRequest = useMemo(
    () =>
      buildRecommendRequest(
        mine,
        opponent,
        winConditionSpeciesId,
        mineForms,
        opponentForms,
      ),
    [mine, opponent, winConditionSpeciesId, mineForms, opponentForms],
  )

  const evaluation = useGameplanEvaluation(request)
  const cells = evaluation.data?.cells ?? []

  const opponentNameById = useMemo(() => {
    const map: Record<string, string> = {}
    opponent.forEach((p) => {
      if (p !== null && p.speciesId !== null) {
        map[p.speciesId] = p.speciesName ?? p.speciesId
      }
    })
    return map
  }, [opponent])

  const mineNameById = useMemo(() => {
    const map: Record<string, string> = {}
    mine.forEach((p) => {
      if (p !== null && p.speciesId !== null) {
        map[p.speciesId] = p.speciesName ?? p.speciesId
      }
    })
    return map
  }, [mine])

  const selectedCell =
    selectedCellIndex !== null && selectedCellIndex < cells.length
      ? cells[selectedCellIndex]
      : null

  function updateForm(
    setter: (next: Record<string, string[]>) => void,
    current: Record<string, string[]>,
    speciesId: string,
    forms: string[],
  ) {
    const next = { ...current }
    if (forms.length === 0) delete next[speciesId]
    else next[speciesId] = forms
    setter(next)
  }

  return (
    <div className="flex flex-col gap-8 p-6">
      {/* ── Page header ──────────────────────────────────── */}
      <header className="flex items-baseline justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-xl font-bold tracking-widest text-white">
            Gameplan Lab
          </h1>
          <p className="text-xs text-white/40">
            Configure bring-4 + lead order · score all 15 opponent lead pairs
          </p>
        </div>
        <span className="arena-chip border-arena-violet/30 text-arena-violet/60">
          Reg M-A
        </span>
      </header>

      {/* ── Team editors ─────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ScenarioEditor
          title="My Team"
          side="mine"
          roster={mine}
          leadOrder={myOrder}
          onLeadOrderChange={setMyOrder}
          winConditionSpeciesId={winConditionSpeciesId}
          onWinConditionChange={setWinConditionSpeciesId}
          assumedFormsBySpeciesId={mineForms}
          onAssumedFormsChange={(id, forms) =>
            updateForm(setMineForms, mineForms, id, forms)
          }
        />
        <ScenarioEditor
          title="Opponent Team"
          side="opponent"
          roster={opponent}
          leadOrder={oppOrder}
          onLeadOrderChange={setOppOrder}
          assumedFormsBySpeciesId={opponentForms}
          onAssumedFormsChange={(id, forms) =>
            updateForm(setOpponentForms, opponentForms, id, forms)
          }
        />
      </div>

      {/* ── Context box ──────────────────────────────────── */}
      <section className="arena-panel grid gap-4 p-4 lg:grid-cols-[1fr_18rem]">
        <label className="flex flex-col gap-2">
          <span className="arena-label text-[10px] text-white/45">
            Game-plan note
          </span>
          <textarea
            value={gamePlanNote}
            onChange={(event) => setGamePlanNote(event.target.value)}
            rows={3}
            placeholder="Preserve Farigiraf, force Trick Room mirror, pivot Charizard late."
            className="arena-input min-h-20 resize-none placeholder:text-white/20"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="arena-label text-[10px] text-white/45">
            Opponent archetype
          </span>
          <input
            value={opponentArchetypeTag}
            onChange={(event) => setOpponentArchetypeTag(event.target.value)}
            placeholder="Trick Room, Sun, Hyper Offense…"
            className="arena-input placeholder:text-white/20"
          />
        </label>
      </section>

      {/* ── Matchup matrix ───────────────────────────────── */}
      <section className="arena-panel flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="arena-label text-white/65">Matchup Matrix</h2>
          <span className="text-xs text-white/35">
            {evaluation.status === 'loading' && (
              <span className="text-arena-cyan/70">evaluating…</span>
            )}
            {evaluation.status === 'error' && (
              <span className="text-arena-plasma/80">
                error: {evaluation.error}
              </span>
            )}
            {request === null &&
              'complete lineup + moves + 6 opponent mons to evaluate'}
          </span>
        </div>

        {cells.length > 0 ? (
          <MatchupMatrix
            cells={cells}
            selectedCellIndex={selectedCellIndex}
            onSelectCell={setSelectedCellIndex}
            opponentNameById={opponentNameById}
          />
        ) : (
          <div className="rounded border border-dashed border-white/10 p-10 text-center text-xs text-white/30">
            Matrix renders once evaluation completes.
          </div>
        )}

        <div className="mt-1 flex items-end justify-between gap-4">
          <CellFlagsLegend />
          <ReportExportButton
            cells={cells}
            gamePlanNote={gamePlanNote}
            opponentArchetypeTag={opponentArchetypeTag}
            winConditionSpeciesId={winConditionSpeciesId}
            mineAssumedForms={mineForms}
            opponentAssumedForms={opponentForms}
            mineNameById={mineNameById}
            opponentNameById={opponentNameById}
          />
        </div>
      </section>

      {/* ── Recommendations ──────────────────────────────── */}
      <LineupRecommendations
        request={recommendRequest}
        onPromote={setMyOrder}
        opponentNameById={opponentNameById}
      />

      {/* ── Drilldown reveal ─────────────────────────────── */}
      <div
        className={`drilldown-wrapper${selectedCell !== null ? ' drilldown-wrapper--open' : ''}`}
      >
        <div className="drilldown-inner">
          <section className="arena-panel p-4">
            <MatchupDrilldown
              cell={selectedCell}
              mineNameById={mineNameById}
              opponentNameById={opponentNameById}
            />
          </section>
        </div>
      </div>
    </div>
  )
}

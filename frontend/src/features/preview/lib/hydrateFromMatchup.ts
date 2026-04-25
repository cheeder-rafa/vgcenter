import { useCalculatorStore } from '../../calculator/store/useCalculatorStore'
import { useTeamsStore } from '../../../store/useTeamsStore'
import type { LeadMatchup, PreviewField } from '../types'

export function hydrateFromMatchup(
  matchup: LeadMatchup,
  selectedLeadIds: [string | null, string | null],
  field: PreviewField,
  focusOpponentIndex: 0 | 1 = 0,
): void {
  const calcStore = useCalculatorStore.getState()
  const teams = useTeamsStore.getState()

  const attackerSpeciesId = selectedLeadIds[0]
  const attackerPokemon = attackerSpeciesId
    ? (teams.mine.find(
        (p) => p?.speciesId === attackerSpeciesId || p?.speciesName === attackerSpeciesId,
      ) ?? null)
    : null

  const defenderSpeciesId = matchup.opponentLeadIds[focusOpponentIndex]
  const defenderPokemon =
    teams.opponent.find(
      (p) => p?.speciesId === defenderSpeciesId || p?.speciesName === defenderSpeciesId,
    ) ?? null

  if (attackerPokemon) {
    calcStore.setAttacker({
      speciesId: attackerPokemon.speciesId,
      natureId: attackerPokemon.natureId,
      sp: { ...attackerPokemon.sp },
      stages: { ...attackerPokemon.stages },
      abilityId: attackerPokemon.abilityId,
      itemId: attackerPokemon.itemId,
      status: attackerPokemon.status,
      megaActive: attackerPokemon.megaActive,
      megaFormId: attackerPokemon.megaFormId,
      moves: attackerPokemon.moves.map((m) => ({ ...m })) as typeof attackerPokemon.moves,
      baseStats: attackerPokemon.baseStats ? { ...attackerPokemon.baseStats } : null,
      finalStats: attackerPokemon.finalStats ? { ...attackerPokemon.finalStats } : null,
      types: attackerPokemon.types,
      grounded: attackerPokemon.grounded,
      currentHp: attackerPokemon.currentHp,
    })
  }

  if (defenderPokemon) {
    calcStore.setDefender({
      speciesId: defenderPokemon.speciesId,
      natureId: defenderPokemon.natureId,
      sp: { ...defenderPokemon.sp },
      stages: { ...defenderPokemon.stages },
      abilityId: defenderPokemon.abilityId,
      itemId: defenderPokemon.itemId,
      status: defenderPokemon.status,
      megaActive: defenderPokemon.megaActive,
      megaFormId: defenderPokemon.megaFormId,
      moves: defenderPokemon.moves.map((m) => ({ ...m })) as typeof defenderPokemon.moves,
      baseStats: defenderPokemon.baseStats ? { ...defenderPokemon.baseStats } : null,
      finalStats: defenderPokemon.finalStats ? { ...defenderPokemon.finalStats } : null,
      types: defenderPokemon.types,
      grounded: defenderPokemon.grounded,
      currentHp: defenderPokemon.currentHp,
    })
  }

  calcStore.setField(field.field)
  calcStore.setAttackerSide(field.selectedSide)
  calcStore.setDefenderSide(field.opponentSide)
}

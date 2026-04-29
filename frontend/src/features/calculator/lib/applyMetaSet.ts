import type { CombatantBuild } from '../types/api'
import type { MetaSet } from '../data/metaSets'

type MetaSetPatch = Pick<CombatantBuild, 'abilityId' | 'itemId' | 'moves'>

export function applyMetaSet(set: MetaSet): MetaSetPatch {
  return {
    abilityId: set.abilityId,
    itemId: set.itemId,
    moves: set.moveIds.map((moveId) => ({ moveId })) as CombatantBuild['moves'],
  }
}

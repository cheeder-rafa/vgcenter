import { useEffect, useMemo, useRef, useState } from 'react'

import { MEGA_STONE_MAP } from '../../calculator/data/megaStoneMap'
import { useTeamsStore } from '../../../store/useTeamsStore'
import { useSpeedTierStore } from '../store/useSpeedTierStore'
import type { SpeedTierEntry, SpeedTierModifiers, SpeedTierRow } from '../types'

const DEFAULT_MODIFIERS: SpeedTierModifiers = {
  tailwind: false,
  trickRoom: false,
  paralysis: false,
  choiceScarf: false,
  stages: 0,
}

const DEBOUNCE_MS = 150

function applyUserTeamModifiers(
  rows: SpeedTierRow[],
  modifiers: SpeedTierModifiers,
): SpeedTierRow[] {
  const scarfMult = modifiers.choiceScarf ? 1.5 : 1
  const tailwindMult = modifiers.tailwind ? 2 : 1
  if (scarfMult === 1 && tailwindMult === 1) return rows
  return rows.map((row) => {
    if (!row.userTeam) return row
    return {
      ...row,
      finalSpeed: Math.floor(row.finalSpeed * scarfMult * tailwindMult),
    }
  })
}

export function useSpeedTiers() {
  const mine = useTeamsStore((state) => state.mine)
  const baseRows = useSpeedTierStore((s) => s.baseRows)
  const status = useSpeedTierStore((s) => s.status)
  const error = useSpeedTierStore((s) => s.error)
  const fetchBase = useSpeedTierStore((s) => s.fetchBase)

  const [modifiers, setModifiers] = useState<SpeedTierModifiers>(DEFAULT_MODIFIERS)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const userTeam = useMemo(
    () =>
      mine
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .flatMap((p): SpeedTierEntry[] => {
          const base: SpeedTierEntry = {
            speciesId: p.speciesId ?? p.speciesName,
            speciesName: p.speciesName,
            spSpeed: p.sp.spe ?? 0,
            natureId: p.natureId,
          }
          const entries: SpeedTierEntry[] = [base]
          if (
            p.megaFormId !== null &&
            p.itemId !== null &&
            MEGA_STONE_MAP[p.megaFormId] === p.itemId
          ) {
            entries.push({
              speciesId: p.megaFormId,
              speciesName: `${p.speciesName} Mega`,
              spSpeed: p.sp.spe ?? 0,
              natureId: p.natureId,
            })
          }
          return entries
        }),
    [mine],
  )

  // Global modifiers (trickRoom, paralysis, stages) go to the backend.
  // Tailwind and choiceScarf are applied client-side to userTeam rows only.
  const globalModifiers = useMemo<SpeedTierModifiers>(
    () => ({
      tailwind: false,
      trickRoom: modifiers.trickRoom,
      paralysis: modifiers.paralysis,
      choiceScarf: false,
      stages: modifiers.stages,
    }),
    [modifiers.trickRoom, modifiers.paralysis, modifiers.stages],
  )

  useEffect(() => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchBase(userTeam, globalModifiers)
    }, DEBOUNCE_MS)
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalModifiers, mine])

  // Tailwind/scarf applied client-side only to userTeam rows
  const rows = useMemo(
    () => applyUserTeamModifiers(baseRows, modifiers),
    [baseRows, modifiers],
  )

  return { status, rows, error, modifiers, setModifiers }
}

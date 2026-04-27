import { useEffect, useRef, useState } from 'react'

import { useTeamsStore } from '../../../store/useTeamsStore'
import { buildSpeedTiers } from '../api/speedApi'
import type { SpeedTierModifiers, SpeedTierRow } from '../types'

type Status = 'idle' | 'loading' | 'success' | 'error'

const DEFAULT_MODIFIERS: SpeedTierModifiers = {
  tailwind: false,
  trickRoom: false,
  paralysis: false,
  choiceScarf: false,
  stages: 0,
}

const DEBOUNCE_MS = 150

export function useSpeedTiers() {
  const mine = useTeamsStore((state) => state.mine)
  const [status, setStatus] = useState<Status>('idle')
  const [rows, setRows] = useState<SpeedTierRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [modifiers, setModifiers] = useState<SpeedTierModifiers>(DEFAULT_MODIFIERS)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const userTeam = mine
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .map((p) => ({
      speciesId: p.speciesId ?? p.speciesName,
      speciesName: p.speciesName,
      spSpeed: p.sp.spe ?? 0,
      natureId: p.natureId,
    }))

  useEffect(() => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      setStatus('loading')
      setError(null)
      try {
        const result = await buildSpeedTiers({
          regulation: 'M-A',
          userTeam,
          modifiers,
        })
        setRows(result.rows)
        setStatus('success')
      } catch (caught) {
        setRows([])
        setStatus('error')
        setError(caught instanceof Error ? caught.message : 'Failed to load speed tiers')
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modifiers, mine])

  return { status, rows, error, modifiers, setModifiers }
}

import { useId, useMemo, useState } from 'react'

import type { PokedexEntry } from '../types/api'

type Props = {
  pokedex: PokedexEntry[]
  speciesId: string | null
  accent?: 'plasma' | 'cyan'
  onChange: (entry: PokedexEntry | null) => void
}

export function SpeciesSelect({
  pokedex,
  speciesId,
  accent = 'plasma',
  onChange,
}: Props) {
  const [query, setQuery] = useState('')
  const listId = useId()
  const labelId = useId()

  const sorted = useMemo(
    () => [...pokedex].sort((a, b) => a.name.localeCompare(b.name)),
    [pokedex],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle === '') {
      return sorted
    }
    return sorted.filter(
      (entry) =>
        entry.name.toLowerCase().includes(needle) ||
        entry.id.toLowerCase().includes(needle),
    )
  }, [sorted, query])

  const accentLabel =
    accent === 'cyan' ? 'text-arena-cyan' : 'text-arena-plasma'

  function handleSelectValue(nextId: string) {
    if (nextId === '') {
      onChange(null)
      return
    }
    const entry = pokedex.find((candidate) => candidate.id === nextId) ?? null
    onChange(entry)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label id={labelId} className={`arena-label ${accentLabel}`}>
        Species
      </label>
      <div className="flex flex-col gap-2">
        <input
          type="search"
          className="arena-input"
          value={query}
          placeholder="Search Regulation M-A roster…"
          onChange={(event) => setQuery(event.target.value)}
          list={listId}
          aria-label="Species search"
        />
        <select
          className="arena-select"
          value={speciesId ?? ''}
          onChange={(event) => handleSelectValue(event.target.value)}
          aria-labelledby={labelId}
        >
          <option value="" className="bg-arena-void">
            — Select a Pokémon —
          </option>
          {filtered.map((entry) => (
            <option key={entry.id} value={entry.id} className="bg-arena-void">
              {entry.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

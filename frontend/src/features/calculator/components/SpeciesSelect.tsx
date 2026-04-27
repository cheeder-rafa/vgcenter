import { useId, useMemo, useRef, useState } from 'react'

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
  const [draftQuery, setDraftQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [showDraftValue, setShowDraftValue] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const inputId = useId()
  const listId = useId()
  const labelId = useId()

  const sorted = useMemo(
    () => [...pokedex].sort((a, b) => a.name.localeCompare(b.name)),
    [pokedex],
  )

  const selectedEntry = useMemo(
    () => pokedex.find((entry) => entry.id === speciesId) ?? null,
    [pokedex, speciesId],
  )
  const query =
    open || showDraftValue ? draftQuery : (selectedEntry?.name ?? draftQuery)

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
  const activeIndex =
    filtered.length === 0 ? 0 : Math.min(highlightedIndex, filtered.length - 1)
  const activeOptionId =
    open && filtered[activeIndex] !== undefined
      ? `${listId}-option-${filtered[activeIndex].id}`
      : undefined

  function commitSelection(entry: PokedexEntry | null) {
    onChange(entry)
    setDraftQuery(entry?.name ?? '')
    setOpen(false)
    setShowDraftValue(false)
    setHighlightedIndex(0)
  }

  function clearSelection() {
    onChange(null)
    setDraftQuery('')
    setOpen(false)
    setShowDraftValue(true)
    setHighlightedIndex(0)
  }

  function moveHighlight(direction: 1 | -1) {
    if (filtered.length === 0) {
      return
    }
    setOpen(true)
    setHighlightedIndex((current) => {
      const next = current + direction
      if (next < 0) {
        return filtered.length - 1
      }
      if (next >= filtered.length) {
        return 0
      }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        id={labelId}
        htmlFor={inputId}
        className={`arena-label ${accentLabel}`}
      >
        Species
      </label>
      <div
        ref={rootRef}
        className="relative"
        onBlur={(event) => {
          const nextFocused = event.relatedTarget
          if (
            nextFocused instanceof Node &&
            rootRef.current?.contains(nextFocused)
          ) {
            return
          }
          setOpen(false)
          setShowDraftValue(false)
          setDraftQuery(selectedEntry?.name ?? '')
        }}
      >
        <div className="relative">
          <input
            id={inputId}
            type="text"
            role="combobox"
            className="arena-input pr-10"
            value={query}
            placeholder="Search Regulation M-A roster…"
            autoComplete="off"
            aria-labelledby={labelId}
            aria-controls={listId}
            aria-expanded={open}
            aria-autocomplete="list"
            aria-activedescendant={activeOptionId}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onChange={(event) => {
              setDraftQuery(event.target.value)
              setOpen(true)
              setShowDraftValue(true)
              setHighlightedIndex(0)
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                moveHighlight(1)
                return
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault()
                moveHighlight(-1)
                return
              }
              if (event.key === 'Enter') {
                if (!open || filtered.length === 0) {
                  return
                }
                event.preventDefault()
                commitSelection(filtered[activeIndex] ?? null)
                return
              }
              if (event.key === 'Escape') {
                event.preventDefault()
                setOpen(false)
                setShowDraftValue(false)
                setDraftQuery(selectedEntry?.name ?? '')
              }
            }}
          />
          {(draftQuery !== '' || selectedEntry !== null) && (
            <button
              type="button"
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-sm text-white/55 transition hover:bg-white/10 hover:text-white"
              aria-label="Clear species"
              onClick={clearSelection}
            >
              ×
            </button>
          )}
        </div>

        {open ? (
          <div className="absolute left-0 right-0 z-30 mt-2 rounded-sm border border-white/12 bg-arena-void/95 shadow-[0_24px_60px_rgba(2,6,23,0.45)] backdrop-blur">
            {filtered.length > 0 ? (
              <ul
                id={listId}
                role="listbox"
                aria-label="Species options"
                className="max-h-72 overflow-y-auto py-1"
              >
                {filtered.map((entry, index) => {
                  const highlighted = index === activeIndex
                  return (
                    <li key={entry.id}>
                      <button
                        id={`${listId}-option-${entry.id}`}
                        type="button"
                        role="option"
                        aria-selected={highlighted}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                          highlighted
                            ? 'bg-white/12 text-white'
                            : 'text-white/82 hover:bg-white/8'
                        }`}
                        onMouseDown={(event) => {
                          event.preventDefault()
                          commitSelection(entry)
                        }}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        <span>{entry.name}</span>
                        <span className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-white/38">
                          {entry.id}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="px-3 py-3 text-sm text-white/62">
                No matching species.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

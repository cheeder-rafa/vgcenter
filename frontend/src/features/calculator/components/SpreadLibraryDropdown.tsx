import { useId, useState } from 'react'

import {
  useSpreadLibraryStore,
  type NamedSpread,
} from '../store/useSpreadLibraryStore'
import type { CombatantBuild, MoveSlot } from '../types/api'

const EMPTY: NamedSpread[] = []

type Props = {
  speciesId: string
  currentBuild: CombatantBuild
  onLoad: (spread: NamedSpread) => void
}

function buildToSpread(
  id: string,
  name: string,
  build: CombatantBuild,
): NamedSpread {
  return {
    id,
    name,
    sp: { ...build.sp },
    natureId: build.natureId,
    abilityId: build.abilityId,
    itemId: build.itemId,
    moves: build.moves.map((m) => ({ moveId: m.moveId })) as [
      MoveSlot,
      MoveSlot,
      MoveSlot,
      MoveSlot,
    ],
  }
}

export function SpreadLibraryDropdown({
  speciesId,
  currentBuild,
  onLoad,
}: Props) {
  const spreads = useSpreadLibraryStore((s) => s.library[speciesId] ?? EMPTY)
  const saveSpread = useSpreadLibraryStore((s) => s.saveSpread)
  const deleteSpread = useSpreadLibraryStore((s) => s.deleteSpread)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')
  const inputId = useId()

  function handleSave() {
    const trimmed = newName.trim()
    if (!trimmed) return
    saveSpread(
      speciesId,
      buildToSpread(`${speciesId}-${Date.now()}`, trimmed, currentBuild),
    )
    setNewName('')
    setSaving(false)
  }

  return (
    <div className="relative" data-testid="spread-library-dropdown">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          data-testid="spread-library-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="arena-chip cursor-pointer text-arena-violet transition hover:bg-arena-violet/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan"
        >
          Spreads{spreads.length > 0 ? ` (${spreads.length})` : ''} ▾
        </button>
        <button
          type="button"
          data-testid="spread-library-save-btn"
          onClick={() => setSaving((v) => !v)}
          className="arena-chip cursor-pointer text-arena-sun transition hover:bg-arena-sun/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan"
          aria-label="Save current spread"
        >
          Save as…
        </button>
      </div>

      {saving && (
        <div
          className="mt-1.5 flex items-center gap-2"
          data-testid="spread-save-form"
        >
          <label htmlFor={inputId} className="sr-only">
            Spread name
          </label>
          <input
            id={inputId}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') setSaving(false)
            }}
            placeholder="Spread name…"
            autoFocus
            className="arena-input flex-1 text-sm"
            data-testid="spread-name-input"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!newName.trim()}
            className="arena-chip cursor-pointer text-arena-cyan disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arena-cyan"
            data-testid="spread-save-confirm"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setSaving(false)}
            className="font-mono text-[0.65rem] text-white/30 transition hover:text-white/60"
          >
            ✕
          </button>
        </div>
      )}

      {open && (
        <ul
          role="list"
          className="absolute left-0 top-full z-20 mt-1 flex max-h-56 w-64 flex-col gap-0.5 overflow-y-auto rounded-sm border border-white/10 bg-[#0d0d18] p-1 shadow-xl"
          data-testid="spread-list"
        >
          {spreads.length === 0 ? (
            <li className="px-2 py-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/25">
              No saved spreads yet
            </li>
          ) : (
            spreads.map((spread) => (
              <li key={spread.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onLoad(spread)
                    setOpen(false)
                  }}
                  className="flex-1 rounded-sm px-2 py-1.5 text-left font-display text-xs font-semibold text-white/85 transition hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-1 focus-visible:outline-arena-violet"
                  data-testid={`spread-load-${spread.id}`}
                >
                  {spread.name}
                </button>
                <button
                  type="button"
                  onClick={() => deleteSpread(speciesId, spread.id)}
                  className="shrink-0 p-1 font-mono text-[0.6rem] text-white/25 opacity-0 transition hover:text-arena-plasma/80 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-1 focus-visible:outline-arena-cyan"
                  aria-label={`Delete spread ${spread.name}`}
                  data-testid={`spread-delete-${spread.id}`}
                >
                  ×
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

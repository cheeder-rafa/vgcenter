import type { SavedPokemon } from '../../../store/useTeamsStore'

export type LeadOrder = {
  lead1: string | null
  lead2: string | null
  back1: string | null
  back2: string | null
}

const SLOTS: { key: keyof LeadOrder; label: string; abbr: string }[] = [
  { key: 'lead1', label: 'Lead 1', abbr: 'L1' },
  { key: 'lead2', label: 'Lead 2', abbr: 'L2' },
  { key: 'back1', label: 'Back 1', abbr: 'B1' },
  { key: 'back2', label: 'Back 2', abbr: 'B2' },
]

type Props = {
  roster: (SavedPokemon | null)[]
  order: LeadOrder
  onChange: (order: LeadOrder) => void
}

export function LeadOrderPicker({ roster, order, onChange }: Props) {
  const available = roster.filter((p): p is SavedPokemon => p !== null)
  const disabled = available.length < 4

  const selectedIds = Object.values(order).filter(
    (id): id is string => id !== null,
  )

  const filledCount = selectedIds.length
  const isIncomplete = filledCount < 4

  function handleChange(slotKey: keyof LeadOrder, value: string) {
    onChange({ ...order, [slotKey]: value === '' ? null : value })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SLOTS.map(({ key, label, abbr }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label
              htmlFor={`lead-order-${key}`}
              className="arena-label text-[10px] text-white/50"
            >
              <span className="text-arena-violet">{abbr}</span>
              <span className="ml-1.5 text-white/40">{label}</span>
            </label>
            <select
              id={`lead-order-${key}`}
              disabled={disabled}
              value={order[key] ?? ''}
              onChange={(e) => handleChange(key, e.target.value)}
              className="arena-select text-xs"
            >
              <option value="">— pick —</option>
              {available.map((mon) => (
                <option
                  key={mon.speciesId}
                  value={mon.speciesId ?? ''}
                  disabled={
                    selectedIds.includes(mon.speciesId ?? '') &&
                    order[key] !== mon.speciesId
                  }
                >
                  {mon.speciesName ?? mon.speciesId}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {!disabled && isIncomplete && (
        <p role="alert" className="text-xs text-arena-sun/80">
          Select all 4 slots to complete your lineup.
        </p>
      )}
    </div>
  )
}

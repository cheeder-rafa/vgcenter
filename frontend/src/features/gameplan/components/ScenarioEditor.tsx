import type { SavedPokemon } from '../../../store/useTeamsStore'
import { LeadOrderPicker, type LeadOrder } from './LeadOrderPicker'

type MineProps = {
  title: string
  side: 'mine'
  roster: (SavedPokemon | null)[]
  leadOrder: LeadOrder
  onLeadOrderChange: (order: LeadOrder) => void
  winConditionSpeciesId: string | null
  onWinConditionChange: (speciesId: string | null) => void
  assumedFormsBySpeciesId: Record<string, string[]>
  onAssumedFormsChange: (speciesId: string, forms: string[]) => void
}

type OpponentProps = {
  title: string
  side: 'opponent'
  roster: (SavedPokemon | null)[]
  leadOrder: LeadOrder
  onLeadOrderChange: (order: LeadOrder) => void
  assumedFormsBySpeciesId: Record<string, string[]>
  onAssumedFormsChange: (speciesId: string, forms: string[]) => void
}

type Props = MineProps | OpponentProps

function pickLineup(
  roster: (SavedPokemon | null)[],
  order: LeadOrder,
): SavedPokemon[] {
  const ids: (string | null)[] = [
    order.lead1,
    order.lead2,
    order.back1,
    order.back2,
  ]
  const byId = new Map<string, SavedPokemon>()
  roster.forEach((p) => {
    if (p !== null && p.speciesId !== null) {
      byId.set(p.speciesId, p)
    }
  })
  return ids
    .map((id) => (id === null ? null : (byId.get(id) ?? null)))
    .filter((p): p is SavedPokemon => p !== null)
}

function MegaToggle({
  mon,
  assumedForms,
  onChange,
}: {
  mon: SavedPokemon
  assumedForms: string[]
  onChange: (forms: string[]) => void
}) {
  const isMega = assumedForms.includes('mega')
  return (
    <button
      type="button"
      aria-pressed={isMega}
      onClick={() =>
        onChange(isMega ? assumedForms.filter((f) => f !== 'mega') : [...assumedForms, 'mega'])
      }
      className={
        'rounded border px-2 py-0.5 font-mono text-[11px] tracking-wide transition ' +
        (isMega
          ? 'border-white bg-white/10 text-white'
          : 'border-white/20 text-white/55 hover:border-white/40')
      }
    >
      {mon.speciesName ?? mon.speciesId} · Mega
    </button>
  )
}

export function ScenarioEditor(props: Props) {
  const lineup = pickLineup(props.roster, props.leadOrder)

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-white/80">{props.title}</h2>

      <LeadOrderPicker
        roster={props.roster}
        order={props.leadOrder}
        onChange={props.onLeadOrderChange}
      />

      {props.side === 'mine' && lineup.length === 4 && (
        <fieldset
          className="flex flex-col gap-2 rounded border border-white/10 bg-arena-surface/50 p-3"
          aria-label="Win condition"
        >
          <legend className="text-xs uppercase tracking-widest text-white/55">
            Win condition (weighed ~1.5× in scoring)
          </legend>
          <div className="flex flex-wrap gap-3">
            {lineup.map((mon) => {
              const id = mon.speciesId ?? ''
              const checked = props.winConditionSpeciesId === id
              return (
                <label
                  key={id}
                  className="flex items-center gap-1.5 text-xs text-white/80"
                >
                  <input
                    type="radio"
                    name="win-condition"
                    value={id}
                    checked={checked}
                    onChange={() => props.onWinConditionChange(id)}
                  />
                  {mon.speciesName ?? id}
                </label>
              )
            })}
          </div>
        </fieldset>
      )}

      {lineup.length === 4 && (
        <div className="flex flex-col gap-2 rounded border border-white/10 bg-arena-surface/50 p-3">
          <span className="text-xs uppercase tracking-widest text-white/55">
            Assumed mid-battle forms
          </span>
          <div className="flex flex-wrap gap-2">
            {lineup.map((mon) => {
              const id = mon.speciesId ?? ''
              const forms = props.assumedFormsBySpeciesId[id] ?? []
              return (
                <MegaToggle
                  key={id}
                  mon={mon}
                  assumedForms={forms}
                  onChange={(next) => props.onAssumedFormsChange(id, next)}
                />
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

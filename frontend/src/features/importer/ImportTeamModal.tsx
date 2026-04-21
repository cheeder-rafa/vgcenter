import { useId, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'

import type {
  ImportedPokemon,
  ImportedTeamResponse,
} from '../calculator/types/api'

type Props = {
  accentClassName: string
  description: string
  emptyState: string
  inputLabel: string
  inputPlaceholder: string
  submitLabel: string
  title: string
  triggerLabel: string
  multiline?: boolean
  onImport: (value: string) => Promise<ImportedTeamResponse>
  onLoadPokemon: (
    side: 'attacker' | 'defender',
    pokemon: ImportedPokemon,
  ) => void
}

export function ImportTeamModal({
  accentClassName,
  description,
  emptyState,
  inputLabel,
  inputPlaceholder,
  submitLabel,
  title,
  triggerLabel,
  multiline = false,
  onImport,
  onLoadPokemon,
}: Props) {
  const inputId = useId()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [team, setTeam] = useState<ImportedPokemon[]>([])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setErrorMessage(null)
    try {
      const imported = await onImport(value)
      setTeam(imported.team)
    } catch (error) {
      setTeam([])
      setErrorMessage(error instanceof Error ? error.message : 'Import failed.')
    } finally {
      setLoading(false)
    }
  }

  function handleLoad(side: 'attacker' | 'defender', pokemon: ImportedPokemon) {
    onLoadPokemon(side, pokemon)
    setOpen(false)
    setValue('')
    setErrorMessage(null)
    setTeam([])
  }

  return (
    <>
      <button
        type="button"
        className={`arena-button ${accentClassName}`}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </button>

      {open
        ? createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end bg-[rgba(4,3,15,0.72)] p-4 backdrop-blur-sm sm:items-center sm:justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${inputId}-title`}
        >
          <div className="arena-panel arena-panel--violet relative w-full max-w-3xl p-5 sm:p-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="arena-label text-arena-violet">Team Import</p>
                  <h2
                    id={`${inputId}-title`}
                    className="font-display text-2xl font-bold tracking-wide text-white"
                  >
                    {title}
                  </h2>
                  <p className="max-w-[62ch] font-body text-sm leading-6 text-white/68">
                    {description}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-sm border border-white/12 px-3 py-2 font-body text-sm text-white/72 transition hover:border-white/28 hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>

              <form className="grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-1.5">
                  <label
                    htmlFor={inputId}
                    className="arena-label text-arena-cyan"
                  >
                    {inputLabel}
                  </label>
                  {multiline ? (
                    <textarea
                      id={inputId}
                      className="arena-input min-h-40 resize-y"
                      value={value}
                      placeholder={inputPlaceholder}
                      onChange={(event) => setValue(event.target.value)}
                    />
                  ) : (
                    <input
                      id={inputId}
                      className="arena-input"
                      value={value}
                      placeholder={inputPlaceholder}
                      onChange={(event) => setValue(event.target.value)}
                    />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className="arena-button text-arena-plasma"
                    disabled={loading}
                  >
                    {loading ? 'Importing…' : submitLabel}
                  </button>
                  {errorMessage ? (
                    <p
                      role="alert"
                      className="font-body text-sm text-[rgba(255,145,145,0.92)]"
                    >
                      {errorMessage}
                    </p>
                  ) : null}
                </div>
              </form>

              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="arena-label text-arena-sun">Imported Team</p>
                  <span className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-white/44">
                    {team.length} loaded
                  </span>
                </div>

                {team.length === 0 ? (
                  <div className="rounded-sm border border-white/10 bg-white/[0.04] px-4 py-4 font-body text-sm leading-6 text-white/56">
                    {emptyState}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {team.map((pokemon) => (
                      <article
                        key={`${pokemon.speciesId}-${pokemon.nickname ?? pokemon.speciesName}`}
                        className="grid gap-3 rounded-sm border border-white/10 bg-white/[0.04] px-4 py-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h3 className="font-display text-lg text-white">
                              {pokemon.nickname ?? pokemon.speciesName}
                            </h3>
                            {pokemon.nickname ? (
                              <p className="font-body text-sm text-white/58">
                                {pokemon.speciesName}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="arena-button text-arena-plasma"
                              onClick={() => handleLoad('attacker', pokemon)}
                            >
                              Load Attacker
                            </button>
                            <button
                              type="button"
                              className="arena-button text-arena-cyan"
                              onClick={() => handleLoad('defender', pokemon)}
                            >
                              Load Defender
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {pokemon.itemId ? (
                            <span className="arena-chip text-arena-sun/90">
                              {pokemon.itemId}
                            </span>
                          ) : null}
                          {pokemon.abilityId ? (
                            <span className="arena-chip text-arena-cyan/90">
                              {pokemon.abilityId}
                            </span>
                          ) : null}
                          <span className="arena-chip text-arena-violet/90">
                            Lv. {pokemon.level}
                          </span>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          <p className="font-body text-sm leading-6 text-white/62">
                            HP {pokemon.stats.hp} · Atk {pokemon.stats.attack} ·
                            Def {pokemon.stats.defense}
                          </p>
                          <p className="font-body text-sm leading-6 text-white/62">
                            SpA {pokemon.stats.specialAttack} · SpD{' '}
                            {pokemon.stats.specialDefense} · Spe{' '}
                            {pokemon.stats.speed}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
            ,
            document.body,
          )
        : null}
    </>
  )
}

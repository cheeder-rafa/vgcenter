import type { ChangeEvent, FormEvent } from 'react'

import type { ReplayInputMode } from '../types'

type Props = {
  rawInput: string
  mode: ReplayInputMode
  status: 'idle' | 'parsing' | 'evaluating' | 'ready' | 'error'
  inputErrors: string[]
  errorMessage: string | null
  onChange: (value: string) => void
  onAnalyze: () => void
  onReset: () => void
}

const SAMPLE = `https://replay.pokemonshowdown.com/gen9championsvgc2026regma-2593988469-...`

export function ReplayInputPanel({
  rawInput,
  mode,
  status,
  inputErrors,
  errorMessage,
  onChange,
  onAnalyze,
  onReset,
}: Props) {
  const loading = status === 'parsing' || status === 'evaluating'
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!loading) onAnalyze()
  }
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) =>
    onChange(e.target.value)

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-arena-violet/20 bg-arena-night/60 p-5 shadow-cyan"
    >
      <div className="flex items-center justify-between">
        <label
          htmlFor="replay-input"
          className="font-display text-arena-2xs uppercase tracking-[0.18em] text-white/55"
        >
          Replay URL · Raw log · BO3 (1–3 URLs)
        </label>
        <span
          className={[
            'rounded-full px-2 py-0.5 font-display text-arena-2xs uppercase tracking-[0.14em]',
            mode === 'bo3'
              ? 'bg-arena-cyan/15 text-arena-cyan'
              : 'bg-arena-violet/10 text-arena-violet',
          ].join(' ')}
        >
          {mode === 'bo3' ? 'BO3 detected' : 'Single game'}
        </span>
      </div>
      <textarea
        id="replay-input"
        value={rawInput}
        onChange={handleChange}
        placeholder={SAMPLE}
        spellCheck={false}
        rows={4}
        className="w-full resize-y rounded-lg border border-arena-violet/20 bg-arena-void/70 px-3 py-2.5 font-mono text-[0.78rem] leading-relaxed text-white placeholder:text-white/30 focus:border-arena-cyan/50 focus:outline-none"
      />
      {inputErrors.length > 0 ? (
        <ul className="flex flex-col gap-1 rounded-md border border-arena-ember/30 bg-arena-ember/[0.05] px-3 py-2 text-arena-xs text-arena-ember">
          {inputErrors.map((msg, i) => (
            <li key={i}>• {msg}</li>
          ))}
        </ul>
      ) : null}
      {errorMessage ? (
        <div
          role="alert"
          className="rounded-md border border-arena-plasma/40 bg-arena-plasma/[0.05] px-3 py-2 text-arena-xs text-arena-plasma"
        >
          {errorMessage}
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={loading || rawInput.trim().length === 0}
          className="rounded-full bg-arena-plasma/90 px-5 py-2 font-display text-arena-xs uppercase tracking-[0.14em] text-white transition hover:bg-arena-plasma disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === 'parsing'
            ? 'Fetching…'
            : status === 'evaluating'
              ? 'Scoring…'
              : 'Run Autopsy'}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-arena-violet/20 px-4 py-2 font-display text-arena-xs uppercase tracking-[0.14em] text-white/60 transition hover:text-white"
        >
          Reset
        </button>
      </div>
    </form>
  )
}

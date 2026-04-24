import { useMemo, useState } from 'react'

import { classifyAdaptation } from '../lib/bo3Guidance'
import { exportAsJson, exportAsMarkdown } from '../lib/bo3Export'
import type {
  AdaptationSuggestion,
  GameRecord,
  GameResult,
  OpponentBehavior,
} from '../types'

type Props = {
  games: GameRecord[]
  onAddGame: (game: GameRecord) => void
  onClear: () => void
}

export function Bo3Notebook({ games, onAddGame, onClear }: Props) {
  const guidance = useMemo(() => classifyAdaptation(games), [games])
  const nextGameNumber = games.length === 0 ? 1 : games.length < 2 ? 2 : null
  const hasGames = games.length > 0

  return (
    <section className="arena-panel arena-panel--cyan p-4" aria-label="BO3 Adaptation Notebook">
      <div className="relative z-10 grid gap-4">
        <SectionHeader />

        {games.map((game) => (
          <GameSummary key={game.gameNumber} game={game} />
        ))}

        {nextGameNumber !== null ? (
          <AddGameForm gameNumber={nextGameNumber} onSave={onAddGame} />
        ) : null}

        {guidance.suggestions.length > 0 ? (
          <AdaptationGuidancePanel guidance={guidance} />
        ) : null}

        {hasGames ? (
          <ExportPanel
            games={games}
            guidance={guidance.suggestions.length > 0 ? guidance : null}
            onClear={onClear}
          />
        ) : null}
      </div>
    </section>
  )
}

function SectionHeader() {
  return (
    <div>
      <p className="arena-label text-arena-cyan">Best of 3</p>
      <h2 className="mt-1 text-xl font-black text-white">BO3 Adaptation Notebook</h2>
      <p className="mt-1 text-sm leading-6 text-white/68">
        Record each game. Get adaptation guidance for the next.
      </p>
    </div>
  )
}

function GameSummary({ game }: { game: GameRecord }) {
  const resultClass =
    game.result === 'win'
      ? 'border-arena-cyan/35 bg-arena-cyan/10 text-arena-cyan'
      : game.result === 'loss'
        ? 'border-arena-plasma/35 bg-arena-plasma/10 text-arena-plasma'
        : 'border-white/10 bg-white/[0.04] text-white/55'

  return (
    <div className="rounded border border-white/10 bg-black/18 p-3 grid gap-2">
      <div className="flex items-center gap-3">
        <span className="arena-label text-white/55">Game {game.gameNumber}</span>
        {game.result ? (
          <span
            className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[0.66rem] uppercase tracking-[0.18em] ${resultClass}`}
          >
            {game.result}
          </span>
        ) : null}
      </div>

      {game.myLeads ? (
        <InfoRow label="My leads" value={game.myLeads} />
      ) : null}
      {game.opponentLeads ? (
        <InfoRow label="Opponent leads" value={game.opponentLeads} />
      ) : null}
      {game.myBrought ? (
        <InfoRow label="I brought" value={game.myBrought} />
      ) : null}
      {game.opponentBrought ? (
        <InfoRow label="Opponent brought" value={game.opponentBrought} />
      ) : null}
      {game.scoutedInfo ? (
        <InfoRow label="Scouted info" value={game.scoutedInfo} />
      ) : null}
      {game.unrevealedInfo ? (
        <InfoRow label="Unrevealed info" value={game.unrevealedInfo} />
      ) : null}
      {game.resultNotes ? (
        <InfoRow label="Key plays" value={game.resultNotes} />
      ) : null}
      {game.opponentBehavior ? (
        <InfoRow
          label="Opponent between games"
          value={BEHAVIOR_LABELS[game.opponentBehavior]}
        />
      ) : null}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(120px,auto)_1fr] gap-2 text-sm">
      <span className="text-white/45">{label}</span>
      <span className="break-words text-white/85">{value}</span>
    </div>
  )
}

type FormState = Omit<GameRecord, 'gameNumber'>

function emptyForm(): FormState {
  return {
    result: null,
    myLeads: '',
    opponentLeads: '',
    myBrought: '',
    opponentBrought: '',
    scoutedInfo: '',
    unrevealedInfo: '',
    resultNotes: '',
    opponentBehavior: null,
  }
}

function AddGameForm({
  gameNumber,
  onSave,
}: {
  gameNumber: 1 | 2
  onSave: (game: GameRecord) => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    onSave({ ...form, gameNumber })
    setOpen(false)
    setForm(emptyForm())
  }

  if (!open) {
    return (
      <button
        type="button"
        className="arena-button h-10 w-full justify-center text-white sm:w-auto sm:px-6"
        onClick={() => setOpen(true)}
      >
        Record Game {gameNumber}
      </button>
    )
  }

  const inputClass =
    'min-h-11 w-full rounded border border-white/10 bg-arena-surface px-3 py-2 text-sm text-white outline-none transition focus-visible:border-arena-cyan/70 focus-visible:ring-2 focus-visible:ring-arena-cyan/25'

  return (
    <div className="rounded border border-white/10 bg-black/18 p-4 grid gap-4">
      <p className="arena-label text-arena-cyan">Game {gameNumber}</p>

      <div className="grid gap-2">
        <label className="grid gap-1.5">
          <span className="arena-label text-white/55">Result</span>
          <select
            className={inputClass}
            aria-label="Result"
            value={form.result ?? ''}
            onChange={(e) => set('result', (e.target.value as GameResult) || null)}
          >
            <option value="">— select —</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="arena-label text-white/55">My leads</span>
          <input
            type="text"
            className={inputClass}
            aria-label="My leads"
            placeholder="e.g. Tornadus + Urshifu"
            value={form.myLeads}
            onChange={(e) => set('myLeads', e.target.value)}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="arena-label text-white/55">Opponent leads</span>
          <input
            type="text"
            className={inputClass}
            aria-label="Opponent leads"
            placeholder="e.g. Rillaboom + Flutter Mane"
            value={form.opponentLeads}
            onChange={(e) => set('opponentLeads', e.target.value)}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="arena-label text-white/55">I brought</span>
          <input
            type="text"
            className={inputClass}
            aria-label="I brought"
            placeholder="e.g. Tornadus, Urshifu, Iron Hands, Landorus"
            value={form.myBrought}
            onChange={(e) => set('myBrought', e.target.value)}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="arena-label text-white/55">Opponent brought</span>
          <input
            type="text"
            className={inputClass}
            aria-label="Opponent brought"
            placeholder="e.g. Rillaboom, Flutter Mane, Incineroar, Cresselia"
            value={form.opponentBrought}
            onChange={(e) => set('opponentBrought', e.target.value)}
          />
        </label>
      </div>

      <label className="grid gap-1.5">
        <span className="arena-label text-white/55">Scouted info</span>
        <textarea
          className={`${inputClass} min-h-20 resize-y`}
          aria-label="Scouted info"
          placeholder="e.g. Flutter Mane: Timid / Rillaboom: Choice Band"
          value={form.scoutedInfo}
          onChange={(e) => set('scoutedInfo', e.target.value)}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="arena-label text-white/55">Unrevealed info</span>
        <input
          type="text"
          className={inputClass}
          aria-label="Unrevealed info"
          placeholder="e.g. Landorus not revealed"
          value={form.unrevealedInfo}
          onChange={(e) => set('unrevealedInfo', e.target.value)}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="arena-label text-white/55">Key plays</span>
        <textarea
          className={`${inputClass} min-h-20 resize-y`}
          aria-label="Key plays"
          placeholder="Why you won or lost — what decided the game"
          value={form.resultNotes}
          onChange={(e) => set('resultNotes', e.target.value)}
        />
      </label>

      <fieldset className="grid gap-2">
        <legend className="arena-label text-white/55">Opponent between games</legend>
        <div className="flex flex-wrap gap-3">
          {(
            [
              ['ran-it-back', 'Ran it back'],
              ['adjusted', 'Adjusted'],
              ['new-mode', 'Showed a new mode'],
            ] as [OpponentBehavior, string][]
          ).map(([value, label]) => (
            <label key={value} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name={`opponent-behavior-g${gameNumber}`}
                value={value}
                checked={form.opponentBehavior === value}
                onChange={() => set('opponentBehavior', value)}
                className="accent-arena-cyan"
              />
              <span className="text-white/76">{label}</span>
            </label>
          ))}
          {form.opponentBehavior ? (
            <button
              type="button"
              className="text-xs text-white/40 underline hover:text-white/68"
              onClick={() => set('opponentBehavior', null)}
            >
              Clear
            </button>
          ) : null}
        </div>
      </fieldset>

      <div className="flex gap-3">
        <button
          type="button"
          className="arena-button h-10 justify-center text-white px-6"
          onClick={handleSave}
        >
          Save Game {gameNumber}
        </button>
        <button
          type="button"
          className="h-10 px-4 text-sm text-white/55 hover:text-white/85 transition-colors"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

const SUGGESTION_LABELS: Record<AdaptationSuggestion, string> = {
  'run-it-back': 'Run it back',
  'change-lead-only': 'Change lead only',
  'change-backline': 'Change backline',
  'change-win-condition': 'Change win condition',
  'preserve-unrevealed': 'Preserve unrevealed info',
  'calculated-risk': 'Take a calculated risk',
}

const SUGGESTION_TONE: Record<AdaptationSuggestion, string> = {
  'run-it-back': 'border-arena-cyan/35 bg-arena-cyan/10 text-arena-cyan',
  'change-lead-only': 'border-arena-sun/35 bg-arena-sun/10 text-arena-sun',
  'change-backline': 'border-arena-sun/35 bg-arena-sun/10 text-arena-sun',
  'change-win-condition': 'border-arena-plasma/35 bg-arena-plasma/10 text-white',
  'preserve-unrevealed': 'border-white/15 bg-white/[0.06] text-white/85',
  'calculated-risk': 'border-arena-plasma/35 bg-arena-plasma/10 text-white',
}

function AdaptationGuidancePanel({
  guidance,
}: {
  guidance: ReturnType<typeof classifyAdaptation>
}) {
  return (
    <div
      className="rounded border border-white/10 bg-black/18 p-3 grid gap-3"
      aria-live="polite"
      aria-atomic="false"
    >
      <p className="arena-label text-arena-cyan">Adaptation guidance</p>

      <div className="flex flex-wrap gap-2">
        {guidance.suggestions.map((s) => (
          <span
            key={s}
            className={`inline-flex items-center rounded border px-2 py-1 font-mono text-[0.66rem] uppercase tracking-[0.18em] ${SUGGESTION_TONE[s]}`}
          >
            {SUGGESTION_LABELS[s]}
          </span>
        ))}
      </div>

      {guidance.reasoning.length > 0 ? (
        <ul className="grid gap-1.5">
          {guidance.reasoning.map((r, i) => (
            <li key={i} className="text-sm leading-6 text-white/76">
              {r}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function ExportPanel({
  games,
  guidance,
  onClear,
}: {
  games: GameRecord[]
  guidance: ReturnType<typeof classifyAdaptation> | null
  onClear: () => void
}) {
  const [copiedMd, setCopiedMd] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)

  async function copyMarkdown() {
    const md = exportAsMarkdown(games, guidance)
    await navigator.clipboard.writeText(md)
    setCopiedMd(true)
    setTimeout(() => setCopiedMd(false), 2000)
  }

  async function copyJson() {
    const json = exportAsJson(games, guidance)
    await navigator.clipboard.writeText(json)
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2000)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="arena-button h-10 justify-center text-white sm:px-5"
        onClick={copyMarkdown}
      >
        {copiedMd ? 'Copied!' : 'Copy as Markdown'}
      </button>
      <button
        type="button"
        className="arena-button h-10 justify-center text-white sm:px-5"
        onClick={copyJson}
      >
        {copiedJson ? 'Copied!' : 'Copy as JSON'}
      </button>
      <button
        type="button"
        className="h-10 px-3 text-sm text-white/40 hover:text-white/68 transition-colors"
        onClick={onClear}
      >
        Clear all
      </button>
    </div>
  )
}

const BEHAVIOR_LABELS: Record<OpponentBehavior, string> = {
  'ran-it-back': 'Ran it back',
  adjusted: 'Adjusted',
  'new-mode': 'Showed a new mode',
}

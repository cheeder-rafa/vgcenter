import type { PlanRecommendation, RecommendPlansResult } from '../types'

type PlanCardsProps = {
  result: RecommendPlansResult
  myTeamNames: string[]
  onPromote: (plan: PlanRecommendation) => void
  winConditionIndex: number | null
  onWinConditionChange: (index: number | null) => void
}

export function PlanCards({
  result,
  myTeamNames,
  onPromote,
  winConditionIndex,
  onWinConditionChange,
}: PlanCardsProps) {
  return (
    <section className="grid gap-4">
      <WinConditionPicker
        teamNames={myTeamNames}
        value={winConditionIndex}
        onChange={onWinConditionChange}
      />

      {result.plans.length === 0 ? (
        <EmptyState />
      ) : (
        <PlanList
          plans={result.plans}
          winConditionIndex={winConditionIndex}
          onPromote={onPromote}
        />
      )}
    </section>
  )
}

function WinConditionPicker({
  teamNames,
  value,
  onChange,
}: {
  teamNames: string[]
  value: number | null
  onChange: (index: number | null) => void
}) {
  return (
    <label className="grid gap-2">
      <span className="arena-label text-white/55">Win Condition</span>
      <select
        aria-label="Win condition"
        className="min-h-11 rounded border border-white/10 bg-arena-surface px-3 text-sm text-white outline-none transition focus-visible:border-arena-cyan/70 focus-visible:ring-2 focus-visible:ring-arena-cyan/25"
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value
          onChange(raw === '' ? null : Number(raw))
        }}
      >
        <option value="">None</option>
        {teamNames.map((name, idx) => (
          <option key={idx} value={idx}>
            {name}
          </option>
        ))}
      </select>
    </label>
  )
}

function PlanList({
  plans,
  winConditionIndex,
  onPromote,
}: {
  plans: PlanRecommendation[]
  winConditionIndex: number | null
  onPromote: (plan: PlanRecommendation) => void
}) {
  return (
    <ul className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {plans.map((plan, idx) => (
        <li key={idx}>
          <PlanCard
            plan={plan}
            winConditionIndex={winConditionIndex}
            onPromote={onPromote}
          />
        </li>
      ))}
    </ul>
  )
}

function PlanCard({
  plan,
  winConditionIndex,
  onPromote,
}: {
  plan: PlanRecommendation
  winConditionIndex: number | null
  onPromote: (plan: PlanRecommendation) => void
}) {
  const showWinConditionBadge =
    plan.winConditionSupported && winConditionIndex !== null

  return (
    <article className="arena-panel p-4">
      <div className="relative z-10 grid gap-3">
        <PlanSummary summary={plan.summary} />

        {showWinConditionBadge ? <WinConditionBadge /> : null}

        <PredictionBurden burden={plan.predictionBurden} />

        <ModesSection
          covered={plan.modesCovered}
          atRisk={plan.modesAtRisk}
        />

        {plan.leftOutRationale.length > 0 ? (
          <LeftOutSection rationale={plan.leftOutRationale} />
        ) : null}

        <button
          type="button"
          className="arena-button mt-1 h-10 w-full justify-center text-white"
          onClick={() => onPromote(plan)}
        >
          Use this plan
        </button>
      </div>
    </article>
  )
}

function PlanSummary({ summary }: { summary: string }) {
  return (
    <p className="break-words text-sm font-semibold leading-6 text-white">{summary}</p>
  )
}

function WinConditionBadge() {
  return (
    <span className="inline-flex w-fit items-center rounded border border-arena-cyan/35 bg-arena-cyan/10 px-2 py-1 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-arena-cyan">
      Win condition protected
    </span>
  )
}

function PredictionBurden({
  burden,
}: {
  burden: PlanRecommendation['predictionBurden']
}) {
  const toneClass = {
    low: 'border-white/10 bg-white/[0.04] text-white/62',
    medium: 'border-arena-sun/35 bg-arena-sun/10 text-arena-sun',
    high: 'border-arena-plasma/35 bg-arena-plasma/10 text-white',
  }[burden]

  return (
    <div className={`rounded border px-3 py-2 ${toneClass}`}>
      <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] opacity-75">
        Prediction burden
      </p>
      <p className="mt-1 text-sm font-black capitalize">{burden}</p>
    </div>
  )
}

function ModesSection({
  covered,
  atRisk,
}: {
  covered: string[]
  atRisk: string[]
}) {
  if (covered.length === 0 && atRisk.length === 0) return null

  return (
    <div className="grid gap-2">
      {covered.length > 0 ? (
        <ReadoutList
          title="Handles well"
          items={covered}
          accentClass="text-arena-cyan"
        />
      ) : null}
      {atRisk.length > 0 ? (
        <ReadoutList
          title="Rough matchups"
          items={atRisk}
          accentClass="text-arena-plasma"
        />
      ) : null}
    </div>
  )
}

function LeftOutSection({ rationale }: { rationale: string[] }) {
  return (
    <ReadoutList title="Bench decisions" items={rationale} accentClass="text-white/45" />
  )
}

function ReadoutList({
  title,
  items,
  accentClass,
}: {
  title: string
  items: string[]
  accentClass: string
}) {
  return (
    <div className="rounded border border-white/10 bg-black/18 p-3">
      <p className={`arena-label ${accentClass}`}>{title}</p>
      <ul className="mt-2 grid gap-1">
        {items.map((item) => (
          <li key={item} className="text-sm leading-6 text-white/76">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded border border-white/10 bg-arena-panel/85 p-6 text-center text-sm text-white/62">
      No recommendations available. Save both full teams and run recommendations.
    </div>
  )
}

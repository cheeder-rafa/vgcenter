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
        className="min-h-11 rounded border border-white/10 bg-arena-night/60 px-3 text-sm text-white outline-none transition focus-visible:border-arena-cyan/70 focus-visible:ring-2 focus-visible:ring-arena-cyan/25"
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
    <ul className="grid auto-rows-fr gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {plans.map((plan, idx) => (
        <li key={idx} className="flex">
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
  return (
    <article className="arena-panel flex h-full w-full flex-col p-4">
      <div className="relative z-10 flex flex-1 flex-col gap-3">
        <PlanSummary summary={plan.summary} />

        <WinConditionRow
          role={plan.winConditionRole}
          winConditionIndex={winConditionIndex}
        />

        <ReadDifficulty burden={plan.predictionBurden} />

        <ModesSection
          covered={plan.modesCovered}
          atRisk={plan.modesAtRisk}
        />

        {plan.leftOutRationale.length > 0 ? (
          <LeftOutSection rationale={plan.leftOutRationale} />
        ) : null}

        <button
          type="button"
          className="arena-button mt-auto h-10 w-full justify-center text-white"
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

function WinConditionRow({
  role,
  winConditionIndex,
}: {
  role: PlanRecommendation['winConditionRole']
  winConditionIndex: number | null
}) {
  if (winConditionIndex === null) {
    return (
      <p className="text-xs text-white/35">
        No win condition set — pick one above to see plan impact.
      </p>
    )
  }

  const config = {
    leading: {
      label: 'Win condition leading — exposed early',
      cls: 'border-arena-sun/35 bg-arena-sun/10 text-arena-sun',
    },
    backline: {
      label: 'Win condition in back — closes the game',
      cls: 'border-arena-cyan/35 bg-arena-cyan/10 text-arena-cyan',
    },
    benched: {
      label: 'Win condition benched — this plan abandons it',
      cls: 'border-arena-plasma/35 bg-arena-plasma/10 text-arena-plasma',
    },
    none: {
      label: '',
      cls: '',
    },
  }[role]

  if (role === 'none') return null

  return (
    <span
      className={`inline-flex w-fit items-center rounded border px-2 py-1 font-mono text-[0.66rem] uppercase tracking-[0.18em] ${config.cls}`}
    >
      {config.label}
    </span>
  )
}

function ReadDifficulty({
  burden,
}: {
  burden: PlanRecommendation['predictionBurden']
}) {
  const toneClass = {
    low: 'border-white/10 bg-white/[0.04] text-white/62',
    medium: 'border-arena-sun/35 bg-arena-sun/10 text-arena-sun',
    high: 'border-arena-plasma/35 bg-arena-plasma/10 text-white',
  }[burden]

  const description = {
    low: 'Few matchups force a guess',
    medium: 'A couple of 50/50s',
    high: 'Many forced reads',
  }[burden]

  return (
    <div className={`rounded border px-3 py-2 ${toneClass}`}>
      <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] opacity-75">
        Read difficulty
      </p>
      <p className="mt-1 text-sm font-black capitalize">{burden}</p>
      <p className="mt-0.5 text-xs opacity-60">{description}</p>
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

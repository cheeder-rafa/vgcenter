import { Link } from 'react-router-dom'

import { SpriteBadge } from '../../calculator/components/SpriteBadge'
import {
  buildMatchupShareLink,
  speciesNameToId,
} from '../lib/buildMatchupShareLink'
import type { ReplayBoardState, ReplayDecisionLine } from '../types'
import { DeltaBar } from './DeltaBar'

type Props = {
  line: ReplayDecisionLine
  board: ReplayBoardState
  delta: number
  maxAbsDelta: number
  emphasis?: 'played' | 'alt'
}

export function DecisionLineRow({
  line,
  board,
  delta,
  maxAbsDelta,
  emphasis = 'alt',
}: Props) {
  const isPlayed = emphasis === 'played'
  const primaryChoice = line.choices[0]

  return (
    <div
      className={[
        'group flex flex-col gap-2 rounded-lg border px-3 py-2.5 transition',
        isPlayed
          ? 'border-arena-plasma/40 bg-arena-plasma/[0.06]'
          : 'border-arena-violet/10 bg-arena-night/40 hover:border-arena-cyan/40 hover:bg-arena-cyan/[0.04]',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center gap-2">
        {line.choices.map((choice, idx) => (
          <Link
            key={`${choice.actorSlotId}-${idx}`}
            to={primaryChoice ? buildMatchupShareLink(choice, board) : '/calc'}
            className="flex min-w-0 items-center gap-2 rounded-md border border-transparent px-1.5 py-1 transition hover:border-arena-cyan/40 hover:bg-arena-cyan/[0.06]"
            aria-label={`Open ${choice.actorSpeciesName} → ${choice.moveName} in calculator`}
          >
            <SpriteBadge
              speciesId={speciesNameToId(choice.actorSpeciesName)}
              speciesName={choice.actorSpeciesName}
              size="sm"
              accent={isPlayed ? 'plasma' : 'cyan'}
            />
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="font-display text-arena-2xs uppercase tracking-[0.14em] text-white/60">
                {choice.actorSpeciesName}
              </span>
              <span className="truncate font-body text-[0.78rem] font-medium text-white">
                {choice.moveName}
              </span>
              {choice.targetSpeciesName ? (
                <span className="truncate text-arena-2xs text-white/40">
                  → {choice.targetSpeciesName}
                </span>
              ) : null}
            </div>
          </Link>
        ))}
        <span
          className={[
            'ml-auto rounded-full px-2 py-0.5 font-display text-arena-2xs uppercase tracking-[0.14em]',
            isPlayed
              ? 'bg-arena-plasma/15 text-arena-plasma'
              : 'bg-arena-violet/10 text-arena-violet',
          ].join(' ')}
        >
          {isPlayed ? 'Played' : 'Alt'}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-1 text-arena-2xs text-white/55">
        <span>
          dealt{' '}
          <span className="font-mono text-white/80">
            {line.expectedDamageDealt.toFixed(1)}
          </span>
        </span>
        <span>
          taken{' '}
          <span className="font-mono text-white/80">
            {line.expectedDamageTaken.toFixed(1)}
          </span>
        </span>
        {line.expectedKos > 0 ? (
          <span className="text-arena-mint">KO ×{line.expectedKos}</span>
        ) : null}
        {line.expectedFaints > 0 ? (
          <span className="text-arena-plasma">
            faint ×{line.expectedFaints}
          </span>
        ) : null}
        <div className="ml-auto min-w-[120px]">
          <DeltaBar delta={delta} maxAbsDelta={maxAbsDelta} />
        </div>
      </div>
    </div>
  )
}

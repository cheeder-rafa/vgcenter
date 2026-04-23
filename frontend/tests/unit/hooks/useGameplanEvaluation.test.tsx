import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  evaluateMatchup: vi.fn(),
}))

vi.mock('../../../src/features/gameplan/api/gameplanApi', () => ({
  evaluateMatchup: mocks.evaluateMatchup,
}))

import {
  useGameplanEvaluation,
  type GameplanEvaluationState,
} from '../../../src/features/gameplan/hooks/useGameplanEvaluation'
import type {
  EvaluateMatchupRequest,
  EvaluateMatchupResponse,
} from '../../../src/features/gameplan/types/api'
import type { CombatantRequest } from '../../../src/features/calculator/types/api'

const combatant: CombatantRequest = {
  level: 50,
  stats: {
    hp: 175,
    attack: 120,
    defense: 100,
    specialAttack: 140,
    specialDefense: 100,
    speed: 110,
  },
  types: ['FIRE'],
  abilityId: null,
  itemId: null,
  status: 'NONE',
  stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  grounded: true,
  currentHp: 175,
}

function mon(speciesId: string) {
  return {
    speciesId,
    combatant,
    moveIds: ['a', 'b', 'c', 'd'] as [string, string, string, string],
    assumedForms: [] as string[],
  }
}

function makeRequest(seed = 'seed'): EvaluateMatchupRequest {
  return {
    regulation: 'M-A',
    mine: {
      lineup: [
        mon(`${seed}-m1`),
        mon(`${seed}-m2`),
        mon(`${seed}-m3`),
        mon(`${seed}-m4`),
      ],
      winConditionIndex: 0,
    },
    opponent: [
      mon(`${seed}-o1`),
      mon(`${seed}-o2`),
      mon(`${seed}-o3`),
      mon(`${seed}-o4`),
      mon(`${seed}-o5`),
      mon(`${seed}-o6`),
    ],
  }
}

const emptyResponse: EvaluateMatchupResponse = { cells: [] }

function Harness({
  request,
  onState,
}: {
  request: EvaluateMatchupRequest | null
  onState: (s: GameplanEvaluationState) => void
}) {
  const state = useGameplanEvaluation(request) as unknown as GameplanEvaluationState
  onState(state)
  return null
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useGameplanEvaluation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mocks.evaluateMatchup.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces the fetch by ~200ms and stores the response', async () => {
    mocks.evaluateMatchup.mockResolvedValue(emptyResponse)
    const states: GameplanEvaluationState[] = []

    render(<Harness request={makeRequest()} onState={(s) => states.push(s)} />)

    expect(mocks.evaluateMatchup).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(199)
    })
    expect(mocks.evaluateMatchup).not.toHaveBeenCalled()

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(mocks.evaluateMatchup).toHaveBeenCalledTimes(1)
    const last = states[states.length - 1]
    expect(last.status).toBe('success')
    expect(last.data).toEqual(emptyResponse)
  })

  it('cancels an in-flight request when inputs change and keeps only the latest result', async () => {
    const first = createDeferred<EvaluateMatchupResponse>()
    const second: EvaluateMatchupResponse = {
      cells: [
        {
          firstOpponentIndex: 0,
          secondOpponentIndex: 1,
          opponentLeadSpeciesIds: ['o1', 'o2'],
          score: { total: 50, offense: 10, defense: 10, speed: 10, immunity: 20 },
          mineFlags: {
            protect: false,
            redirection: false,
            fakeOut: false,
            priority: false,
            speedControl: 'NONE',
          },
          opponentFlags: {
            protect: false,
            redirection: false,
            fakeOut: false,
            priority: false,
            speedControl: 'NONE',
          },
          outgoing: [],
          incoming: [],
        },
      ],
    }

    mocks.evaluateMatchup
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValueOnce(second)

    const states: GameplanEvaluationState[] = []

    const { rerender } = render(
      <Harness request={makeRequest('a')} onState={(s) => states.push(s)} />,
    )

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(mocks.evaluateMatchup).toHaveBeenCalledTimes(1)

    rerender(<Harness request={makeRequest('b')} onState={(s) => states.push(s)} />)

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(mocks.evaluateMatchup).toHaveBeenCalledTimes(2)

    const afterSecond = states[states.length - 1]
    expect(afterSecond.data).toEqual(second)

    // Resolve the stale first promise — should not clobber the newer result
    await act(async () => {
      first.resolve({ cells: [] })
      await Promise.resolve()
      await Promise.resolve()
    })

    const final = states[states.length - 1]
    expect(final.data).toEqual(second)
    expect(final.status).toBe('success')
  })

  it('returns idle when request is null', async () => {
    const states: GameplanEvaluationState[] = []
    render(<Harness request={null} onState={(s) => states.push(s)} />)

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(mocks.evaluateMatchup).not.toHaveBeenCalled()
    expect(states[states.length - 1].status).toBe('idle')
  })

  it('surfaces errors on failed fetch', async () => {
    mocks.evaluateMatchup.mockRejectedValue(new Error('boom'))
    const states: GameplanEvaluationState[] = []

    render(<Harness request={makeRequest()} onState={(s) => states.push(s)} />)

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    const last = states[states.length - 1]
    expect(last.status).toBe('error')
    expect(last.error).toMatch(/boom/)
  })
})

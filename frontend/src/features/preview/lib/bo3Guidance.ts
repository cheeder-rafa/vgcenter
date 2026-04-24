import type {
  AdaptationGuidance,
  AdaptationSuggestion,
  GameRecord,
} from '../types'

export function classifyAdaptation(games: GameRecord[]): AdaptationGuidance {
  const completed = games.filter((g) => g.result !== null)
  if (completed.length === 0) return { suggestions: [], reasoning: [] }

  const losses = completed.filter((g) => g.result === 'loss').length
  const wins = completed.filter((g) => g.result === 'win').length

  if (losses === 2) {
    return {
      suggestions: ['calculated-risk'],
      reasoning: [
        'Down 0-2. Any adaptation is a gamble — commit to your best read and execute.',
      ],
    }
  }

  const last = completed[completed.length - 1]
  const hasUnrevealed = last.unrevealedInfo.trim().length > 0

  const suggestions: AdaptationSuggestion[] = []
  const reasoning: string[] = []

  if (hasUnrevealed) {
    suggestions.push('preserve-unrevealed')
    reasoning.push(
      `You have unrevealed information: ${last.unrevealedInfo.trim()}. Keep it hidden to maintain your edge.`,
    )
  }

  if (last.result === 'win') {
    switch (last.opponentBehavior) {
      case 'ran-it-back':
        suggestions.push('run-it-back')
        reasoning.push(
          'Opponent ran it back. They believe in the same line. Mirror their confidence and execute.',
        )
        break
      case 'adjusted':
        suggestions.push('change-lead-only')
        reasoning.push(
          'Opponent adjusted. Scout their new lead read with a minimal change — keep your win condition intact.',
        )
        break
      case 'new-mode':
        suggestions.push('change-backline')
        reasoning.push(
          'Opponent showed a new mode. Adjust your backline to cover the new threat without abandoning your win condition.',
        )
        break
      default:
        suggestions.push('run-it-back')
        reasoning.push(
          'You won. Maintain your winning line until the opponent forces a change.',
        )
    }
  } else {
    switch (last.opponentBehavior) {
      case 'ran-it-back':
        suggestions.push('change-lead-only')
        suggestions.push('change-win-condition')
        reasoning.push(
          'Opponent ran it back and it worked. Change your lead to disrupt their read.',
        )
        reasoning.push(
          'If your win condition was neutralised, commit to a different mode entirely.',
        )
        break
      case 'adjusted':
        suggestions.push('change-backline')
        reasoning.push(
          'Opponent found the counter. Change your backline to answer what they revealed.',
        )
        break
      case 'new-mode':
        suggestions.push('change-win-condition')
        reasoning.push(
          "Opponent showed a mode you couldn't answer. Build around a different win condition.",
        )
        break
      default:
        suggestions.push('change-lead-only')
        reasoning.push(
          'Loss recorded. Start with a lead change to disrupt their reads.',
        )
    }
  }

  if (wins === 1 && losses === 1) {
    const mentionsUnrevealed = reasoning.some((r) =>
      r.toLowerCase().includes('unrevealed'),
    )
    if (!mentionsUnrevealed) {
      reasoning.push(
        'Game 3 — every unrevealed card is leverage. Think about what information they still lack.',
      )
    }
  }

  return { suggestions, reasoning }
}

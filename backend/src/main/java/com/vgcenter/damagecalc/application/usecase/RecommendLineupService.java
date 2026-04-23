package com.vgcenter.damagecalc.application.usecase;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

public final class RecommendLineupService implements RecommendLineupUseCase {

    private static final int[][] LEAD_PAIRINGS = {
        {0, 1, 2, 3},
        {0, 2, 1, 3},
        {0, 3, 1, 2}
    };

    private final EvaluateMatchupUseCase evaluateMatchupUseCase;

    public RecommendLineupService(EvaluateMatchupUseCase evaluateMatchupUseCase) {
        this.evaluateMatchupUseCase = evaluateMatchupUseCase;
    }

    @Override
    public RecommendLineupResult recommend(RecommendLineupCommand command) {
        Objects.requireNonNull(command, "command must not be null");

        List<RecommendationResult> evaluated = new ArrayList<>(45);
        for (int first = 0; first < 3; first++) {
            for (int second = first + 1; second < 4; second++) {
                for (int third = second + 1; third < 5; third++) {
                    for (int fourth = third + 1; fourth < 6; fourth++) {
                        List<Integer> bring = List.of(first, second, third, fourth);
                        for (int[] pairing : LEAD_PAIRINGS) {
                            evaluated.add(evaluateLineup(command, bring, pairing));
                        }
                    }
                }
            }
        }

        return new RecommendLineupResult(
                evaluated.size(),
                evaluated.stream()
                        .sorted(Comparator.comparingDouble(RecommendationResult::averageScore)
                                .reversed()
                                .thenComparing(recommendation ->
                                        recommendation.lineupSpeciesIds().toString()))
                        .limit(3)
                        .toList());
    }

    private RecommendationResult evaluateLineup(RecommendLineupCommand command, List<Integer> bring, int[] pairing) {
        List<Integer> orderedIndices =
                List.of(bring.get(pairing[0]), bring.get(pairing[1]), bring.get(pairing[2]), bring.get(pairing[3]));
        List<EvaluateMatchupPokemonCommand> lineup =
                orderedIndices.stream().map(command.mine()::get).toList();
        Integer lineupWinConditionIndex =
                command.winConditionIndex() == null ? null : orderedIndices.indexOf(command.winConditionIndex());
        if (lineupWinConditionIndex != null && lineupWinConditionIndex < 0) {
            lineupWinConditionIndex = null;
        }

        EvaluateMatchupResult result = evaluateMatchupUseCase.evaluate(new EvaluateMatchupCommand(
                command.regulation(), new EvaluateMineCommand(lineup, lineupWinConditionIndex), command.opponent()));
        double averageScore = result.cells().stream()
                .mapToInt(cell -> cell.score().total())
                .average()
                .orElse(0.0d);

        return new RecommendationResult(
                orderedIndices,
                lineup.stream().map(EvaluateMatchupPokemonCommand::speciesId).toList(),
                lineupWinConditionIndex,
                averageScore,
                result.cells());
    }
}

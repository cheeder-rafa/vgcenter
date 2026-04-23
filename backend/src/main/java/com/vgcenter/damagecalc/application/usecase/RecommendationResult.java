package com.vgcenter.damagecalc.application.usecase;

import java.util.List;
import java.util.Objects;

public record RecommendationResult(
        List<Integer> lineupIndices,
        List<String> lineupSpeciesIds,
        Integer winConditionIndex,
        double averageScore,
        List<MatchupCellResult> cells) {

    public RecommendationResult {
        lineupIndices = List.copyOf(Objects.requireNonNull(lineupIndices, "lineupIndices must not be null"));
        lineupSpeciesIds = List.copyOf(Objects.requireNonNull(lineupSpeciesIds, "lineupSpeciesIds must not be null"));
        cells = List.copyOf(Objects.requireNonNull(cells, "cells must not be null"));
    }
}

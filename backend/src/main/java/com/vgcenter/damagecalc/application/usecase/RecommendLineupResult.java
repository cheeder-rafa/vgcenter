package com.vgcenter.damagecalc.application.usecase;

import java.util.List;
import java.util.Objects;

public record RecommendLineupResult(int evaluatedLineups, List<RecommendationResult> recommendations) {

    public RecommendLineupResult {
        recommendations = List.copyOf(Objects.requireNonNull(recommendations, "recommendations must not be null"));
    }
}

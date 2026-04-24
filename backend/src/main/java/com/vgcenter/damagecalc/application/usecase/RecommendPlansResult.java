package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

public record RecommendPlansResult(List<PlanRecommendation> plans) {

    public RecommendPlansResult {
        plans = List.copyOf(plans);
    }
}

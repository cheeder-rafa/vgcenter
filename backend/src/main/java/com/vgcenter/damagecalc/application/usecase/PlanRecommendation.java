package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

public record PlanRecommendation(
        List<Integer> bringIndices,
        List<Integer> leadIndices,
        String summary,
        Verdict verdict,
        List<String> modesCovered,
        List<String> modesAtRisk,
        boolean winConditionSupported,
        List<String> leftOutRationale,
        String predictionBurden,
        String winConditionRole) {

    public PlanRecommendation {
        bringIndices = List.copyOf(bringIndices);
        leadIndices = List.copyOf(leadIndices);
        modesCovered = List.copyOf(modesCovered);
        modesAtRisk = List.copyOf(modesAtRisk);
        leftOutRationale = List.copyOf(leftOutRationale);
        if (verdict == null) {
            throw new IllegalArgumentException("verdict must not be null");
        }
        if (!List.of("leading", "backline", "benched", "none").contains(winConditionRole)) {
            throw new IllegalArgumentException("Invalid winConditionRole: " + winConditionRole);
        }
    }
}

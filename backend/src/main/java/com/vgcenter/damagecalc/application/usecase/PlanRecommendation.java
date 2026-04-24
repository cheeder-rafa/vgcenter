package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

public record PlanRecommendation(
        List<Integer> bringIndices,
        List<Integer> leadIndices,
        String summary,
        List<String> modesCovered,
        List<String> modesAtRisk,
        boolean winConditionSupported,
        List<String> leftOutRationale,
        String predictionBurden) {

    public PlanRecommendation {
        bringIndices = List.copyOf(bringIndices);
        leadIndices = List.copyOf(leadIndices);
        modesCovered = List.copyOf(modesCovered);
        modesAtRisk = List.copyOf(modesAtRisk);
        leftOutRationale = List.copyOf(leftOutRationale);
    }
}

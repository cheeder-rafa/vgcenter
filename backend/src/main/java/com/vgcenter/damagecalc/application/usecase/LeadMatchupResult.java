package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

public record LeadMatchupResult(
        List<String> opponentLeadIds,
        List<String> opponentLeadNames,
        PreviewMetricResult koPressure,
        PreviewMetricResult twoHitKoPressure,
        PreviewMetricResult doubleUpPressure,
        PreviewMetricResult incomingDanger,
        PreviewMetricResult speedComparison,
        List<String> mustReactLabels,
        List<String> turnOneAnnotations) {

    public LeadMatchupResult {
        opponentLeadIds = List.copyOf(opponentLeadIds);
        opponentLeadNames = List.copyOf(opponentLeadNames);
        mustReactLabels = List.copyOf(mustReactLabels);
        turnOneAnnotations = List.copyOf(turnOneAnnotations);
    }
}

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
        List<String> turnOneAnnotations,
        List<HitEvidenceSummary> outgoingEvidence,
        List<HitEvidenceSummary> incomingEvidence,
        String summary) {

    public LeadMatchupResult(
            List<String> opponentLeadIds,
            List<String> opponentLeadNames,
            PreviewMetricResult koPressure,
            PreviewMetricResult twoHitKoPressure,
            PreviewMetricResult doubleUpPressure,
            PreviewMetricResult incomingDanger,
            PreviewMetricResult speedComparison,
            List<String> mustReactLabels,
            List<String> turnOneAnnotations,
            List<HitEvidenceSummary> outgoingEvidence,
            List<HitEvidenceSummary> incomingEvidence) {
        this(
                opponentLeadIds,
                opponentLeadNames,
                koPressure,
                twoHitKoPressure,
                doubleUpPressure,
                incomingDanger,
                speedComparison,
                mustReactLabels,
                turnOneAnnotations,
                outgoingEvidence,
                incomingEvidence,
                null);
    }

    public LeadMatchupResult {
        opponentLeadIds = List.copyOf(opponentLeadIds);
        opponentLeadNames = List.copyOf(opponentLeadNames);
        mustReactLabels = List.copyOf(mustReactLabels);
        turnOneAnnotations = List.copyOf(turnOneAnnotations);
        outgoingEvidence = List.copyOf(outgoingEvidence);
        incomingEvidence = List.copyOf(incomingEvidence);
    }

    public LeadMatchupResult withSummary(String newSummary) {
        return new LeadMatchupResult(
                opponentLeadIds,
                opponentLeadNames,
                koPressure,
                twoHitKoPressure,
                doubleUpPressure,
                incomingDanger,
                speedComparison,
                mustReactLabels,
                turnOneAnnotations,
                outgoingEvidence,
                incomingEvidence,
                newSummary);
    }
}

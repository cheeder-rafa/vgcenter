package com.vgcenter.damagecalc.web.dto;

import java.util.List;

public record LeadMatchupResponseDto(
        List<String> opponentLeadIds,
        List<String> opponentLeadNames,
        PreviewMetricDto koPressure,
        PreviewMetricDto twoHitKoPressure,
        PreviewMetricDto doubleUpPressure,
        PreviewMetricDto incomingDanger,
        PreviewMetricDto speedComparison,
        List<String> mustReactLabels,
        List<String> turnOneAnnotations,
        List<HitEvidenceSummaryDto> outgoingEvidence,
        List<HitEvidenceSummaryDto> incomingEvidence,
        String summary) {}

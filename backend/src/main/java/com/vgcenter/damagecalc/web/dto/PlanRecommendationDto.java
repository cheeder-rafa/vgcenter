package com.vgcenter.damagecalc.web.dto;

import java.util.List;

public record PlanRecommendationDto(
        List<Integer> bringIndices,
        List<Integer> leadIndices,
        String summary,
        List<String> modesCovered,
        List<String> modesAtRisk,
        boolean winConditionSupported,
        List<String> leftOutRationale,
        String predictionBurden) {}

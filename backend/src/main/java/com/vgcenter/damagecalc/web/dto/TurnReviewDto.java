package com.vgcenter.damagecalc.web.dto;

import java.util.List;

public record TurnReviewDto(
        int turnNumber,
        ReplayDecisionLineDto played,
        List<ReplayDecisionLineDto> rankedAlternatives,
        double delta,
        String verdict,
        String narrative) {}

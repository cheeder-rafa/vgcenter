package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

public record TurnReview(
        int turnNumber,
        ReplayDecisionLine played,
        List<ReplayDecisionLine> rankedAlternatives,
        double delta,
        String verdict,
        String narrative) {

    public TurnReview {
        rankedAlternatives = List.copyOf(rankedAlternatives);
    }
}

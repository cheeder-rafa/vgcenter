package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

public record ReplayDecisionLine(
        List<ReplayMoveChoice> choices,
        double score,
        double expectedDamageDealt,
        double expectedDamageTaken,
        int expectedKos,
        int expectedFaints) {

    public ReplayDecisionLine {
        choices = List.copyOf(choices);
    }
}

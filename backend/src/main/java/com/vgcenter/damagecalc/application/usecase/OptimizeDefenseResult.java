package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

public record OptimizeDefenseResult(List<DefenseSpreadCandidate> candidates) {

    public OptimizeDefenseResult {
        candidates = List.copyOf(candidates);
    }
}

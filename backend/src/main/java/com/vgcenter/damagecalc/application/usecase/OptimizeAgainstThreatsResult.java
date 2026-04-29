package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

public record OptimizeAgainstThreatsResult(
        DefenseSpreadCandidate best,
        List<DefenseSpreadCandidate> candidates,
        List<OptimizeAgainstThreatResult> threats) {

    public OptimizeAgainstThreatsResult {
        candidates = List.copyOf(candidates);
        threats = List.copyOf(threats);
    }
}
